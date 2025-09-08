const { Order } = require("../models/Order");
const { Store } = require("../models/Store");
const AppError = require("../utils/AppError");
const { sequelize } = require("../config/db");
const { Op, fn, col, where } = require("sequelize");
const { Customer } = require("../models/");
const { Payment } = require("../models");
const { OrderProduct } = require("../models");
const { OrderAddress } = require("../models");
const { OrderHistory } = require("../models");

/**
 * Helper function to calculate payment summary for an order with its products
 * @param {Object} order - The order object
 * @param {Array} products - Array of order products with quantities and prices
 * @returns {Object} Payment summary object with product subtotal, tax details, fees, etc.
 */
const calculateOrderPaymentSummary = (order, products = []) => {
  // Calculate from products if available, otherwise use order values directly
  const productSubtotal =
    products.length > 0
      ? products.reduce(
          (sum, product) => sum + parseFloat(product.price) * product.qty,
          0
        )
      : parseFloat(order.sub_total || 0);

  const productTaxAmount =
    products.length > 0
      ? products.reduce((sum, product) => {
          const taxAmount = product.tax_amount
            ? parseFloat(product.tax_amount) * product.qty
            : 0;
          return sum + taxAmount;
        }, 0)
      : parseFloat(order.tax_amount || 0);

  // Calculate GST components
  const gstRate = 0.18; // 18% GST - adjust as needed
  const estimatedGST =
    productTaxAmount > 0 ? productTaxAmount : productSubtotal * gstRate;
  const sgstAmount = estimatedGST / 2;
  const cgstAmount = estimatedGST / 2;

  // Calculate fees
  const serviceFee = 0; // Add service fee calculation if applicable
  const platformFee = 0; // Add platform fee calculation if applicable
  const shippingFee = order.shipping_amount
    ? parseFloat(order.shipping_amount)
    : 0;

  // Calculate final totals
  const discountAmount = order.discount_amount
    ? parseFloat(order.discount_amount)
    : 0;
  const calculatedTotal =
    productSubtotal +
    productTaxAmount +
    shippingFee +
    serviceFee +
    platformFee -
    discountAmount;

  return {
    product_subtotal: parseFloat(productSubtotal.toFixed(2)),
    tax_details: {
      total_tax: parseFloat(productTaxAmount.toFixed(2)),
      gst: parseFloat(estimatedGST.toFixed(2)),
      sgst: parseFloat(sgstAmount.toFixed(2)),
      cgst: parseFloat(cgstAmount.toFixed(2)),
    },
    fees: {
      service_fee: serviceFee,
      platform_fee: platformFee,
      shipping_fee: shippingFee,
    },
    discount: discountAmount,
    grand_total: parseFloat(calculatedTotal.toFixed(2)),
    paid_amount: order.payment ? parseFloat(order.payment.amount || 0) : 0,
  };
};

/**
 * Get all orders for a specific store
 * @route GET /api/orders/store/:storeId
 * @access Private
 */
