// Script to run the custom migration
const { addNotificationFieldsToVendor } = require('./migrations/addNotificationFieldsToVendor');

// Run the migration
addNotificationFieldsToVendor()
  .then(success => {
    if (success) {
      console.log('Migration completed successfully!');
    } else {
      console.error('Migration failed!');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Error running migration:', error);
    process.exit(1);
  });
