const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// POST /auth/register — Cadastro de usuário
router.post('/register', register);

// POST /auth/login — Login com e-mail e senha
router.post('/login', login);

module.exports = router;
