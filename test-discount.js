// Test script for the Discount model and coupon functionality
require('dotenv').config();
const { sequelize } = require('./config/db');
const { Discount } = require('./models/Discount');

async function testDiscountModel() {
  try {
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('Connection successful!\n');
    
    // Check if the Discount model can access the ec_discounts table
    console.log('Fetching existing discounts/coupons...');
    const discounts = await Discount.findAll({ limit: 5 });
    
    if (discounts.length > 0) {
      console.log(`Found ${discounts.length} existing discounts/coupons`);
      console.log('Sample discount:');
      console.log(JSON.stringify(discounts[0], null, 2));
      
      // Check discount types
      const discountTypes = {};
      for (const discount of discounts) {
        const type = discount.type;
        if (!discountTypes[type]) {
          discountTypes[type] = 0;
        }
        discountTypes[type]++;
      }
      
      console.log('\nDiscount types found:');
      console.log(discountTypes);
    } else {
      console.log('No discounts found. Creating a test discount...');
      
      // Generate a random code
      const generateRandomCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };
      
      // Create a test discount for store_id 1
      const testDiscount = await Discount.create({
        title: 'Test Percentage Discount',
        code: generateRandomCode(),
        type: 'percentage',
        value: 10.00,
        quantity: 50,
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        total_used: 0,
        can_use_with_promotion: false,
        discount_on: null,
        type_option: 'all_products',
        store_id: 1,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      console.log('Created test discount:');
      console.log(JSON.stringify(testDiscount, null, 2));
    }
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

testDiscountModel();
