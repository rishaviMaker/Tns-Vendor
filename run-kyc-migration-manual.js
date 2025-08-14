/**
 * Interactive script to run KYC fields migration
 * Allows manual entry of database credentials
 */

const path = require('path');
const { Sequelize } = require('sequelize');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Test connection with provided credentials
async function testConnection(config) {
  const { host, port, user, password, database } = config;
  
  try {
    console.log(`Attempting to connect to MySQL at ${host}:${port} with user: ${user}`);
    
    // Create Sequelize instance
    const sequelize = new Sequelize(database, user, password, {
      host,
      port,
      dialect: 'mysql',
      logging: false,
    });

    // Test the connection
    await sequelize.authenticate();
    console.log(`✅ Successfully connected to MySQL database '${database}'`);
    return { success: true, sequelize };
  } catch (error) {
    console.error(`❌ Connection failed:`, error.message);
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
    console.log('Running KYC fields migration...');
    await migration.up(sequelize.getQueryInterface(), Sequelize);
    console.log('✅ KYC fields migration completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error running KYC fields migration:', error.message);
    if (error.message.includes('already exists')) {
      console.log('Note: It appears some or all of these columns may already exist in the database.');
    }
    return false;
  }
}

// Main function
async function main() {
  console.log('=== KYC Fields Migration Tool ===');
  console.log('Please enter your MySQL database credentials:');
  
  // Get database connection details
  const host = await prompt('Host (default: localhost): ') || 'localhost';
  const port = await prompt('Port (default: 3306): ') || '3306';
  const user = await prompt('Username: ');
  const password = await prompt('Password (leave empty if none): ');
  const database = await prompt('Database name: ');
  
  if (!user || !database) {
    console.error('❌ Username and database name are required');
    return;
  }
  
  // Test connection
  const result = await testConnection({
    host,
    port: parseInt(port, 10),
    user,
    password,
    database
  });
  
  // If successful, run migration
  if (result.success) {
    await runKycFieldsMigration(result.sequelize);
    await result.sequelize.close();
  } else {
    console.log('\nPlease check your database credentials and try again.');
  }
  
  rl.close();
}

main()
  .catch((error) => {
    console.error('Unhandled error:', error);
    rl.close();
    process.exit(1);
  });
