const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { Store } = require('./Store');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true
  },
  images: {
    type: DataTypes.TEXT, // Assuming images are stored as JSON or comma-separated URLs
    allowNull: true
  },
  sku: {
    type: DataTypes.STRING,
    allowNull: true
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  allow_checkout_when_out_of_stock: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  },
  with_storehouse_management: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  },
  brand_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  is_variation: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  },
  sale_type: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  sale_price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  length: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  wide: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  height: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  weight: { // Note: This seems to be misspelled in the schema, keeping it as is
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  tax_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  views: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  stock_status: {
    type: DataTypes.STRING,
    allowNull: true
  },
  store_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'mp_stores',
      key: 'id'
    }
  },
  created_by_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  created_by_type: {
    type: DataTypes.STRING,
    allowNull: true
  },
  approved_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  image: {
    type: DataTypes.STRING, // This appears to be a separate field from 'images'
    allowNull: true
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sub_category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  videos: {
    type: DataTypes.TEXT, // For storing multiple video URLs as JSON
    allowNull: true
  },
  shipping_charges: {
    type: DataTypes.DECIMAL(10, 2), // Amount in INR
    allowNull: true,
    defaultValue: 0
  },
  shipping_included: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  },
  purchase_price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  hsn_sac_code: {
    type: DataTypes.STRING,
    allowNull: true
  },
  applicable_tax: {
    type: DataTypes.STRING,
    allowNull: true
  },
  unit: {
    type: DataTypes.STRING, // KG, Piece, etc.
    allowNull: true
  },
  warehouse_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'ec_products',
  timestamps: false // We'll handle timestamps manually with created_at and updated_at
});

// Define relationship with Store
Product.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });
Store.hasMany(Product, { foreignKey: 'store_id', as: 'products' });

module.exports = { Product };
