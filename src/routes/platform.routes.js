const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

async function notify(userId, type, title, message, link) {
  return prisma.notification.create({ data: { userId, type, title, message, link } });
}

router.get('/pedido/public/:protocol', async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { protocol: req.params.protocol },
    include: { listing: { select: { title: true, billingPeriod: true } }, seller: { select: { name: true, storeName: true } }, events: { orderBy: { createdAt: 'asc' }, select: { toStatus: true, note: true, createdAt: true } } }
  });
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
  res.json({ protocol: order.protocol, status: order.status, amount: order.amount, paidAt: order.paidAt, createdAt: order.createdAt, listing: order.listing, seller: order.seller, events: order.events });
});

router.patch('/orders/:id/status', requireAuth, async (req, res) => {
  const { status, note } = req.body;
  const allowed = ['AWAITING_PAYMENT','PAID','AWAITING_DELIVERY','DELIVERED','IN_WARRANTY','COMPLETED','DISPUTED','REFUNDED','CANCELLED'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Status inválido' });
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
  const canManage = req.user.role === 'ADMIN' || req.user.role === 'SUPPORT' || req.user.id === order.sellerId;
  if (!canManage) return res.status(403).json({ error: 'Acesso negado' });
  const updated = await prisma.$transaction(async tx => {
    const result = await tx.order.update({ where: { id: order.id }, data: { status, ...(status === 'DELIVERED' || status === 'COMPLETED' ? { deliveredAt: new Date() } : {}) } });
    await tx.orderEvent.create({ data: { orderId: order.id, actorId: req.user.id, fromStatus: order.status, toStatus: status, note: note || null } });
    return result;
  });
  await notify(order.clientId, 'ORDER_STATUS', `Pedido ${order.protocol}`, `O status do seu pedido mudou para ${status}.`, `/pedido/${order.protocol}`);
  if (order.sellerId !== req.user.id) await notify(order.sellerId, 'ORDER_STATUS', `Pedido ${order.protocol}`, `O status do pedido foi atualizado para ${status}.`, `/loja`);
  res.json(updated);
});

router.get('/orders/:id/events', requireAuth, async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id }, select: { clientId: true, sellerId: true } });
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
  if (![order.clientId, order.sellerId].includes(req.user.id) && !['ADMIN','SUPPORT'].includes(req.user.role)) return res.status(403).json({ error: 'Acesso negado' });
  res.json(await prisma.orderEvent.findMany({ where: { orderId: req.params.id }, orderBy: { createdAt: 'asc' }, include: { actor: { select: { name: true } } } }));
});

router.post('/orders/:id/reviews', requireAuth, async (req, res) => {
  const { stars, comment } = req.body;
  const value = Number(stars);
  if (!Number.isInteger(value) || value < 1 || value > 5) return res.status(400).json({ error: 'Avaliação deve ter de 1 a 5 estrelas.' });
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order || order.status !== 'COMPLETED') return res.status(400).json({ error: 'O pedido precisa estar concluído.' });
  const targetId = req.user.id === order.clientId ? order.sellerId : req.user.id === order.sellerId ? order.clientId : null;
  if (!targetId) return res.status(403).json({ error: 'Acesso negado' });
  const existing = await prisma.review.findFirst({ where: { orderId: order.id, authorId: req.user.id } });
  if (existing) return res.status(409).json({ error: 'Você já avaliou este pedido.' });
  const review = await prisma.review.create({ data: { orderId: order.id, authorId: req.user.id, targetId, stars: value, comment: comment?.trim() || null } });
  await notify(targetId, 'REVIEW_RECEIVED', 'Você recebeu uma avaliação', `Seu pedido ${order.protocol} recebeu ${value} estrela(s).`, '/loja');
  res.status(201).json(review);
});

router.get('/notifications', requireAuth, async (req, res) => {
  res.json(await prisma.notification.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 50 }));
});
router.patch('/notifications/:id/read', requireAuth, async (req, res) => {
  const item = await prisma.notification.updateMany({ where: { id: req.params.id, userId: req.user.id }, data: { readAt: new Date() } });
  res.json({ ok: item.count > 0 });
});

