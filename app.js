const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger/config');

// Load environment variables
dotenv.config();


const adminRoutes = require('./routes/adminRoutes');
// Import routes
const vendorRoutes = require('./routes/vendorRoutes');
const storeRoutes = require('./routes/storeRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const discountRoutes = require('./routes/discountRoutes');
const withdrawalRoutes = require('./routes/withdrawalRoutes');
const revenueRoutes = require('./routes/revenueRoutes');
const productSearchRoutes = require('./routes/productSearchRoutes');
const productRequestRoutes = require('./routes/productRequestRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const kycRoutes = require('./routes/kycRoutes');
const warehouseRoutes = require('./routes/warehouseRoutes');
const pincodeRoutes = require('./routes/pincodeRoutes');

// Import error handler middleware
const errorHandler = require('./middlewares/errorHandler');

// Initialize express app
const app = express();

// Middlewares
app.use(helmet({ 
  contentSecurityPolicy: false, // Disable CSP as it can interfere with Swagger UI
  crossOriginEmbedderPolicy: false // Allow loading resources from different origins
})); // Security headers with modifications for Swagger

// Enhanced CORS configuration
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('prod')); // Request logging
app.use(express.json()); // Parse JSON request body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request body

// API Routes
app.use('/admin', adminRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', discountRoutes);
app.use('/api/vendor/kyc', kycRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/product-search', productSearchRoutes);
app.use('/api/product-requests', productRequestRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/warehouse', warehouseRoutes);
app.use('/api/pincode', pincodeRoutes);

// Mount static files if needed for Swagger UI
app.use('/public', express.static('public'));

// Serve the Swagger spec directly as a route
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send(swaggerSpec);
});

// Create a single middleware function for swagger documentation
const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'list',
    filter: true,
    // By not specifying a URL, we'll use the directly provided spec
  },
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Vendor API Documentation'
};

// Setup Swagger UI - we directly pass the spec rather than relying on URL fetch
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Direct root to documentation
app.get('/docs', (req, res) => {
  res.redirect('/api-docs');
});

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
      categories: '/api/categories',
      orders: '/api/orders',
      coupons: '/api/coupons',
      withdrawals: '/api/withdrawals',
      productRequests: '/api/product-requests',
      productSearch: '/api/product-search',
      dashboard: '/api/dashboard'
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
