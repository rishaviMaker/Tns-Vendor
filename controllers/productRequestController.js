const { ProductRequest } = require('../models/ProductRequest');
const { Vendor } = require('../models/Vendor');
const { Store } = require('../models/Store');
const AppError = require('../utils/AppError');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage for product request images
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Create the directory if it doesn't exist
    const uploadPath = 'public/uploads/product-requests';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    // Generate unique filename
    cb(null, `request-image-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Configure upload middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function(req, file, cb) {
    // Accept only images
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
}).array('images', 5); // Allow up to 5 images

/**
 * Product Request Controller
 * Handles vendor requests for new products to be added to the catalog
 */
const productRequestController = {
  /**
   * Create a new product request
   * @route POST /api/product-requests/create
   */
  async createProductRequest(req, res, next) {
    // Handle file uploads first
    upload(req, res, async function(err) {
      if (err) {
        return next(new AppError(err.message, 400));
      }

      try {
        const { 
          name, price, sale_price, quantity, shipping_charges, shipping_included
        } = req.body;
console.log(req.body);
        // Validate required fields
        if (!name) {
          return next(new AppError('Product name is required', 400));
        }

        if (!price) {
          return next(new AppError('Product price is required', 400));
        }

        if (!quantity) {
          return next(new AppError('Product quantity is required', 400));
        }

        // Validate store belongs to vendor
        // const store = await Store.findOne({ 
        //   where: { id: store_id, customerId: req.user.id }
        // });

        // if (!store) {
        //   return next(new AppError('Store not found or does not belong to this vendor', 404));
        // }

        // Process uploaded images
        let imageUrls = [];
        if (req.files && req.files.length > 0) {
          imageUrls = req.files.map(file => `/uploads/product-requests/${file.filename}`);
        }

        // Create product request
        const productRequest = await ProductRequest.create({
          vendor_id: req.user.id,
          // store_id,
          name,
          price,
          sale_price: sale_price || null,
          quantity,
          shipping_charges: shipping_charges || 0,
          shipping_included: shipping_included === 'true' || shipping_included === true,
          images: imageUrls,
          status: 'pending'
        });

        // Fetch vendor details for the response
        const vendor = await Vendor.findByPk(req.user.id, {
          attributes: ['id', 'fullName', 'email', 'mobileNumber']
        });

        res.status(201).json({
          status: 'success',
          data: {
            productRequest: {
              ...productRequest.toJSON(),
              vendor: vendor,
              // store: store
            }
          }
        });
      } catch (error) {
        console.error('Error creating product request:', error);
        next(error);
      }
    });
  },

  /**
   * Get all product requests for a vendor
   * @route GET /api/product-requests
   */
  async getAllProductRequests(req, res, next) {
    try {
      // Get vendor ID from authenticated user
      const vendorId = req.user.id;

      // Find all product requests for this vendor
      const productRequests = await ProductRequest.findAll({
        where: { vendor_id: vendorId },
        order: [['created_at', 'DESC']]
      });

      // Get vendor details
      const vendor = await Vendor.findByPk(req.user.id, {
        attributes: ['id', 'fullName', 'email', 'mobileNumber']
      });

      // Get store details for each product request
      const storeIds = [...new Set(productRequests.map(pr => pr.store_id))];
      const stores = await Store.findAll({
        where: { id: storeIds },
        attributes: ['id', 'name']
      });

      // Map stores by ID for easy lookup
      const storeMap = {};
      stores.forEach(store => {
        storeMap[store.id] = store;
      });

      // Add vendor and store details to each product request
      const enrichedProductRequests = productRequests.map(pr => {
        const prJson = pr.toJSON();
        return {
          ...prJson,
          vendor: vendor,
          store: storeMap[pr.store_id] || null
        };
      });

      // Return success response
      res.status(200).json({
        status: 'success',
        results: enrichedProductRequests.length,
        data: {
          productRequests: enrichedProductRequests
        }
      });
    } catch (error) {
      console.error('Error fetching product requests:', error);
      next(error);
    }
  },

  /**
   * Get a single product request by ID
   * @route GET /api/product-requests/:id
   */
  async getProductRequestById(req, res, next) {
    try {
      const { id } = req.params;
      const vendorId = req.user.id;

      // Find the product request
      const productRequest = await ProductRequest.findOne({
        where: { id, vendor_id: vendorId }
      });

      // Check if product request exists
      if (!productRequest) {
        return next(new AppError('Product request not found', 404));
      }

      // Get vendor details
      const vendor = await Vendor.findByPk(vendorId, {
        attributes: ['id', 'fullName', 'email', 'mobileNumber']
      });

      // Get store details
      const store = await Store.findByPk(productRequest.store_id, {
        attributes: ['id', 'name']
      });

      // Return success response with vendor and store details
      res.status(200).json({
        status: 'success',
        data: {
          productRequest: {
            ...productRequest.toJSON(),
            vendor,
            store
          }
        }
      });
    } catch (error) {
      console.error('Error fetching product request:', error);
      next(error);
    }
  },

  /**
   * Update a product request (only if status is still pending)
   * @route PATCH /api/product-requests/:id
   */
  async updateProductRequest(req, res, next) {
    try {
      const { id } = req.params;
      const vendorId = req.user.id;
      
      // Find the product request
      const productRequest = await ProductRequest.findOne({
        where: { 
          id,
          vendor_id: vendorId
        }
      });

      if (!productRequest) {
        return next(new AppError('Product request not found', 404));
      }

      // Only allow updates if status is still pending
      if (productRequest.status !== 'pending') {
        return next(new AppError('Cannot update product request that has been processed by admin', 400));
      }

      // Update allowed fields
      const { 
        name, price, sale_price, quantity, shipping_charges, shipping_included
      } = req.body;

      // Update the product request
      await productRequest.update({
        name: name || productRequest.name,
        price: price !== undefined ? price : productRequest.price,
        sale_price: sale_price !== undefined ? sale_price : productRequest.sale_price,
        quantity: quantity !== undefined ? quantity : productRequest.quantity,
        shipping_charges: shipping_charges !== undefined ? shipping_charges : productRequest.shipping_charges,
        shipping_included: shipping_included !== undefined ? (shipping_included === 'true' || shipping_included === true) : productRequest.shipping_included
      });

      res.status(200).json({
        status: 'success',
        message: 'Product request updated successfully',
        data: {
          productRequest
        }
      });
    } catch (error) {
      console.error('Error updating product request:', error);
      next(new AppError('Failed to update product request', 500));
    }
  },

  /**
   * Cancel a product request (only if status is still pending)
   * @route DELETE /api/product-requests/:id
   */
  async cancelProductRequest(req, res, next) {
    try {
      const { id } = req.params;
      const vendorId = req.user.id;
      
      // Find the product request
      const productRequest = await ProductRequest.findOne({
        where: { 
          id,
          vendor_id: vendorId
        }
      });

      if (!productRequest) {
        return next(new AppError('Product request not found', 404));
      }

      // Only allow cancellation if status is still pending
      if (productRequest.status !== 'pending') {
        return next(new AppError('Cannot cancel product request that has been processed by admin', 400));
      }

      // Delete the product request
      await productRequest.destroy();

      res.status(200).json({
        status: 'success',
        message: 'Product request cancelled successfully'
      });
    } catch (error) {
      console.error('Error cancelling product request:', error);
      next(new AppError('Failed to cancel product request', 500));
    }
  }
};

module.exports = productRequestController;
