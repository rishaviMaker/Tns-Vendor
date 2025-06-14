const { Notification } = require('../models/Notification');
const notificationService = require('./notificationService');
const { Vendor } = require('../models/Vendor');

/**
 * Create a new notification in the database and optionally send a push notification
 * @param {number} vendorId - ID of the vendor receiving the notification
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {Object} options - Additional notification options
 * @param {string} options.type - Type of notification (e.g., 'order', 'payment', 'product')
 * @param {number} options.entityId - ID of the related entity
 * @param {string} options.entityType - Type of the related entity
 * @param {Object} options.data - Additional data to store with the notification
 * @param {boolean} options.sendPush - Whether to send push notification (default: true)
 * @returns {Promise<Object>} The created notification object
 */
exports.createNotification = async (vendorId, title, message, options = {}) => {
  try {
    const {
      type = 'general',
      entityId = null,
      entityType = null,
      data = {},
      sendPush = true
    } = options;
    
    // Create notification record in database
    const notification = await Notification.create({
      vendor_id: vendorId,
      title,
      message,
      type,
      entity_id: entityId,
      entity_type: entityType,
      data: JSON.stringify(data),
      is_read: false,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    // If push notification is requested, send it
    if (sendPush) {
      try {
        // Get vendor's device token
        const vendor = await Vendor.findByPk(vendorId);
        if (vendor && vendor.deviceToken) {
          // Send push notification
          await notificationService.sendNotification(
            vendor.deviceToken,
            title,
            message,
            {
              ...data,
              type,
              entityId,
              entityType,
              notificationId: notification.id,
              // Add timestamp for notification sorting in mobile app
              timestamp: new Date().getTime()
            }
          );
        }
      } catch (pushError) {
        console.error('Error sending push notification:', pushError);
        // Continue even if push notification fails
      }
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Create notifications for multiple vendors
 * @param {Array<number>} vendorIds - Array of vendor IDs
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {Object} options - Additional notification options (same as createNotification)
 * @returns {Promise<Array>} Array of created notifications
 */
exports.createMultipleNotifications = async (vendorIds, title, message, options = {}) => {
  try {
    const notifications = [];
    
    // Process each vendor ID
    for (const vendorId of vendorIds) {
      try {
        const notification = await exports.createNotification(vendorId, title, message, options);
        notifications.push(notification);
      } catch (err) {
        console.error(`Error creating notification for vendor ${vendorId}:`, err);
        // Continue with other vendors even if one fails
      }
    }
    
    return notifications;
  } catch (error) {
    console.error('Error creating multiple notifications:', error);
    throw error;
  }
};

/**
 * Create notifications for all vendors or vendors matching specific criteria
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {Object} options - Additional notification options (same as createNotification)
 * @param {Object} filter - Filter criteria for vendors
 * @returns {Promise<Array>} Array of created notifications
 */
exports.notifyAllVendors = async (title, message, options = {}, filter = {}) => {
  try {
    // Find all vendors matching the filter
    const vendors = await Vendor.findAll({
      where: filter,
      attributes: ['id', 'deviceToken']
    });
    
    // Get just the vendor IDs
    const vendorIds = vendors.map(vendor => vendor.id);
    
    // Create notifications for all these vendors
    return await exports.createMultipleNotifications(vendorIds, title, message, options);
  } catch (error) {
    console.error('Error notifying all vendors:', error);
    throw error;
  }
};

/**
 * Create a product-related notification
 * @param {number} vendorId - Vendor ID
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {number} productId - Product ID
 * @param {string} action - Action type (e.g., 'created', 'updated', 'approved', 'rejected')
 * @param {Object} additionalData - Any additional data to include
 * @returns {Promise<Object>} The created notification
 */
exports.createProductNotification = async (vendorId, title, message, productId, action, additionalData = {}) => {
  return await exports.createNotification(vendorId, title, message, {
    type: 'product',
    entityId: productId,
    entityType: 'product',
    data: { ...additionalData, action, productId },
    sendPush: true
  });
};

/**
 * Create an order-related notification
 * @param {number} vendorId - Vendor ID
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {number} orderId - Order ID
 * @param {string} status - Order status
 * @param {Object} additionalData - Any additional data to include
 * @returns {Promise<Object>} The created notification
 */
exports.createOrderNotification = async (vendorId, title, message, orderId, status, additionalData = {}) => {
  return await exports.createNotification(vendorId, title, message, {
    type: 'order',
    entityId: orderId,
    entityType: 'order',
    data: { ...additionalData, status, orderId },
    sendPush: true
  });
};

/**
 * Create a payment-related notification
 * @param {number} vendorId - Vendor ID
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {number} paymentId - Payment ID
 * @param {string} status - Payment status
 * @param {Object} additionalData - Any additional data to include
 * @returns {Promise<Object>} The created notification
 */
exports.createPaymentNotification = async (vendorId, title, message, paymentId, status, additionalData = {}) => {
  return await exports.createNotification(vendorId, title, message, {
    type: 'payment',
    entityId: paymentId,
    entityType: 'payment',
    data: { ...additionalData, status, paymentId },
    sendPush: true
  });
};

/**
 * Create a withdrawal-related notification
 * @param {number} vendorId - Vendor ID
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {number} withdrawalId - Withdrawal ID
 * @param {string} status - Withdrawal status
 * @param {Object} additionalData - Any additional data to include
 * @returns {Promise<Object>} The created notification
 */
exports.createWithdrawalNotification = async (vendorId, title, message, withdrawalId, status, additionalData = {}) => {
  return await exports.createNotification(vendorId, title, message, {
    type: 'withdrawal',
    entityId: withdrawalId,
    entityType: 'withdrawal',
    data: { ...additionalData, status, withdrawalId },
    sendPush: true
  });
};
