const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const { Product } = require('../models/Product');

/**
 * Service for product search and management
 */
const productSearchService = {
  /**
   * Search for products in the central catalog (ec_products)
   * @param {string} query - The search query
   * @param {number} limit - Maximum number of results to return
   * @return {Promise<Array>} - Array of matching products
   */
  async searchCatalogProducts(query, limit = 10) {
    try {
      // Using the Sequelize Product model which maps to ec_products table
      const results = await Product.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.like]: `%${query}%` } }
          ]
        },
        attributes: [
          'id', 'name', 'description', 'content', 'price', 'sale_price', 'sku', 
          'image', 'category', 'sub_category', 'unit', 'brand_id', 'sale_type',
          'length', 'wide', 'height', 'weight'
        ],
        limit: limit
      });
      
      return results;
    } catch (error) {
      console.error('Error searching catalog products:', error);
      throw error;
    }
  },
  
  /**
   * Get a product's complete details from the central catalog by ID
   * @param {number} productId - The product ID to fetch
   * @return {Promise<Object>} - The product details
   */
  async getCatalogProductById(productId) {
    try {
      const product = await Product.findByPk(productId, {
        attributes: [
          'id', 'name', 'description', 'content', 'price', 'sale_price', 'sku', 
          'image', 'category', 'sub_category', 'unit', 'brand_id', 'sale_type',
          'length', 'wide', 'height', 'weight', 'created_at',
          'is_featured', 'tax_id'
        ]
      });
      
      if (!product) {
        throw new Error('Product not found in catalog');
      }
      
      return product;
    } catch (error) {
      console.error('Error getting catalog product:', error);
      throw error;
    }
  }
};

module.exports = productSearchService;
