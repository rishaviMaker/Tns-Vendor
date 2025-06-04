const { sequelize } = require('../config/db');
const Sequelize = require('sequelize');

async function addFieldsToStoresTable() {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    console.log('Starting migration: Adding bank details and social media fields to mp_stores table...');
    
    // Starting a transaction
    await sequelize.transaction(async (transaction) => {
      // Add Bank Details fields
      console.log('Adding bank details fields...');
      
      const bankFields = [
        ['preferred_payment_method', Sequelize.STRING],
        ['bank_name', Sequelize.STRING],
        ['ifsc_code', Sequelize.STRING],
        ['account_number', Sequelize.STRING],
        ['paypal_id', Sequelize.STRING],
        ['upi_id', Sequelize.STRING],
        ['payment_description', Sequelize.TEXT]
      ];
      
      for (const [fieldName, fieldType] of bankFields) {
        try {
          await queryInterface.addColumn('mp_stores', fieldName, {
            type: fieldType,
            allowNull: true
          }, { transaction });
          console.log(`Added field: ${fieldName}`);
        } catch (error) {
          // If column already exists, log and continue
          if (error.message.includes('column exists')) {
            console.log(`Field ${fieldName} already exists, skipping...`);
          } else {
            throw error;
          }
        }
      }
      
      // Add Social Media fields
      console.log('Adding social media fields...');
      
      const socialFields = [
        ['facebook_link', Sequelize.STRING],
        ['twitter_link', Sequelize.STRING],
        ['instagram_link', Sequelize.STRING],
        ['youtube_link', Sequelize.STRING],
        ['linkedin_link', Sequelize.STRING],
        ['whatsapp_link', Sequelize.STRING]
      ];
      
      for (const [fieldName, fieldType] of socialFields) {
        try {
          await queryInterface.addColumn('mp_stores', fieldName, {
            type: fieldType,
            allowNull: true
          }, { transaction });
          console.log(`Added field: ${fieldName}`);
        } catch (error) {
          // If column already exists, log and continue
          if (error.message.includes('column exists')) {
            console.log(`Field ${fieldName} already exists, skipping...`);
          } else {
            throw error;
          }
        }
      }
    });
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
addFieldsToStoresTable();
