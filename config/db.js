const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Create Sequelize instance
const sequelize = new Sequelize(
  isProduction ? process.env.PROD_DB_NAME : process.env.DEV_DB_NAME,
  isProduction ? process.env.PROD_DB_USER : process.env.DEV_DB_USER,
  isProduction ? process.env.PROD_DB_PASS : process.env.DEV_DB_PASS || '',
  {
    host: isProduction ? process.env.PROD_DB_HOST : process.env.DEV_DB_HOST,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.', isProduction ? 'Production' : 'Development');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, testConnection };
