const path = require('path');
const { sequelize } = require('./config/db');
const { Sequelize } = require('sequelize');
const migrationFile = require('./migrations/20250614_create_notifications_table');

async function runMigration() {
  try {
    console.log('Running notification table migration...');
    
    // Create queryInterface instance from our existing sequelize connection
    const queryInterface = sequelize.getQueryInterface();
    
    // Run the migration
    await migrationFile.up(queryInterface, Sequelize);
    
    console.log('Migration completed successfully! vendor_notifications table created.');
  } catch (error) {
    console.error('Migration failed:', error);
    
    // Check if the error is because the table already exists
    if (error.name === 'SequelizeDatabaseError' && error.message.includes('already exists')) {
      console.log('The vendor_notifications table already exists. No action needed.');
    } else {
      throw error;
    }
  } finally {
    // Close the connection
    await sequelize.close();
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration script failed:', err);
    process.exit(1);
  });
