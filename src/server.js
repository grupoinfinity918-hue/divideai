require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

process.on('unhandledRejection', (err) => {
  console.error('Erro não tratado (requisição falhou, mas o servidor continua no ar):', err);
});
process.on('uncaughtException', (err) => {
  console.error('Exceção não tratada (servidor continua no ar):', err);
});

const authRoutes = require('./routes/auth.routes');
const paymentRoutes = require('./routes/payment.routes');
const chatRoutes = require('./routes/chat.routes');
const walletRoutes = require('./routes/wallet.routes');
const listingsRoutes = require('./routes/listings.routes');
const settingsRoutes = require('./routes/settings.routes');
const usersRoutes = require('./routes/users.routes');
const ordersRoutes = require('./routes/orders.routes');
const presaleChatRoutes = require('./routes/presale-chat.routes');
const reportsRoutes = require('./routes/reports.routes');
const supportChatRoutes = require('./routes/support-chat.routes');
const platformRoutes = require('./routes/platform.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api', authRoutes);
app.use('/api', paymentRoutes);
app.use('/api', chatRoutes);
app.use('/api', walletRoutes);
app.use('/api', listingsRoutes);
app.use('/api', settingsRoutes);
app.use('/api', usersRoutes);
app.use('/api', ordersRoutes);
app.use('/api', presaleChatRoutes);
app.use('/api', reportsRoutes);
app.use('/api', supportChatRoutes);
app.use('/api', platformRoutes);

const FRONTEND_DIST = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(FRONTEND_DIST));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Divide Aí rodando na porta ${PORT}`);
});
