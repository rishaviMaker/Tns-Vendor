// Test script for revenue calculation and withdrawal validation
require('dotenv').config();
const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:4000/api';
// Use the valid token from earlier test
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InZlbmRvciIsImlhdCI6MTc0OTI3NTgwNCwiZXhwIjoxNzUxODY3ODA0fQ.mHuNdGEwUhQoYeXql0UpA7QsC6FRXJFH1VZlRqX9Vng';

// Set up axios with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`
  }
});

// Function to test getting revenue summary
async function testGetRevenueSummary() {
  try {
    console.log('\nTesting revenue summary API...');
    const response = await api.get('/revenue/summary');
    
    console.log('Revenue Summary:');
    console.log('----------------');
    console.log(`Total Revenue: ₹${response.data.data.revenue.total.toFixed(2)}`);
    console.log(`Pending Revenue: ₹${response.data.data.revenue.pending.toFixed(2)}`);
    console.log(`Completed Revenue: ₹${response.data.data.revenue.completed.toFixed(2)}`);
    console.log(`Refunded Amount: ₹${response.data.data.revenue.refunded.toFixed(2)}`);
    console.log(`Available Balance: ₹${response.data.data.revenue.available.toFixed(2)}`);
    console.log(`Total Transactions: ${response.data.data.revenue.transaction_count}`);
    
    return response.data.data.revenue;
  } catch (error) {
    console.error('Error getting revenue summary:', error.response?.data || error.message);
    return null;
  }
}

// Function to test getting detailed revenue stats
async function testGetRevenueStats() {
  try {
    console.log('\nTesting revenue statistics API...');
    const response = await api.get('/revenue/stats');
    
    console.log('Monthly Revenue Trend:');
    console.log('---------------------');
    response.data.data.stats.trend.forEach(month => {
      console.log(`${month.year}-${month.month.toString().padStart(2, '0')}: ₹${month.revenue.toFixed(2)} (${month.count} transactions)`);
    });
    
    return response.data.data.stats;
  } catch (error) {
    console.error('Error getting revenue stats:', error.response?.data || error.message);
    return null;
  }
}

// Function to test getting recent transactions
async function testGetRecentTransactions() {
  try {
    console.log('\nTesting recent transactions API...');
    const response = await api.get('/revenue/transactions?limit=5');
    
    console.log('Recent Transactions:');
    console.log('-------------------');
    response.data.data.transactions.forEach(transaction => {
      console.log(`ID: ${transaction.id}, Amount: ₹${transaction.amount}, Status: ${transaction.status}, Date: ${new Date(transaction.created_at).toLocaleDateString()}`);
    });
    
    return response.data.data.transactions;
  } catch (error) {
    console.error('Error getting recent transactions:', error.response?.data || error.message);
    return null;
  }
}

// Function to test creating a withdrawal request with valid amount
async function testCreateValidWithdrawal(availableBalance) {
  try {
    // Use 90% of available balance to ensure it's valid
    const withdrawAmount = availableBalance * 0.9;
    
    console.log(`\nTesting valid withdrawal request (₹${withdrawAmount.toFixed(2)})...`);
    
    const withdrawalRequest = {
      amount: withdrawAmount,
      payment_channel: 'Bank Transfer',
      description: 'Test withdrawal with valid amount',
      bank_info: JSON.stringify({
        bank_name: 'ICICI Bank',
        ifsc: 'ICIC0001234',
        account_number: '123456789012'
      })
    };
    
    const response = await api.post('/withdrawals', withdrawalRequest);
    
    console.log('Withdrawal created successfully:');
    console.log(`ID: ${response.data.data.withdrawal.id}`);
    console.log(`Amount: ₹${response.data.data.withdrawal.amount}`);
    console.log(`Status: ${response.data.data.withdrawal.status}`);
    
    return response.data.data.withdrawal;
  } catch (error) {
    console.error('Error creating withdrawal:', error.response?.data || error.message);
    return null;
  }
}

// Function to test creating a withdrawal request with invalid amount (exceeding balance)
async function testCreateInvalidWithdrawal(availableBalance) {
  try {
    // Try to withdraw more than available
    const withdrawAmount = availableBalance * 1.5;
    
    console.log(`\nTesting invalid withdrawal request (₹${withdrawAmount.toFixed(2)})...`);
    
    const withdrawalRequest = {
      amount: withdrawAmount,
      payment_channel: 'Bank Transfer',
      description: 'Test withdrawal exceeding available balance',
      bank_info: JSON.stringify({
        bank_name: 'ICICI Bank',
        ifsc: 'ICIC0001234',
        account_number: '123456789012'
      })
    };
    
    const response = await api.post('/withdrawals', withdrawalRequest);
    
    console.log('Unexpected success! Withdrawal should have been rejected.');
    return response.data.data.withdrawal;
  } catch (error) {
    console.log('Expected error (withdrawal amount exceeds balance):');
    console.log(error.response?.data?.message || error.message);
    return null;
  }
}

// Main function to run all tests
async function runTests() {
  console.log('===== TESTING REVENUE TRACKING AND WITHDRAWAL VALIDATION =====');
  
  // Get revenue summary
  const revenue = await testGetRevenueSummary();
  
  if (revenue) {
    // Test revenue stats
    await testGetRevenueStats();
    
    // Test recent transactions
    await testGetRecentTransactions();
    
    // Test withdrawal validation
    if (revenue.available > 0) {
      // Try valid withdrawal (less than available)
      await testCreateValidWithdrawal(revenue.available);
      
      // Try invalid withdrawal (more than available)
      await testCreateInvalidWithdrawal(revenue.available);
    } else {
      console.log('\nSkipping withdrawal tests - no available balance.');
    }
  }
  
  console.log('\n===== TEST COMPLETED =====');
}

// Check if we should run the tests
if (process.argv.includes('--run')) {
  console.log('Note: Before running this script:');
  console.log('1. Make sure your API server is running');
  console.log('2. Make sure the auth token is valid');
  console.log('');
  
  runTests();
} else {
  console.log('Run with --run flag to execute the tests.');
}