exports.getOrdersByStoreId = async (req, res, next) => {
  try {
    const { id } = req.user;
    const store = await Store.findOne({ where: { customer_id: id } });
    if (!store) {
      return next(new AppError("Store not found", 404));
    }
    const storeIdNum = parseInt(store.id, 10);

    try {
      const [rawOrders] = await sequelize.query(
        `SELECT * FROM ec_orders WHERE store_id = ${storeIdNum} ORDER BY created_at DESC LIMIT 50`
      );

      // Import models needed for detailed product information
      const { OrderProduct } = require("../models/OrderProduct");
      const { Product } = require("../models/Product");
      const { Payment } = require("../models/Payment");

      // Now try with the ORM
      const orders = await Order.findAll({
        where: { store_id: storeIdNum },
        order: [["created_at", "DESC"]],
        limit: 50,
      });

      const orderIds = orders.map((order) => order.id);

      const allOrderProducts = await OrderProduct.findAll({
        where: { order_id: orderIds },
      });

      const productsByOrder = {};
      allOrderProducts.forEach((product) => {
        if (!productsByOrder[product.order_id]) {
          productsByOrder[product.order_id] = [];
        }
        productsByOrder[product.order_id].push(product);
      });

      const productIds = allOrderProducts.map((op) => op.product_id);
      const products = await Product.findAll({
        where: { id: productIds },
        attributes: [
          "id",
          "name",
          "description",
          "sku",
          "images",
          "image",
          "price",
          "sale_price",
          "stock_status",
          "quantity",
        ],
      });

      const productMap = {};
      products.forEach((product) => {
        productMap[product.id] = product;
      });

      const payments = await Payment.findAll({
        where: { order_id: orderIds },
      });

      const paymentMap = {};
      payments.forEach((payment) => {
        paymentMap[payment.order_id] = payment;
      });

      // Process orders to include payment summary for each one
      const processedOrders = orders.map((order) => {
        const orderData = order.toJSON();

        // Get order products
        const orderProducts = productsByOrder[order.id] || [];

        // Get associated payment
        const orderPayment = paymentMap[order.id];
        orderData.payment = orderPayment;

        // Enrich order products with product details
        const enrichedProducts = orderProducts.map((orderProduct) => {
          const productDetail = productMap[orderProduct.product_id] || null;
          const productData = orderProduct.toJSON();

          // Format decimal fields
          productData.price = parseFloat(productData.price);
          if (productData.tax_amount)
            productData.tax_amount = parseFloat(productData.tax_amount);

          // Add additional product details if available
          if (productDetail) {
            const additionalDetails = productDetail.toJSON();
            delete additionalDetails.id; // Avoid duplicate ID

            // Format product prices
            if (additionalDetails.price)
              additionalDetails.price = parseFloat(additionalDetails.price);
            if (additionalDetails.sale_price)
              additionalDetails.sale_price = parseFloat(
                additionalDetails.sale_price
              );

            // Parse images if stored as JSON string
            if (typeof additionalDetails.images === "string") {
              try {
                additionalDetails.images = JSON.parse(additionalDetails.images);
              } catch (e) {
                console.log(
                  `Could not parse images for product ${productDetail.id}:`,
                  e.message
                );
              }
            }

            return {
              ...productData,
              product_detail: additionalDetails,
            };
          }

          return productData;
        });

        // Calculate payment summary with the enriched products
        const paymentSummary = calculateOrderPaymentSummary(
          orderData,
          enrichedProducts
        );

        // Add payment summary and enriched products to order data
        return {
          ...orderData,
          payment_summary: paymentSummary,
          products: enrichedProducts,
          // Update amount fields with calculated values
          amount: paymentSummary.grand_total,
          tax_amount: paymentSummary.tax_details.total_tax,
          shipping_amount: paymentSummary.fees.shipping_fee,
          discount_amount: paymentSummary.discount,
          sub_total: paymentSummary.product_subtotal,
        };
      });

      // Return the formatted response
      return res.status(200).json({
        status: "success",
        results: processedOrders.length,
        data: {
          orders: processedOrders,
        },
      });
    } catch (sqlError) {
      console.error("SQL query error:", sqlError);

      // Fallback - try with Sequelize findAll without any filters first
      try {
        // Import models needed for detailed product information if not already imported
        const { OrderProduct } = require("../models/OrderProduct");
        const { Product } = require("../models/Product");
        const { Payment } = require("../models/Payment");

        const allOrders = await Order.findAll({
          limit: 100,
          order: [["created_at", "DESC"]],
        });

        console.log(`Found ${allOrders.length} total orders in database`);

        // Manually filter by store_id
        const filteredOrders = allOrders.filter((order) => {
          console.log(`Order ${order.id} has store_id: ${order.store_id}`);
          return order.store_id === storeIdNum;
        });

        console.log(
          `Filtered to ${filteredOrders.length} orders for store ${storeIdNum}`
        );

        // Get order IDs for fetching related data
        const orderIds = filteredOrders.map((order) => order.id);

        // Fetch all order products in a single query
        const allOrderProducts = await OrderProduct.findAll({
          where: { order_id: orderIds },
        });

        // Group products by order_id
        const productsByOrder = {};
        allOrderProducts.forEach((product) => {
          if (!productsByOrder[product.order_id]) {
            productsByOrder[product.order_id] = [];
          }
          productsByOrder[product.order_id].push(product);
        });

        // Fetch all products for enrichment
        const productIds = allOrderProducts.map((op) => op.product_id);
        const products = await Product.findAll({
          where: { id: productIds },
          attributes: [
            "id",
            "name",
            "description",
            "sku",
            "images",
            "image",
            "price",
            "sale_price",
            "stock_status",
            "quantity",
          ],
        });

        // Create a map for easy product lookup
        const productMap = {};
        products.forEach((product) => {
          productMap[product.id] = product;
        });

        // Fetch payments for all orders
        const payments = await Payment.findAll({
          where: { order_id: orderIds },
        });

        // Create a map for easy payment lookup
        const paymentMap = {};
        payments.forEach((payment) => {
          paymentMap[payment.order_id] = payment;
        });
        // Process orders to include payment summary for each one
        const processedOrders = filteredOrders.map((order) => {
          const orderData = order.toJSON();

          // Get order products
          const orderProducts = productsByOrder[order.id] || [];

          // Get associated payment
          const orderPayment = paymentMap[order.id];
          orderData.payment = orderPayment;

          // Enrich order products with product details
          const enrichedProducts = orderProducts.map((orderProduct) => {
            const productDetail = productMap[orderProduct.product_id] || null;
            const productData = orderProduct.toJSON();

            // Format decimal fields
            productData.price = parseFloat(productData.price);
            if (productData.tax_amount)
              productData.tax_amount = parseFloat(productData.tax_amount);

            // Add additional product details if available
            if (productDetail) {
              const additionalDetails = productDetail.toJSON();
              delete additionalDetails.id; // Avoid duplicate ID

              // Format product prices
              if (additionalDetails.price)
                additionalDetails.price = parseFloat(additionalDetails.price);
              if (additionalDetails.sale_price)
                additionalDetails.sale_price = parseFloat(
                  additionalDetails.sale_price
                );

              // Parse images if stored as JSON string
              if (typeof additionalDetails.images === "string") {
                try {
                  additionalDetails.images = JSON.parse(
                    additionalDetails.images
                  );
                } catch (e) {
                  console.log(
                    `Could not parse images for product ${productDetail.id}:`,
                    e.message
                  );
                }
              }

              return {
                ...productData,
                product_detail: additionalDetails,
              };
            }

            return productData;
          });

          // Calculate payment summary with the enriched products
          const paymentSummary = calculateOrderPaymentSummary(
            orderData,
            enrichedProducts
          );

          // Add payment summary and enriched products to order data
          return {
            ...orderData,
            payment_summary: paymentSummary,
            products: enrichedProducts,
            // Update amount fields with calculated values
            amount: paymentSummary.grand_total,
            tax_amount: paymentSummary.tax_details.total_tax,
            shipping_amount: paymentSummary.fees.shipping_fee,
            discount_amount: paymentSummary.discount,
            sub_total: paymentSummary.product_subtotal,
          };
        });

        return res.status(200).json({
          status: "success",
          results: processedOrders.length,
          data: {
            orders: processedOrders,
          },
        });
      } catch (fallbackError) {
        console.error("Fallback query error:", fallbackError);
        return next(
          new AppError(`Database query error: ${fallbackError.message}`, 500)
        );
      }
    }
  } catch (error) {
    console.error("Error fetching orders:", error);
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

    console.log(
      `Fetching order details for order ID: ${id}, vendor ID: ${vendorId}`
    );

    // Import models here to avoid circular dependencies
    const { User } = require("../models/User");
    const { OrderAddress } = require("../models/OrderAddress");
    const { Shipment } = require("../models/Shipment");
    const { Payment } = require("../models/Payment");
    const { OrderProduct } = require("../models/OrderProduct");
    const { Product } = require("../models/Product");

    // First try to find the basic order
    const basicOrder = await Order.findByPk(id);

    if (!basicOrder) {
      return next(new AppError("Order not found", 404));
    }

    console.log(`Found base order with ID: ${id}`);

    // Get related data in separate queries to avoid join issues
    try {
      // 1. Get user data - adjust attributes to match actual database structure
      const user = await User.findByPk(basicOrder.user_id, {
        attributes: [
          "id",
          "first_name",
          "last_name",
          "username",
          "email",
          "avatar_id",
          "created_at",
        ],
      });
      console.log(
        `User data ${user ? "found" : "not found"} for user_id: ${
          basicOrder.user_id
        }`
      );

      // 2. Get address data
      const address = await OrderAddress.findOne({ where: { order_id: id } });
      console.log(
        `Address data ${address ? "found" : "not found"} for order_id: ${id}`
      );

      // 3. Get shipment data
      const shipments = await Shipment.findAll({ where: { order_id: id } });
      console.log(`Found ${shipments.length} shipments for order_id: ${id}`);

      // 4. Get payment data - Try to find payment by both payment_id and by order_id directly
      let payment = null;
      if (basicOrder.payment_id) {
        // First try to get payment by payment_id from order
        payment = await Payment.findByPk(basicOrder.payment_id);
        console.log(
          `Payment data ${payment ? "found" : "not found"} for payment_id: ${
            basicOrder.payment_id
          }`
        );
      }

      // If no payment found by payment_id, try to find by order_id
      if (!payment) {
        payment = await Payment.findOne({ where: { order_id: id } });
        console.log(
          `Payment data ${payment ? "found" : "not found"} for order_id: ${id}`
        );
      }

      // 5. Get any vendor-related payments (where customer_id matches vendor_id)
      let vendorPayments = [];
      if (vendorId) {
        vendorPayments = await Payment.findAll({
          where: {
            customer_id: vendorId,
            customer_type: "Botble\\Ecommerce\\Models\\Customer", // Filter by the customer type shown in the image
          },
        });
        console.log(
          `Found ${vendorPayments.length} vendor payments where customer_id = ${vendorId}`
        );
      }

      // 6. Get order products
      const orderProducts = await OrderProduct.findAll({
        where: { order_id: id },
      });
      console.log(
        `Found ${orderProducts.length} order products for order_id: ${id}`
      );

      // 7. Fetch detailed product info for each order product
      let enrichedProducts = [];
      if (orderProducts.length > 0) {
        // Extract all product IDs
        const productIds = orderProducts.map((op) => op.product_id);

        // Fetch all products in a single query for efficiency
        const products = await Product.findAll({
          where: { id: productIds },
          attributes: [
            "id",
            "name",
            "description",
            "sku",
            "images",
            "image",
            "price",
            "sale_price",
            "stock_status",
            "quantity",
          ],
        });

        // Create a map of products for easy lookup
        const productMap = {};
        products.forEach((product) => {
          productMap[product.id] = product;
        });

        // Combine order product data with full product details
        enrichedProducts = orderProducts.map((orderProduct) => {
          const productDetail = productMap[orderProduct.product_id] || null;
          const productData = orderProduct.toJSON();

          // Format decimal fields
          productData.price = parseFloat(productData.price);
          if (productData.tax_amount)
            productData.tax_amount = parseFloat(productData.tax_amount);

          // Add additional product details if available
          if (productDetail) {
            const additionalDetails = productDetail.toJSON();
            // Don't duplicate fields that already exist in orderProduct
            delete additionalDetails.id; // This would be the product_id

            // Format product prices
            if (additionalDetails.price)
              additionalDetails.price = parseFloat(additionalDetails.price);
            if (additionalDetails.sale_price)
              additionalDetails.sale_price = parseFloat(
                additionalDetails.sale_price
              );

            // Parse images if stored as JSON string
            if (typeof additionalDetails.images === "string") {
              try {
                additionalDetails.images = JSON.parse(additionalDetails.images);
              } catch (e) {
                console.log(
                  `Could not parse images for product ${productDetail.id}:`,
                  e.message
                );
              }
            }

            return {
              ...productData,
              product_detail: additionalDetails,
            };
          }

          return productData;
        });
      }

      console.log(
        `Enriched ${enrichedProducts.length} order products with product details`
      );

      // Calculate payment summary using the helper function
      const orderObj = basicOrder.toJSON();
      orderObj.payment = payment;
      const paymentSummary = calculateOrderPaymentSummary(
        orderObj,
        enrichedProducts
      );

      // Combine all data and format response
      const orderData = {
        ...basicOrder.toJSON(),
        // Add related data
        user: user ? user.toJSON() : null,
        address: address ? address.toJSON() : null,
        shipments:
          shipments.length > 0
            ? shipments.map((shipment) => shipment.toJSON())
            : [],
        payment: payment ? payment.toJSON() : null,
        vendor_payments:
          vendorPayments.length > 0
            ? vendorPayments.map((p) => p.toJSON())
            : [],
        products: enrichedProducts, // Add the enriched products to the response
        // Add payment summary
        payment_summary: paymentSummary,
        // Update amount fields with calculated values from payment summary
        amount: paymentSummary.grand_total,
        tax_amount: paymentSummary.tax_details.total_tax,
        shipping_amount: paymentSummary.fees.shipping_fee,
        discount_amount: paymentSummary.discount,
        sub_total: paymentSummary.product_subtotal,
      };

      // Format shipment decimals if they exist
      if (orderData.shipments && orderData.shipments.length > 0) {
        orderData.shipments = orderData.shipments.map((shipment) => ({
          ...shipment,
          price: shipment.price ? parseFloat(shipment.price) : null,
          cod_amount: shipment.cod_amount
            ? parseFloat(shipment.cod_amount)
            : null,
        }));
      }

      // Format payment decimals if they exist
      if (orderData.payment) {
        orderData.payment.amount = parseFloat(orderData.payment.amount);
        if (orderData.payment.refunded_amount) {
          orderData.payment.refunded_amount = parseFloat(
            orderData.payment.refunded_amount
          );
        }
      }

      // Format vendor payment decimals if they exist
      if (orderData.vendor_payments && orderData.vendor_payments.length > 0) {
        orderData.vendor_payments = orderData.vendor_payments.map(
          (payment) => ({
            ...payment,
            amount: parseFloat(payment.amount),
            refunded_amount: payment.refunded_amount
              ? parseFloat(payment.refunded_amount)
              : null,
          })
        );
      }

      return res.status(200).json({
        status: "success",
        data: {
          order: orderData,
        },
      });
    } catch (dataError) {
      console.error("Error fetching related data:", dataError);
      console.error(dataError.stack); // Add detailed stack trace for debugging
      return next(
        new AppError(`Error fetching related data: ${dataError.message}`, 500)
      );
    }
  } catch (error) {
    console.error("Error in getOrderById:", error);
    console.error(error.stack); // Add detailed stack trace for debugging
    return next(new AppError(`Database error: ${error.message}`, 500));
  }
};

