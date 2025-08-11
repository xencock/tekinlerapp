const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');
const Sale = require('./Sale');
const Customer = require('./Customer');

class Invoice extends Model {}

Invoice.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  invoiceNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    comment: 'Benzersiz fatura numarası (örn: INV-2025-0001)'
  },
  saleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Sale,
      key: 'id'
    }
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Customer,
      key: 'id'
    }
  },
  issueDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Fatura düzenleme tarihi'
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Son ödeme tarihi'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Faturanın toplam tutarı'
  },
  status: {
    type: DataTypes.ENUM('Oluşturuldu', 'Ödendi', 'Gecikti', 'İptal Edildi'),
    defaultValue: 'Oluşturuldu',
    allowNull: false
  },
  pdfPath: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Oluşturulan PDF dosyasının yolu'
  }
}, {
  sequelize,
  modelName: 'Invoice',
  tableName: 'invoices',
  timestamps: true,
  indexes: [
    {
      fields: ['invoiceNumber']
    },
    {
      fields: ['saleId']
    },
    {
      fields: ['customerId']
    },
    {
      fields: ['status']
    }
  ]
});

// Associations
Invoice.belongsTo(Sale, { foreignKey: 'saleId', as: 'sale' });
Sale.hasOne(Invoice, { foreignKey: 'saleId', as: 'invoice' });

Invoice.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Customer.hasMany(Invoice, { foreignKey: 'customerId', as: 'invoices' });

// Static method to generate a unique invoice number
Invoice.generateInvoiceNumber = async function() {
  const year = new Date().getFullYear();
  const lastInvoice = await this.findOne({
    where: {
      invoiceNumber: {
        [DataTypes.Op.like]: `INV-${year}-%`
      }
    },
    order: [['invoiceNumber', 'DESC']]
  });

  let nextNumber = 1;
  if (lastInvoice) {
    const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
    nextNumber = lastNumber + 1;
  }

  return `INV-${year}-${nextNumber.toString().padStart(4, '0')}`;
};

module.exports = Invoice;