const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  type: {
    type: DataTypes.ENUM('income', 'expense'),
    allowNull: false,
    validate: {
      isIn: { args: [['income', 'expense']], msg: 'Tipo deve ser income ou expense' },
    },
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: { args: [0.01], msg: 'Valor deve ser maior que zero' },
    },
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Descrição é obrigatória' },
    },
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Outros',
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'transactions',
  timestamps: true,
});

// Associação: cada transação pertence a um usuário
User.hasMany(Transaction, { foreignKey: 'userId', onDelete: 'CASCADE' });
Transaction.belongsTo(User, { foreignKey: 'userId' });

module.exports = Transaction;
