const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Store = sequelize.define('Store', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true
  },
  gst_no: {
    type: DataTypes.STRING,
    allowNull: true
  },
  pan_no: {
    type: DataTypes.STRING,
    allowNull: true
  },
  established_year: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  business_type: {
    type: DataTypes.STRING,
    allowNull: true
  },
  logo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Bank Details
  preferred_payment_method: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bank_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ifsc_code: {
    type: DataTypes.STRING,
    allowNull: true
  },
  account_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  paypal_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  upi_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  payment_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Social Media Links
  facebook_link: {
    type: DataTypes.STRING,
    allowNull: true
  },
  twitter_link: {
    type: DataTypes.STRING,
    allowNull: true
  },
  instagram_link: {
    type: DataTypes.STRING,
    allowNull: true
  },
  youtube_link: {
    type: DataTypes.STRING,
    allowNull: true
  },
  linkedin_link: {
    type: DataTypes.STRING,
    allowNull: true
  },
  whatsapp_link: {
    type: DataTypes.STRING,
    allowNull: true
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Vendors',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'published'),
    defaultValue: 'pending'
  },
  vendor_verified_at: {
    type: DataTypes.DATE,
    allowNull: true
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
  tableName: 'mp_stores',
  timestamps: false // We'll handle timestamps manually with created_at and updated_at
});

module.exports = { Store };
