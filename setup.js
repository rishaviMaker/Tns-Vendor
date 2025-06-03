const { initDatabase } = require('./utils/database');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Force sync database (drop and recreate tables) and create sample data
const setupDatabase = async () => {
  try {
    console.log('Setting up database with sample data...');
    await initDatabase(true);
    console.log('Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
};

// Run setup
setupDatabase();
