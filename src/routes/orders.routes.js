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
      protocol: generateProtocol(),
      listingId: listing.id,
      clientId: req.user.id,
      sellerId: listing.sellerId,
      amount: listing.price,
      status: 'AWAITING_PAYMENT'
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

router.get('/orders/mine', requireAuth, async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { clientId: req.user.id },
    include: { listing: { select: { title: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(orders);
});

router.get('/orders/:id', requireAuth, async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { listing: { select: { title: true } } }
  });

  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
  if (order.clientId !== req.user.id) return res.status(403).json({ error: 'Acesso negado' });

  res.json(order);
});

module.exports = router;
