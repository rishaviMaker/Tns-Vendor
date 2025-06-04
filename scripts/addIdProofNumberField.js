const { sequelize } = require('../config/db');
const Sequelize = require('sequelize');

async function addIdProofNumberField() {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    console.log('Starting migration: Adding idProofNumber field to Vendors table...');
    
    // Starting a transaction
    await sequelize.transaction(async (transaction) => {
      try {
        await queryInterface.addColumn('Vendors', 'idProofNumber', {
          type: Sequelize.STRING,
          allowNull: true
        }, { transaction });
        console.log('Added field: idProofNumber');
      } catch (error) {
        // If column already exists, log and continue
        if (error.message.includes('column exists')) {
          console.log('Field idProofNumber already exists, skipping...');
        } else {
          throw error;
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
addIdProofNumberField();
