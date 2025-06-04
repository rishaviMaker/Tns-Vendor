// Test script to verify the enhanced getOrderById functionality
require('dotenv').config();
const express = require('express');
const app = express();
const { sequelize } = require('./config/db');
const { Order } = require('./models/Order');
const { User } = require('./models/User');
const { OrderAddress } = require('./models/OrderAddress');
const { Shipment } = require('./models/Shipment');
const { Payment } = require('./models/Payment');

async function testOrderApi() {
  try {
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('Connection successful!\n');

    // Find an order with payment information
    console.log('Finding a test order...');
    const testOrder = await Order.findOne();
    
    if (!testOrder) {
      console.log('No orders found in database');
      return;
    }
    
    const orderId = testOrder.id;
    console.log(`Testing with order ID: ${orderId}\n`);

    // Get basic order data
    console.log('Basic Order Details:');
    console.log(`Order ID: ${testOrder.id}`);
    console.log(`Status: ${testOrder.status}`);
    console.log(`Amount: ${testOrder.amount}`);
    console.log(`User ID: ${testOrder.user_id}`);
    console.log(`Payment ID: ${testOrder.payment_id || 'N/A'}`);
    console.log('------------------------\n');

    // Test related data retrieval
    // 1. Test User data
    if (testOrder.user_id) {
      const user = await User.findByPk(testOrder.user_id);
      console.log('User Details:');
      console.log(user ? user.dataValues : 'User not found');
      console.log('------------------------\n');
    }

    // 2. Test Order Address
    const address = await OrderAddress.findOne({ where: { order_id: orderId } });
    console.log('Order Address:');
    console.log(address ? address.dataValues : 'Address not found');
    console.log('------------------------\n');

    // 3. Test Shipments
    const shipments = await Shipment.findAll({ where: { order_id: orderId } });
    console.log(`Shipments (${shipments.length} found):`);
    if (shipments.length > 0) {
      console.log(shipments[0].dataValues);
    } else {
      console.log('No shipments found');
    }
    console.log('------------------------\n');

    // 4. Test Payment - first try with payment_id
    let payment = null;
    if (testOrder.payment_id) {
      payment = await Payment.findByPk(testOrder.payment_id);
      console.log(`Payment by payment_id (${testOrder.payment_id}):`);
      console.log(payment ? payment.dataValues : 'Payment not found by payment_id');
    } else {
      console.log('No payment_id found in order');
    }

    // If no payment found, try by order_id
    if (!payment) {
      payment = await Payment.findOne({ where: { order_id: orderId } });
      console.log(`Payment by order_id (${orderId}):`);
      console.log(payment ? payment.dataValues : 'Payment not found by order_id');
    }
    console.log('------------------------\n');

    // 5. Test vendor payments (using a sample vendor ID for testing)
    // You would typically get this from authenticated user in a real request
    const testVendorId = 1; // This is just for testing
    const vendorPayments = await Payment.findAll({ 
      where: { 
        customer_id: testVendorId,
        customer_type: "Botble\\Ecommerce\\Models\\Customer"
      },
      limit: 2
    });
    
    console.log(`Vendor Payments for vendor ID ${testVendorId} (${vendorPayments.length} found):`);
    if (vendorPayments.length > 0) {
      vendorPayments.forEach((p, i) => {
        console.log(`Payment ${i+1}:`, p.dataValues);
      });
    } else {
      console.log('No vendor payments found');
    }

    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

testOrderApi();
