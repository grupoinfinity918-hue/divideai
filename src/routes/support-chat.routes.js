const express = require('express');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

function generateProtocol() {
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `SUP-${rand}`;
}

router.post('/support-chats', requireAuth, async (req, res) => {
  let chat = await prisma.supportChat.findFirst({
    where: { userId: req.user.id, status: { not: 'COMPLETED' } },
    orderBy: { createdAt: 'desc' }
  });

  if (!chat) {
    chat = await prisma.supportChat.create({
      data: { protocol: generateProtocol(), userId: req.user.id }
    });
  }

  res.status(201).json(chat);
});

router.get('/support-chats/:id', requireAuth, async (req, res) => {
  const chat = await prisma.supportChat.findUnique({
    where: { id: req.params.id },
    include: { messages: { orderBy: { createdAt: 'asc' } } }
  });

  if (!chat) return res.status(404).json({ error: 'Chat não encontrado' });
  const isOwner = chat.userId === req.user.id;
  const isStaff = ['ADMIN', 'SUPPORT'].includes(req.user.role);
  if (!isOwner && !isStaff) return res.status(403).json({ error: 'Acesso negado' });

  res.json(chat);
});

router.post('/support-chats/:id/messages', requireAuth, async (req, res) => {
  const { content } = req.body;

  const chat = await prisma.supportChat.findUnique({ where: { id: req.params.id } });
  if (!chat) return res.status(404).json({ error: 'Chat não encontrado' });

  const isStaff = ['ADMIN', 'SUPPORT'].includes(req.user.role);
  if (chat.userId !== req.user.id && !isStaff) return res.status(403).json({ error: 'Acesso negado' });

  const message = await prisma.supportMessage.create({
    data: {
      chatId: chat.id,
      senderId: req.user.id,
      senderType: isStaff ? 'SUPPORT' : 'CLIENT',
      content
    }
  });

  await prisma.supportChat.update({ where: { id: chat.id }, data: { updatedAt: new Date() } });

  res.status(201).json(message);
});

router.get('/admin/support-chats', requireAuth, requireRole(['ADMIN', 'SUPPORT']), async (req, res) => {
  const chats = await prisma.supportChat.findMany({
    where: { status: { not: 'COMPLETED' } },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { updatedAt: 'desc' }
  });
  res.json(chats);
});

module.exports = router;