router.get('/comments', async (req, res) => {
  const { targetType, targetId } = req.query;
  if (!targetType || !targetId) return res.status(400).json({ error: 'Referência obrigatória' });
  res.json(await prisma.comment.findMany({ where: { targetType, targetId, status: 'VISIBLE' }, orderBy: { createdAt: 'desc' }, include: { author: { select: { id: true, name: true, avatarUrl: true } } } }));
});
router.post('/comments', requireAuth, async (req, res) => {
  const { targetType, targetId, content } = req.body;
  if (!targetType || !targetId || !content?.trim()) return res.status(400).json({ error: 'Comentário inválido' });
  if (content.length > 2000) return res.status(400).json({ error: 'Comentário muito longo' });
  const comment = await prisma.comment.create({ data: { authorId: req.user.id, targetType, targetId, content: content.trim() } });
  res.status(201).json(comment);
});
router.get('/admin/comments', requireAuth, requireRole(['ADMIN','SUPPORT']), async (req, res) => {
  res.json(await prisma.comment.findMany({ orderBy: { createdAt: 'desc' }, include: { author: { select: { name: true, email: true } } } }));
});
router.patch('/admin/comments/:id', requireAuth, requireRole(['ADMIN','SUPPORT']), async (req, res) => {
  const status = ['VISIBLE','HIDDEN','DELETED'].includes(req.body.status) ? req.body.status : 'HIDDEN';
  res.json(await prisma.comment.update({ where: { id: req.params.id }, data: { status, moderatedBy: req.user.id, moderatedAt: new Date() } }));
});

router.post('/coupons/validate', async (req, res) => {
  const { code, amount, listingId, userId } = req.body;
  const coupon = await prisma.coupon.findUnique({ where: { code: String(code || '').trim().toUpperCase() } });
  if (!coupon || !coupon.active) return res.status(404).json({ error: 'Cupom inválido' });
  const now = new Date();
  if ((coupon.startsAt && coupon.startsAt > now) || (coupon.expiresAt && coupon.expiresAt < now) || (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses)) return res.status(400).json({ error: 'Cupom expirado ou indisponível' });
  if (coupon.userId && coupon.userId !== userId) return res.status(403).json({ error: 'Cupom não disponível para este usuário' });
  if (coupon.listingId && coupon.listingId !== listingId) return res.status(400).json({ error: 'Cupom não válido para este serviço' });
  const value = Number(amount || 0);
  if (coupon.minAmount && value < Number(coupon.minAmount)) return res.status(400).json({ error: `Valor mínimo de R$ ${Number(coupon.minAmount).toFixed(2)}` });
  const discount = coupon.type === 'PERCENT' ? Math.min(value, value * Number(coupon.value) / 100) : Math.min(value, Number(coupon.value));
  res.json({ id: coupon.id, code: coupon.code, discount: Math.round(discount * 100) / 100, total: Math.max(0, Math.round((value - discount) * 100) / 100) });
});
router.get('/admin/coupons', requireAuth, requireRole(['ADMIN']), async (req,res) => res.json(await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } })));
router.post('/admin/coupons', requireAuth, requireRole(['ADMIN']), async (req,res) => {
  const { code, type='PERCENT', value, minAmount, maxUses, startsAt, expiresAt, listingId, userId } = req.body;
  if (!code || !Number.isFinite(Number(value))) return res.status(400).json({ error: 'Código e valor são obrigatórios' });
  const coupon = await prisma.coupon.create({ data: { code: code.trim().toUpperCase(), type, value: Number(value), minAmount: minAmount == null ? null : Number(minAmount), maxUses: maxUses == null ? null : Number(maxUses), startsAt: startsAt ? new Date(startsAt) : null, expiresAt: expiresAt ? new Date(expiresAt) : null, listingId: listingId || null, userId: userId || null } });
  res.status(201).json(coupon);
});

router.get('/banners', async (req,res) => {
  const theme = req.query.theme || 'DEFAULT';
  res.json(await prisma.banner.findMany({
    where: { active: true, theme: { in: [theme, 'DEFAULT'] } },
    orderBy: { sortOrder: 'asc' }
  }));
});

router.get('/admin/banners', requireAuth, requireRole(['ADMIN']), async (req,res) => {
  res.json(await prisma.banner.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] }));
});

