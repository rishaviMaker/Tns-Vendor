const { sequelize } = require('./config/db');

async function updateSchema() {
  try {
    // Add the images column
    await sequelize.query(`
      ALTER TABLE product_requests ADD COLUMN images TEXT AFTER shipping_included
    `);
    console.log('Added images column successfully');
    
    // Make sure we have the correct status enum values
    await sequelize.query(`
      ALTER TABLE product_requests MODIFY COLUMN status 
      ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'
    `);
    console.log('Updated status column successfully');
  } catch (e) {
    console.error('Error updating schema:', e);
  }
  
  console.log('Database schema update completed');
}

updateSchema();
