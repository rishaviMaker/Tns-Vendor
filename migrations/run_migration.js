const { sequelize } = require('../config/db');

async function runMigration() {
  try {
    console.log('Starting migration to add shipping columns...');
    
    // Add shipping_charges column
    await sequelize.query(`
      ALTER TABLE ec_products 
      ADD COLUMN shipping_charges DECIMAL(10,2) DEFAULT 0
    `);
    console.log('Added shipping_charges column');
    
    // Add shipping_included column
    await sequelize.query(`
      ALTER TABLE ec_products 
      ADD COLUMN shipping_included BOOLEAN DEFAULT FALSE
    `);
    console.log('Added shipping_included column');
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    
    if (error.message.includes('Duplicate column name')) {
      console.log('Column(s) might already exist. This is not necessarily an error.');
      process.exit(0);
    } else {
      process.exit(1);
    }
  }
}

runMigration();
