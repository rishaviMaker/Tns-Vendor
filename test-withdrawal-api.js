const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Base URL for API requests
const API_URL = 'http://localhost:5000';

// Store the auth token
let token = '';
// Store created withdrawal ID
let withdrawalId = '';

// Test vendor credentials
const vendorCredentials = {
  email: 'vendor@example.com',
  password: 'password123'
};

// Sample withdrawal data
const withdrawalData = {
  amount: 1250.00,
  payment_channel: 'Bank Transfer',
  transaction_id: '#' + Math.floor(Math.random() * 1000000000),
  description: 'Test withdrawal request',
  bank_info: {
    bank_name: 'YES BANK',
    ifsc: 'YES00011000002',
    account_number: '621652621161161155'
  }
};

// Helper function to log responses
const logResponse = (title, response) => {
  console.log('\n===================================');
  console.log(`${title}:`);
  console.log('-----------------------------------');
  console.log('Status:', response.status);
  console.log('Data:', JSON.stringify(response.data, null, 2));
  console.log('===================================\n');
};

// Helper function to log errors
const logError = (title, error) => {
  console.log('\n===================================');
  console.log(`${title} ERROR:`);
  console.log('-----------------------------------');
  if (error.response) {
    console.log('Status:', error.response.status);
    console.log('Data:', JSON.stringify(error.response.data, null, 2));
  } else {
    console.log('Error:', error.message);
  }
  console.log('===================================\n');
};

// Login and get token
const login = async () => {
  try {
    console.log('Logging in...');
    const response = await axios.post(`${API_URL}/api/vendors/login`, vendorCredentials);
    token = response.data.token;
    console.log('Login successful! Token received.');
    return true;
  } catch (error) {
    logError('Login', error);
    return false;
  }
};

// Test getting all withdrawals
const getAllWithdrawals = async () => {
  try {
    console.log('Getting all withdrawals...');
    const response = await axios.get(`${API_URL}/api/withdrawals`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logResponse('All Withdrawals', response);
    return true;
  } catch (error) {
    logError('Get All Withdrawals', error);
    return false;
  }
};

// Test creating a withdrawal
const createWithdrawal = async () => {
  try {
    console.log('Creating a withdrawal request...');
    const response = await axios.post(
      `${API_URL}/api/withdrawals`,
      withdrawalData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    logResponse('Create Withdrawal', response);
    withdrawalId = response.data.data.withdrawal.id;
    console.log(`Withdrawal created with ID: ${withdrawalId}`);
    return true;
  } catch (error) {
    logError('Create Withdrawal', error);
    return false;
  }
};

// Test getting a withdrawal by ID
const getWithdrawalById = async () => {
  try {
    console.log(`Getting withdrawal with ID: ${withdrawalId}...`);
    const response = await axios.get(
      `${API_URL}/api/withdrawals/${withdrawalId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    logResponse('Get Withdrawal by ID', response);
    return true;
  } catch (error) {
    logError('Get Withdrawal by ID', error);
    return false;
  }
};

// Test cancelling a withdrawal
const cancelWithdrawal = async () => {
  try {
    console.log(`Cancelling withdrawal with ID: ${withdrawalId}...`);
    const response = await axios.patch(
      `${API_URL}/api/withdrawals/${withdrawalId}/cancel`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    logResponse('Cancel Withdrawal', response);
    return true;
  } catch (error) {
    logError('Cancel Withdrawal', error);
    return false;
  }
};

// Test retrying a withdrawal
const retryWithdrawal = async () => {
  try {
    console.log(`Retrying withdrawal with ID: ${withdrawalId}...`);
    const response = await axios.post(
      `${API_URL}/api/withdrawals/${withdrawalId}/retry`,
      { transaction_id: '#' + Math.floor(Math.random() * 1000000000) },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    logResponse('Retry Withdrawal', response);
    return true;
  } catch (error) {
    logError('Retry Withdrawal', error);
    return false;
  }
};

// Test exporting withdrawals as CSV
const exportWithdrawalsCSV = async () => {
  try {
    console.log('Exporting withdrawals as CSV...');
    const response = await axios.get(
      `${API_URL}/api/withdrawals/export-csv`,
      { 
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      }
    );
    console.log('CSV export successful!');
    console.log('Content Type:', response.headers['content-type']);
    console.log('Content Length:', response.data.length);
    return true;
  } catch (error) {
    logError('Export Withdrawals CSV', error);
    return false;
  }
};

// Test exporting withdrawals as Excel
const exportWithdrawalsExcel = async () => {
  try {
    console.log('Exporting withdrawals as Excel...');
    const response = await axios.get(
      `${API_URL}/api/withdrawals/export-excel`,
      { 
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      }
    );
    console.log('Excel export successful!');
    console.log('Content Type:', response.headers['content-type']);
    console.log('Content Length:', response.data.length);
    return true;
  } catch (error) {
    logError('Export Withdrawals Excel', error);
    return false;
  }
};

// Run all tests
const runTests = async () => {
  console.log('Starting Withdrawal API tests...\n');
  
  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('Login failed. Cannot continue tests.');
    return;
  }
  
  // Run tests in sequence
  await getAllWithdrawals();
  await createWithdrawal();
  
  if (withdrawalId) {
    await getWithdrawalById();
    await cancelWithdrawal();
    await retryWithdrawal();
  } else {
    console.log('No withdrawal ID available. Skipping ID-specific tests.');
  }
  
  await exportWithdrawalsCSV();
  await exportWithdrawalsExcel();
  
  console.log('\nAll tests completed!');
};

// Run the tests
runTests().catch(error => {
  console.error('Test execution error:', error);
});
