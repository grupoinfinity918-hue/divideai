const https = require('https');

const BASE_URL = process.env.EFI_BASE_URL || 'https://pix.api.efipay.com.br';

function efiRequest(path, { method = 'GET', headers = {}, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const raw = process.env.EFI_CERTIFICATE_BASE64;
    if (!raw) return reject(new Error('EFI_CERTIFICATE_BASE64 não configurado'));

    const url = new URL(path, BASE_URL);
    const payload = body == null ? null : JSON.stringify(body);

    const req = https.request(url, {
      method,
      pfx: Buffer.from(raw, 'base64'),
      passphrase: process.env.EFI_CERTIFICATE_PASSWORD || '',
      headers: {
        Accept: 'application/json',
        ...(payload ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        } : {}),
        ...headers
      }
    }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let parsed = {};
        try { parsed = data ? JSON.parse(data) : {}; }
        catch { parsed = { raw: data }; }

        if (res.statusCode >= 200 && res.statusCode < 300) {
          return resolve({ status: res.statusCode, data: parsed });
        }

        const err = new Error(
          parsed?.mensagem || parsed?.message || `Efí HTTP ${res.statusCode}`
        );
        err.statusCode = res.statusCode;
        err.response = parsed;
        reject(err);
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function registerEfiWebhook() {
  const {
    EFI_CLIENT_ID,
    EFI_CLIENT_SECRET,
    EFI_PIX_KEY,
    EFI_CERTIFICATE_BASE64
  } = process.env;

  if (!EFI_CLIENT_ID || !EFI_CLIENT_SECRET || !EFI_PIX_KEY || !EFI_CERTIFICATE_BASE64) {
    console.log('[Efí] Webhook não configurado: faltam credenciais/certificado.');
    return;
  }

  try {
    const credentials = Buffer.from(
      `${EFI_CLIENT_ID}:${EFI_CLIENT_SECRET}`
    ).toString('base64');

    const tokenResponse = await efiRequest('/oauth/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`
      },
      body: { grant_type: 'client_credentials' }
    });

    const token = tokenResponse.data?.access_token;
    if (!token) throw new Error('Efí não retornou access_token.');

    // O parâmetro ignorar= impede a Efí de acrescentar /pix à URL.
    const webhookUrl =
      'https://divideai-production.up.railway.app/api/pix/webhook?ignorar=';

    const result = await efiRequest(
      `/v2/webhook/${encodeURIComponent(EFI_PIX_KEY)}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-skip-mtls-checking': 'true'
        },
        body: { webhookUrl }
      }
    );

    console.log(`[Efí] Webhook configurado com sucesso (${result.status}): ${webhookUrl}`);
  } catch (err) {
    console.error('[Efí] Falha ao configurar webhook:', err.response || err.message || err);
  }
}

module.exports = { registerEfiWebhook };
