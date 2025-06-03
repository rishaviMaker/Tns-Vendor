const { Product } = require('../models/Product');
const { Store } = require('../models/Store');
const multer = require('multer');
const path = require('path');

// Configure storage for product files (images and videos)
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    if (file.fieldname === 'videos') {
      cb(null, './uploads/products/videos/');
    } else {
      cb(null, './uploads/products/');
    }
  },
  filename: function(req, file, cb) {
    const prefix = file.fieldname === 'videos' ? 'video_' : 'product_';
    cb(null, prefix + Date.now() + '_' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

// File filter for product files (images and videos)
const fileFilter = (req, file, cb) => {
  // Accept image files for image/images fields
  if ((file.fieldname === 'image' || file.fieldname === 'images') && file.mimetype.startsWith('image/')) {
    cb(null, true);
  } 
  // Accept video files for videos field
  else if (file.fieldname === 'videos' && (
    file.mimetype.startsWith('video/') || 
    file.mimetype === 'application/mp4' ||
    file.mimetype === 'application/x-mpegURL'
  )) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file format for ${file.fieldname}. Please upload appropriate files only.`), false);
  }
};

exports.upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // Increased to 50MB limit for videos
});

/**
 * Get all products
 * @route GET /api/products
 * @access Public
 */
exports.getAllProducts = async (req, res, next) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    
    // Get vendor ID from authenticated user
    const vendorId = req.user.id;
    
    // Find store associated with this vendor
    const store = await Store.findOne({ where: { customerId: vendorId } });
    
    if (!store) {
      return res.status(404).json({
        status: 'fail',
        message: 'No store found for this vendor. Please create a store first.'
      });
    }
    
    const queryOptions = {
      where: { store_id: store.id }, // Filter by vendor's store only
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['created_at', 'DESC']]
    };
    
    const { count, rows: products } = await Product.findAndCountAll(queryOptions);
    
    res.status(200).json({
      status: 'success',
      results: products.length,
      total: count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        products
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get product by ID
 * @route GET /api/products/:id
 * @access Public
 */
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findByPk(id, {
      include: [{ model: Store, as: 'store' }]
    });
    
    if (!product) {
      return res.status(404).json({
        status: 'fail',
        message: 'Product not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        product
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get products by store ID
 * @route GET /api/products/store/:storeId
 * @access Public
 */
exports.getProductsByStore = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { limit = 10, page = 1 } = req.query;
    
    // Verify store exists
    const store = await Store.findByPk(storeId);
    if (!store) {
      return res.status(404).json({
        status: 'fail',
        message: 'Store not found'
      });
    }
    
    const { count, rows: products } = await Product.findAndCountAll({
      where: { store_id: storeId },
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['created_at', 'DESC']]
    });
    
    res.status(200).json({
      status: 'success',
      results: products.length,
      total: count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        store,
        products
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new product
 * @route POST /api/products
 * @access Private (Vendor only)
 */
exports.createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      content,
      status,
      sku,
      order,
      quantity,
      allow_checkout_when_out_of_stock,
      with_storehouse_management,
      is_featured,
      brand_id,
      is_variation,
      sale_type,
      price,
      sale_price,
      start_date,
      end_date,
      length,
      wide,
      height,
      weight,
      tax_id,
      stock_status,
      // Additional fields
      category,
      sub_category,
      videos,
      purchase_price,
      hsn_sac_code,
      applicable_tax,
      unit
    } = req.body;
    
    // Get vendor ID from authenticated user
    const vendorId = req.user.id;
    
    // Find store associated with this vendor
    const store = await Store.findOne({ where: { customerId: vendorId } });
    
    if (!store) {
      return res.status(404).json({
        status: 'fail',
        message: 'No store found for this vendor. Please create a store first.'
      });
    }
    
    // Use store.id as the store_id
    const store_id = store.id;
    
    // Handle image upload if present
    let image = null;
    if (req.file) {
      image = `/uploads/products/${req.file.filename}`;
    }
    
    // Handle multiple images and videos if present
    let images = [];
    let videoUrls = []; // Renamed to avoid conflict with videos from req.body
    
    if (req.files) {
      // When using multer.fields(), req.files is an object with fieldnames as keys
      // Each key contains an array of files
      
      // Handle images
      if (req.files.images && req.files.images.length > 0) {
        images = req.files.images.map(file => `/uploads/products/${file.filename}`);
        images = JSON.stringify(images);
      }
      
      // Handle videos
      if (req.files.videos && req.files.videos.length > 0) {
        videoUrls = req.files.videos.map(file => `/uploads/products/videos/${file.filename}`);
        videos = JSON.stringify(videoUrls); // Use the parsed videoUrls but assign to videos parameter from req.body
      }
    }
    
    // Create the product
    const newProduct = await Product.create({
      name,
      description,
      content,
      status: status || 'pending',
      images,
      sku,
      order,
      quantity,
      allow_checkout_when_out_of_stock,
      with_storehouse_management,
      is_featured,
      brand_id,
      is_variation,
      sale_type,
      price,
      sale_price,
      start_date,
      end_date,
      length,
      wide,
      height,
      weight,
      tax_id,
      views: 0,
      stock_status: stock_status || 'in_stock',
      store_id,
      created_by_id: vendorId, // Get directly from authenticated user
      created_by_type: 'Botble\\Marketplace\\Models\\Store',
      image,
      // Add the new fields
      category,
      sub_category,
      videos,
      purchase_price,
      hsn_sac_code,
      applicable_tax,
      unit,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        product: newProduct
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update product
 * @route PATCH /api/products/:id
 * @access Private (Vendor who created the product)
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        status: 'fail',
        message: 'Product not found'
      });
    }
    
    // Update fields that are provided
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        product[key] = req.body[key];
      }
    });
    
    // Handle image upload if present
    if (req.file) {
      product.image = `/uploads/products/${req.file.filename}`;
    }
    
    // Handle multiple files (images and videos) if present
    if (req.files) {
      // Handle images
      if (req.files.images && req.files.images.length > 0) {
        const newImages = req.files.images.map(file => `/uploads/products/${file.filename}`);
        
        // Merge with existing images if any
        let existingImages = [];
        try {
          if (product.images) {
            existingImages = JSON.parse(product.images);
          }
        } catch (e) {
          // If images is not a valid JSON, start fresh
          existingImages = [];
        }
        
        product.images = JSON.stringify([...existingImages, ...newImages]);
      }
      
      // Handle videos
      if (req.files.videos && req.files.videos.length > 0) {
        const newVideos = req.files.videos.map(file => `/uploads/products/videos/${file.filename}`);
        
        // Merge with existing videos if any
        let existingVideos = [];
        try {
          if (product.videos) {
            existingVideos = JSON.parse(product.videos);
          }
        } catch (e) {
          // If videos is not a valid JSON, start fresh
          existingVideos = [];
        }
        
        product.videos = JSON.stringify([...existingVideos, ...newVideos]);
      }
    }
    
    product.updated_at = new Date();
    await product.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        product
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete product
 * @route DELETE /api/products/:id
 * @access Private (Vendor who created the product)
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        status: 'fail',
        message: 'Product not found'
      });
    }
    
    await product.destroy();
    
    res.status(200).json({
      status: 'success',
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change product status
 * @route PATCH /api/products/:id/status
 * @access Private (Admin)
 */
exports.updateProductStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['published', 'pending', 'draft'].includes(status)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid status value. Must be one of: published, pending, draft'
      });
    }
    
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        status: 'fail',
        message: 'Product not found'
      });
    }
    
    product.status = status;
    product.updated_at = new Date();
    
    // If product is being published, set approved_by
    if (status === 'published') {
      product.approved_by = req.user ? req.user.id : null; // Assuming req.user contains the admin user data
    }
    
    await product.save();
    
    res.status(200).json({
      status: 'success',
      message: `Product status updated to ${status}`,
      data: {
        product
      }
    });
  } catch (error) {
    next(error);
  }
};