exports.getAllOrderList = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const date = req.query.date;
    const status = req.query.status;
    const store_id = req.query.store_id;
    const customer_id = req.query.customer_id;
    const timePeriod = req.query.timePeriod;
    const search = req.query.search;
    const payment_status = req.query.payment_status;

    let whereClause = {};
    if (status) {
      whereClause.status = status;
    }
    if (date) {
      whereClause.created_at = {
        [Op.gte]: date,
      };
    }
    if (store_id) {
      whereClause.store_id = store_id;
    }
    if (customer_id) {
      whereClause.customer_id = customer_id;
    }
    if (timePeriod) {
      if (timePeriod == "today") {
        whereClause.created_at = {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)),
          [Op.lt]: new Date(new Date().setHours(23, 59, 59, 999)),
        };
      } else if (timePeriod == "yesterday") {
        whereClause.created_at = {
          [Op.gte]: new Date(
            new Date().setHours(0, 0, 0, 0) - 24 * 60 * 60 * 1000
          ),
          [Op.lt]: new Date(new Date().setHours(23, 59, 59, 999)),
        };
      } else if (timePeriod == "weekly") {
        whereClause.created_at = {
          [Op.gte]: new Date(
            new Date().setHours(0, 0, 0, 0) - 7 * 24 * 60 * 60 * 1000
          ),
          [Op.lt]: new Date(new Date().setHours(23, 59, 59, 999)),
        };
      } else if (timePeriod == "monthly") {
        whereClause.created_at = {
          [Op.gte]: new Date(
            new Date().setHours(0, 0, 0, 0) - 30 * 24 * 60 * 60 * 1000
          ),
          [Op.lt]: new Date(new Date().setHours(23, 59, 59, 999)),
        };
      } else if (timePeriod == "yearly") {
        whereClause.created_at = {
          [Op.gte]: new Date(
            new Date().setHours(0, 0, 0, 0) - 365 * 24 * 60 * 60 * 1000
          ),
          [Op.lt]: new Date(new Date().setHours(23, 59, 59, 999)),
        };
      }
    }

    let customerWhereClause = {};

    let searchTerm = search;
    if (search) {
      customerWhereClause = {
        [Op.or]: [
          where(fn("LOWER", col("customer.name")), {
            [Op.like]: `%${searchTerm.toLowerCase()}%`,
          }),
          where(fn("LOWER", col("customer.email")), {
            [Op.like]: `%${searchTerm.toLowerCase()}%`,
          }),
          where(fn("LOWER", col("customer.phone")), {
            [Op.like]: `%${searchTerm.toLowerCase()}%`,
          }),
        ],
      };
    }

    let paymentWhereClause = {};
    if (payment_status) {
      paymentWhereClause.status = payment_status;
    }
    const orders = await Order.findAll({
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [["created_at", "DESC"]],
      where: whereClause,
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "name", "email", "phone"],
          where: customerWhereClause,
        },
        {
          model: Payment,
          as: "payment",
          attributes: [
            "id",
            "amount",
            "status",
            "payment_channel",
            "charge_id",
            "payment_type",
            "customer_id",
            "refunded_amount",
            "refund_note",
            "created_at",
            "updated_at",
            "customer_type",
            "metadata",
          ],
          where: paymentWhereClause,
        },
      ],
    });
    const count = await Order.count({
      where: whereClause,
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "name", "email", "phone"],
          where: customerWhereClause,
        },
        {
          model: Payment,
          as: "payment",
          attributes: [
            "id",
            "amount",
            "status",
            "payment_channel",
            "charge_id",
            "payment_type",
            "customer_id",
            "refunded_amount",
            "refund_note",
            "created_at",
            "updated_at",
            "customer_type",
            "metadata",
          ],
          where: paymentWhereClause,
        },
      ],
    });
    res.status(200).json({
      status: "success",
      results: orders.length,
      total: count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        orders,
      },
    });
  } catch (error) {
    next(error);
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
      return next(new AppError("Order status is required", 400));
      return next(new AppError("Order status is required", 400));
    }

    // Find the order
    const order = await Order.findByPk(id);
    if (!order) {
      return next(new AppError("Order not found", 404));
    }

    // Get current values for logging
    const previousStatus = order.status;
    const wasConfirmed = order.is_confirmed;

    console.log(
      `Updating order ${id} status from ${previousStatus} to ${status}`
    );
    console.log(`Setting is_confirmed to true (was: ${wasConfirmed})`);

    // Update only the specified fields
    const updatedOrder = await order.update({
      status: status,
      is_confirmed: true,
    });

    // Send notification about order status change
    try {
      // If we have notification services set up, use them
      if (order.store_id) {
        const eventNotificationService = require("../services/eventNotificationService");
        await eventNotificationService.notifyOrderStatusChanged(
          updatedOrder,
          order.store_id,
          previousStatus,
          status
        );
      }
    } catch (notificationError) {
      console.error(
        "Error sending order status notification:",
        notificationError
      );
      // Continue with the response even if notification fails
    }

    res.status(200).json({
      status: "success",
      message: "Order status updated successfully",
      data: {
        order: updatedOrder,
      },
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return next(
      new AppError(`Error updating order status: ${error.message}`, 500)
    );
  }
};

