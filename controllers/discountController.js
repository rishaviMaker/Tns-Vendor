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
      where: { customerId: vendorId }
    });

    if (!store) {
      return next(new AppError('Vendor has no associated store', 400));
    }
    
    const storeId = store.id;

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
      where: { customerId: vendorId }
    });

    if (!store) {
      return next(new AppError('Vendor has no associated store', 400));
    }
    
    const storeId = store.id;

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
      where: { customerId: vendorId }
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
      product_scope, // 'all_products', 'specific_product', 'product_collections'
      product_quantity,
      target_products, // For specific products or collections
      min_order_price
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
    }

    // Create the coupon - using the actual database structure we discovered
    const newCoupon = await Discount.create({
      title: title || `${discount_type.toUpperCase()} Discount: ${code}`,
      code,
      type: 'coupon', // This is fixed as 'coupon' in the database
      type_option: discount_type, // 'percentage', 'amount', or 'shipping' goes here
      value,
      quantity: quantity || null,
      start_date: start_date || new Date(),
      end_date: end_date || null,
      total_used: 0,
      can_use_with_promotion: can_use_with_promotion || false,
      discount_on: product_scope === 'specific_product' ? 'product' : 'all-orders',
      product_quantity: product_quantity || 1,
      target: targetValue,
      min_order_price: min_order_price || null,
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
      where: { customerId: vendorId }
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
      product_scope, // 'all_products', 'specific_product', 'product_collections'
      product_quantity,
      target_products, // Target product IDs as array
      min_order_price
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
    } else if (product_scope === 'all_products') {
      targetValue = 'all-orders';
    }

    // Update the coupon
    const updatedFields = {
      ...(title !== undefined && { title }),
      ...(code && { code }),
      ...(discount_type && { type_option: discount_type }), // Update type_option field with discount_type
      ...(value !== undefined && { value }),
      ...(quantity !== undefined && { quantity }),
      ...(start_date && { start_date }),
      ...(end_date && { end_date }),
      ...(can_use_with_promotion !== undefined && { can_use_with_promotion }),
      ...(product_scope && { discount_on: product_scope === 'specific_product' ? 'product' : 'all-orders' }),
      ...(product_quantity !== undefined && { product_quantity }),
      ...(targetValue !== coupon.target && { target: targetValue }),
      ...(min_order_price !== undefined && { min_order_price }),
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
      where: { customerId: vendorId }
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
