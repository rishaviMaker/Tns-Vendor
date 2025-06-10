// Script to run the custom migrations
const { addNotificationFieldsToVendor } = require('./migrations/addNotificationFieldsToVendor');
const { Sequelize } = require('sequelize');
const { sequelize } = require('./config/db');

// Import the new migration
const path = require('path');
const fs = require('fs');

// Function to run the new migration
async function runNewDiscountFieldsMigration() {
  try {
    // Load the migration file
    const migrationPath = path.join(__dirname, 'migrations', '20250607_add_new_discount_fields.js');
    const migration = require(migrationPath);
    
    // Execute the migration
    await migration.up(sequelize.getQueryInterface(), Sequelize);
    return true;
  } catch (error) {
    console.error('Error running discount fields migration:', error);
    return false;
  }
}

// Run the migrations in sequence
async function runAllMigrations() {
  try {
    // Run the notification fields migration
    const notificationSuccess = await addNotificationFieldsToVendor();
    if (notificationSuccess) {
      console.log('Notification fields migration completed successfully!');
    } else {
      console.error('Notification fields migration failed!');
    }
    
    // Run the discount fields migration
    const discountSuccess = await runNewDiscountFieldsMigration();
    if (discountSuccess) {
      console.log('Discount fields migration completed successfully!');
    } else {
      console.error('Discount fields migration failed!');
    }
    
    return notificationSuccess && discountSuccess;
  } catch (error) {
    console.error('Error running migrations:', error);
    return false;
  }
}

// Run all migrations
runAllMigrations()
  .then(success => {
    if (success) {
      console.log('All migrations completed successfully!');
    } else {
      console.error('Some migrations failed!');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Error running migrations:', error);
    process.exit(1);
  });
