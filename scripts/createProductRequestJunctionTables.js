const { sequelize } = require('../config/db');
const Sequelize = require('sequelize');

async function createProductRequestJunctionTables() {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    console.log('Starting migration: Creating product request junction tables...');
    
    await sequelize.transaction(async (transaction) => {
      
      // Create product_request_category_product table
      console.log('Creating product_request_category_product table...');
      try {
        await queryInterface.createTable('product_request_category_product', {
          category_id: {
            type: Sequelize.INTEGER,
            allowNull: true
          },
          product_request_id: {
            type: Sequelize.INTEGER,
            allowNull: true
          }
        }, { transaction });
        
        // Add indexes
        try {
          await queryInterface.addIndex('product_request_category_product', ['product_request_id'], {
            name: 'idx_pr_category_request_id',
            transaction
          });
        } catch (e) {
          if (!e.message.includes('Duplicate key')) throw e;
        }
        try {
          await queryInterface.addIndex('product_request_category_product', ['category_id'], {
            name: 'idx_pr_category_id',
            transaction
          });
        } catch (e) {
          if (!e.message.includes('Duplicate key')) throw e;
        }
        
        console.log('✓ Created product_request_category_product table');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('Table product_request_category_product already exists, skipping...');
        } else {
          throw error;
        }
      }
      
      // Create product_request_collection_products table
      console.log('Creating product_request_collection_products table...');
      try {
        await queryInterface.createTable('product_request_collection_products', {
          product_collection_id: {
            type: Sequelize.INTEGER,
            allowNull: true
          },
          product_request_id: {
            type: Sequelize.INTEGER,
            allowNull: true
          }
        }, { transaction });
        
        // Add indexes
        try {
          await queryInterface.addIndex('product_request_collection_products', ['product_request_id'], {
            name: 'idx_pr_collection_request_id',
            transaction
          });
        } catch (e) {
          if (!e.message.includes('Duplicate key')) throw e;
        }
        try {
          await queryInterface.addIndex('product_request_collection_products', ['product_collection_id'], {
            name: 'idx_pr_collection_id',
            transaction
          });
        } catch (e) {
          if (!e.message.includes('Duplicate key')) throw e;
        }
        
        console.log('✓ Created product_request_collection_products table');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('Table product_request_collection_products already exists, skipping...');
        } else {
          throw error;
        }
      }
      
      // Create product_request_label_products table
      console.log('Creating product_request_label_products table...');
      try {
        await queryInterface.createTable('product_request_label_products', {
          product_request_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true
          },
          product_label_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true
          }
        }, { transaction });
        
        // Add indexes
        await queryInterface.addIndex('product_request_label_products', ['product_request_id'], {
          name: 'idx_pr_label_request_id',
          transaction
        });
        await queryInterface.addIndex('product_request_label_products', ['product_label_id'], {
          name: 'idx_pr_label_id',
          transaction
        });
        
        console.log('✓ Created product_request_label_products table');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('Table product_request_label_products already exists, skipping...');
        } else {
          throw error;
        }
      }
    });
    
    console.log('\n✅ Migration completed successfully!');
    console.log('Tables created:');
    console.log('  - product_request_category_product');
    console.log('  - product_request_collection_products');
    console.log('  - product_request_label_products');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the migration
createProductRequestJunctionTables();