router.post('/admin/banners', requireAuth, requireRole(['ADMIN']), async (req,res) => {
  const { eyebrow, title, description, buttonText, desktopUrl, mobileUrl, href, theme='DEFAULT', sortOrder=0, active=true } = req.body;
  if (!desktopUrl) return res.status(400).json({ error: 'Banner desktop é obrigatório' });
  const banner = await prisma.banner.create({
    data: {
      eyebrow: eyebrow || null,
      title: title || null,
      description: description || null,
      buttonText: buttonText || null,
      desktopUrl,
      mobileUrl: mobileUrl || null,
      href: href || null,
      theme,
      sortOrder: Number(sortOrder) || 0,
      active: Boolean(active)
    }
  });
  res.status(201).json(banner);
});

router.patch('/admin/banners/:id', requireAuth, requireRole(['ADMIN']), async (req,res) => {
  const { eyebrow, title, description, buttonText, desktopUrl, mobileUrl, href, theme, sortOrder, active } = req.body;
  const existing = await prisma.banner.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Banner não encontrado' });
  const banner = await prisma.banner.update({
    where: { id: req.params.id },
    data: {
      ...(eyebrow !== undefined ? { eyebrow: eyebrow || null } : {}),
      ...(title !== undefined ? { title: title || null } : {}),
      ...(description !== undefined ? { description: description || null } : {}),
      ...(buttonText !== undefined ? { buttonText: buttonText || null } : {}),
      ...(desktopUrl !== undefined ? { desktopUrl } : {}),
      ...(mobileUrl !== undefined ? { mobileUrl: mobileUrl || null } : {}),
      ...(href !== undefined ? { href: href || null } : {}),
      ...(theme !== undefined ? { theme } : {}),
      ...(sortOrder !== undefined ? { sortOrder: Number(sortOrder) || 0 } : {}),
      ...(active !== undefined ? { active: Boolean(active) } : {})
    }
  });
  res.json(banner);
});

router.delete('/admin/banners/:id', requireAuth, requireRole(['ADMIN']), async (req,res) => {
  await prisma.banner.delete({ where: { id: req.params.id } });
  res.json({ok:true});
});

