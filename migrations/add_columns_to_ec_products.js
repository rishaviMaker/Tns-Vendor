const { sequelize } = require('../config/db');

/**
 * Migration script to add new columns to ec_products table
 */
async function addColumnsToEcProducts() {
  try {
    console.log('Starting migration: Adding new columns to ec_products table...');
    
    // Check if columns already exist to avoid errors
    const checkColumnQuery = `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'ec_products' 
      AND COLUMN_NAME IN ('category', 'sub_category', 'videos', 'purchase_price', 'hsn_sac_code', 'applicable_tax', 'unit')
    `;
    
    const [existingColumns] = await sequelize.query(checkColumnQuery);
    const existingColumnNames = existingColumns.map(col => col.COLUMN_NAME);
    
    // Add category column if it doesn't exist
    if (!existingColumnNames.includes('category')) {
      await sequelize.query(`
        ALTER TABLE ec_products 
        ADD COLUMN category VARCHAR(255) NULL
      `);
      console.log('Added category column');
    }
    
    // Add sub_category column if it doesn't exist
    if (!existingColumnNames.includes('sub_category')) {
      await sequelize.query(`
        ALTER TABLE ec_products 
        ADD COLUMN sub_category VARCHAR(255) NULL
      `);
      console.log('Added sub_category column');
    }
    
    // Add videos column if it doesn't exist
    if (!existingColumnNames.includes('videos')) {
      await sequelize.query(`
        ALTER TABLE ec_products 
        ADD COLUMN videos TEXT NULL
      `);
      console.log('Added videos column');
    }
    
    // Add purchase_price column if it doesn't exist
    if (!existingColumnNames.includes('purchase_price')) {
      await sequelize.query(`
        ALTER TABLE ec_products 
        ADD COLUMN purchase_price DECIMAL(15,2) NULL
      `);
      console.log('Added purchase_price column');
    }
    
    // Add hsn_sac_code column if it doesn't exist
    if (!existingColumnNames.includes('hsn_sac_code')) {
      await sequelize.query(`
        ALTER TABLE ec_products 
        ADD COLUMN hsn_sac_code VARCHAR(255) NULL
      `);
      console.log('Added hsn_sac_code column');
    }
    
    // Add applicable_tax column if it doesn't exist
    if (!existingColumnNames.includes('applicable_tax')) {
      await sequelize.query(`
        ALTER TABLE ec_products 
        ADD COLUMN applicable_tax VARCHAR(255) NULL
      `);
      console.log('Added applicable_tax column');
    }
    
    // Add unit column if it doesn't exist
    if (!existingColumnNames.includes('unit')) {
      await sequelize.query(`
        ALTER TABLE ec_products 
        ADD COLUMN unit VARCHAR(50) NULL
      `);
      console.log('Added unit column');
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
addColumnsToEcProducts();
