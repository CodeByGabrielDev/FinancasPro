const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const {
  listar,
  resumo,
  criar,
  atualizar,
  remover,
} = require('../controllers/transactionController');

// Todas as rotas de transações exigem JWT
router.use(authMiddleware);

// GET /transactions/summary — DEVE vir antes de /:id para não ser interceptado
router.get('/summary', resumo);

// GET /transactions — Lista transações com filtros opcionais
router.get('/', listar);

// POST /transactions — Cria nova transação
router.post('/', criar);

// PUT /transactions/:id — Atualiza transação
router.put('/:id', atualizar);

// DELETE /transactions/:id — Remove transação
router.delete('/:id', remover);

module.exports = router;
