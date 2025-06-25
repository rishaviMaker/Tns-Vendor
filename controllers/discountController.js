const { Discount } = require('../models/Discount');
const { Product } = require('../models/Product');
const { Store } = require('../models/Store');
const AppError = require('../utils/AppError');

/**
 * Get all coupons for a vendor's store
 * @route GET /api/coupons
 * @access Private
 */
exports.getCoupons = async (req, res, next) => {
  try {
    const vendorId = req.user.id;
    
    // Find the store associated with this vendor
    const store = await Store.findOne({
      where: { customer_id: vendorId }
    });

    if (!store) {
      return next(new AppError('Vendor has no associated store', 400));
    }
    
    const storeId = store.id;

    // Now that we've confirmed the new columns exist in the database,
    // we can include them in our query
    const coupons = await Discount.findAll({
      where: { store_id: storeId },
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({
      status: 'success',
      results: coupons.length,
      data: {
        coupons
      }
    });
  } catch (error) {
    console.error('Error in getCoupons:', error);
    return next(new AppError(`Error fetching coupons: ${error.message}`, 500));
  }
};

/**
 * Get a specific coupon by ID
 * @route GET /api/coupons/:id
 * @access Private
 */
exports.getCouponById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;
    
    // Find the store associated with this vendor
    const store = await Store.findOne({
      where: { customer_id: vendorId }
    });

    if (!store) {
      return next(new AppError('Vendor has no associated store', 400));
    }
    
    const storeId = store.id;

    // Now that we've confirmed the new columns exist in the database,
    // we can include them in our query
    const coupon = await Discount.findOne({
      where: { 
        id,
        store_id: storeId
      }
    });

    if (!coupon) {
      return next(new AppError('Coupon not found or does not belong to your store', 404));
    }

    return res.status(200).json({
      status: 'success',
      data: {
        coupon
      }
    });
  } catch (error) {
    console.error('Error in getCouponById:', error);
    return next(new AppError(`Error fetching coupon: ${error.message}`, 500));
  }
};

/**
 * Generate a unique coupon code
 * @route GET /api/coupons/generate-code
 * @access Private
 */
exports.generateCouponCode = async (req, res, next) => {
  try {
    // Generate a random code with 8 characters (alphanumeric)
    const generateRandomCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    // Try to generate a unique code (not already in database)
    let code;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10; // Prevent infinite loop

    while (!isUnique && attempts < maxAttempts) {
      code = generateRandomCode();
      // Check if code exists in database
      const existingCoupon = await Discount.findOne({ where: { code } });
      if (!existingCoupon) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return next(new AppError('Unable to generate a unique coupon code, please try again', 500));
    }

    return res.status(200).json({
      status: 'success',
      data: {
        code
      }
    });
  } catch (error) {
    console.error('Error in generateCouponCode:', error);
    return next(new AppError(`Error generating coupon code: ${error.message}`, 500));
  }
};

/**
 * Create a new coupon
 * @route POST /api/coupons
 * @access Private
 */
