const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Shipment = sequelize.define('Shipment', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  order_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  weight: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  shipment_id: {
    type: DataTypes.STRING(120),
    allowNull: true
  },
  note: {
    type: DataTypes.STRING(120),
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(60),
    allowNull: false
  },
  cod_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  cod_status: {
    type: DataTypes.STRING(60),
    allowNull: true
  },
  cross_checking_status: {
    type: DataTypes.STRING(60),
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(15, 2),
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
  tableName: 'ec_shipments',
  timestamps: false,
  underscored: true
});

module.exports = { Shipment };
