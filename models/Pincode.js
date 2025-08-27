const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const WarehousePincode = sequelize.define('Warehouse', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  pincode:{
    type:DataTypes.STRING,
    allowNull: true,
    comment: 'Pincode for warehouse'
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Location of pincode'
  },
  warehouse_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Vendors',
      key: 'id'
    }
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'mp_warehouse_pincode',
  timestamps: false
});

module.exports = { WarehousePincode };
