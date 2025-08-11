const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [1, 100],
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  color: {
    type: DataTypes.STRING(7),
    allowNull: true,
    defaultValue: '#6B7280', // Default gray color
    validate: {
      is: /^#[0-9A-F]{6}$/i // Hex color validation
    }
  },
  productCount: {
    type: DataTypes.VIRTUAL,
    get() {
      // Bu alan frontend'de hesaplanacak
      return 0;
    }
  }
}, {
  tableName: 'Categories',
  indexes: [
    {
      unique: true,
      fields: ['name']
    },
    {
      fields: ['isActive']
    }
  ]
});


// Static methods
Category.getAllCategories = async function() {
  return await Category.findAll({
    where: {
      isActive: true
    },
    order: [['sortOrder', 'ASC'], ['name', 'ASC']]
  });
};

module.exports = Category;