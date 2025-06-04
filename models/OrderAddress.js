const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const OrderAddress = sequelize.define('OrderAddress', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(191),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(191),
    allowNull: true
  },
  country: {
    type: DataTypes.STRING(120),
    allowNull: true
  },
  state: {
    type: DataTypes.STRING(120),
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(120),
    allowNull: true
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  order_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  zip_code: {
    type: DataTypes.STRING(20),
    allowNull: true
  }
  // Removed created_at and updated_at as they don't exist in the actual database
}, {
  tableName: 'ec_order_addresses',
  timestamps: false,
  underscored: true
});

module.exports = { OrderAddress };
