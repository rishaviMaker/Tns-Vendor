// Test script for new coupon features
require('dotenv').config();
const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:4000/api';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InZlbmRvciIsImlhdCI6MTc0OTI3NTgwNCwiZXhwIjoxNzUxODY3ODA0fQ.mHuNdGEwUhQoYeXql0UpA7QsC6FRXJFH1VZlRqX9Vng';

// Set up axios with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`
  }
});

// Test new coupon features
async function testNeverExpireCoupon() {
  try {
    console.log('Testing never expire coupon...');
    const code = await generateCouponCode();
    
    const couponData = {
      title: 'Never Expire Coupon',
      code: code,
      discount_type: 'percentage',
      value: 15,
      quantity: 100,
      start_date: new Date().toISOString(),
      can_use_with_promotion: false,
      product_scope: 'all_products',
      product_quantity: 1,
      never_expire: true,
      unlimited_used: false
    };
    
    const response = await api.post('/coupons', couponData);
    console.log('Created never expire coupon:', response.data.data.coupon);
    return response.data.data.coupon.id;
  } catch (error) {
    console.error('Error creating never expire coupon:', error.response?.data || error.message);
    return null;
  }
}

async function testUnlimitedUsedCoupon() {
  try {
    console.log('Testing unlimited used coupon...');
    const code = await generateCouponCode();
    
    const couponData = {
      title: 'Unlimited Used Coupon',
      code: code,
      discount_type: 'percentage',
      value: 10,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      can_use_with_promotion: false,
      product_scope: 'all_products',
      product_quantity: 1,
      never_expire: false,
      unlimited_used: true
    };
    
    const response = await api.post('/coupons', couponData);
    console.log('Created unlimited used coupon:', response.data.data.coupon);
    return response.data.data.coupon.id;
  } catch (error) {
    console.error('Error creating unlimited used coupon:', error.response?.data || error.message);
    return null;
  }
}

async function testCategorySpecificCoupon() {
  try {
    console.log('Testing category-specific coupon...');
    const code = await generateCouponCode();
    
    const couponData = {
      title: 'Category Discount',
      code: code,
      discount_type: 'percentage',
      value: 20,
      quantity: 50,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      can_use_with_promotion: false,
      product_scope: 'categories',
      target_categories: [1, 2], // Assuming category IDs 1 and 2 exist
      product_quantity: 1,
      never_expire: false,
      unlimited_used: false
    };
    
    const response = await api.post('/coupons', couponData);
    console.log('Created category-specific coupon:', response.data.data.coupon);
    return response.data.data.coupon.id;
  } catch (error) {
    console.error('Error creating category-specific coupon:', error.response?.data || error.message);
    return null;
  }
}

async function testSubcategorySpecificCoupon() {
  try {
    console.log('Testing subcategory-specific coupon...');
    const code = await generateCouponCode();
    
    const couponData = {
      title: 'Subcategory Discount',
      code: code,
      discount_type: 'percentage',
      value: 25,
      quantity: 30,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      can_use_with_promotion: false,
      product_scope: 'subcategories',
      target_subcategories: [5, 6], // Assuming subcategory IDs 5 and 6 exist
      product_quantity: 1,
      never_expire: false,
      unlimited_used: false
    };
    
    const response = await api.post('/coupons', couponData);
    console.log('Created subcategory-specific coupon:', response.data.data.coupon);
    return response.data.data.coupon.id;
  } catch (error) {
    console.error('Error creating subcategory-specific coupon:', error.response?.data || error.message);
    return null;
  }
}

async function generateCouponCode() {
  try {
    const response = await api.get('/coupons/generate-code');
    return response.data.data.code;
  } catch (error) {
    console.error('Error generating coupon code:', error.response?.data || error.message);
    return `TEST${Math.floor(Math.random() * 10000)}`;
  }
}

async function runTests() {
  console.log('===== TESTING NEW COUPON FEATURES =====\n');
  
  // Test never expire coupon
  const neverExpireId = await testNeverExpireCoupon();
  console.log('\n');
  
  // Test unlimited used coupon
  const unlimitedUsedId = await testUnlimitedUsedCoupon();
  console.log('\n');
  
  // Test category-specific coupon
  const categorySpecificId = await testCategorySpecificCoupon();
  console.log('\n');
  
  // Test subcategory-specific coupon
  const subcategorySpecificId = await testSubcategorySpecificCoupon();
  
  console.log('\n===== TEST COMPLETED =====');
}

// Run the tests
console.log('Note: Before running this script:');
console.log('1. Make sure your API server is running');
console.log('2. Make sure the migration has been applied');
console.log('3. Make sure the auth token is valid\n');

if (process.argv.includes('--run')) {
  runTests();
} else {
  console.log('Add --run flag to execute the tests');
}
