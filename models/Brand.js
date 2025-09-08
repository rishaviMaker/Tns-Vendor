const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Brands = sequelize.define('Brands', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true
  },
  logo: {
    type: DataTypes.STRING,
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
  is_featured: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  created_at: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'coupon'
  },
  updated_at: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
}, {
  tableName: 'ec_brands',
  timestamps: false,
  underscored: true,
  createdAt:'created_at',
  updatedAt:'updated_at'
});

module.exports = { Brands };
