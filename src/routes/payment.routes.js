const express = require('express');
const crypto = require('crypto');
const https = require('https');
const { PrismaClient } = require('@prisma/client');
const { calculateCommission } = require('../services/commission.service');
const { creditSaleHeld } = require('../services/wallet.service');
const { notifySellerPixConfirmed } = require('../services/whatsapp.service');

const router = express.Router();
const prisma = new PrismaClient();

const EFI_BASE_URL = process.env.EFI_BASE_URL || 'https://pix.api.efipay.com.br';
let efiToken = null;
let efiTokenExp = 0;

function efiAgent() {
  const raw = process.env.EFI_CERTIFICATE_BASE64;
  if (!raw) throw new Error('EFI_CERTIFICATE_BASE64 não configurado');
  return new https.Agent({
    pfx: Buffer.from(raw, 'base64'),
    passphrase: process.env.EFI_CERTIFICATE_PASSWORD || ''
  });
}

function efiRequest(path, { method = 'GET', headers = {}, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, EFI_BASE_URL);
    const payload = body == null ? null : JSON.stringify(body);
    const req = https.request(url, {
      method,
      agent: efiAgent(),
      headers: {
        Accept: 'application/json',
        ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...headers
      }
    }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let parsed = {};
        try { parsed = data ? JSON.parse(data) : {}; } catch { parsed = { raw: data }; }
        if (res.statusCode >= 200 && res.statusCode < 300) return resolve(parsed);
        const err = new Error(parsed?.mensagem || parsed?.message || `Efí HTTP ${res.statusCode}`);
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

async function getEfiToken() {
  if (efiToken && Date.now() < efiTokenExp) return efiToken;

  const credentials = Buffer.from(
    `${process.env.EFI_CLIENT_ID}:${process.env.EFI_CLIENT_SECRET}`
  ).toString('base64');

  const data = await efiRequest('/oauth/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}` },
    body: { grant_type: 'client_credentials' }
  });

  if (!data.access_token) throw new Error('Efí não retornou access_token');
  efiToken = data.access_token;
  efiTokenExp = Date.now() + Math.max(60, Number(data.expires_in || 300) - 60) * 1000;
  return efiToken;
}

router.post('/pix/charge', async (req, res) => {
  const { orderId } = req.body;

  if (!process.env.EFI_CLIENT_ID || !process.env.EFI_CLIENT_SECRET || !process.env.EFI_PIX_KEY || !process.env.EFI_CERTIFICATE_BASE64) {
    return res.status(503).json({ error: 'Pagamentos via Pix ainda não configurados. Configure as credenciais do Efí Bank.' });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { listing: true, seller: true }
  });

  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });

  try {
    const token = await getEfiToken();
    const txid = crypto.randomBytes(16).toString('hex').slice(0, 26);

    const cobData = await efiRequest(`/v2/cob/${txid}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        calendario: { expiracao: 3600 },
        valor: { original: Number(order.amount).toFixed(2) },
        chave: process.env.EFI_PIX_KEY,
        solicitacaoPagador: `Divide Aí - Pedido ${order.protocol}`
      }
    });

    if (!cobData.loc?.id) throw new Error('Efí criou a cobrança, mas não retornou o location.id');

    const qrData = await efiRequest(`/v2/loc/${cobData.loc.id}/qrcode`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { pixTxId: txid }
    });

    res.json({
      protocol: order.protocol,
      txid,
      pixCopiaCola: qrData.qrcode,
      qrcode: qrData.imagemQrcode || null,
      linkVisualizacao: qrData.linkVisualizacao || null
    });
  } catch (err) {
    console.error('Erro ao gerar cobrança Pix:', err.response || err.message || err);
    res.status(502).json({ error: 'Não foi possível gerar o Pix agora. Verifique as credenciais/certificado da Efí e tente novamente.' });
  }
});

router.post('/pix/webhook', async (req, res) => {
  console.log('Efí webhook recebido:', JSON.stringify(req.body));

  const pixEvents = req.body.pix || [];

  for (const ev of pixEvents) {
    const order = await prisma.order.findFirst({
      where: { pixTxId: ev.txid },
      include: { listing: true, seller: true }
    });

    if (!order || order.status !== 'AWAITING_PAYMENT') continue;

    const { commissionAmt, netToSeller } = await calculateCommission(
      order.sellerId,
      order.listing.origin,
      order.amount
    );

    await prisma.$transaction([
      prisma.order.update({ where: { id: order.id }, data: { status: 'PAID', paidAt: new Date(), commissionAmt, netToSeller } }),
      prisma.orderEvent.create({ data: { orderId: order.id, toStatus: 'PAID', note: 'Pagamento Pix confirmado automaticamente.' } }),
      prisma.notification.create({ data: { userId: order.clientId, type: 'PAYMENT_CONFIRMED', title: 'Pagamento confirmado', message: `O pagamento do pedido ${order.protocol} foi confirmado.`, link: `/pedido/${order.protocol}` } }),
      prisma.notification.create({ data: { userId: order.sellerId, type: 'NEW_ORDER', title: 'Nova venda confirmada', message: `O pedido ${order.protocol} foi pago e está aguardando atendimento.`, link: '/loja' } })
    ]);

    await creditSaleHeld(order.sellerId, order.id, netToSeller);
    await notifySellerPixConfirmed(order, order.seller.phone);
  }

  res.status(200).send();
});

module.exports = router;
