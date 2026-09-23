const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/wallet', requireAuth, async (req, res) => {
  const wallet = await prisma.wallet.upsert({
    where: { userId: req.user.id },
    update: {},
    create: { userId: req.user.id }
  });
  res.json(wallet);
});

router.post('/wallet/withdraw', requireAuth, async (req, res) => {
  const { amount, pixKeyType, pixKey } = req.body;
  const value = Number(amount);

  if (!value || value <= 0 || !pixKeyType || !pixKey) {
    return res.status(400).json({ error: 'Dados de saque inválidos' });
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } });
  if (!wallet || Number(wallet.balanceFree) < value) {
    return res.status(400).json({ error: 'Saldo disponível insuficiente' });
  }

  const [request] = await prisma.$transaction([
    prisma.withdrawalRequest.create({
      data: { sellerId: req.user.id, amount: value, pixKeyType, pixKey }
    }),
    prisma.wallet.update({
      where: { id: wallet.id },
      data: { balanceFree: { decrement: value } }
    })
  ]);

  res.status(201).json(request);
});

router.get('/wallet/withdrawals/mine', requireAuth, async (req, res) => {
  const list = await prisma.withdrawalRequest.findMany({
    where: { sellerId: req.user.id },
    orderBy: { createdAt: 'desc' }
  });
  res.json(list);
});

router.get('/admin/withdrawals', requireAuth, requireRole(['ADMIN', 'SUPPORT']), async (req, res) => {
  const list = await prisma.withdrawalRequest.findMany({
    where: { status: 'PENDING' },
    include: { seller: { select: { name: true, phone: true } } },
    orderBy: { createdAt: 'asc' }
  });
  res.json(list);
});

router.post('/admin/withdrawals/:id/pay', requireAuth, requireRole(['ADMIN', 'SUPPORT']), async (req, res) => {
  const request = await prisma.withdrawalRequest.findUnique({ where: { id: req.params.id } });
  if (!request || request.status !== 'PENDING') {
    return res.status(404).json({ error: 'Solicitação não encontrada' });
  }

  const updated = await prisma.withdrawalRequest.update({
    where: { id: request.id },
    data: { status: 'PAID', paidAt: new Date() }
  });

  res.json(updated);
});

module.exports = router;
