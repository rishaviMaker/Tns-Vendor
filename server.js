const app = require('./app');
const dotenv = require('dotenv');
const { initDatabase } = require('./utils/database');

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 6000; // Set default port to 6000 to match Swagger configuration

// Initialize the database
const startServer = async () => {
  try {
    // Initialize database
    // Pass true to force sync (drop tables and recreate) - use only in development
    const force = process.env.NODE_ENV === 'development' && process.env.DB_FORCE_SYNC === 'true';
    const dbInitialized = await initDatabase(force);
    
    if (!dbInitialized) {
      console.error('Failed to initialize database. Exiting...');
      process.exit(1);
    }
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
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
