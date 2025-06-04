const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Discount = sequelize.define('Discount', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  total_used: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  value: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  type: {
    type: DataTypes.STRING(60),
    allowNull: true,
    defaultValue: 'coupon'
  },
  can_use_with_promotion: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  discount_on: {
    type: DataTypes.STRING(60),
    allowNull: true
  },
  product_quantity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1
  },
  type_option: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  target: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  min_order_price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  store_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'ec_discounts',
  timestamps: false,
  underscored: true
});

module.exports = { Discount };
