const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CustomerWithdrawal = sequelize.define('CustomerWithdrawal', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Foreign key to the vendor/customer table'
  },
  fee: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0.0,
    comment: 'Transaction fee if applicable'
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    comment: 'Withdrawal amount'
  },
  current_balance: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Current balance after withdrawal'
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'INR',
    comment: 'Currency code'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description or notes for this withdrawal'
  },
  bank_info: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON string with bank details (name, IFSC, account number)'
  },
  payment_channel: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Payment method or channel (Bank Transfer, UPI, etc.)'
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
    defaultValue: 'pending',
    comment: 'Current status of the withdrawal request'
  },
  transaction_id: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Transaction reference ID'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'mp_customer_withdrawals',
  timestamps: false // We handle timestamps manually
});

module.exports = { CustomerWithdrawal };
