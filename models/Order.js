const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  shipping_option: {
    type: DataTypes.STRING(60),
    allowNull: true
  },
  shipping_method: {
    type: DataTypes.STRING(60),
    allowNull: false,
    defaultValue: 'default'
  },
  status: {
    type: DataTypes.STRING(120),
    allowNull: false,
    defaultValue: 'pending'
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  tax_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  shipping_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  coupon_code: {
    type: DataTypes.STRING(120),
    allowNull: true
  },
  discount_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  sub_total: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  is_confirmed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  discount_description: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  is_finished: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true
  },
  token: {
    type: DataTypes.STRING(120),
    allowNull: true
  },
  payment_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  store_id: {
    type: DataTypes.INTEGER.UNSIGNED,
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
  tableName: 'ec_orders', // Map to the existing table name
  timestamps: false, // Disable sequelize timestamps, use created_at/updated_at from the table
  underscored: true // Use snake_case for column names
});

// Note: We're handling associations directly in the controller to avoid circular dependencies

module.exports = { Order };
