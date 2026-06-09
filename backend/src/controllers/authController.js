const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { db, Collections } = require('../config/firebase');

/**
 * POST /auth/register
 * Cria usuário na coleção "users" do Firestore com senha hasheada.
 */
async function register(req, res) {
  try {
    const { name, email, password, expenseLimit } = req.body;

    // Validações básicas
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios' });
    }
    if (name.trim().length < 2) {
      return res.status(400).json({ error: 'Nome deve ter no mínimo 2 caracteres' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'E-mail inválido' });
    }

    // Verifica e-mail duplicado no Firestore
    const existente = await db.collection(Collections.USERS)
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    if (!existente.empty) {
      return res.status(409).json({ error: 'E-mail já cadastrado' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cria documento no Firestore (ID gerado automaticamente)
    const docRef = await db.collection(Collections.USERS).add({
      name:         name.trim(),
      email:        email.toLowerCase(),
      password:     hashedPassword,
      expenseLimit: parseFloat(expenseLimit) || 2000.0,
      createdAt:    new Date().toISOString(),
    });

    const token = jwt.sign(
      { id: docRef.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      message: 'Usuário cadastrado com sucesso',
      token,
      user: {
        id:           docRef.id,
        name:         name.trim(),
        email:        email.toLowerCase(),
        expenseLimit: parseFloat(expenseLimit) || 2000.0,
      },
    });
  } catch (error) {
    console.error('[authController.register]', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

/**
 * POST /auth/login
 * Busca o usuário pelo e-mail e valida senha.
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
    }

    // Busca usuário pelo e-mail
    const snapshot = await db.collection(Collections.USERS)
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const doc  = snapshot.docs[0];
    const data = doc.data();

    const senhaCorreta = await bcrypt.compare(password, data.password);
    if (!senhaCorreta) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: doc.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id:           doc.id,
        name:         data.name,
        email:        data.email,
        expenseLimit: data.expenseLimit,
      },
    });
  } catch (error) {
    console.error('[authController.login]', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

module.exports = { register, login };
