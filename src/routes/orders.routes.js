const express = require('express');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

function generateProtocol() {
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `PED-${date}-${rand}`;
}

router.post('/orders', requireAuth, async (req, res) => {
  const { listingId } = req.body;

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  const rawDelivery = listing?.autoDeliveryPayload || '';
  const separator = rawDelivery.indexOf(':');
  const autoLogin = listing?.autoDelivery ? (separator > 0 ? rawDelivery.slice(0, separator).trim() : rawDelivery.trim()) : null;
  const autoPassword = listing?.autoDelivery && separator > 0 ? rawDelivery.slice(separator + 1).trim() : null;
  if (!listing || listing.status !== 'ACTIVE') {
    return res.status(404).json({ error: 'Anúncio não encontrado ou indisponível' });
  }

  if (listing.sellerId === req.user.id) {
    return res.status(400).json({ error: 'Você não pode comprar seu próprio anúncio' });
  }

  if (listing.slotsAvailable !== null && listing.slotsAvailable <= 0) {
    return res.status(400).json({ error: 'Não há mais vagas disponíveis neste anúncio' });
  }

  const order = await prisma.order.create({
    data: {
      protocol: generateProtocol(), listingId: listing.id, clientId: req.user.id, sellerId: listing.sellerId, amount: listing.price, status: 'AWAITING_PAYMENT',
      deliveryLogin: autoLogin || null,
      deliveryPassword: autoPassword || null,
      deliveryCredentials: listing.autoDelivery ? (listing.autoDeliveryPayload || null) : null,
      events: { create: { actorId: req.user.id, toStatus: 'AWAITING_PAYMENT', note: 'Pedido criado e aguardando pagamento.' } }
    }
  });

  if (listing.slotsAvailable !== null) {
    const newSlots = listing.slotsAvailable - 1;
    await prisma.listing.update({
      where: { id: listing.id },
      data: { slotsAvailable: newSlots, ...(newSlots <= 0 ? { status: 'PAUSED' } : {}) }
    });
  }

  res.status(201).json(order);
});


router.get('/seller/orders', requireAuth, async (req, res) => {
  const orders = await prisma.order.findMany({ where: { sellerId: req.user.id }, include: { listing: { select: { title: true } }, client: { select: { name: true } } }, orderBy: { createdAt: 'desc' } });
  res.json(orders);
});

router.get('/orders/mine', requireAuth, async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { clientId: req.user.id },
    include: {
      listing: { select: { title: true, icon: true, billingPeriod: true } },
      seller: { select: { id: true, name: true, storeName: true, storeColor: true, storeBannerUrl: true } },
      reviews: { where: { authorId: req.user.id }, select: { id: true, stars: true, comment: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(orders);
});

router.get('/orders/:id', requireAuth, async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { listing: { select: { title: true } }, seller: { select: { id: true, name: true, storeName: true, storeColor: true, storeBannerUrl: true } }, reviews: { where: { authorId: req.user.id }, select: { id: true, stars: true, comment: true } } }
  });

  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
  if (order.clientId !== req.user.id) return res.status(403).json({ error: 'Acesso negado' });

  res.json(order);
});

router.patch('/seller/orders/:id/delivery', requireAuth, async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order || (order.sellerId !== req.user.id && !['ADMIN','SUPPORT'].includes(req.user.role))) return res.status(404).json({ error: 'Pedido não encontrado' });
  if (!['PAID','AWAITING_DELIVERY','DELIVERED','IN_WARRANTY','COMPLETED'].includes(order.status)) return res.status(400).json({ error: 'O pedido ainda não está disponível para entrega.' });
  const deliveryLogin = String(req.body.deliveryLogin || '').trim().slice(0, 500);
  const deliveryPassword = String(req.body.deliveryPassword || '').trim().slice(0, 1000);
  const deliveryCredentials = String(req.body.deliveryCredentials || '').trim().slice(0, 10000);
  const updated = await prisma.order.update({ where: { id: order.id }, data: { deliveryLogin: deliveryLogin || null, deliveryPassword: deliveryPassword || null, deliveryCredentials: deliveryCredentials || [deliveryLogin, deliveryPassword].filter(Boolean).join(':') || null } });
  res.json({ ok: true, deliveryLogin: updated.deliveryLogin, deliveryPassword: updated.deliveryPassword, deliveryCredentials: updated.deliveryCredentials });
});

router.get('/orders/:id/delivery', requireAuth, async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id }, select: { clientId: true, sellerId: true, status: true, deliveryLogin: true, deliveryPassword: true, deliveryCredentials: true } });
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
  if (![order.clientId, order.sellerId].includes(req.user.id) && !['ADMIN','SUPPORT'].includes(req.user.role)) return res.status(403).json({ error: 'Acesso negado' });
  res.json({ deliveryLogin: order.deliveryLogin, deliveryPassword: order.deliveryPassword, deliveryCredentials: order.deliveryCredentials, status: order.status });
});

module.exports = router;
