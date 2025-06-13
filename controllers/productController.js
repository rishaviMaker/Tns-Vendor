const { Product } = require('../models/Product');
const { Store } = require('../models/Store');
const { ProductRequest } = require('../models/ProductRequest');
const productSearchService = require('../services/productSearchService');
const AppError = require('../utils/AppError');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage for product files (images and videos)
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Create the directory if it doesn't exist
    const uploadPath = 'public/uploads/products';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    // Generate unique filename with appropriate file type indicator
    const fileType = file.mimetype.startsWith('video/') ? 'video' : 'image';
    cb(null, `product-${fileType}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// File filter for product files (images and videos)
const fileFilter = (req, file, cb) => {
  // Accept images and videos
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|mp4|webm|mov|avi)$/)) {
    return cb(new Error('Only image and video files are allowed!'), false);
  }
  cb(null, true);
};

// Create upload middleware
exports.upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max file size to accommodate videos
}).fields([
  { name: 'image', maxCount: 1 }, // Primary product image
  { name: 'images', maxCount: 5 }, // Additional product images
  { name: 'videos', maxCount: 2 } // Product videos
]);

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
 * Create a new product
 * @route POST /api/products
 * @access Private (Vendor only)
 * 
 * Accepts multipart/form-data with:
 * - image: Primary product image (single file)
 * - images: Additional product images (up to 5)
 * - videos: Product videos (up to 2)
 * 
 * Body parameters:
 * - catalog_product_id: ID of the product from central catalog
 * - price: Vendor selling price (MRP)
 * - sale_price: Discounted price (optional)
 * - quantity: Stock quantity
 * - shipping_charges: Shipping charges in INR (optional, default: 0)
 * - shipping_included: Whether shipping is included in price (optional, default: false)
 * - status: Product status (optional, default: 'pending')
 */
exports.createProduct = async (req, res, next) => {
  try {
    const {
      catalog_product_id, // New field to reference the selected product from ec_products
      price, // MRP
      sale_price, // Discounted price
      quantity,
      shipping_charges, // Shipping charges in INR
      shipping_included, // Whether shipping cost is included in price
      status = 'pending' // Default status is pending
    } = req.body;
    
    // Get vendor ID from authenticated user
    const vendorId = req.user.id;
    
    // Find store associated with this vendor
    const store = await Store.findOne({ where: { customerId: vendorId } });
    
    if (!store) {
      return next(new AppError('No store found for this vendor. Please create a store first.', 404));
    }
    
    // Check if a catalog product ID was provided
    if (!catalog_product_id) {
      return next(new AppError('You must select a product from the catalog by providing catalog_product_id', 400));
    }
    
    // Log the catalog_product_id for debugging
    console.log(`Searching for catalog product with ID: ${catalog_product_id} (type: ${typeof catalog_product_id})`);
    
    // Ensure catalog_product_id is an integer
    const productId = parseInt(catalog_product_id, 10);
    
    // Fetch product details from the catalog
    let catalogProduct;
    try {
      // Include all the fields we need
      console.log(`Attempting to find product with ID: ${productId}`);
      catalogProduct = await Product.findByPk(productId, {
        attributes: [
          'id', 'name', 'description', 'content', 'status', 'images', 'sku',
          'order', 'quantity', 'price', 'sale_price', 'weight',
          'created_at', 'updated_at', 'image', 'category', 'sub_category',
          'videos', 'unit', 'brand_id', 'sale_type', 'length', 'wide', 'height',
           'tax_id', 'is_featured'
        ]
      });
      
      if (!catalogProduct) {
        console.log('Product not found with findByPk, trying findOne...');
        catalogProduct = await Product.findOne({
          where: { id: productId },
          attributes: safeAttributes
        });
      }
      
      if (!catalogProduct) {
        // Log a few available products for debugging
        const sampleProducts = await Product.findAll({ 
          limit: 5, 
          attributes: ['id', 'name']
        });
        console.log('Sample of available products:', JSON.stringify(sampleProducts));
        
        return next(new AppError(`Product with ID ${productId} not found in catalog`, 404));
      }
      
      console.log(`Found catalog product: ${catalogProduct.name} (ID: ${catalogProduct.id})`);
    } catch (error) {
      console.error('Error fetching catalog product:', error);
      return next(new AppError(`Failed to find product in catalog: ${error.message}`, 500));
    }
    
    // Basic validation
    if (!price || !quantity) {
      return next(new AppError('Price and quantity are required fields', 400));
    }
    
    // Create the new product using catalog product details and vendor-specific information
    // Now we can include all fields including shipping fields
    const productData = {
      name: catalogProduct.name,
      description: catalogProduct.description,
      content: catalogProduct.content,
      catalog_product_id: catalogProduct.id, // Store reference to catalog product
      price: parseFloat(price), // MRP
      sale_price: sale_price ? parseFloat(sale_price) : null, // Discounted price
      quantity: parseInt(quantity),
      sku: catalogProduct.sku,
      store_id: store.id,
      status,
      is_variation: false, // Not handling variations in this simplified flow
      category: catalogProduct.category,
      sub_category: catalogProduct.sub_category,
      brand_id: catalogProduct.brand_id,
      sale_type: catalogProduct.sale_type,
      length: catalogProduct.length,
      wide: catalogProduct.wide,
      height: catalogProduct.height,
      weight: catalogProduct.weight,
      
      tax_id: catalogProduct.tax_id,
      is_featured: catalogProduct.is_featured || false,
      unit: catalogProduct.unit,
      // Now we can include shipping fields directly
      shipping_charges: shipping_charges || 0,
      shipping_included: shipping_included === 'true' || shipping_included === true ? true : false,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    console.log('Creating product with shipping info:', { 
      shipping_charges: productData.shipping_charges, 
      shipping_included: productData.shipping_included 
    });
    
    let newProduct;
    
    try {
      console.log('Attempting to create product with data:', JSON.stringify(productData));
      newProduct = await Product.create(productData);
      console.log('Product created successfully with ID:', newProduct.id);
      
      // Handle file uploads
      if (req.file) {
        console.log('Processing primary image upload');
        await Product.update(
          { image: `/uploads/products/${req.file.filename}` },
          { where: { id: newProduct.id } }
        );
        newProduct.image = `/uploads/products/${req.file.filename}`;
      }
      
      // Handle multiple files (images and videos) if present
      if (req.files) {
        // Handle images
        if (req.files.images && req.files.images.length > 0) {
          console.log(`Processing ${req.files.images.length} additional images`);
          const images = req.files.images.map(file => `/uploads/products/${file.filename}`);
          await Product.update(
            { images: JSON.stringify(images) },
            { where: { id: newProduct.id } }
          );
          newProduct.images = JSON.stringify(images);
        }
        
        // Handle videos
        if (req.files.videos && req.files.videos.length > 0) {
          console.log(`Processing ${req.files.videos.length} videos`);
          const videos = req.files.videos.map(file => `/uploads/products/${file.filename}`);
          await Product.update(
            { videos: JSON.stringify(videos) },
            { where: { id: newProduct.id } }
          );
          newProduct.videos = JSON.stringify(videos);
        }
      }
      
      // Return success response
      return res.status(201).json({
        status: 'success',
        message: 'Product created successfully from catalog',
        data: {
          product: newProduct,
          catalog_source: {
            id: catalogProduct.id,
            name: catalogProduct.name,
            brand: catalogProduct.brand
          },
          shipping_info: {
            shipping_charges: newProduct.shipping_charges,
            shipping_included: newProduct.shipping_included
          } // Include shipping info from the saved product
        }
      });
    } catch (error) {
      console.error('Error during product creation process:', error);
      return next(new AppError(`Failed to create product: ${error.message}`, 500));
    }
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
    
    // Handle image uploads if present
    const mediaFiles = [];
    
    if (req.files) {
      // Handle main image
      if (req.files.image && req.files.image.length > 0) {
        product.image = `/uploads/products/${req.files.image[0].filename}`;
      }
      
      // Handle additional images
      if (req.files.images && req.files.images.length > 0) {
        const imageUrls = req.files.images.map(file => `/uploads/products/${file.filename}`);
        mediaFiles.push(...imageUrls.map(url => ({ type: 'image', url })));
      }
      
      // Handle videos
      if (req.files.videos && req.files.videos.length > 0) {
        const videoUrls = req.files.videos.map(file => `/uploads/products/${file.filename}`);
        mediaFiles.push(...videoUrls.map(url => ({ type: 'video', url })));
      }
      
      // Store all media files
      if (mediaFiles.length > 0) {
        product.media_files = JSON.stringify(mediaFiles);
      }
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
