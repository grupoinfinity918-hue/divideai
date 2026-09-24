const express = require('express');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { calculateCommission } = require('../services/commission.service');
const { creditSaleHeld } = require('../services/wallet.service');
const { notifySellerPixConfirmed } = require('../services/whatsapp.service');

const router = express.Router();
const prisma = new PrismaClient();

let efiToken = null;
let efiTokenExp = 0;

async function getEfiToken() {
  if (efiToken && Date.now() < efiTokenExp) return efiToken;

  const credentials = Buffer.from(
    `${process.env.EFI_CLIENT_ID}:${process.env.EFI_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(`${process.env.EFI_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ grant_type: 'client_credentials' })
  });

  const data = await res.json();
  efiToken = data.access_token;
  efiTokenExp = Date.now() + (data.expires_in - 60) * 1000;
  return efiToken;
}

router.post('/pix/charge', async (req, res) => {
  const { orderId } = req.body;

  if (!process.env.EFI_CLIENT_ID || !process.env.EFI_CLIENT_SECRET || !process.env.EFI_BASE_URL || !process.env.EFI_PIX_KEY) {
    return res.status(503).json({ error: 'Pagamentos via Pix ainda não configurados. Configure as credenciais do EFI Bank.' });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { listing: true, seller: true }
  });

  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });

  try {
    const token = await getEfiToken();
    const txid = crypto.randomBytes(16).toString('hex').slice(0, 26);

    const efiRes = await fetch(`${process.env.EFI_BASE_URL}/v2/cob/${txid}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        calendario: { expiracao: 3600 },
        valor: { original: Number(order.amount).toFixed(2) },
        chave: process.env.EFI_PIX_KEY,
        solicitacaoPagador: `Divide Aí - Pedido ${order.protocol}`
      })
    });

    const cobData = await efiRes.json();

    await prisma.order.update({
      where: { id: orderId },
      data: { pixTxId: txid }
    });

    res.json({
      protocol: order.protocol,
      txid,
      pixCopiaCola: cobData.pixCopiaCola,
      qrcode: cobData.qrcode || null
    });
  } catch (err) {
    console.error('Erro ao gerar cobrança Pix:', err);
    res.status(502).json({ error: 'Não foi possível gerar o Pix agora. Tente novamente.' });
  }
});

router.post('/pix/webhook', async (req, res) => {
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

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        commissionAmt,
        netToSeller
      }
    });

    await creditSaleHeld(order.sellerId, order.id, netToSeller);
    await notifySellerPixConfirmed(order, order.seller.phone);
  }

  res.status(200).send();
});

module.exports = router;
