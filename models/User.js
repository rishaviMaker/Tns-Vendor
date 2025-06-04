const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Update the User model based on the actual database structure
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  first_name: {
    type: DataTypes.STRING(120),
    allowNull: true
  },
  last_name: {
    type: DataTypes.STRING(120),
    allowNull: true
  },
  username: {
    type: DataTypes.STRING(60),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(191),
    allowNull: false
  },
  // Removed phone field as it doesn't exist in the actual database
  password: {
    type: DataTypes.STRING(191),
    allowNull: true
  },
  avatar_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  // Removed dob field as it doesn't exist in the actual database
  created_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: false,
  underscored: true
});

module.exports = { User };
