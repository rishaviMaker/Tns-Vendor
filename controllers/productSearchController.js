const AppError = require('../utils/AppError');
const productSearchService = require('../services/productSearchService');
const { ProductRequest } = require('../models/ProductRequest');

/**
 * Search for products in the central catalog
 */
exports.searchCatalogProducts = async (req, res, next) => {
  try {
    const { query, limit = 1000000 } = req.query;
    
    // if (!query || query.length < 2) {
    //   return next(new AppError('Search query must be at least 2 characters', 400));
    // }
    
    const products = await productSearchService.searchCatalogProducts(query, parseInt(limit));
    
    return res.status(200).json({
      status: 'success',
      results: products.length,
      data: {
        products
      }
    });
  } catch (error) {
    console.error('Error searching catalog products:', error);
    return next(new AppError(`Failed to search products: ${error.message}`, 500));
  }
};

/**
 * Get catalog product details by ID
 */
exports.getCatalogProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const product = await productSearchService.getCatalogProductById(id);
    
    return res.status(200).json({
      status: 'success',
      data: {
        product
      }
    });
  } catch (error) {
    console.error('Error getting catalog product:', error);
    return next(new AppError(`Failed to get product details: ${error.message}`, 404));
  }
};

/**
 * Request for a new product to be added to the catalog
 */
exports.requestNewProduct = async (req, res, next) => {
  try {
    const vendorId = req.user.id;
    const {
      name,
      description,
      category_id,
      brand,
      specifications
    } = req.body;
    
    // Validate required fields
    if (!name) {
      return next(new AppError('Product name is required', 400));
    }
    
    // Create product request
    const productRequest = await ProductRequest.create({
      vendor_id: vendorId,
      name,
      description,
      category_id,
      brand,
      specifications: specifications ? JSON.stringify(specifications) : null,
      status: 'pending'
    });
    
    return res.status(201).json({
      status: 'success',
      message: 'Product request submitted successfully',
      data: {
        request: productRequest
      }
    });
  } catch (error) {
    console.error('Error creating product request:', error);
    return next(new AppError(`Failed to submit product request: ${error.message}`, 500));
  }
};

/**
 * Get all product requests for vendor
 */
exports.getVendorProductRequests = async (req, res, next) => {
  try {
    const vendorId = req.user.id;
    const { status } = req.query;
    
    // Build query conditions
    const whereClause = { vendor_id: vendorId };
    
    // Add status filter if provided
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      whereClause.status = status;
    }
    
    const requests = await ProductRequest.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });
    
    return res.status(200).json({
      status: 'success',
      results: requests.length,
      data: {
        requests
      }
    });
  } catch (error) {
    console.error('Error getting product requests:', error);
    return next(new AppError(`Failed to get product requests: ${error.message}`, 500));
  }
};
