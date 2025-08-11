const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BalanceTransaction = sequelize.define('BalanceTransaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Müşteri ID'
  },
  type: {
    type: DataTypes.ENUM('payment', 'debt'),
    allowNull: false,
    comment: 'İşlem türü: payment (ödeme), debt (borç)'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'İşlem tutarı'
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'İşlem açıklaması'
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'İşlem kategorisi (örn: Satış, Ödeme, İade)'
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'İşlem tarihi'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'İşlemi oluşturan kullanıcı ID'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Ek notlar'
  }
}, {
  tableName: 'balance_transactions',
  timestamps: true,
  indexes: [
    {
      fields: ['customerId']
    },
    {
      fields: ['type']
    },
    {
      fields: ['date']
    },
    {
      fields: ['category']
    }
  ]
});

// Instance methods
BalanceTransaction.prototype.getFormattedAmount = function() {
  const sign = this.type === 'payment' ? '-' : '+';
  return `${sign}${this.amount.toFixed(2)} ₺`;
};

BalanceTransaction.prototype.getTypeText = function() {
  return this.type === 'payment' ? 'Ödeme' : 'Borç';
};

BalanceTransaction.prototype.getTypeColor = function() {
  return this.type === 'payment' ? 'text-green-600' : 'text-red-600';
};

// Set up associations
const User = require('./User');
const Customer = require('./Customer');

BalanceTransaction.belongsTo(User, { foreignKey: 'createdBy', as: 'createdByUser' });
BalanceTransaction.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

module.exports = BalanceTransaction;
