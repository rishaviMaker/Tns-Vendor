const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const OrderProduct = sequelize.define('OrderProduct', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  order_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  qty: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  tax_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  options: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  product_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  product_name: {
    type: DataTypes.STRING(191),
    allowNull: false
  },
  weight: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  restock_quantity: {
    type: DataTypes.INTEGER,
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
  tableName: 'ec_order_product',
  timestamps: false,
  underscored: true
});

module.exports = { OrderProduct };
