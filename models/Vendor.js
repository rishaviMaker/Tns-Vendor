const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Vendor = sequelize.define('Vendor', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  businessType: {
    type: DataTypes.ENUM('Manufacturer', 'Distributor', 'Wholesaler', 'Retailer', 'Other'),
    allowNull: false
  },
  mobileNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  alternativeMobileNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  position: {
    type: DataTypes.STRING,
    allowNull: true
  },
  idProofType: {
    type: DataTypes.ENUM('Aadhar Card', 'PAN Card', 'Driving License', 'Voter ID'),
    allowNull: false
  },
  idProofUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  idProofNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  shopUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  gstinNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  panNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  establishedYear: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  shopPhoneNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Business Address
  street: {
    type: DataTypes.STRING,
    allowNull: false
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false
  },
  postalCode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  country: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'India'
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  isMobileVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  deviceToken: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Firebase device token for push notifications'
  },
  notificationsEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether the vendor has enabled push notifications'
  },
  // KYC Verification Status Fields
  isPanVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'PAN card verification status'
  },
  isAadharVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Aadhar card verification status'
  },
  isDlVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Driving License verification status'
  },
  isGstinVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'GSTIN verification status'
  },
  isVoterIdVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Voter ID verification status'
  },
  kycVerificationData: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Stores detailed verification responses from Cashfree API'
  },
  kycVerifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the KYC verification was last performed'
  }
}, {
  timestamps: true
});

module.exports = { Vendor };
