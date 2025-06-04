// Test file to diagnose model issues
const { sequelize } = require('./config/db');
const { User } = require('./models/User');
const { OrderAddress } = require('./models/OrderAddress');
const { Shipment } = require('./models/Shipment');
const { Order } = require('./models/Order');

async function testModels() {
  try {
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('Connection successful!');
    
    console.log('\nTesting Order model...');
    try {
      const orders = await Order.findAll({ limit: 1 });
      console.log(`Found ${orders.length} orders`);
      if (orders.length > 0) {
        console.log('First order ID:', orders[0].id);
      }
    } catch (err) {
      console.error('Error testing Order model:', err.message);
    }
    
    console.log('\nTesting User model...');
    try {
      const users = await User.findAll({ limit: 1 });
      console.log(`Found ${users.length} users`);
    } catch (err) {
      console.error('Error testing User model:', err.message);
    }
    
    console.log('\nTesting OrderAddress model...');
    try {
      const addresses = await OrderAddress.findAll({ limit: 1 });
      console.log(`Found ${addresses.length} addresses`);
    } catch (err) {
      console.error('Error testing OrderAddress model:', err.message);
    }
    
    console.log('\nTesting Shipment model...');
    try {
      const shipments = await Shipment.findAll({ limit: 1 });
      console.log(`Found ${shipments.length} shipments`);
    } catch (err) {
      console.error('Error testing Shipment model:', err.message);
    }
  } catch (e) {
    console.error('Database connection error:', e.message);
    console.error(e.stack);
  } finally {
    await sequelize.close();
  }
}

testModels();
