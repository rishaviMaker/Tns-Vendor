const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const vendorRoutes = require('./routes/vendorRoutes');
const storeRoutes = require('./routes/storeRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');

// Import error handler middleware
const errorHandler = require('./middlewares/errorHandler');

// Initialize express app
const app = express();

// Middlewares
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('dev')); // Request logging
app.use(express.json()); // Parse JSON request body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request body

// API Routes
app.use('/api/vendors', vendorRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Root route - API documentation or welcome page
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to Vendor API',
    documentation: '/api-docs',
    version: '1.0.0',
    endpoints: {
      vendors: '/api/vendors',
      stores: '/api/stores',
      products: '/api/products',
      categories: '/api/categories'
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// Handle unhandled routes
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

module.exports = app;
