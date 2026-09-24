const express = require('express');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

function generateProtocol() {
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `DA-${date}-${rand}`;
}

router.post('/chats', requireAuth, async (req, res) => {
  const { orderId } = req.body;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });

  const existing = await prisma.chat.findUnique({ where: { orderId } });
  if (existing) return res.json(existing);

  const chat = await prisma.chat.create({
    data: {
      protocol: generateProtocol(),
      orderId: order.id,
      clientId: order.clientId,
      sellerId: order.sellerId,
      status: 'AWAITING_SHIPMENT'
    }
  });

  res.status(201).json(chat);
});

router.get('/chats/mine', requireAuth, async (req, res) => {
  const userId = req.user.id;

  const chats = await prisma.chat.findMany({
    where: { OR: [{ clientId: userId }, { sellerId: userId }] },
    orderBy: { updatedAt: 'desc' },
    include: {
      order: { select: { protocol: true, amount: true, status: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 }
    }
  });

  const withUnread = await Promise.all(chats.map(async chat => {
    const isClient = chat.clientId === userId;
    const lastRead = isClient ? chat.lastReadClient : chat.lastReadSeller;
    const unreadCount = await prisma.chatMessage.count({
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

router.get('/chats/:protocol', requireAuth, async (req, res) => {
  const chat = await prisma.chat.findUnique({
    where: { protocol: req.params.protocol },
    include: { messages: { orderBy: { createdAt: 'asc' } }, order: true }
  });

  if (!chat) return res.status(404).json({ error: 'Chat não encontrado' });

  const isParty = [chat.clientId, chat.sellerId].includes(req.user.id);
  const isStaff = ['ADMIN', 'SUPPORT'].includes(req.user.role);
  if (!isParty && !isStaff) return res.status(403).json({ error: 'Acesso negado' });

  if (req.user.id === chat.clientId) {
    await prisma.chat.update({ where: { id: chat.id }, data: { lastReadClient: new Date() } });
  } else if (req.user.id === chat.sellerId) {
    await prisma.chat.update({ where: { id: chat.id }, data: { lastReadSeller: new Date() } });
  }

  res.json(chat);
});

router.post('/chats/:protocol/messages', requireAuth, async (req, res) => {
  const { content, attachmentUrl } = req.body;

  const chat = await prisma.chat.findUnique({ where: { protocol: req.params.protocol } });
  if (!chat) return res.status(404).json({ error: 'Chat não encontrado' });

  let senderType;
  if (req.user.id === chat.clientId) senderType = 'CLIENT';
  else if (req.user.id === chat.sellerId) senderType = 'SELLER';
  else if (['ADMIN', 'SUPPORT'].includes(req.user.role)) senderType = 'SUPPORT';
  else return res.status(403).json({ error: 'Acesso negado' });

  const message = await prisma.chatMessage.create({
    data: {
      chatId: chat.id,
      senderId: req.user.id,
      senderType,
      content,
      attachmentUrl
    }
  });

  await prisma.chat.update({ where: { id: chat.id }, data: { updatedAt: new Date() } });

  res.status(201).json(message);
});

router.patch('/chats/:protocol/status', requireAuth, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['AWAITING_SHIPMENT', 'IN_WARRANTY', 'COMPLETED', 'DISPUTED'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Status inválido' });
  }

  const chat = await prisma.chat.findUnique({ where: { protocol: req.params.protocol } });
  if (!chat) return res.status(404).json({ error: 'Chat não encontrado' });

  const isSeller = req.user.id === chat.sellerId;
  const isStaff = ['ADMIN', 'SUPPORT'].includes(req.user.role);
  if (!isSeller && !isStaff) return res.status(403).json({ error: 'Acesso negado' });

  const updated = await prisma.chat.update({
    where: { id: chat.id },
    data: { status }
  });

  res.json(updated);
});

router.post('/chats/:protocol/tripartite', requireAuth, requireRole(['ADMIN', 'SUPPORT']), async (req, res) => {
  const chat = await prisma.chat.findUnique({ where: { protocol: req.params.protocol } });
  if (!chat) return res.status(404).json({ error: 'Chat não encontrado' });

  const updated = await prisma.chat.update({
    where: { id: chat.id },
    data: { tripartite: true, supportId: req.user.id, status: 'DISPUTED' }
  });

  await prisma.chatMessage.create({
    data: {
      chatId: chat.id,
      senderId: req.user.id,
      senderType: 'SUPPORT',
      content: 'Suporte do Divide Aí entrou na conversa para mediar a disputa.'
    }
  });

  res.json(updated);
});

router.get('/admin/chats', requireAuth, requireRole(['ADMIN', 'SUPPORT']), async (req, res) => {
  const chats = await prisma.chat.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { order: { select: { protocol: true, amount: true, status: true } } }
  });
  res.json(chats);
});

router.get('/admin/chats-all', requireAuth, requireRole(['ADMIN', 'SUPPORT']), async (req, res) => {
  const [sales, presale, support] = await Promise.all([
    prisma.chat.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        client: { select: { name: true } },
        seller: { select: { name: true } },
        order: { select: { protocol: true, amount: true } }
      }
    }),
    prisma.preSaleChat.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        client: { select: { name: true } },
        seller: { select: { name: true } },
        listing: { select: { title: true } }
      }
    }),
    prisma.supportChat.findMany({
      where: { status: { not: 'COMPLETED' } },
      orderBy: { updatedAt: 'desc' },
      include: { user: { select: { name: true } } }
    })
  ]);

  res.json({
    sales: sales.map(c => ({ id: c.id, protocol: c.protocol, kind: 'VENDA', client: c.client.name, seller: c.seller.name, status: c.status })),
    presale: presale.map(c => ({ id: c.id, protocol: c.protocol, kind: 'DUVIDA', client: c.client.name, seller: c.seller.name, title: c.listing.title })),
    support: support.map(c => ({ id: c.id, protocol: c.protocol, kind: 'SUPORTE', user: c.user.name, status: c.status }))
  });
});

router.get('/chats/unread-count', requireAuth, async (req, res) => {
  const userId = req.user.id;

  const [saleChats, presaleChats, supportChats] = await Promise.all([
    prisma.chat.findMany({ where: { OR: [{ clientId: userId }, { sellerId: userId }] } }),
    prisma.preSaleChat.findMany({ where: { OR: [{ clientId: userId }, { sellerId: userId }] } }),
    prisma.supportChat.findMany({ where: { userId } })
  ]);

  let total = 0;

  for (const chat of saleChats) {
    const isClient = chat.clientId === userId;
    const lastRead = isClient ? chat.lastReadClient : chat.lastReadSeller;
    total += await prisma.chatMessage.count({
      where: { chatId: chat.id, senderType: isClient ? { not: 'CLIENT' } : { not: 'SELLER' }, ...(lastRead ? { createdAt: { gt: lastRead } } : {}) }
    });
  }

  for (const chat of presaleChats) {
    const isClient = chat.clientId === userId;
    const lastRead = isClient ? chat.lastReadClient : chat.lastReadSeller;
    total += await prisma.preSaleMessage.count({
      where: { chatId: chat.id, senderType: isClient ? { not: 'CLIENT' } : { not: 'SELLER' }, ...(lastRead ? { createdAt: { gt: lastRead } } : {}) }
    });
  }

  for (const chat of supportChats) {
    total += await prisma.supportMessage.count({
      where: { chatId: chat.id, senderType: { not: 'CLIENT' }, ...(chat.lastReadUser ? { createdAt: { gt: chat.lastReadUser } } : {}) }
    });
  }

  res.json({ unreadCount: total });
});

module.exports = router;
