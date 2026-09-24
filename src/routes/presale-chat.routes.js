const express = require('express');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

function generateProtocol() {
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `DUV-${rand}`;
}

router.post('/presale-chats', requireAuth, async (req, res) => {
  const { listingId } = req.body;

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return res.status(404).json({ error: 'Anúncio não encontrado' });

  if (listing.sellerId === req.user.id) {
    return res.status(400).json({ error: 'Você não pode iniciar um chat com seu próprio anúncio' });
  }

  const chat = await prisma.preSaleChat.upsert({
    where: { listingId_clientId: { listingId, clientId: req.user.id } },
    update: {},
    create: {
      protocol: generateProtocol(),
      listingId,
      clientId: req.user.id,
      sellerId: listing.sellerId
    }
  });

  res.status(201).json(chat);
});

router.get('/presale-chats/mine', requireAuth, async (req, res) => {
  const chats = await prisma.preSaleChat.findMany({
    where: { OR: [{ clientId: req.user.id }, { sellerId: req.user.id }] },
    include: {
      listing: { select: { title: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 }
    },
    orderBy: { updatedAt: 'desc' }
  });

  const withUnread = await Promise.all(chats.map(async chat => {
    const isClient = chat.clientId === req.user.id;
    const lastRead = isClient ? chat.lastReadClient : chat.lastReadSeller;
    const unreadCount = await prisma.preSaleMessage.count({
      where: {
        chatId: chat.id,
        senderType: isClient ? { not: 'CLIENT' } : { not: 'SELLER' },
        ...(lastRead ? { createdAt: { gt: lastRead } } : {})
      }
    });
    return { ...chat, unreadCount };
  }));

  res.json(withUnread);
});

router.get('/presale-chats/:id', requireAuth, async (req, res) => {
  const chat = await prisma.preSaleChat.findUnique({
    where: { id: req.params.id },
    include: { messages: { orderBy: { createdAt: 'asc' } }, listing: { select: { title: true } } }
  });

  if (!chat) return res.status(404).json({ error: 'Chat não encontrado' });
  if (![chat.clientId, chat.sellerId].includes(req.user.id)) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  if (req.user.id === chat.clientId) {
    await prisma.preSaleChat.update({ where: { id: chat.id }, data: { lastReadClient: new Date() } });
  } else {
    await prisma.preSaleChat.update({ where: { id: chat.id }, data: { lastReadSeller: new Date() } });
  }

  res.json(chat);
});

router.post('/presale-chats/:id/messages', requireAuth, async (req, res) => {
  const { content } = req.body;

  const chat = await prisma.preSaleChat.findUnique({ where: { id: req.params.id } });
  if (!chat) return res.status(404).json({ error: 'Chat não encontrado' });

  let senderType;
  if (req.user.id === chat.clientId) senderType = 'CLIENT';
  else if (req.user.id === chat.sellerId) senderType = 'SELLER';
  else return res.status(403).json({ error: 'Acesso negado' });

  const message = await prisma.preSaleMessage.create({
    data: { chatId: chat.id, senderId: req.user.id, senderType, content }
  });

  await prisma.preSaleChat.update({ where: { id: chat.id }, data: { updatedAt: new Date() } });

  res.status(201).json(message);
});

module.exports = router;
