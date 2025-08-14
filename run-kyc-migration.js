/**
 * Script to run the KYC fields migration specifically
 * This uses direct database connection parameters to avoid environment variable issues
 */

const path = require('path');
const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create a function to test database connection with specific parameters
async function testConnection(config) {
  const { host, port, user, password, database } = config;
  
  try {
    // Create a Sequelize instance with the provided configuration
    const sequelize = new Sequelize(database, user, password, {
      host,
      port,
      dialect: 'mysql',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });

    // Test the connection
    await sequelize.authenticate();
    console.log(`✅ Successfully connected to MySQL server at ${host}:${port}`);
    return { success: true, sequelize };
  } catch (error) {
    console.error(`❌ Failed to connect to MySQL server at ${host}:${port}:`, error.message);
    return { success: false, error };
  }
}

// Run the KYC fields migration
async function runKycFieldsMigration(sequelize) {
  try {
    // Load the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add_kyc_fields_to_vendors.js');
    const migration = require(migrationPath);
    
    // Execute the migration
    await migration.up(sequelize.getQueryInterface(), Sequelize);
    console.log('✅ KYC fields migration completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error running KYC fields migration:', error.message);
    return false;
  }
}

// Main function
async function main() {
  // Try default connection from environment variables first
  const envConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'tns_new'
  };
  
  console.log('Attempting to connect with environment variables...');
  let result = await testConnection(envConfig);
  
  // If that fails, try common localhost configurations
  if (!result.success) {
    console.log('Environment variable connection failed. Trying common configurations...');
    
    // Common configurations to try
    const configs = [
      { host: 'localhost', port: 3306, user: 'root', password: '', database: 'tns_new' },
      { host: '127.0.0.1', port: 3306, user: 'root', password: '', database: 'tns_new' },
      { host: 'localhost', port: 3306, user: 'root', password: 'root', database: 'tns_new' }
    ];
    
    // Try each configuration
    for (const config of configs) {
      result = await testConnection(config);
      if (result.success) {
        console.log('Connection successful with alternative configuration!');
        break;
      }
    }
  }
  
  // If we have a successful connection, run the migration
  if (result.success) {
    await runKycFieldsMigration(result.sequelize);
    await result.sequelize.close();
  } else {
    console.error('Could not connect to the database with any configuration.');
    console.log('\nPlease check the following:');
    console.log('1. Make sure MySQL server is running');
    console.log('2. Verify your database credentials in the .env file');
    console.log('3. Ensure the database "tns_new" exists');
    console.log('4. Check if MySQL is accessible on default port 3306');
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
