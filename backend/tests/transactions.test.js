/**
 * Testes funcionais — Transações (CRUD + resumo financeiro)
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';

const request = require('supertest');
const app = require('../src/app');
const sequelize = require('../src/config/database');

require('../src/models/User');
require('../src/models/Transaction');

let token = '';
let transactionId = null;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  // Registra e faz login para obter token
  const res = await request(app).post('/auth/register').send({
    name: 'Teste Transações',
    email: 'transacoes@teste.com',
    password: 'senha123',
  });

  token = res.body.token;
});

afterAll(async () => {
  await sequelize.close();
});

describe('POST /transactions', () => {
  it('deve criar uma receita com sucesso', async () => {
    const res = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'income',
        amount: 3000,
        description: 'Salário',
        category: 'Renda',
        date: '2024-01-15',
      });

    expect(res.status).toBe(201);
    expect(res.body.transaction).toHaveProperty('id');
    expect(res.body.transaction.type).toBe('income');
    expect(res.body.transaction.amount).toBe(3000);

    transactionId = res.body.transaction.id;
  });

  it('deve criar uma despesa com sucesso', async () => {
    const res = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'expense',
        amount: 500,
        description: 'Aluguel',
        category: 'Moradia',
        date: '2024-01-20',
      });

    expect(res.status).toBe(201);
    expect(res.body.transaction.type).toBe('expense');
  });

  it('deve rejeitar transação sem token', async () => {
    const res = await request(app).post('/transactions').send({
      type: 'income',
      amount: 100,
      description: 'Sem token',
    });

    expect(res.status).toBe(401);
  });

  it('deve rejeitar transação com tipo inválido', async () => {
    const res = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'invalido',
        amount: 100,
        description: 'Tipo errado',
      });

    expect(res.status).toBe(400);
  });

  it('deve rejeitar transação sem campos obrigatórios', async () => {
    const res = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'income' });

    expect(res.status).toBe(400);
  });
});

describe('GET /transactions', () => {
  it('deve listar as transações do usuário', async () => {
    const res = await request(app)
      .get('/transactions')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('transactions');
    expect(Array.isArray(res.body.transactions)).toBe(true);
    expect(res.body.total).toBeGreaterThanOrEqual(2);
  });

  it('deve filtrar transações por tipo', async () => {
    const res = await request(app)
      .get('/transactions?type=income')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    res.body.transactions.forEach((t) => {
      expect(t.type).toBe('income');
    });
  });

  it('deve exigir autenticação', async () => {
    const res = await request(app).get('/transactions');
    expect(res.status).toBe(401);
  });
});

describe('GET /transactions/summary', () => {
  it('deve retornar saldo, receitas e despesas corretamente', async () => {
    const res = await request(app)
      .get('/transactions/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('balance');
    expect(res.body).toHaveProperty('totalIncome');
    expect(res.body).toHaveProperty('totalExpense');

    // Salário (3000) - Aluguel (500) = 2500
    expect(res.body.totalIncome).toBe(3000);
    expect(res.body.totalExpense).toBe(500);
    expect(res.body.balance).toBe(2500);
  });
});

describe('PUT /transactions/:id', () => {
  it('deve atualizar uma transação com sucesso', async () => {
    const res = await request(app)
      .put(`/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Salário Atualizado', amount: 3500 });

    expect(res.status).toBe(200);
    expect(res.body.transaction.description).toBe('Salário Atualizado');
    expect(res.body.transaction.amount).toBe(3500);
  });

  it('deve retornar 404 ao atualizar transação inexistente', async () => {
    const res = await request(app)
      .put('/transactions/99999')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Não existe' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /transactions/:id', () => {
  it('deve remover uma transação com sucesso', async () => {
    const res = await request(app)
      .delete(`/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/sucesso/i);
  });

  it('deve retornar 404 ao remover transação já removida', async () => {
    const res = await request(app)
      .delete(`/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
