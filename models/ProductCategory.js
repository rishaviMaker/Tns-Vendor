const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ProductCategory = sequelize.define('ProductCategory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0 // 0 indicates it's a top-level category
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'ec_product_categories',
  timestamps: false // We'll handle timestamps manually with created_at and updated_at
});

// Self-referential relationship
ProductCategory.hasMany(ProductCategory, { as: 'subcategories', foreignKey: 'parent_id' });
ProductCategory.belongsTo(ProductCategory, { as: 'parent', foreignKey: 'parent_id' });

module.exports = { ProductCategory };
