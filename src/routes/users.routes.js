const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/admin/users', requireAuth, requireRole(['ADMIN', 'SUPPORT']), async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, phone: true, role: true, banned: true, customCommissionRate: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(users);
});

router.patch('/admin/users/:id', requireAuth, requireRole(['ADMIN']), async (req, res) => {
  const { name, email, phone, password, customCommissionRate } = req.body;

  const data = {};
  if (name) data.name = name;
  if (email) data.email = email;
  if (phone) data.phone = phone;
  if (password) data.passwordHash = await bcrypt.hash(password, 10);

  if (customCommissionRate !== undefined) {
    const rate = Number(customCommissionRate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      return res.status(400).json({ error: 'A comissão deve estar entre 0% e 100%.' });
    }

    const target = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { role: true }
    });

    if (!target) return res.status(404).json({ error: 'Usuário não encontrado' });
    if (target.role !== 'SELLER') {
      return res.status(400).json({ error: 'A comissão customizada só pode ser definida para vendedores.' });
    }

    data.customCommissionRate = Math.round(rate * 100) / 100;
  }

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data,
    select: { id: true, name: true, email: true, phone: true, role: true, customCommissionRate: true }
  });

  res.json(updated);
});

router.patch('/admin/users/:id/ban', requireAuth, requireRole(['ADMIN']), async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { banned: !user.banned }
  });

  res.json(updated);
});

router.delete('/admin/users/:id', requireAuth, requireRole(['ADMIN']), async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

router.patch('/profile/avatar', requireAuth, async (req, res) => {
  const { avatarUrl } = req.body;
  if (!avatarUrl) return res.status(400).json({ error: 'Imagem inválida' });

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: { avatarUrl }
  });

  res.json({ id: updated.id, avatarUrl: updated.avatarUrl });
});

module.exports = router;
