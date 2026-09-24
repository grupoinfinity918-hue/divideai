const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/reports', requireAuth, async (req, res) => {
  const { targetType, targetId, reason } = req.body;

  if (!targetType || !targetId || !reason?.trim()) {
    return res.status(400).json({ error: 'Preencha o motivo da denúncia' });
  }

  const report = await prisma.report.create({
    data: { reporterId: req.user.id, targetType, targetId, reason: reason.trim() }
  });

  res.status(201).json(report);
});

router.get('/admin/reports', requireAuth, requireRole(['ADMIN', 'SUPPORT']), async (req, res) => {
  const reports = await prisma.report.findMany({
    where: { status: 'OPEN' },
    include: { reporter: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(reports);
});

router.post('/admin/reports/:id/resolve', requireAuth, requireRole(['ADMIN', 'SUPPORT']), async (req, res) => {
  const updated = await prisma.report.update({
    where: { id: req.params.id },
    data: { status: 'RESOLVED' }
  });
  res.json(updated);
});

module.exports = router;
