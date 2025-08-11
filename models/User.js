const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 30],
      notEmpty: true
    }
  },
  pin: {
    type: DataTypes.STRING,
    allowNull: false,
    // Model-level doğrulama kaldırıldı; giriş/route seviyesinde doğrulanıyor
  },
  fullName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [2, 100],
      notEmpty: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: /^[0-9+\-\s()]*$/
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  loginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lockUntil: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'Users',
  indexes: [
    {
      unique: true,
      fields: ['username']
    }
  ],
  hooks: {
    // PIN'i kaydetmeden önce hashle
    beforeCreate: async (user) => {
      if (user.pin) {
        const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
        user.pin = await bcrypt.hash(user.pin, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('pin')) {
        const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
        user.pin = await bcrypt.hash(user.pin, salt);
      }
    }
  }
});

// Virtual field for lock status
User.prototype.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

// Instance method to check PIN
User.prototype.comparePin = async function(candidatePin) {
  try {
    return await bcrypt.compare(candidatePin, this.pin);
  } catch (error) {
    throw new Error('PIN karşılaştırma hatası');
  }
};

// Instance method to increment login attempts
User.prototype.incLoginAttempts = async function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < new Date()) {
    await this.update({
      lockUntil: null,
      loginAttempts: 1
    });
    return;
  }
  
  const newAttempts = this.loginAttempts + 1;
  const updateData = { loginAttempts: newAttempts };
  
  // Lock account after 5 failed attempts for 2 hours
  if (newAttempts >= 5 && !this.isLocked()) {
    updateData.lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
  }
  
  await this.update(updateData);
};

// Instance method to reset login attempts
User.prototype.resetLoginAttempts = async function() {
  await this.update({
    loginAttempts: 0,
    lockUntil: null
  });
};

// Static method to find user by credentials
User.findByCredentials = async function(username, pin) {
  const user = await User.findOne({ where: { username } });
  
  if (!user) {
    throw new Error('Geçersiz kullanıcı adı veya PIN');
  }

  if (!user.isActive) {
    throw new Error('Hesabınız aktif değil. Lütfen bir yönetici ile iletişime geçin.');
  }
  
  if (user.isLocked()) {
    throw new Error('Hesabınız kilitli. Lütfen daha sonra tekrar deneyin.');
  }
  
  const isMatch = await user.comparePin(pin);
  
  if (!isMatch) {
    await user.incLoginAttempts();
    throw new Error('Geçersiz kullanıcı adı veya PIN');
  }
  
  // Reset login attempts on successful login
  await user.resetLoginAttempts();
  user.lastLogin = new Date();
  await user.save();
  
  return user;
};

const Sale = require('./Sale');
User.hasMany(Sale, { foreignKey: 'userId' });
Sale.belongsTo(User, { foreignKey: 'userId' });

module.exports = User;
