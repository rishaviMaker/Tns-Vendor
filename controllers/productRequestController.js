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
          name, price, sale_price, quantity, shipping_charges, shipping_included,
          // Optional extended fields
          description, content, sku, order,
          allow_checkout_when_out_of_stock, with_storehouse_management, is_featured,
          brand_id, is_variation, sale_type, start_date, end_date,
          length, wide, height, weight, tax_id, views, stock_status, store_id,
          created_by_id, created_by_type, approved_by, image, category, sub_category,
          videos, purchase_price, hsn_sac_code, applicable_tax, unit, is_quotable
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
        //   where: { id: store_id, customer_id: req.user.id }
        // });

        // if (!store) {
        //   return next(new AppError('Store not found or does not belong to this vendor', 404));
        // }

        // Helpers
        const toBool = (v) => v === true || v === 'true' || v === 1 || v === '1';
        const parseList = (val) => {
          if (!val) return [];
          if (Array.isArray(val)) return val;
          try { return JSON.parse(val); } catch (_) {
            if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
            return [];
          }
        };

        // Merge images from body (if any) and uploaded files
        let imageUrls = parseList(req.body.images);
        if (req.files && req.files.length > 0) {
          const uploaded = req.files.map(file => `/uploads/product-requests/${file.filename}`);
          imageUrls = [...imageUrls, ...uploaded];
        }

        // Parse videos list if provided
        const videosParsed = parseList(videos);

        // Create product request
        const productRequest = await ProductRequest.create({
          vendor_id: req.user.id,
          // store_id,
          name,
          price,
          sale_price: sale_price || null,
          quantity,
          shipping_charges: shipping_charges || 0,
          shipping_included: toBool(shipping_included),
          images: imageUrls,
          status: 'pending',
          // Extended optional fields (only set if provided)
          description, content, sku, order,
          allow_checkout_when_out_of_stock: allow_checkout_when_out_of_stock !== undefined ? toBool(allow_checkout_when_out_of_stock) : undefined,
          with_storehouse_management: with_storehouse_management !== undefined ? toBool(with_storehouse_management) : undefined,
          is_featured: is_featured !== undefined ? toBool(is_featured) : undefined,
          brand_id, is_variation: is_variation !== undefined ? toBool(is_variation) : undefined,
          sale_type, start_date, end_date,
          length, wide, height, weight, tax_id, views, stock_status, store_id,
          created_by_id, created_by_type, approved_by, image, category, sub_category,
          videos: videosParsed.length ? videosParsed : undefined,
          purchase_price, hsn_sac_code, applicable_tax, unit,
          is_quotable: is_quotable !== undefined ? toBool(is_quotable) : undefined
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
        name, price, sale_price, quantity, shipping_charges, shipping_included,
        description, content, sku, order,
        allow_checkout_when_out_of_stock, with_storehouse_management, is_featured,
        brand_id, is_variation, sale_type, start_date, end_date,
        length, wide, height, weight, tax_id, views, stock_status, store_id,
        created_by_id, created_by_type, approved_by, image, category, sub_category,
        videos, purchase_price, hsn_sac_code, applicable_tax, unit, is_quotable, images
      } = req.body;

      // Helpers
      const toBool = (v) => v === true || v === 'true' || v === 1 || v === '1';
      const parseList = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        try { return JSON.parse(val); } catch (_) {
          if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
          return [];
        }
      };

      // Update the product request
      await productRequest.update({
        name: name || productRequest.name,
        price: price !== undefined ? price : productRequest.price,
        sale_price: sale_price !== undefined ? sale_price : productRequest.sale_price,
        quantity: quantity !== undefined ? quantity : productRequest.quantity,
        shipping_charges: shipping_charges !== undefined ? shipping_charges : productRequest.shipping_charges,
        shipping_included: shipping_included !== undefined ? toBool(shipping_included) : productRequest.shipping_included,
        // Extended optional fields
        description: description !== undefined ? description : productRequest.description,
        content: content !== undefined ? content : productRequest.content,
        sku: sku !== undefined ? sku : productRequest.sku,
        order: order !== undefined ? order : productRequest.order,
        allow_checkout_when_out_of_stock: allow_checkout_when_out_of_stock !== undefined ? toBool(allow_checkout_when_out_of_stock) : productRequest.allow_checkout_when_out_of_stock,
        with_storehouse_management: with_storehouse_management !== undefined ? toBool(with_storehouse_management) : productRequest.with_storehouse_management,
        is_featured: is_featured !== undefined ? toBool(is_featured) : productRequest.is_featured,
        brand_id: brand_id !== undefined ? brand_id : productRequest.brand_id,
        is_variation: is_variation !== undefined ? toBool(is_variation) : productRequest.is_variation,
        sale_type: sale_type !== undefined ? sale_type : productRequest.sale_type,
        start_date: start_date !== undefined ? start_date : productRequest.start_date,
        end_date: end_date !== undefined ? end_date : productRequest.end_date,
        length: length !== undefined ? length : productRequest.length,
        wide: wide !== undefined ? wide : productRequest.wide,
        height: height !== undefined ? height : productRequest.height,
        weight: weight !== undefined ? weight : productRequest.weight,
        tax_id: tax_id !== undefined ? tax_id : productRequest.tax_id,
        views: views !== undefined ? views : productRequest.views,
        stock_status: stock_status !== undefined ? stock_status : productRequest.stock_status,
        store_id: store_id !== undefined ? store_id : productRequest.store_id,
        created_by_id: created_by_id !== undefined ? created_by_id : productRequest.created_by_id,
        created_by_type: created_by_type !== undefined ? created_by_type : productRequest.created_by_type,
        approved_by: approved_by !== undefined ? approved_by : productRequest.approved_by,
        image: image !== undefined ? image : productRequest.image,
        category: category !== undefined ? category : productRequest.category,
        sub_category: sub_category !== undefined ? sub_category : productRequest.sub_category,
        videos: videos !== undefined ? parseList(videos) : productRequest.videos,
        purchase_price: purchase_price !== undefined ? purchase_price : productRequest.purchase_price,
        hsn_sac_code: hsn_sac_code !== undefined ? hsn_sac_code : productRequest.hsn_sac_code,
        applicable_tax: applicable_tax !== undefined ? applicable_tax : productRequest.applicable_tax,
        unit: unit !== undefined ? unit : productRequest.unit,
        is_quotable: is_quotable !== undefined ? toBool(is_quotable) : productRequest.is_quotable,
        images: images !== undefined ? parseList(images) : productRequest.images
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
