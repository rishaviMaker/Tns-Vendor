const { sequelize } = require('../config/db');

/**
 * Idempotent migration to add missing columns to product_requests table
 * It checks INFORMATION_SCHEMA and only adds columns that don't already exist.
 */
async function addColumnsToProductRequests() {
  try {
    console.log('Starting migration: Adding missing columns to product_requests table...');

    const [existing] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'product_requests'
    `);

    const existingNames = new Set(existing.map(r => r.COLUMN_NAME));

    const columns = [
      // name, sql type (match model types)
      ['description', 'TEXT NULL'],
      ['content', 'LONGTEXT NULL'],
      ['sku', 'VARCHAR(191) NULL'],
      ['order', 'INT NULL'],
      ['allow_checkout_when_out_of_stock', 'BOOLEAN NULL DEFAULT FALSE'],
      ['with_storehouse_management', 'BOOLEAN NULL DEFAULT FALSE'],
      ['is_featured', 'BOOLEAN NULL DEFAULT FALSE'],
      ['brand_id', 'INT NULL'],
      ['is_variation', 'BOOLEAN NULL DEFAULT FALSE'],
      ['sale_type', 'INT NULL'],
      ['start_date', 'TIMESTAMP NULL'],
      ['end_date', 'TIMESTAMP NULL'],
      ['length', 'DECIMAL(10,2) NULL'],
      ['wide', 'DECIMAL(10,2) NULL'],
      ['height', 'DECIMAL(10,2) NULL'],
      ['weight', 'DECIMAL(10,2) NULL'],
      ['tax_id', 'INT NULL'],
      ['views', 'INT NULL DEFAULT 0'],
      ['stock_status', 'VARCHAR(191) NULL'],
      ['store_id', 'INT NULL'],
      ['created_by_id', 'INT NULL'],
      ['created_by_type', 'VARCHAR(255) NULL'],
      ['approved_by', 'INT NULL'],
      ['image', 'VARCHAR(255) NULL'],
      ['category', 'VARCHAR(255) NULL'],
      ['sub_category', 'VARCHAR(255) NULL'],
      ['videos', 'TEXT NULL'],
      ['purchase_price', 'DECIMAL(15,2) NULL'],
      ['hsn_sac_code', 'VARCHAR(255) NULL'],
      ['applicable_tax', 'VARCHAR(255) NULL'],
      ['unit', 'VARCHAR(50) NULL'],
      ['shipping_charges', 'DECIMAL(10,2) NULL DEFAULT 0'],
      ['shipping_included', 'BOOLEAN NOT NULL DEFAULT FALSE'],
      ['is_quotable', 'BOOLEAN NULL DEFAULT FALSE'],
      ['images', 'TEXT NULL']
    ];

    for (const [name, type] of columns) {
      if (!existingNames.has(name)) {
        const sql = `ALTER TABLE product_requests ADD COLUMN \`${name}\` ${type}`;
        console.log(`Adding column: ${name}`);
        await sequelize.query(sql);
      } else {
        console.log(`Column already exists, skipping: ${name}`);
      }
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
addColumnsToProductRequests();
