const { Sequelize } = require('sequelize');
const path = require('path');

// Usa banco em memória nos testes para não poluir o banco de produção
const isTest = process.env.NODE_ENV === 'test';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: isTest ? ':memory:' : path.join(__dirname, '../../financaspro.db'),
  logging: false, // Desativa logs SQL no console
});

module.exports = sequelize;
