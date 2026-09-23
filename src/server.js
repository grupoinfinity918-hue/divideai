require('dotenv').config();
const express = require('express');
const cors = require('cors');

const paymentRoutes = require('./routes/payment.routes');
const chatRoutes = require('./routes/chat.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api', paymentRoutes);
app.use('/api', chatRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Divide Aí backend rodando na porta ${PORT}`);
});
