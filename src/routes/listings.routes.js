const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/categories', async (req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { order: 'asc' } });
  res.json(categories);
});

router.post('/admin/categories', requireAuth, requireRole(['ADMIN']), async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Nome da categoria é obrigatório' });

  const slug = name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');

  const category = await prisma.category.create({
    data: { name: name.trim(), slug }
  });

  res.status(201).json(category);
});

router.delete('/admin/categories/:id', requireAuth, requireRole(['ADMIN']), async (req, res) => {
  await prisma.category.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

router.get('/listings', async (req, res) => {
  const { origin, featured, limit } = req.query;
  const listings = await prisma.listing.findMany({
    where: { status: 'ACTIVE', ...(origin ? { origin } : {}) },
    orderBy: [{ isPrioritario: 'desc' }, { createdAt: 'desc' }],
    ...(featured && limit ? { take: Number(limit) } : {})
  });
  res.json(listings);
});

router.get('/listings/:id', async (req, res) => {
  const listing = await prisma.listing.findUnique({
    where: { id: req.params.id },
    include: { seller: { select: { id: true, name: true } }, category: { select: { name: true } } }
  });
  if (!listing) return res.status(404).json({ error: 'Anúncio não encontrado' });
  res.json(listing);
});

router.get('/seller/listings', requireAuth, async (req, res) => {
  const listings = await prisma.listing.findMany({
    where: { sellerId: req.user.id },
    orderBy: { createdAt: 'desc' }
  });
  res.json(listings);
});

router.post('/seller/listings', requireAuth, async (req, res) => {
  const { categoryId, title, description, rules, price, slotsTotal, autoDelivery, autoDeliveryPayload } = req.body;

  if (!categoryId || !title || !description || !price || !slotsTotal) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
  }

  const listing = await prisma.listing.create({
    data: {
      sellerId: req.user.id,
      categoryId,
      origin: 'THIRD_PARTY',
      title,
      description,
      rules: rules || null,
      price,
      slotsTotal: Number(slotsTotal),
      slotsAvailable: Number(slotsTotal),
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

router.get('/admin/listings', requireAuth, requireRole(['ADMIN', 'SUPPORT']), async (req, res) => {
  const listings = await prisma.listing.findMany({
    where: { status: { in: ['ACTIVE', 'PAUSED'] } },
    include: { seller: { select: { name: true, email: true } }, category: { select: { name: true } } },
    orderBy: [{ isPrioritario: 'desc' }, { createdAt: 'desc' }]
  });
  res.json(listings);
});

router.delete('/admin/listings/:id', requireAuth, requireRole(['ADMIN', 'SUPPORT']), async (req, res) => {
  await prisma.listing.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

router.patch('/admin/listings/:id/feature', requireAuth, requireRole(['ADMIN', 'SUPPORT']), async (req, res) => {
  const current = await prisma.listing.findUnique({ where: { id: req.params.id } });
  if (!current) return res.status(404).json({ error: 'Anúncio não encontrado' });

  const updated = await prisma.listing.update({
    where: { id: req.params.id },
    data: { isPrioritario: !current.isPrioritario }
  });

  res.json(updated);
});

module.exports = router;
