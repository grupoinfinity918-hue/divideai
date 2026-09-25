const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

function issueToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

router.post('/auth/register', async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'Preencha todos os campos' });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ error: 'E-mail já cadastrado' });

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash,
      role: role === 'SELLER' ? 'SELLER' : 'CLIENT'
    }
  });

  const token = issueToken(user);
  res.status(201).json({ token, user: { id: user.id, name: user.name, role: user.role } });
});

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' });

  if (user.banned) return res.status(403).json({ error: 'Conta suspensa' });

  const token = issueToken(user);
  res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
});

router.get('/auth/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, phone: true, role: true, kycStatus: true, avatarUrl: true }
  });
  res.json(user);
});

module.exports = router;
