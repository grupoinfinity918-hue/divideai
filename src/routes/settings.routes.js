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
  const { aiChatEnabled, activeTheme, homepageOrder, carouselIntervalMs, platformRules } = req.body;

  const updated = await prisma.adminSettings.upsert({
    where: { id: 'singleton' },
    update: {
      ...(aiChatEnabled !== undefined ? { aiChatEnabled } : {}),
      ...(activeTheme ? { activeTheme } : {}),
      ...(homepageOrder ? { homepageOrder } : {}),
      ...(carouselIntervalMs !== undefined ? { carouselIntervalMs: Math.max(2000, Math.min(30000, Number(carouselIntervalMs) || 5000)) } : {}),
      ...(platformRules !== undefined ? { platformRules: String(platformRules).slice(0, 10000) } : {})
    },
    create: { id: 'singleton' }
  });

  res.json(updated);
});


router.get('/admin/themes', requireAuth, requireRole(['ADMIN','SUPPORT']), async (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const root = path.join(__dirname, '../../frontend/public/themes');
  const themes = [];
  try {
    for (const dir of fs.readdirSync(root, { withFileTypes: true })) {
      if (!dir.isDirectory()) continue;
      const file = path.join(root, dir.name, 'theme.json');
      if (!fs.existsSync(file)) continue;
      try { themes.push(JSON.parse(fs.readFileSync(file, 'utf8'))); } catch (_) {}
    }
  } catch (_) {}
  if (!themes.some(t => t.key === 'DEFAULT')) themes.unshift({ key: 'DEFAULT', label: 'Padrão', colors: { '--da-primary': '#ec1c6a', '--da-primary-dark': '#c4104f', '--da-primary-light': '#ff8fb8', '--da-surface': '#fff5f8', '--da-border': '#ffd6e4' } });
  res.json(themes);
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
