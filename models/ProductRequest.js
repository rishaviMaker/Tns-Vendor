const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

class ProductRequest extends Model {}

ProductRequest.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  vendor_id: {
    type: DataTypes.INTEGER,
    allowNull: false
    // Removing foreign key constraint for now
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
  sku: {
    type: DataTypes.STRING,
    allowNull: true
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  allow_checkout_when_out_of_stock: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  },
  with_storehouse_management: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  },
  brand_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  is_variation: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  },
  sale_type: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
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
  weight: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
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
    allowNull: true
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
    type: DataTypes.STRING,
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
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('videos');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('videos', JSON.stringify(value));
    }
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
    type: DataTypes.STRING,
    allowNull: true
  },
  shipping_charges: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  },
  shipping_included: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  is_quotable: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  },
  images: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('images');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('images', JSON.stringify(value));
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    allowNull: false
  },
  admin_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'ProductRequest',
  tableName: 'product_requests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = { ProductRequest };
