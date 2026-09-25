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
  const { origin, featured, limit, category } = req.query;
  const listings = await prisma.listing.findMany({
    where: {
      status: 'ACTIVE',
      ...(origin ? { origin } : {}),
      ...(category ? { category: { slug: category } } : {})
    },
    include: { category: { select: { name: true, slug: true } } },
    orderBy: [{ isPrioritario: 'desc' }, { createdAt: 'desc' }],
    ...(featured && limit ? { take: Number(limit) } : {})
  });
  res.json(listings);
});

router.get('/listings/:id', async (req, res) => {
  const listing = await prisma.listing.findUnique({
    where: { id: req.params.id },
    include: { seller: { select: { id: true, name: true, storeName: true, storeColor: true, storeBannerUrl: true, avatarUrl: true } }, category: { select: { name: true } } }
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
  const { categoryId, title, description, rules, price, slotsTotal, icon, autoDelivery, autoDeliveryPayload } = req.body;

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
      icon: icon || 'tv',
      autoDelivery: !!autoDelivery,
      autoDeliveryPayload: autoDelivery ? autoDeliveryPayload : null,
      status: 'ACTIVE'
    }
  });

  res.status(201).json(listing);
});

router.delete('/seller/listings/:id', requireAuth, async (req, res) => {
  const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
  if (!listing || listing.sellerId !== req.user.id) return res.status(404).json({ error: 'Anúncio não encontrado' });
  await prisma.listing.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

router.patch('/seller/listings/:id', requireAuth, async (req, res) => {
  const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
  if (!listing || listing.sellerId !== req.user.id) return res.status(404).json({ error: 'Anúncio não encontrado' });

  const { title, description, rules, price, slotsTotal, icon, categoryId } = req.body;
  const afterData = {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    ...(rules !== undefined ? { rules } : {}),
    ...(price ? { price: Number(price) } : {}),
    ...(slotsTotal ? { slotsTotal: Number(slotsTotal), slotsAvailable: Number(slotsTotal) } : {}),
    ...(icon ? { icon } : {}),
    ...(categoryId ? { categoryId } : {})
  };

  const beforeData = {
    title: listing.title,
    description: listing.description,
    rules: listing.rules,
    price: Number(listing.price),
    slotsTotal: listing.slotsTotal,
    icon: listing.icon,
    categoryId: listing.categoryId
  };

  const edit = await prisma.listingEdit.create({
    data: { listingId: listing.id, beforeData, afterData, status: 'PENDING_APPROVAL' }
  });

  res.status(201).json({ ok: true, pendingApproval: true, edit });
});

router.get('/sellers/:id/store', async (req, res) => {
  const seller = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: { id: true, name: true, avatarUrl: true, storeName: true, storeColor: true, storeBannerUrl: true, createdAt: true }
  });
  if (!seller) return res.status(404).json({ error: 'Vendedor não encontrado' });

  const listings = await prisma.listing.findMany({
    where: { sellerId: seller.id, status: 'ACTIVE' },
    orderBy: [{ isPrioritario: 'desc' }, { createdAt: 'desc' }]
  });

  const reviews = await prisma.review.findMany({
    where: { targetId: seller.id },
    include: { author: { select: { name: true, avatarUrl: true } } },
    orderBy: { createdAt: 'desc' }
  });

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.stars, 0) / reviews.length : null;

  res.json({ seller, listings, reviews, ratingAverage: avg, ratingCount: reviews.length });
});

router.patch('/seller/store', requireAuth, requireRole(['SELLER','ADMIN']), async (req, res) => {
  const { storeName, storeColor, storeBannerUrl, avatarUrl } = req.body;
  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      ...(storeName !== undefined ? { storeName } : {}),
      ...(storeColor !== undefined ? { storeColor } : {}),
      ...(storeBannerUrl !== undefined ? { storeBannerUrl } : {}),
      ...(avatarUrl !== undefined ? { avatarUrl } : {})
    }
  });
  res.json(updated);
});

router.post('/seller/kyc', requireAuth, async (req, res) => {
  const { fullName, cpf, birthDate, address } = req.body;
  if (!fullName || !cpf || !birthDate || !address) {
    return res.status(400).json({ error: 'Preencha nome completo, CPF, data de nascimento e endereço' });
  }

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      name: fullName,
      cpf,
      birthDate: new Date(birthDate),
      address,
      role: 'SELLER',
      kycStatus: 'APPROVED'
    }
  });

  res.json({ id: updated.id, name: updated.name, role: updated.role });
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
