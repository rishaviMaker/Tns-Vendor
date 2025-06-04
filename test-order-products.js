// Test script to check OrderProduct functionality
require('dotenv').config();
const { sequelize } = require('./config/db');
const { OrderProduct } = require('./models/OrderProduct');
const { Product } = require('./models/Product');

async function testOrderProducts() {
  try {
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('Connection successful!\n');

    // Find a test order ID to use
    console.log('Looking for order products...');
    const orderProducts = await OrderProduct.findAll({ limit: 2 });
    
    if (orderProducts.length === 0) {
      console.log('No order products found in database');
      return;
    }
    
    console.log(`Found ${orderProducts.length} order products`);
    console.log('Sample order product:');
    console.log(orderProducts[0].dataValues);
    
    // Test fetching product details
    const productId = orderProducts[0].product_id;
    console.log(`\nFetching product details for product ID: ${productId}`);
    const productDetails = await Product.findByPk(productId);
    
    if (productDetails) {
      console.log('Product details found:');
      // Just print some key fields, not the whole object
      const { id, name, sku, price, image, images } = productDetails;
      console.log({ id, name, sku, price, image, images });
    } else {
      console.log('Product details not found');
    }
    
    console.log('\nTest completed!');
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

testOrderProducts();
