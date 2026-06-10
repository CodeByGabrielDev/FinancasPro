/**
 * Testes funcionais — Autenticação (register e login)
 * Usa Firestore com projectId fake (sem credenciais reais)
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';

const request = require('supertest');
const app = require('../src/app');
const { db, Collections } = require('../src/config/firebase');

// Limpa a coleção de usuários antes de cada suite
beforeAll(async () => {
  const snapshot = await db.collection(Collections.USERS).get();
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
});

afterAll(async () => {
  // Limpa dados de teste
  const snapshot = await db.collection(Collections.USERS).get();
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
});

describe('POST /auth/register', () => {
  it('deve cadastrar um usuário com sucesso', async () => {
    const res = await request(app).post('/auth/register').send({
      name: 'João Silva',
      email: 'joao@teste.com',
      password: '123456',
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe('joao@teste.com');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('deve rejeitar cadastro com e-mail duplicado', async () => {
    await request(app).post('/auth/register').send({
      name: 'Maria',
      email: 'duplicado@teste.com',
      password: '123456',
    });

    const res = await request(app).post('/auth/register').send({
      name: 'Maria 2',
      email: 'duplicado@teste.com',
      password: '123456',
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/já cadastrado/i);
  });

  it('deve rejeitar cadastro sem campos obrigatórios', async () => {
    const res = await request(app).post('/auth/register').send({
      email: 'incompleto@teste.com',
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('deve rejeitar senha com menos de 6 caracteres', async () => {
    const res = await request(app).post('/auth/register').send({
      name: 'Fraco',
      email: 'fraco@teste.com',
      password: '123',
    });

    expect(res.status).toBe(400);
  });
});

describe('POST /auth/login', () => {
  beforeAll(async () => {
    await request(app).post('/auth/register').send({
      name: 'Login User',
      email: 'login@teste.com',
      password: 'senha123',
    });
  });

  it('deve fazer login com credenciais corretas', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'login@teste.com',
      password: 'senha123',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('login@teste.com');
  });

  it('deve rejeitar login com senha incorreta', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'login@teste.com',
      password: 'senhaerrada',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/inválidas/i);
  });

  it('deve rejeitar login com e-mail inexistente', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'naoexiste@teste.com',
      password: 'qualquer',
    });

    expect(res.status).toBe(401);
  });

  it('deve rejeitar login sem campos obrigatórios', async () => {
    const res = await request(app).post('/auth/login').send({});

    expect(res.status).toBe(400);
  });
});
