const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Warehouse = sequelize.define('Warehouse', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(191),
    allowNull: false
  },
  address: {
    type: DataTypes.STRING(191),
    allowNull: false
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  contact_person: {
    type: DataTypes.STRING(191),
    allowNull: true
  },
  contact_number: {
    type: DataTypes.STRING(191),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('published', 'draft', 'pending'),
    defaultValue: 'draft'
  },
  vendor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Vendors', // Assuming your Vendors table exists
      key: 'id'
    }
  },
  store_id: {
    type: DataTypes.INTEGER,
    allowNull: true
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
  tableName: 'mp_warehouse',
  timestamps: false // We manually handle created_at and updated_at
});

module.exports = { Warehouse };
