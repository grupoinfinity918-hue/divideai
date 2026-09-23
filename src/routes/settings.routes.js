const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/settings', async (req, res) => {
  const settings = await prisma.adminSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' }
  });
  res.json(settings);
});

router.patch('/admin/settings', requireAuth, requireRole(['ADMIN']), async (req, res) => {
  const { aiChatEnabled, activeTheme, homepageOrder } = req.body;

  const updated = await prisma.adminSettings.upsert({
    where: { id: 'singleton' },
    update: {
      ...(aiChatEnabled !== undefined ? { aiChatEnabled } : {}),
      ...(activeTheme ? { activeTheme } : {}),
      ...(homepageOrder ? { homepageOrder } : {})
    },
    create: { id: 'singleton' }
  });

  res.json(updated);
});

router.get('/admin/listing-edits', requireAuth, requireRole(['ADMIN', 'SUPPORT']), async (req, res) => {
  const { status } = req.query;
  const edits = await prisma.listingEdit.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: 'desc' }
  });
  res.json(edits);
});

router.post('/admin/listing-edits/:id/decision', requireAuth, requireRole(['ADMIN', 'SUPPORT']), async (req, res) => {
  const { decision } = req.body;
  const edit = await prisma.listingEdit.findUnique({ where: { id: req.params.id } });
  if (!edit) return res.status(404).json({ error: 'Edição não encontrada' });

  if (decision === 'APPROVE') {
    await prisma.$transaction([
      prisma.listing.update({ where: { id: edit.listingId }, data: edit.afterData }),
      prisma.listingEdit.update({
        where: { id: edit.id },
        data: { status: 'ACTIVE', reviewedBy: req.user.id, reviewedAt: new Date() }
      })
    ]);
  } else {
    await prisma.listingEdit.update({
      where: { id: edit.id },
      data: { status: 'REJECTED', reviewedBy: req.user.id, reviewedAt: new Date() }
    });
  }

  res.json({ ok: true });
});

module.exports = router;
