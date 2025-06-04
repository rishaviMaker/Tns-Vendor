const { Order } = require('../models/Order');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { sequelize } = require('../config/db');

/**
 * Get all orders for a specific store
 * @route GET /api/orders/store/:storeId
 * @access Private
 */
exports.getOrdersByStoreId = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    
    // Validate storeId
    if (!storeId || isNaN(parseInt(storeId))) {
      return next(new AppError('Valid store ID is required', 400));
    }
    
    const storeIdNum = parseInt(storeId, 10);
    console.log(`Querying orders for store_id: ${storeIdNum} (type: ${typeof storeIdNum})`);
    
    // Try with a direct SQL query first to verify database connectivity
    try {
      const [rawOrders] = await sequelize.query(
        `SELECT * FROM ec_orders WHERE store_id = ${storeIdNum} ORDER BY created_at DESC LIMIT 50`
      );
      console.log(`Raw SQL query found ${rawOrders.length} orders`);
      
      // Now try with the ORM
      const orders = await Order.findAll({
        where: { store_id: storeIdNum },
        order: [['created_at', 'DESC']],
        limit: 50
      });
      
      console.log(`Sequelize ORM found ${orders.length} orders`);
      
      // Return the formatted response
      return res.status(200).json({
        status: 'success',
        results: orders.length,
        data: {
          orders
        }
      });
    } catch (sqlError) {
      console.error('SQL query error:', sqlError);
      
      // Fallback - try with Sequelize findAll without any filters first
      try {
        const allOrders = await Order.findAll({
          limit: 100,
          order: [['created_at', 'DESC']]
        });
        
        console.log(`Found ${allOrders.length} total orders in database`);
        
        // Manually filter by store_id
        const filteredOrders = allOrders.filter(order => {
          console.log(`Order ${order.id} has store_id: ${order.store_id}`);
          return order.store_id === storeIdNum;
        });
        
        console.log(`Filtered to ${filteredOrders.length} orders for store ${storeIdNum}`);
        
        return res.status(200).json({
          status: 'success',
          results: filteredOrders.length,
          data: {
            orders: filteredOrders
          }
        });
      } catch (fallbackError) {
        console.error('Fallback query error:', fallbackError);
        return next(new AppError(`Database query error: ${fallbackError.message}`, 500));
      }
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    return next(new AppError(`Database error: ${error.message}`, 500));
  }
};

/**
 * Get comprehensive order details by ID
 * @route GET /api/orders/:id
 * @access Private
 */
exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Get the vendor ID from the authenticated request for customer_id matching
    const vendorId = req.user ? req.user.id : null;
    
    console.log(`Fetching order details for order ID: ${id}, vendor ID: ${vendorId}`);
    
    // Import models here to avoid circular dependencies
    const { User } = require('../models/User');
    const { OrderAddress } = require('../models/OrderAddress');
    const { Shipment } = require('../models/Shipment');
    const { Payment } = require('../models/Payment');
    const { OrderProduct } = require('../models/OrderProduct');
    const { Product } = require('../models/Product');
    
    // First try to find the basic order
    const basicOrder = await Order.findByPk(id);
    
    if (!basicOrder) {
      return next(new AppError('Order not found', 404));
    }
    
    console.log(`Found base order with ID: ${id}`);
    
    // Get related data in separate queries to avoid join issues
    try {
      // 1. Get user data - adjust attributes to match actual database structure
      const user = await User.findByPk(basicOrder.user_id, {
        attributes: ['id', 'first_name', 'last_name', 'username', 'email', 'avatar_id', 'created_at']
      });
      console.log(`User data ${user ? 'found' : 'not found'} for user_id: ${basicOrder.user_id}`);
      
      // 2. Get address data
      const address = await OrderAddress.findOne({ where: { order_id: id } });
      console.log(`Address data ${address ? 'found' : 'not found'} for order_id: ${id}`);
      
      // 3. Get shipment data
      const shipments = await Shipment.findAll({ where: { order_id: id } });
      console.log(`Found ${shipments.length} shipments for order_id: ${id}`);
      
      // 4. Get payment data - Try to find payment by both payment_id and by order_id directly
      let payment = null;
      if (basicOrder.payment_id) {
        // First try to get payment by payment_id from order
        payment = await Payment.findByPk(basicOrder.payment_id);
        console.log(`Payment data ${payment ? 'found' : 'not found'} for payment_id: ${basicOrder.payment_id}`);
      }
      
      // If no payment found by payment_id, try to find by order_id
      if (!payment) {
        payment = await Payment.findOne({ where: { order_id: id } });
        console.log(`Payment data ${payment ? 'found' : 'not found'} for order_id: ${id}`);
      }
      
      // 5. Get any vendor-related payments (where customer_id matches vendor_id)
      let vendorPayments = [];
      if (vendorId) {
        vendorPayments = await Payment.findAll({ 
          where: { 
            customer_id: vendorId,
            customer_type: "Botble\\Ecommerce\\Models\\Customer" // Filter by the customer type shown in the image
          }
        });
        console.log(`Found ${vendorPayments.length} vendor payments where customer_id = ${vendorId}`);
      }
      
      // 6. Get order products
      const orderProducts = await OrderProduct.findAll({ 
        where: { order_id: id }
      });
      console.log(`Found ${orderProducts.length} order products for order_id: ${id}`);
      
      // 7. Fetch detailed product info for each order product
      let enrichedProducts = [];
      if (orderProducts.length > 0) {
        // Extract all product IDs
        const productIds = orderProducts.map(op => op.product_id);
        
        // Fetch all products in a single query for efficiency
        const products = await Product.findAll({
          where: { id: productIds },
          attributes: ['id', 'name', 'description', 'sku', 'images', 'image', 'price', 'sale_price', 'stock_status', 'quantity']
        });
        
        // Create a map of products for easy lookup
        const productMap = {};
        products.forEach(product => {
          productMap[product.id] = product;
        });
        
        // Combine order product data with full product details
        enrichedProducts = orderProducts.map(orderProduct => {
          const productDetail = productMap[orderProduct.product_id] || null;
          const productData = orderProduct.toJSON();
          
          // Format decimal fields
          productData.price = parseFloat(productData.price);
          if (productData.tax_amount) productData.tax_amount = parseFloat(productData.tax_amount);
          
          // Add additional product details if available
          if (productDetail) {
            const additionalDetails = productDetail.toJSON();
            // Don't duplicate fields that already exist in orderProduct
            delete additionalDetails.id; // This would be the product_id
            
            // Format product prices
            if (additionalDetails.price) additionalDetails.price = parseFloat(additionalDetails.price);
            if (additionalDetails.sale_price) additionalDetails.sale_price = parseFloat(additionalDetails.sale_price);
            
            // Parse images if stored as JSON string
            if (typeof additionalDetails.images === 'string') {
              try {
                additionalDetails.images = JSON.parse(additionalDetails.images);
              } catch (e) {
                console.log(`Could not parse images for product ${productDetail.id}:`, e.message);
              }
            }
            
            return {
              ...productData,
              product_detail: additionalDetails
            };
          }
          
          return productData;
        });
      }
      
      console.log(`Enriched ${enrichedProducts.length} order products with product details`);
      
      // Combine all data and format response
      const orderData = {
        ...basicOrder.toJSON(),
        // Add related data
        user: user ? user.toJSON() : null,
        address: address ? address.toJSON() : null,
        shipments: shipments.length > 0 ? shipments.map(shipment => shipment.toJSON()) : [],
        payment: payment ? payment.toJSON() : null,
        vendor_payments: vendorPayments.length > 0 ? vendorPayments.map(p => p.toJSON()) : [],
        products: enrichedProducts, // Add the enriched products to the response
        // Ensure correct data types for decimal fields
        amount: parseFloat(basicOrder.amount),
        tax_amount: basicOrder.tax_amount ? parseFloat(basicOrder.tax_amount) : null,
        shipping_amount: basicOrder.shipping_amount ? parseFloat(basicOrder.shipping_amount) : null,
        discount_amount: basicOrder.discount_amount ? parseFloat(basicOrder.discount_amount) : null,
        sub_total: parseFloat(basicOrder.sub_total)
      };
      
      // Format shipment decimals if they exist
      if (orderData.shipments && orderData.shipments.length > 0) {
        orderData.shipments = orderData.shipments.map(shipment => ({
          ...shipment,
          price: shipment.price ? parseFloat(shipment.price) : null,
          cod_amount: shipment.cod_amount ? parseFloat(shipment.cod_amount) : null
        }));
      }
      
      // Format payment decimals if they exist
      if (orderData.payment) {
        orderData.payment.amount = parseFloat(orderData.payment.amount);
        if (orderData.payment.refunded_amount) {
          orderData.payment.refunded_amount = parseFloat(orderData.payment.refunded_amount);
        }
      }
      
      // Format vendor payment decimals if they exist
      if (orderData.vendor_payments && orderData.vendor_payments.length > 0) {
        orderData.vendor_payments = orderData.vendor_payments.map(payment => ({
          ...payment,
          amount: parseFloat(payment.amount),
          refunded_amount: payment.refunded_amount ? parseFloat(payment.refunded_amount) : null
        }));
      }
      
      return res.status(200).json({
        status: 'success',
        data: {
          order: orderData
        }
      });
    } catch (dataError) {
      console.error('Error fetching related data:', dataError);
      console.error(dataError.stack); // Add detailed stack trace for debugging
      return next(new AppError(`Error fetching related data: ${dataError.message}`, 500));
    }
  } catch (error) {
    console.error('Error in getOrderById:', error);
    console.error(error.stack); // Add detailed stack trace for debugging
    return next(new AppError(`Database error: ${error.message}`, 500));
  }
};

/**
 * Update order status and mark as confirmed
 * @route PATCH /api/orders/:id/status
 * @access Private
 */
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate required fields
    if (!status) {
      return next(new AppError('Order status is required', 400));
    }
    
    // Find the order
    const order = await Order.findByPk(id);
    if (!order) {
      return next(new AppError('Order not found', 404));
    }
    
    // Get current values for logging
    const previousStatus = order.status;
    const wasConfirmed = order.is_confirmed;
    
    console.log(`Updating order ${id} status from ${previousStatus} to ${status}`);
    console.log(`Setting is_confirmed to true (was: ${wasConfirmed})`);
    
    // Update only the specified fields
    const updatedOrder = await order.update({
      status: status,
      is_confirmed: true
    });
    
    // Send notification about order status change
    try {
      // If we have notification services set up, use them
      if (order.store_id) {
        const eventNotificationService = require('../services/eventNotificationService');
        await eventNotificationService.notifyOrderStatusChanged(
          updatedOrder,
          order.store_id,
          previousStatus,
          status
        );
      }
    } catch (notificationError) {
      console.error('Error sending order status notification:', notificationError);
      // Continue with the response even if notification fails
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Order status updated successfully',
      data: {
        order: updatedOrder
      }
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return next(new AppError(`Error updating order status: ${error.message}`, 500));
  }
};
