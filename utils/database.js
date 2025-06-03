const { sequelize, testConnection } = require('../config/db');

// Import all models
const { Vendor } = require('../models/Vendor');
const { OTP } = require('../models/OTP');
const { Store } = require('../models/Store');
const { Product } = require('../models/Product');
const { ProductCategory } = require('../models/ProductCategory');

/**
 * Initialize database
 * This will sync all models with the database
 */
const initDatabase = async (force = false) => {
  try {
    // Test database connection
    await testConnection();
    
    console.log('Database connection established successfully');
    
    // Sync all models with the database
    if (force) {
      console.log('Selectively syncing database models');
      
      // Only sync Vendor and OTP models with force option
      await Vendor.sync({ force: true });
      await OTP.sync({ force: true });
      
      // Sync Store model without force to preserve existing data
      await Store.sync({ alter: true });
      
      // Don't sync Product model at all to ensure we don't modify the ec_products table
      // This model will be used for querying only
      console.log('Product model mapped to ec_products table (read-only, no sync)');
      
      console.log('Database tables created successfully');
      
      // Create sample data if force is true
      await createSampleData();
    } else {
      console.log('Syncing database without dropping existing tables');
      await sequelize.sync();
      console.log('Database synchronized successfully');
    }
    
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    console.error(error.stack);
    return false;
  }
};

// No associations needed as Vendor is now standalone

/**
 * Create sample data for development
 */
const createSampleData = async () => {
  try {
    // Create sample vendor
    const vendor = await Vendor.create({
      fullName: 'Test Vendor',
      email: 'vendor@example.com',
      password: 'password123',
      businessType: 'Wholesaler',
      mobileNumber: '1234567890',
      alternativeMobileNumber: '9876543210',
      position: 'Owner',
      idProofType: 'Aadhar Card',
      companyName: 'Sample Vendor Business',
      street: '123 Vendor St',
      city: 'Vendor City',
      state: 'VS',
      postalCode: '12345',
      country: 'India',
      status: 'pending'
    });

    console.log('Sample vendor data created successfully');
  } catch (error) {
    console.error('Error creating sample data:', error);
  }
};

module.exports = { initDatabase };
