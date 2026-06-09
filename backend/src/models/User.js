const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Nome é obrigatório' },
      len: { args: [2, 100], msg: 'Nome deve ter entre 2 e 100 caracteres' },
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: { msg: 'E-mail já cadastrado' },
    validate: {
      isEmail: { msg: 'E-mail inválido' },
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // Limite mensal de despesas para alertas (em R$)
  expenseLimit: {
    type: DataTypes.FLOAT,
    defaultValue: 2000.0,
  },
}, {
  tableName: 'users',
  timestamps: true,
});

module.exports = User;
