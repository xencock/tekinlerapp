const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // customerCode field removed as per user request
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Müşteri adı'
  },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Müşteri soyadı'
  },
  phone: {
    type: DataTypes.STRING(15),
    allowNull: true,
    unique: true,
    comment: 'Telefon numarası'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
    comment: 'E-posta adresi'
  },
  tcNumber: {
    type: DataTypes.STRING(11),
    allowNull: true,
    unique: true,
    comment: 'TC Kimlik Numarası'
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Adres bilgisi'
  },
  city: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Şehir'
  },
  district: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'İlçe'
  },
  postalCode: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'Posta kodu'
  },
  
  // Tercihler
  preferredColors: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Tercih ettiği renkler'
  },
  preferredBrands: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Tercih ettiği markalar'
  },
  
  // Bakiye takibi - alışveriş geçmişi kaldırıldı
  balance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'Müşteri bakiyesi (borç/alacak)'
  },
  
  // Satış istatistikleri
  totalPurchases: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'Toplam satış tutarı'
  },
  totalOrders: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Toplam sipariş sayısı'
  },
  
  // İletişim tercihleri
  smsPermission: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'SMS izni'
  },
  emailPermission: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'E-posta izni'
  },
  
  // Notlar
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Müşteri notları'
  },
  
  // Durum
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Müşteri aktif mi?'
  },
  
  // Oluşturan kullanıcı
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Müşteriyi oluşturan kullanıcı ID'
  },
  
  // Güncelleyen kullanıcı
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Müşteriyi güncelleyen kullanıcı ID'
  }
}, {
  tableName: 'customers',
  timestamps: true,
  indexes: [
    {
      fields: ['phone']
    },
    {
      fields: ['email']
    },
    {
      fields: ['tcNumber']
    },
    {
      fields: ['isActive']
    }
  ]
});

// Set up associations (User import is at the bottom of the file)

// Instance methods
Customer.prototype.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

Customer.prototype.getBalanceStatus = function() {
  if (this.balance > 0) return 'Borç';
  if (this.balance < 0) return 'Alacak';
  return 'Sıfır';
};

Customer.prototype.getBalanceColor = function() {
  if (this.balance > 0) return 'text-red-600';
  if (this.balance < 0) return 'text-green-600';
  return 'text-gray-600';
};

Customer.prototype.getBalanceInfo = function() {
  if (this.balance > 0) {
    return {
      status: 'Borç',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      icon: 'trending-up'
    };
  }
  if (this.balance < 0) {
    return {
      status: 'Alacak',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      icon: 'trending-down'
    };
  }
  return {
    status: 'Sıfır',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: 'minus'
  };
};

Customer.prototype.formatBalance = function() {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(this.balance || 0);
};

Customer.prototype.getCustomerSegment = function() {
  const totalPurchases = parseFloat(this.totalPurchases || 0);
  if (totalPurchases >= 1000) return 'Premium';
  if (totalPurchases >= 500) return 'Gold';
  if (totalPurchases >= 100) return 'Silver';
  return 'Bronze';
};

Customer.prototype.getAverageOrderValue = function() {
  const totalPurchases = parseFloat(this.totalPurchases || 0);
  const totalOrders = parseInt(this.totalOrders || 0);
  if (totalOrders === 0) return 0;
  return (totalPurchases / totalOrders).toFixed(2);
};

Customer.findByPhone = async function(phone) {
  return await this.findOne({ where: { phone } });
};

Customer.findByEmail = async function(email) {
  return await this.findOne({ where: { email } });
};

Customer.findByTC = async function(tcNumber) {
  return await this.findOne({ where: { tcNumber } });
};

// Associations with User model

const User = require('./User');
Customer.belongsTo(User, { 
  as: 'createdByUser', 
  foreignKey: 'createdBy'
});
Customer.belongsTo(User, { 
  as: 'updatedByUser', 
  foreignKey: 'updatedBy'
});

// Sale ilişkisi - bu import'u en sona koyduk ki circular dependency olmasın
const Sale = require('./Sale');
Customer.hasMany(Sale, { foreignKey: 'customerId', as: 'sales' });
Sale.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

module.exports = Customer;
