// Test script for the enhanced getOrderById functionality
require('dotenv').config();
const { sequelize } = require('./config/db');
const { Order } = require('./models/Order');
const { User } = require('./models/User');
const { OrderAddress } = require('./models/OrderAddress');
const { Shipment } = require('./models/Shipment');
const { Payment } = require('./models/Payment');
const { OrderProduct } = require('./models/OrderProduct');
const { Product } = require('./models/Product');
const { AppError } = require('./utils/appError'); // Assuming you have this utility

/**
 * Mock implementation of getOrderById controller method for testing
 */
async function getOrderById(orderId, vendorId = null) {
  try {
    console.log(`Fetching order details for order ID: ${orderId}, vendor ID: ${vendorId || 'none'}`);
    
    // First try to find the basic order
    const basicOrder = await Order.findByPk(orderId);
    
    if (!basicOrder) {
      console.error('Order not found');
      return null;
    }
    
    console.log(`Found base order with ID: ${orderId}`);
    
    // Get related data in separate queries to avoid join issues
    try {
      // 1. Get user data
      const user = await User.findByPk(basicOrder.user_id, {
        attributes: ['id', 'first_name', 'last_name', 'username', 'email', 'avatar_id', 'created_at']
      });
      console.log(`User data ${user ? 'found' : 'not found'} for user_id: ${basicOrder.user_id}`);
      
      // 2. Get address data
      const address = await OrderAddress.findOne({ where: { order_id: orderId } });
      console.log(`Address data ${address ? 'found' : 'not found'} for order_id: ${orderId}`);
      
      // 3. Get shipment data
      const shipments = await Shipment.findAll({ where: { order_id: orderId } });
      console.log(`Found ${shipments.length} shipments for order_id: ${orderId}`);
      
      // 4. Get payment data - Try to find payment by both payment_id and by order_id directly
      let payment = null;
      if (basicOrder.payment_id) {
        // First try to get payment by payment_id from order
        payment = await Payment.findByPk(basicOrder.payment_id);
        console.log(`Payment data ${payment ? 'found' : 'not found'} for payment_id: ${basicOrder.payment_id}`);
      }
      
      // If no payment found by payment_id, try to find by order_id
      if (!payment) {
        payment = await Payment.findOne({ where: { order_id: orderId } });
        console.log(`Payment data ${payment ? 'found' : 'not found'} for order_id: ${orderId}`);
      }
      
      // 5. Get any vendor-related payments (where customer_id matches vendor_id)
      let vendorPayments = [];
      if (vendorId) {
        vendorPayments = await Payment.findAll({ 
          where: { 
            customer_id: vendorId,
            customer_type: "Botble\\Ecommerce\\Models\\Customer"
          }
        });
        console.log(`Found ${vendorPayments.length} vendor payments where customer_id = ${vendorId}`);
      }
      
      // 6. Get order products
      const orderProducts = await OrderProduct.findAll({ 
        where: { order_id: orderId }
      });
      console.log(`Found ${orderProducts.length} order products for order_id: ${orderId}`);
      
      // 7. Fetch detailed product info for each order product
      let enrichedProducts = [];
      if (orderProducts.length > 0) {
        // Extract all product IDs
        const productIds = orderProducts.map(op => op.product_id);
        
        // Fetch all products in a single query for efficiency
        const products = await Product.findAll({
          where: { id: productIds },
          attributes: ['id', 'name', 'description', 'sku', 'images', 'image', 'price', 'sale_price', 'stock_status', 'quantity']
        });
        
        // Create a map of products for easy lookup
        const productMap = {};
        products.forEach(product => {
          productMap[product.id] = product;
        });
        
        // Combine order product data with full product details
        enrichedProducts = orderProducts.map(orderProduct => {
          const productDetail = productMap[orderProduct.product_id] || null;
          const productData = orderProduct.toJSON();
          
          // Format decimal fields
          productData.price = parseFloat(productData.price);
          if (productData.tax_amount) productData.tax_amount = parseFloat(productData.tax_amount);
          
          // Add additional product details if available
          if (productDetail) {
            const additionalDetails = productDetail.toJSON();
            // Don't duplicate fields that already exist in orderProduct
            delete additionalDetails.id; // This would be the product_id
            
            // Format product prices
            if (additionalDetails.price) additionalDetails.price = parseFloat(additionalDetails.price);
            if (additionalDetails.sale_price) additionalDetails.sale_price = parseFloat(additionalDetails.sale_price);
            
            // Parse images if stored as JSON string
            if (typeof additionalDetails.images === 'string') {
              try {
                additionalDetails.images = JSON.parse(additionalDetails.images);
              } catch (e) {
                console.log(`Could not parse images for product ${productDetail.id}:`, e.message);
              }
            }
            
            return {
              ...productData,
              product_detail: additionalDetails
            };
          }
          
          return productData;
        });
      }
      
      console.log(`Enriched ${enrichedProducts.length} order products with product details`);
      
      // Combine all data and format response
      const orderData = {
        ...basicOrder.toJSON(),
        // Add related data
        user: user ? user.toJSON() : null,
        address: address ? address.toJSON() : null,
        shipments: shipments.length > 0 ? shipments.map(shipment => shipment.toJSON()) : [],
        payment: payment ? payment.toJSON() : null,
        vendor_payments: vendorPayments.length > 0 ? vendorPayments.map(p => p.toJSON()) : [],
        products: enrichedProducts, // Add the enriched products to the response
        // Ensure correct data types for decimal fields
        amount: parseFloat(basicOrder.amount),
        tax_amount: basicOrder.tax_amount ? parseFloat(basicOrder.tax_amount) : null,
        shipping_amount: basicOrder.shipping_amount ? parseFloat(basicOrder.shipping_amount) : null,
        discount_amount: basicOrder.discount_amount ? parseFloat(basicOrder.discount_amount) : null,
        sub_total: parseFloat(basicOrder.sub_total)
      };
      
      // Format shipment decimals if they exist
      if (orderData.shipments && orderData.shipments.length > 0) {
        orderData.shipments = orderData.shipments.map(shipment => ({
          ...shipment,
          price: shipment.price ? parseFloat(shipment.price) : null,
          cod_amount: shipment.cod_amount ? parseFloat(shipment.cod_amount) : null
        }));
      }
      
      // Format payment decimals if they exist
      if (orderData.payment) {
        orderData.payment.amount = parseFloat(orderData.payment.amount);
        if (orderData.payment.refunded_amount) {
          orderData.payment.refunded_amount = parseFloat(orderData.payment.refunded_amount);
        }
      }
      
      // Format vendor payment decimals if they exist
      if (orderData.vendor_payments && orderData.vendor_payments.length > 0) {
        orderData.vendor_payments = orderData.vendor_payments.map(payment => ({
          ...payment,
          amount: parseFloat(payment.amount),
          refunded_amount: payment.refunded_amount ? parseFloat(payment.refunded_amount) : null
        }));
      }
      
      return orderData;
    } catch (dataError) {
      console.error('Error fetching related data:', dataError);
      console.error(dataError.stack);
      return null;
    }
  } catch (error) {
    console.error('Error in getOrderById:', error);
    console.error(error.stack);
    return null;
  }
}

