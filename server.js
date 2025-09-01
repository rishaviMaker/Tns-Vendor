const app = require('./app');
const dotenv = require('dotenv');
// const { initDatabase } = require('./utils/database');

// Load environment variables
dotenv.config();

const isProd = process.env.NODE_ENV === 'production';
const PORT = isProd ? process.env.PROD_PORT : process.env.PORT || process.env.DEV_PORT; // Set default port to 6000 to match Swagger configuration

// Initialize the database
const startServer = async () => {
  try {
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running in ${isProd ? 'production' : 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Start the server
startServer();