exports.updateOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, shipping_amount, description } = req.body;

    const order = await Order.findByPk(id);
    if (!order) {
      return next(new AppError("Order not found", 404));
    }

    if (shipping_amount) {
      order.status = "pending_from_user";
    }
  
    const updatedOrder = await order.update({
      status: status ? status : order.status,
      shipping_amount: shipping_amount
        ? shipping_amount
        : order.shipping_amount,
      description: description ? description : order.description,
    });

    const LatestOrder = await Order.findOne({
      where: { id: updatedOrder.id },
      include: [
        { model: Payment, as: "payment" },
        { model: Customer, as: "customer" },
        { model: OrderProduct, as: "orderProducts" },
        { model: OrderHistory, as: "orderHistories" },
        { model: OrderAddress, as: "orderAddresses" },
      ],
    });
    res.status(200).json({
      status: "success",
      message: "Order updated successfully",
      data: {
        order: LatestOrder,
      },
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return next(new AppError(`Error updating order: ${error.message}`, 500));
  }
};

exports.confirmOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id);
    if (!order) {
      return next(new AppError("Order not found", 404));
    }
    const updatedOrder = await order.update({
      is_confirmed: true,
      status: "processing",
    });

    const LatestOrder = await Order.findOne({
      where: { id: updatedOrder.id },
      include: [
        { model: Payment, as: "payment" },
        { model: Customer, as: "customer" },
        { model: OrderProduct, as: "orderProducts" },
        { model: OrderHistory, as: "orderHistories" },
        { model: OrderAddress, as: "orderAddresses" },
      ],
    });
    res.status(200).json({
      status: "success",
      message: "Order confirmed successfully",
      data: {
        order: LatestOrder,
      },
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return next(new AppError(`Error updating order: ${error.message}`, 500));
  }
};

exports.getOrder = async (req, res , next) => {
  try {
    const {id} = req.params;
    if (!id) {
      return next(new AppError("Order ID is required", 400));
    }
    const order = await Order.findOne({
      where: { id: id },
      include: [
        { model: Payment, as: "payment" },
        { model: Customer, as: "customer" },
        { model: OrderProduct, as: "orderProducts" },
        { model: OrderHistory, as: "orderHistories" },
        { model: OrderAddress, as: "orderAddresses" },
      ],
    });
    if (!order) {
      return next(new AppError("Order not found", 404));
    }
    res.status(200).json({
      status: "success",
      message: "Order fetched successfully",
      data: {
        order: order,
      },
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return next(new AppError(`Error fetching order: ${error.message}`, 500));
  }
}