exports.createCoupon = async (req, res, next) => {
  try {
    const vendorId = req.user.id;
    
    // Find the store associated with this vendor
    const store = await Store.findOne({
      where: { customer_id: vendorId }
    });

    if (!store) {
      return next(new AppError('Vendor has no associated store', 400));
    }
    
    const storeId = store.id;

    const {
      title,
      code,
      discount_type, // 'percentage', 'amount', or 'shipping'
      value,
      quantity,
      start_date,
      end_date,
      can_use_with_promotion,
      product_scope, // 'all_products', 'specific_product', 'product_collections', 'categories', 'subcategories'
      product_quantity,
      target_products, // For specific products or collections
      target_categories, // For category-specific discounts
      target_subcategories, // For subcategory-specific discounts
      min_order_price,
      never_expire, // Boolean to indicate if coupon never expires
      unlimited_used // Boolean to indicate if coupon can be used unlimited times
    } = req.body;

    // Validate required fields
    if (!code || !discount_type || !value) {
      return next(new AppError('Please provide coupon code, discount type, and value', 400));
    }

    // Validate discount type
    if (!['percentage', 'amount', 'shipping'].includes(discount_type)) {
      return next(new AppError('Invalid discount type. Must be percentage, amount, or shipping', 400));
    }

    // Additional validations for percentage type
    if (discount_type === 'percentage' && (value <= 0 || value > 100)) {
      return next(new AppError('Percentage discount value must be between 1 and 100', 400));
    }

    // Check if coupon code already exists
    const existingCoupon = await Discount.findOne({ where: { code } });
    if (existingCoupon) {
      return next(new AppError('Coupon code already exists. Please use a different code', 400));
    }

    // Determine the target value based on product scope
    let targetValue = 'all-orders'; // Default for all products
    let categoriesValue = null;
    let subcategoriesValue = null;
    
    if (product_scope === 'specific_product' && target_products) {
      try {
        const productIds = Array.isArray(target_products) ? target_products : JSON.parse(target_products);
        
        // Verify the products exist and belong to the store
        if (productIds.length > 0) {
          const productsCount = await Product.count({
            where: {
              id: productIds,
              store_id: storeId
            }
          });

          if (productsCount !== productIds.length) {
            return next(new AppError('One or more selected products do not exist or do not belong to your store', 400));
          }
          
          // Set target as JSON string of product IDs
          targetValue = JSON.stringify(productIds);
        }
      } catch (error) {
        return next(new AppError('Invalid target products format. Must be a valid array of product IDs', 400));
      }
    } else if (product_scope === 'categories' && target_categories) {
      try {
        const categoryIds = Array.isArray(target_categories) ? target_categories : JSON.parse(target_categories);
        if (categoryIds.length > 0) {
          // Store category IDs as a JSON string
          categoriesValue = JSON.stringify(categoryIds);
        }
      } catch (error) {
        return next(new AppError('Invalid target categories format. Must be a valid array of category IDs', 400));
      }
    } else if (product_scope === 'subcategories' && target_subcategories) {
      try {
        const subcategoryIds = Array.isArray(target_subcategories) ? target_subcategories : JSON.parse(target_subcategories);
        if (subcategoryIds.length > 0) {
          // Store subcategory IDs as a JSON string
          subcategoriesValue = JSON.stringify(subcategoryIds);
        }
      } catch (error) {
        return next(new AppError('Invalid target subcategories format. Must be a valid array of subcategory IDs', 400));
      }
    }

    // Handle never_expire and unlimited_used fields
    const effectiveEndDate = never_expire ? null : (end_date || null);
    const effectiveQuantity = unlimited_used ? null : (quantity || null);
    
    // Determine discount_on value based on product_scope
    let discountOn = 'all-orders';
    if (product_scope === 'specific_product') {
      discountOn = 'product';
    } else if (product_scope === 'categories') {
      discountOn = 'categories';
    } else if (product_scope === 'subcategories') {
      discountOn = 'subcategories';
    }

    // Create the coupon - using the actual database structure we discovered
    const newCoupon = await Discount.create({
      title: title || `${discount_type.toUpperCase()} Discount: ${code}`,
      code,
      type: 'coupon', // This is fixed as 'coupon' in the database
      type_option: discount_type, // 'percentage', 'amount', or 'shipping' goes here
      value,
      quantity: effectiveQuantity,
      start_date: start_date || new Date(),
      end_date: effectiveEndDate,
      total_used: 0,
      can_use_with_promotion: can_use_with_promotion || false,
      discount_on: discountOn,
      product_quantity: product_quantity || 1,
      target: targetValue,
      min_order_price: min_order_price || null,
      // New fields
      never_expire: never_expire || false,
      unlimited_used: unlimited_used || false,
      categories: categoriesValue,
      subcategories: subcategoriesValue,
      store_id: storeId,
      created_at: new Date(),
      updated_at: new Date()
    });

    return res.status(201).json({
      status: 'success',
      data: {
        coupon: newCoupon
      }
    });
  } catch (error) {
    console.error('Error in createCoupon:', error);
    return next(new AppError(`Error creating coupon: ${error.message}`, 500));
  }
};

