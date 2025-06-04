// Test script for coupon APIs
require('dotenv').config();
const axios = require('axios');

// Configuration - adjust as needed
const API_BASE_URL = 'http://localhost:5000/api';
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN'; // Replace with actual vendor auth token

// Set up axios with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`
  }
});

// Test API functions
async function testGenerateCouponCode() {
  try {
    console.log('Testing generate coupon code...');
    const response = await api.get('/coupons/generate-code');
    console.log('Generated code:', response.data.data.code);
    return response.data.data.code;
  } catch (error) {
    console.error('Error generating coupon code:', error.response?.data || error.message);
    return null;
  }
}

async function testCreateCoupon(code) {
  try {
    console.log('Testing create coupon...');
    const couponData = {
      title: 'Test Discount',
      code: code || 'TEST25',
      discount_type: 'percentage',
      value: 25,
      quantity: 50,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      can_use_with_promotion: false,
      product_scope: 'all_products',
      product_quantity: 1
    };
    
    const response = await api.post('/coupons', couponData);
    console.log('Created coupon:', response.data.data.coupon);
    return response.data.data.coupon.id;
  } catch (error) {
    console.error('Error creating coupon:', error.response?.data || error.message);
    return null;
  }
}

async function testGetCoupons() {
  try {
    console.log('Testing get all coupons...');
    const response = await api.get('/coupons');
    console.log(`Retrieved ${response.data.results} coupons`);
    if (response.data.results > 0) {
      console.log('Sample coupon:', response.data.data.coupons[0]);
    }
    return response.data.data.coupons;
  } catch (error) {
    console.error('Error getting coupons:', error.response?.data || error.message);
    return [];
  }
}

async function testGetCouponById(id) {
  try {
    console.log(`Testing get coupon by ID ${id}...`);
    const response = await api.get(`/coupons/${id}`);
    console.log('Retrieved coupon:', response.data.data.coupon);
    return response.data.data.coupon;
  } catch (error) {
    console.error('Error getting coupon by ID:', error.response?.data || error.message);
    return null;
  }
}

async function testUpdateCoupon(id) {
  try {
    console.log(`Testing update coupon with ID ${id}...`);
    const updateData = {
      value: 30, // Update discount value to 30%
      title: 'Updated Discount',
      product_quantity: 2 // Require 2 products to apply discount
    };
    
    const response = await api.patch(`/coupons/${id}`, updateData);
    console.log('Updated coupon:', response.data.data.coupon);
    return response.data.data.coupon;
  } catch (error) {
    console.error('Error updating coupon:', error.response?.data || error.message);
    return null;
  }
}

async function testDeleteCoupon(id) {
  try {
    console.log(`Testing delete coupon with ID ${id}...`);
    const response = await api.delete(`/coupons/${id}`);
    console.log('Delete response:', response.data);
    return true;
  } catch (error) {
    console.error('Error deleting coupon:', error.response?.data || error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('===== COUPON API TESTS =====\n');
  
  // Step 1: Generate a code
  const generatedCode = await testGenerateCouponCode();
  
  // Step 2: Create a coupon with the generated code
  const createdCouponId = await testCreateCoupon(generatedCode);
  
  // Step 3: Get all coupons
  const coupons = await testGetCoupons();
  
  // Step 4: Get the specific coupon by ID
  if (createdCouponId) {
    await testGetCouponById(createdCouponId);
  } else if (coupons.length > 0) {
    await testGetCouponById(coupons[0].id);
  }
  
  // Step 5: Update the coupon
  if (createdCouponId) {
    await testUpdateCoupon(createdCouponId);
  } else if (coupons.length > 0) {
    await testUpdateCoupon(coupons[0].id);
  }
  
  // Step 6: Delete the coupon (uncomment to test)
  /*
  if (createdCouponId) {
    await testDeleteCoupon(createdCouponId);
  }
  */
  
  console.log('\n===== TEST COMPLETED =====');
}

// Run the tests
console.log('Note: Before running this script:');
console.log('1. Make sure your API server is running');
console.log('2. Replace YOUR_AUTH_TOKEN with a valid vendor token');
console.log('3. Adjust any other configuration as needed\n');

if (process.argv.includes('--run')) {
  runTests();
} else {
  console.log('Add --run flag to execute the tests');
}
