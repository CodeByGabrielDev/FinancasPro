require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');

const app = express();

// Middlewares globais
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'financaspro-backend', timestamp: new Date().toISOString() });
});

// Rotas
app.use('/auth', authRoutes);
app.use('/transactions', transactionRoutes);

// Handler de rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

module.exports = app;
