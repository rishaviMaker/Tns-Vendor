const { sequelize } = require('../config/db');

/**
 * Migration script to add new columns to mp_stores table
 */
async function addColumnsToMpStores() {
  try {
    console.log('Starting migration: Adding new columns to mp_stores table...');
    
    // Check if columns already exist to avoid errors
    const checkColumnQuery = `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'mp_stores' 
      AND COLUMN_NAME IN ('logo', 'description', 'content', 'vendor_verified_at')
    `;
    
    const [existingColumns] = await sequelize.query(checkColumnQuery);
    const existingColumnNames = existingColumns.map(col => col.COLUMN_NAME);
    
    // Add logo column if it doesn't exist
    if (!existingColumnNames.includes('logo')) {
      await sequelize.query(`
        ALTER TABLE mp_stores 
        ADD COLUMN logo VARCHAR(255) NULL
      `);
      console.log('Added logo column');
    }
    
    // Add description column if it doesn't exist
    if (!existingColumnNames.includes('description')) {
      await sequelize.query(`
        ALTER TABLE mp_stores 
        ADD COLUMN description TEXT NULL
      `);
      console.log('Added description column');
    }
    
    // Add content column if it doesn't exist
    if (!existingColumnNames.includes('content')) {
      await sequelize.query(`
        ALTER TABLE mp_stores 
        ADD COLUMN content TEXT NULL
      `);
      console.log('Added content column');
    }
    
    // Add vendor_verified_at column if it doesn't exist
    if (!existingColumnNames.includes('vendor_verified_at')) {
      await sequelize.query(`
        ALTER TABLE mp_stores 
        ADD COLUMN vendor_verified_at DATETIME NULL
      `);
      console.log('Added vendor_verified_at column');
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
addColumnsToMpStores();
