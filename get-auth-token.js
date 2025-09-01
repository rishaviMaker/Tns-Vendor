// Script to get a valid authentication token
require('dotenv').config();
const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:4000/api';

// Set up axios with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Login credentials - using a valid vendor email from the database
const credentials = {
  email: 'john.doe@example.com', // Valid vendor email from the database
  password: 'securePassword123'      // Default password, may need to be updated
};

// Function to get auth token
async function getAuthToken() {
  try {
    // console.log('Attempting to login and get auth token...');
    const response = await api.post('/vendors/login', credentials);
    
    if (response.data.status === 'success' && response.data.token) {
      // console.log('Authentication successful!');
      // console.log('Token:', response.data.token);
      return response.data.token;
    } else {
      console.error('Authentication failed:', response.data);
      return null;
    }
  } catch (error) {
    console.error('Error getting auth token:', error.response?.data || error.message);
    return null;
  }
}

// Run the function
getAuthToken();
