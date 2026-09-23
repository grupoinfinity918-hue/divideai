const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/categories', async (req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { order: 'asc' } });
  res.json(categories);
});

router.get('/listings', async (req, res) => {
  const { origin } = req.query;
  const listings = await prisma.listing.findMany({
    where: { status: 'ACTIVE', ...(origin ? { origin } : {}) },
    orderBy: { createdAt: 'desc' }
  });
  res.json(listings);
});

router.get('/seller/listings', requireAuth, async (req, res) => {
  const listings = await prisma.listing.findMany({
    where: { sellerId: req.user.id },
    orderBy: { createdAt: 'desc' }
  });
  res.json(listings);
});

router.post('/seller/listings', requireAuth, async (req, res) => {
  const { categoryId, title, description, price, autoDelivery, autoDeliveryPayload } = req.body;

  if (!categoryId || !title || !description || !price) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
  }

  const listing = await prisma.listing.create({
    data: {
      sellerId: req.user.id,
      categoryId,
      origin: 'THIRD_PARTY',
      title,
      description,
      price,
      autoDelivery: !!autoDelivery,
      autoDeliveryPayload: autoDelivery ? autoDeliveryPayload : null,
      status: 'ACTIVE'
    }
  });

  res.status(201).json(listing);
});

router.get('/seller/profile', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, phone: true, email: true }
  });
  res.json(user);
});

router.patch('/seller/profile', requireAuth, async (req, res) => {
  const { name, phone } = req.body;
  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: { name, phone }
  });
  res.json({ id: updated.id, name: updated.name, phone: updated.phone });
});

module.exports = router;
