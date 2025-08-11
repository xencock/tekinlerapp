const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');
const Product = require('./Product');
const User = require('./User');

class StockMovement extends Model {}

StockMovement.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Product,
      key: 'id'
    },
    comment: 'İlgili ürün ID'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Sistem tarafından yapılan otomatik hareketler için null olabilir
    references: {
      model: User,
      key: 'id'
    },
    comment: 'Hareketi yapan kullanıcı ID'
  },
  type: {
    type: DataTypes.ENUM('sale', 'return', 'stock_in', 'adjustment', 'initial'),
    allowNull: false,
    comment: 'Stok hareket tipi (satış, iade, stok girişi, düzeltme, başlangıç)'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Değişim miktarı (pozitif: artış, negatif: azalış)'
  },
  stockBefore: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Hareketten önceki stok miktarı'
  },
  stockAfter: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Hareketten sonraki stok miktarı'
  },
  referenceId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'İlgili referans ID (örn: satış ID, fatura no)'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Stok hareketiyle ilgili notlar'
  }
}, {
  sequelize,
  modelName: 'StockMovement',
  tableName: 'stock_movements',
  timestamps: true,
  indexes: [
    {
      fields: ['productId']
    },
    {
      fields: ['type']
    },
    {
      fields: ['referenceId']
    }
  ]
});

StockMovement.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Product.hasMany(StockMovement, { foreignKey: 'productId', as: 'movements' });

StockMovement.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(StockMovement, { foreignKey: 'userId', as: 'stockMovements' });

module.exports = StockMovement;