/**
 * Update a coupon
 * @route PATCH /api/coupons/:id
 * @access Private
 */
exports.updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;
    
    // Find the store associated with this vendor
    const store = await Store.findOne({
      where: { customer_id: vendorId }
    });

    if (!store) {
      return next(new AppError('Vendor has no associated store', 400));
    }
    
    const storeId = store.id;

    // Check if the coupon exists and belongs to the vendor's store
    const coupon = await Discount.findOne({
      where: { 
        id,
        store_id: storeId
      }
    });

    if (!coupon) {
      return next(new AppError('Coupon not found or does not belong to your store', 404));
    }

    const {
      title,
      code,
      discount_type, // 'percentage', 'amount', or 'shipping'
      value,
      quantity,
      start_date,
      end_date,
      can_use_with_promotion,
      product_scope, // 'all_products', 'specific_product', 'product_collections', 'categories', 'subcategories'
      product_quantity,
      target_products, // Target product IDs as array
      target_categories, // For category-specific discounts
      target_subcategories, // For subcategory-specific discounts
      min_order_price,
      never_expire, // Boolean to indicate if coupon never expires
      unlimited_used // Boolean to indicate if coupon can be used unlimited times
    } = req.body;

    // If updating code, check it doesn't conflict
    if (code && code !== coupon.code) {
      const existingCoupon = await Discount.findOne({ where: { code } });
      if (existingCoupon) {
        return next(new AppError('Coupon code already exists. Please use a different code', 400));
      }
    }

    // Validate discount type if provided
    if (discount_type && !['percentage', 'amount', 'shipping'].includes(discount_type)) {
      return next(new AppError('Invalid discount type. Must be percentage, amount, or shipping', 400));
    }

    // Validate percentage value if updating to percentage type
    if ((discount_type === 'percentage' || (!discount_type && coupon.type_option === 'percentage')) && value !== undefined) {
      if (value <= 0 || value > 100) {
        return next(new AppError('Percentage discount value must be between 1 and 100', 400));
      }
    }

    // Process target products if provided
    let targetValue = coupon.target; // Keep current value by default
    let categoriesValue = coupon.categories; // Keep current value by default
    let subcategoriesValue = coupon.subcategories; // Keep current value by default
    
    if (product_scope === 'specific_product' && target_products) {
      try {
        const productIds = Array.isArray(target_products) ? target_products : JSON.parse(target_products);
        
        // Verify the products exist and belong to the store
        if (productIds.length > 0) {
          const productsCount = await Product.count({
            where: {
              id: productIds,
              store_id: storeId
            }
          });

          if (productsCount !== productIds.length) {
            return next(new AppError('One or more selected products do not exist or do not belong to your store', 400));
          }
          
          // Set target as JSON string of product IDs
          targetValue = JSON.stringify(productIds);
        }
      } catch (error) {
        return next(new AppError('Invalid target products format. Must be a valid array of product IDs', 400));
      }
    } else if (product_scope === 'categories' && target_categories) {
      try {
        const categoryIds = Array.isArray(target_categories) ? target_categories : JSON.parse(target_categories);
        if (categoryIds.length > 0) {
          // Store category IDs as a JSON string
          categoriesValue = JSON.stringify(categoryIds);
        }
      } catch (error) {
        return next(new AppError('Invalid target categories format. Must be a valid array of category IDs', 400));
      }
    } else if (product_scope === 'subcategories' && target_subcategories) {
      try {
        const subcategoryIds = Array.isArray(target_subcategories) ? target_subcategories : JSON.parse(target_subcategories);
        if (subcategoryIds.length > 0) {
          // Store subcategory IDs as a JSON string
          subcategoriesValue = JSON.stringify(subcategoryIds);
        }
      } catch (error) {
        return next(new AppError('Invalid target subcategories format. Must be a valid array of subcategory IDs', 400));
      }
    } else if (product_scope === 'all_products') {
      targetValue = 'all-orders';
    }

    // Handle never_expire and unlimited_used fields
    // If never_expire is true, set end_date to null
    let effectiveEndDate = end_date;
    if (never_expire !== undefined && never_expire) {
      effectiveEndDate = null;
    } else if (never_expire !== undefined && !never_expire && !end_date) {
      // If never_expire is being turned off but no end_date provided, use a default
      const defaultEndDate = new Date();
      defaultEndDate.setMonth(defaultEndDate.getMonth() + 1); // Default 1 month from now
      effectiveEndDate = defaultEndDate;
    }
    
    // If unlimited_used is true, set quantity to null
    let effectiveQuantity = quantity;
    if (unlimited_used !== undefined && unlimited_used) {
      effectiveQuantity = null;
    }
    
    // Determine discount_on value based on product_scope
    let discountOn;
    if (product_scope) {
      if (product_scope === 'specific_product') {
        discountOn = 'product';
      } else if (product_scope === 'categories') {
        discountOn = 'categories';
      } else if (product_scope === 'subcategories') {
        discountOn = 'subcategories';
      } else if (product_scope === 'all_products') {
        discountOn = 'all-orders';
      }
    }

    // Update the coupon
    const updatedFields = {
      ...(title !== undefined && { title }),
      ...(code && { code }),
      ...(discount_type && { type_option: discount_type }), // Update type_option field with discount_type
      ...(value !== undefined && { value }),
      ...(effectiveQuantity !== undefined && { quantity: effectiveQuantity }),
      ...(start_date && { start_date }),
      ...(effectiveEndDate !== undefined && { end_date: effectiveEndDate }),
      ...(can_use_with_promotion !== undefined && { can_use_with_promotion }),
      ...(discountOn && { discount_on: discountOn }),
      ...(product_quantity !== undefined && { product_quantity }),
      ...(targetValue !== coupon.target && { target: targetValue }),
      ...(categoriesValue !== coupon.categories && { categories: categoriesValue }),
      ...(subcategoriesValue !== coupon.subcategories && { subcategories: subcategoriesValue }),
      ...(min_order_price !== undefined && { min_order_price }),
      ...(never_expire !== undefined && { never_expire }),
      ...(unlimited_used !== undefined && { unlimited_used }),
      updated_at: new Date()
    };

    await coupon.update(updatedFields);

    // Fetch the updated coupon
    const updatedCoupon = await Discount.findByPk(id);

    return res.status(200).json({
      status: 'success',
      data: {
        coupon: updatedCoupon
      }
    });
  } catch (error) {
    console.error('Error in updateCoupon:', error);
    return next(new AppError(`Error updating coupon: ${error.message}`, 500));
  }
};

/**
 * Delete a coupon
 * @route DELETE /api/coupons/:id
 * @access Private
 */
exports.deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;
    
    // Find the store associated with this vendor
    const store = await Store.findOne({
      where: { customer_id: vendorId }
    });

    if (!store) {
      return next(new AppError('Vendor has no associated store', 400));
    }
    
    const storeId = store.id;

    // Check if the coupon exists and belongs to the vendor's store
    const coupon = await Discount.findOne({
      where: { 
        id,
        store_id: storeId
      }
    });

    if (!coupon) {
      return next(new AppError('Coupon not found or does not belong to your store', 404));
    }

    // Delete the coupon
    await coupon.destroy();

    return res.status(200).json({
      status: 'success',
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteCoupon:', error);
    return next(new AppError(`Error deleting coupon: ${error.message}`, 500));
  }
};
