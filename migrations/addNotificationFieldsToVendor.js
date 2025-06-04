const { sequelize } = require('../config/db');

/**
 * Migration to add notification-related fields to the Vendor table
 */
async function addNotificationFieldsToVendor() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    
    // Check if deviceToken column already exists
    const tableInfo = await queryInterface.describeTable('Vendors');
    
    if (!tableInfo.deviceToken) {
      console.log('Adding deviceToken column to Vendors table...');
      await queryInterface.addColumn('Vendors', 'deviceToken', {
        type: sequelize.Sequelize.STRING,
        allowNull: true,
        comment: 'Firebase device token for push notifications'
      });
    }
    
    if (!tableInfo.notificationsEnabled) {
      console.log('Adding notificationsEnabled column to Vendors table...');
      await queryInterface.addColumn('Vendors', 'notificationsEnabled', {
        type: sequelize.Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether the vendor has enabled push notifications'
      });
    }
    
    console.log('Migration completed successfully!');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}

module.exports = { addNotificationFieldsToVendor };