router.get('/admin/own-products', requireAuth, requireRole(['ADMIN']), async (req,res) => {
  const listings = await prisma.listing.findMany({
    where: { origin: 'OWN', sellerId: req.user.id },
    include: { category: { select: { name: true, slug: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(listings);
});

router.post('/admin/own-products', requireAuth, requireRole(['ADMIN']), async (req,res) => {
  const { categoryId, title, description, rules, price, slotsTotal, billingPeriod='mensal', icon='tv', autoDelivery=false, autoDeliveryPayload, isPrioritario=false } = req.body;
  if (!categoryId || !title?.trim() || !description?.trim() || !Number.isFinite(Number(price))) {
    return res.status(400).json({ error: 'Categoria, título, descrição e preço são obrigatórios.' });
  }
  const total = slotsTotal === '' || slotsTotal == null ? null : Number(slotsTotal);
  const listing = await prisma.listing.create({
    data: {
      sellerId: req.user.id,
      categoryId,
      origin: 'OWN',
      title: title.trim(),
      description: description.trim(),
      rules: rules || null,
      price: Number(price),
      slotsTotal: total,
      slotsAvailable: total,
      billingPeriod: billingPeriod || 'mensal',
      icon: icon || 'tv',
      autoDelivery: Boolean(autoDelivery),
      autoDeliveryPayload: autoDelivery ? (autoDeliveryPayload || null) : null,
      isPrioritario: Boolean(isPrioritario),
      status: 'ACTIVE'
    },
    include: { category: { select: { name: true, slug: true } } }
  });
  res.status(201).json(listing);
});

router.patch('/admin/own-products/:id', requireAuth, requireRole(['ADMIN']), async (req,res) => {
  const existing = await prisma.listing.findFirst({ where: { id: req.params.id, origin: 'OWN', sellerId: req.user.id } });
  if (!existing) return res.status(404).json({ error: 'Produto próprio não encontrado.' });
  const { categoryId, title, description, rules, price, slotsTotal, billingPeriod, icon, autoDelivery, autoDeliveryPayload, isPrioritario, status } = req.body;
  const total = slotsTotal === '' || slotsTotal == null ? null : Number(slotsTotal);
  const data = {
    ...(categoryId ? { categoryId } : {}),
    ...(title !== undefined ? { title: String(title).trim() } : {}),
    ...(description !== undefined ? { description: String(description).trim() } : {}),
    ...(rules !== undefined ? { rules: rules || null } : {}),
    ...(price !== undefined ? { price: Number(price) } : {}),
    ...(slotsTotal !== undefined ? { slotsTotal: total, slotsAvailable: total } : {}),
    ...(billingPeriod !== undefined ? { billingPeriod: billingPeriod || 'mensal' } : {}),
    ...(icon !== undefined ? { icon: icon || 'tv' } : {}),
    ...(autoDelivery !== undefined ? { autoDelivery: Boolean(autoDelivery), autoDeliveryPayload: autoDelivery ? (autoDeliveryPayload || null) : null } : {}),
    ...(isPrioritario !== undefined ? { isPrioritario: Boolean(isPrioritario) } : {}),
    ...(status && ['ACTIVE','PAUSED'].includes(status) ? { status } : {})
  };
  const updated = await prisma.listing.update({ where: { id: existing.id }, data, include: { category: { select: { name: true, slug: true } } } });
  res.json(updated);
});

router.delete('/admin/own-products/:id', requireAuth, requireRole(['ADMIN']), async (req,res) => {
  const existing = await prisma.listing.findFirst({ where: { id: req.params.id, origin: 'OWN', sellerId: req.user.id } });
  if (!existing) return res.status(404).json({ error: 'Produto próprio não encontrado.' });
  await prisma.listing.delete({ where: { id: existing.id } });
  res.json({ ok: true });
});

router.get('/admin/dashboard', requireAuth, requireRole(['ADMIN','SUPPORT']), async (req,res) => {
  const start = req.query.start ? new Date(req.query.start) : new Date(new Date().setHours(0,0,0,0));
  const end = req.query.end ? new Date(req.query.end) : new Date();
  const orders = await prisma.order.findMany({ where: { createdAt: { gte: start, lte: end } }, select: { amount: true, commissionAmt: true, netToSeller: true, status: true, sellerId: true, listingId: true, createdAt: true } });
  const users = await prisma.user.count({ where: { createdAt: { lte: end } } });
  const paid = orders.filter(o => ['PAID','AWAITING_DELIVERY','DELIVERED','IN_WARRANTY','COMPLETED'].includes(o.status));
  const byDay = {};
  for (const o of paid) { const k=o.createdAt.toISOString().slice(0,10); byDay[k]=(byDay[k]||0)+Number(o.amount); }
  res.json({ gross: paid.reduce((s,o)=>s+Number(o.amount),0), commissions: paid.reduce((s,o)=>s+Number(o.commissionAmt),0), net: paid.reduce((s,o)=>s+Number(o.netToSeller),0), sales: paid.length, pending: orders.filter(o=>o.status==='AWAITING_PAYMENT').length, users, byDay });
});

router.get('/ranking/sellers', async (req,res) => {
  const sellers = await prisma.user.findMany({
    where: { role: 'SELLER', banned: false },
    select: { id:true, name:true, storeName:true, avatarUrl:true, createdAt:true, reviewsReceived:{select:{stars:true}} }
  });
  const sales = await prisma.order.groupBy({
    by: ['sellerId'],
    where: { status: { in: ['PAID','AWAITING_DELIVERY','DELIVERED','IN_WARRANTY','COMPLETED'] } },
    _sum: { amount: true },
    _count: { _all: true }
  });
  const salesMap = Object.fromEntries(sales.map(s => [s.sellerId, { total: Number(s._sum.amount || 0), orders: s._count._all }]));
  const ranking = sellers.map(s => {
    const r = salesMap[s.id] || { total: 0, orders: 0 };
    const ratings = s.reviewsReceived;
    const avg = ratings.length ? ratings.reduce((a,x)=>a+x.stars,0)/ratings.length : 0;
    return { ...s, totalSales: r.total, salesCount: r.orders, ratingAverage: avg, ratingCount: ratings.length };
  }).sort((a,b) => b.totalSales - a.totalSales || b.salesCount - a.salesCount);
  res.json(ranking.slice(0,50));
});

module.exports = router;