async function testOrderDetails() {
  try {
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('Connection successful!\n');
    
    // Find a test order ID to use
    console.log('Finding a test order...');
    const testOrder = await Order.findOne();
    
    if (!testOrder) {
      console.log('No orders found in database');
      return;
    }
    
    const orderId = testOrder.id;
    // Use vendorId 1 for testing
    const testVendorId = 1;
    
    console.log(`Testing with order ID: ${orderId}\n`);
    
    // Call our mock implementation
    const orderResult = await getOrderById(orderId, testVendorId);
    
    if (!orderResult) {
      console.log('Failed to retrieve order details');
      return;
    }
    
    // Print a summary of the order details
    console.log('\n===== ORDER DETAILS SUMMARY =====');
    console.log(`Order ID: ${orderResult.id}`);
    console.log(`Status: ${orderResult.status}`);
    console.log(`Amount: ${orderResult.amount}`);
    
    // User
    console.log('\n--- User ---');
    if (orderResult.user) {
      console.log(`Name: ${orderResult.user.first_name} ${orderResult.user.last_name}`);
      console.log(`Email: ${orderResult.user.email}`);
    } else {
      console.log('No user data found');
    }
    
    // Address
    console.log('\n--- Address ---');
    if (orderResult.address) {
      console.log(`Name: ${orderResult.address.name}`);
      console.log(`Phone: ${orderResult.address.phone}`);
      console.log(`Address: ${orderResult.address.address}, ${orderResult.address.city}, ${orderResult.address.state}, ${orderResult.address.country}`);
    } else {
      console.log('No address data found');
    }
    
    // Payment
    console.log('\n--- Payment ---');
    if (orderResult.payment) {
      console.log(`Payment ID: ${orderResult.payment.id}`);
      console.log(`Status: ${orderResult.payment.status}`);
      console.log(`Amount: ${orderResult.payment.amount}`);
      console.log(`Channel: ${orderResult.payment.payment_channel}`);
    } else {
      console.log('No payment data found');
    }
    
    // Shipments
    console.log('\n--- Shipments ---');
    if (orderResult.shipments && orderResult.shipments.length > 0) {
      console.log(`Found ${orderResult.shipments.length} shipments`);
      console.log('First shipment:');
      console.log(`Status: ${orderResult.shipments[0].status}`);
      console.log(`Price: ${orderResult.shipments[0].price}`);
    } else {
      console.log('No shipments found');
    }
    
    // Products
    console.log('\n--- Products ---');
    if (orderResult.products && orderResult.products.length > 0) {
      console.log(`Found ${orderResult.products.length} products`);
      console.log('First product:');
      console.log(`Name: ${orderResult.products[0].product_name}`);
      console.log(`Qty: ${orderResult.products[0].qty}`);
      console.log(`Price: ${orderResult.products[0].price}`);
      
      if (orderResult.products[0].product_detail) {
        console.log('Product details:');
        console.log(`SKU: ${orderResult.products[0].product_detail.sku}`);
        console.log(`Images: ${JSON.stringify(orderResult.products[0].product_detail.images)}`);
      }
    } else {
      console.log('No products found');
    }
    
    console.log('\n===== END SUMMARY =====');
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

testOrderDetails();
