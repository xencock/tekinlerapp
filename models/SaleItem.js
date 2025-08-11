const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');
const Sale = require('./Sale');
const Product = require('./Product');

class SaleItem extends Model {}

SaleItem.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  saleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Sale,
      key: 'id'
    }
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Product,
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Satış anındaki birim fiyat (indirimler düşülmüş)'
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Miktar * Birim Fiyat'
  },
  taxRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Ürünün satış anındaki vergi oranı (kullanılmıyor)'
  },
  taxAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Bu kalem için hesaplanan vergi tutarı (kullanılmıyor)'
  }
}, {
  sequelize,
  modelName: 'SaleItem',
  tableName: 'sale_items',
  timestamps: false, // Genellikle satış kalemleri için zaman damgası gerekmez, ana satış kaydında bulunur.
  indexes: [
    {
      fields: ['saleId']
    },
    {
      fields: ['productId']
    }
  ]
});

// Associations
Sale.hasMany(SaleItem, { foreignKey: 'saleId', as: 'items' });
SaleItem.belongsTo(Sale, { foreignKey: 'saleId', as: 'sale' });

Product.hasMany(SaleItem, { foreignKey: 'productId', as: 'saleItems' });
SaleItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

module.exports = SaleItem;