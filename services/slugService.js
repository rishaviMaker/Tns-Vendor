const { Slug } = require('../models/Slug');

/**
 * Slug Service
 * Handles slug generation and management for various models
 */
class SlugService {
  /**
   * Create a slug for a product
   * @param {string} productName - Product name
   * @param {number} productId - Product ID
   * @returns {Promise<Object>} - Slug object with URL
   */
  static async createProductSlug(productName, productId) {
    const slug = await Slug.createSlug(
      productName,
      'Botble\\Ecommerce\\Models\\Product',
      productId,
      'products'
    );
    
    return {
      slug: slug,
      url: `/${slug.prefix}/${slug.key}`,
      fullUrl: `${process.env.APP_URL || 'http://localhost:3000'}/${slug.prefix}/${slug.key}`
    };
  }

  /**
   * Update a product slug
   * @param {string} productName - New product name
   * @param {number} productId - Product ID
   * @returns {Promise<Object>} - Updated slug object with URL
   */
  static async updateProductSlug(productName, productId) {
    const slug = await Slug.upsertSlug(
      productName,
      'Botble\\Ecommerce\\Models\\Product',
      productId,
      'products'
    );
    
    return {
      slug: slug,
      url: `/${slug.prefix}/${slug.key}`,
      fullUrl: `${process.env.APP_URL || 'http://localhost:3000'}/${slug.prefix}/${slug.key}`
    };
  }

  /**
   * Get slug by reference
   * @param {string} referenceType - Model type
   * @param {number} referenceId - Model ID
   * @returns {Promise<Object|null>} - Slug object with URL or null
   */
  static async getSlugByReference(referenceType, referenceId) {
    const slug = await Slug.findOne({
      where: {
        reference_type: referenceType,
        reference_id: referenceId
      }
    });

    if (!slug) return null;

    return {
      slug: slug,
      url: `/${slug.prefix}/${slug.key}`,
      fullUrl: `${process.env.APP_URL || 'http://localhost:3000'}/${slug.prefix}/${slug.key}`
    };
  }

  /**
   * Delete slug by reference
   * @param {string} referenceType - Model type
   * @param {number} referenceId - Model ID
   * @returns {Promise<boolean>} - True if deleted, false otherwise
   */
  static async deleteSlugByReference(referenceType, referenceId) {
    const result = await Slug.destroy({
      where: {
        reference_type: referenceType,
        reference_id: referenceId
      }
    });

    return result > 0;
  }

  /**
   * Create a slug for a category
   * @param {string} categoryName - Category name
   * @param {number} categoryId - Category ID
   * @returns {Promise<Object>} - Slug object with URL
   */
  static async createCategorySlug(categoryName, categoryId) {
    const slug = await Slug.createSlug(
      categoryName,
      'Botble\\Ecommerce\\Models\\ProductCategory',
      categoryId,
      'product-categories'
    );
    
    return {
      slug: slug,
      url: `/${slug.prefix}/${slug.key}`,
      fullUrl: `${process.env.APP_URL || 'http://localhost:3000'}/${slug.prefix}/${slug.key}`
    };
  }

  /**
   * Create a slug for a brand
   * @param {string} brandName - Brand name
   * @param {number} brandId - Brand ID
   * @returns {Promise<Object>} - Slug object with URL
   */
  static async createBrandSlug(brandName, brandId) {
    const slug = await Slug.createSlug(
      brandName,
      'Botble\\Ecommerce\\Models\\Brand',
      brandId,
      'brands'
    );
    
    return {
      slug: slug,
      url: `/${slug.prefix}/${slug.key}`,
      fullUrl: `${process.env.APP_URL || 'http://localhost:3000'}/${slug.prefix}/${slug.key}`
    };
  }

  /**
   * Create a slug for a store
   * @param {string} storeName - Store name
   * @param {number} storeId - Store ID
   * @returns {Promise<Object>} - Slug object with URL
   */
  static async createStoreSlug(storeName, storeId) {
    const slug = await Slug.createSlug(
      storeName,
      'Botble\\Marketplace\\Models\\Store',
      storeId,
      'stores'
    );
    
    return {
      slug: slug,
      url: `/${slug.prefix}/${slug.key}`,
      fullUrl: `${process.env.APP_URL || 'http://localhost:3000'}/${slug.prefix}/${slug.key}`
    };
  }
}

module.exports = SlugService;
