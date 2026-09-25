const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Token ausente' });

  const token = header.replace('Bearer ', '');

  jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
    if (err) return res.status(401).json({ error: 'Token inválido' });

    try {
      const user = await prisma.user.findUnique({ where: { id: payload.id }, select: { banned: true } });
      if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });
      if (user.banned) return res.status(403).json({ error: 'Conta suspensa' });
    } catch {
      return res.status(500).json({ error: 'Erro ao validar usuário' });
    }

    req.user = payload;
    next();
  });
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
