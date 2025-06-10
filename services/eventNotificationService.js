const notificationService = require('./notificationService');
const { Vendor } = require('../models/Vendor');
const { Store } = require('../models/Store');

/**
 * Event Notification Service
 * Handles sending notifications for various application events
 */

// Topic names for different event types
const TOPICS = {
  ALL_USERS: 'all_users',
  ALL_VENDORS: 'all_vendors',
  PRODUCT_UPDATES: 'product_updates',
  VENDOR_UPDATES: 'vendor_updates',
  STORE_UPDATES: 'store_updates',
  ADMIN_ALERTS: 'admin_alerts'
};

/**
 * Send notification about product creation
 * @param {Object} product - The created product
 * @param {number} vendorId - ID of the vendor who created the product
 */
exports.notifyProductCreated = async (product, vendorId) => {
  try {
    // Get vendor details for the notification
    const vendor = await Vendor.findByPk(vendorId);
    const vendorName = vendor ? vendor.fullName || vendor.businessName || 'A vendor' : 'A vendor';
    
    // Notification details
    const title = 'New Product Added';
    const body = `${vendorName} added a new product: ${product.name}`;
    const data = {
      type: 'product',
      entityId: product.id.toString(),
      action: 'created',
      vendorId: vendorId.toString(),
      timestamp: new Date().toISOString()
    };
    
    // Send to topic subscribers (e.g., admins, interested users)
    await notificationService.sendTopicNotification(TOPICS.PRODUCT_UPDATES, title, body, data);
    
    // Send to vendor's specific topic if they have subscribers
    const vendorTopic = `vendor_${vendorId}`;
    await notificationService.sendTopicNotification(vendorTopic, title, body, data);
    
    console.log('Product creation notification sent successfully');
  } catch (error) {
    console.error('Error sending product creation notification:', error);
  }
};

/**
 * Send notification about product update
 * @param {Object} product - The updated product
 * @param {number} vendorId - ID of the vendor who updated the product
 * @param {Array} changedFields - List of fields that were updated
 */
exports.notifyProductUpdated = async (product, vendorId, changedFields = []) => {
  try {
    // Get vendor details
    const vendor = await Vendor.findByPk(vendorId);
    const vendorName = vendor ? vendor.fullName || vendor.businessName || 'A vendor' : 'A vendor';
    
    // Create a descriptive message based on what was updated
    let updateDescription = '';
    if (changedFields.length > 0) {
      updateDescription = `Updated: ${changedFields.join(', ')}`;
    } else {
      updateDescription = 'Details updated';
    }
    
    // Notification details
    const title = 'Product Updated';
    const body = `${vendorName} updated product: ${product.name}. ${updateDescription}`;
    const data = {
      type: 'product',
      entityId: product.id.toString(),
      action: 'updated',
      vendorId: vendorId.toString(),
      changedFields: JSON.stringify(changedFields),
      timestamp: new Date().toISOString()
    };
    
    // Send to topic subscribers
    await notificationService.sendTopicNotification(TOPICS.PRODUCT_UPDATES, title, body, data);
    
    // Send to vendor's specific topic
    const vendorTopic = `vendor_${vendorId}`;
    await notificationService.sendTopicNotification(vendorTopic, title, body, data);
    
    console.log('Product update notification sent successfully');
  } catch (error) {
    console.error('Error sending product update notification:', error);
  }
};

/**
 * Send notification about product deletion
 * @param {Object} product - The deleted product
 * @param {number} vendorId - ID of the vendor who deleted the product
 */
exports.notifyProductDeleted = async (product, vendorId) => {
  try {
    // Get vendor details
    const vendor = await Vendor.findByPk(vendorId);
    const vendorName = vendor ? vendor.fullName || vendor.businessName || 'A vendor' : 'A vendor';
    
    // Notification details
    const title = 'Product Removed';
    const body = `${vendorName} removed a product: ${product.name}`;
    const data = {
      type: 'product',
      entityId: product.id.toString(),
      action: 'deleted',
      productId: product.id.toString(),
      vendorId: vendorId.toString(),
      timestamp: new Date().toISOString()
    };
    
    // Send to topic subscribers
    await notificationService.sendTopicNotification(TOPICS.PRODUCT_UPDATES, title, body, data);
    
    // Send to vendor's specific topic
    const vendorTopic = `vendor_${vendorId}`;
    await notificationService.sendTopicNotification(vendorTopic, title, body, data);
    
    // Notify admin about product deletion
    await notificationService.sendTopicNotification(TOPICS.ADMIN_ALERTS, 
      'Product Deletion Alert', 
      `Vendor ${vendorName} (ID: ${vendorId}) deleted product: ${product.name}`,
      data
    );
    
    console.log('Product deletion notification sent successfully');
  } catch (error) {
    console.error('Error sending product deletion notification:', error);
  }
};

/**
 * Send notification about vendor profile update
 * @param {Object} vendor - The updated vendor
 * @param {Array} changedFields - List of fields that were updated
 */
exports.notifyVendorProfileUpdated = async (vendor, changedFields = []) => {
  try {
    // Create a descriptive message based on what was updated
    let updateDescription = '';
    if (changedFields.length > 0) {
      // Filter out sensitive fields from the notification
      const filteredFields = changedFields.filter(field => 
        !['password', 'bankAccountDetails', 'idProofNumber'].includes(field)
      );
      if (filteredFields.length > 0) {
        updateDescription = `Updated: ${filteredFields.join(', ')}`;
      } else {
        updateDescription = 'Account details updated';
      }
    } else {
      updateDescription = 'Profile updated';
    }
    
    // Notification details
    const title = 'Profile Updated';
    const body = `${vendor.fullName || vendor.businessName || 'Vendor'}'s profile was updated. ${updateDescription}`;
    const data = {
      type: 'vendor',
      entityId: vendor.id.toString(),
      action: 'profile_updated',
      changedFields: JSON.stringify(changedFields),
      timestamp: new Date().toISOString()
    };
    
    // Send to admin topic
    await notificationService.sendTopicNotification(TOPICS.ADMIN_ALERTS, 
      'Vendor Profile Update', 
      `Vendor ${vendor.fullName || vendor.businessName || 'Unknown'} (ID: ${vendor.id}) updated their profile`,
      data
    );
    
    // Send to vendor's specific topic (for their devices)
    const vendorTopic = `vendor_${vendor.id}`;
    await notificationService.sendTopicNotification(vendorTopic, title, body, data);
    
    console.log('Vendor profile update notification sent successfully');
  } catch (error) {
    console.error('Error sending vendor profile update notification:', error);
  }
};

/**
 * Send notification about store/company details update
 * @param {Object} store - The updated store
 * @param {number} vendorId - ID of the vendor who owns the store
 * @param {Array} changedFields - List of fields that were updated
 */
exports.notifyStoreUpdated = async (store, vendorId, changedFields = []) => {
  try {
    // Get vendor details
    const vendor = await Vendor.findByPk(vendorId);
    
    // Create a descriptive message based on what was updated
    let updateDescription = '';
    if (changedFields.length > 0) {
      updateDescription = `Updated: ${changedFields.join(', ')}`;
    } else {
      updateDescription = 'Details updated';
    }
    
    // Notification details
    const title = 'Store Details Updated';
    const body = `${store.name || 'Store'} details were updated. ${updateDescription}`;
    const data = {
      type: 'store',
      entityId: store.id.toString(),
      action: 'updated',
      vendorId: vendorId.toString(),
      changedFields: JSON.stringify(changedFields),
      timestamp: new Date().toISOString()
    };
    
    // Send to store updates topic
    await notificationService.sendTopicNotification(TOPICS.STORE_UPDATES, title, body, data);
    
    // Send to vendor's specific topic
    const vendorTopic = `vendor_${vendorId}`;
    await notificationService.sendTopicNotification(vendorTopic, title, body, data);
    
    // Send to admin topic for monitoring
    await notificationService.sendTopicNotification(TOPICS.ADMIN_ALERTS, 
      'Store Update Alert', 
      `Store ${store.name || 'Unknown'} (ID: ${store.id}) owned by vendor ID: ${vendorId} was updated`,
      data
    );
    
    console.log('Store update notification sent successfully');
  } catch (error) {
    console.error('Error sending store update notification:', error);
  }
};

/**
 * Send notification about new vendor registration
 * @param {Object} vendor - The newly registered vendor
 * @param {Object} store - The store created for the vendor
 */
exports.notifyNewVendorRegistration = async (vendor, store) => {
  try {
    // Notification for admins
    const adminTitle = 'New Vendor Registration';
    const adminBody = `${vendor.fullName || vendor.businessName || 'A new vendor'} has registered. Business: ${store ? store.name : 'Not specified'}`;
    const data = {
      type: 'vendor',
      entityId: vendor.id.toString(),
      action: 'registered',
      storeId: store ? store.id.toString() : null,
      timestamp: new Date().toISOString()
    };
    
    // Send to admin topic
    await notificationService.sendTopicNotification(TOPICS.ADMIN_ALERTS, adminTitle, adminBody, data);
    
    // Welcome notification to the vendor
    const vendorTitle = 'Welcome to Vendor Platform';
    const vendorBody = `Thank you for registering, ${vendor.fullName || 'Vendor'}! Your account is now being reviewed.`;
    
    // If vendor has a device token, send direct notification
    if (vendor.deviceToken) {
      await notificationService.sendNotification(vendor.deviceToken, vendorTitle, vendorBody, {
        type: 'vendor',
        entityId: vendor.id.toString(),
        action: 'welcome',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('New vendor registration notification sent successfully');
  } catch (error) {
    console.error('Error sending new vendor registration notification:', error);
  }
};

/**
 * Send notification about vendor status change (approval, rejection, etc.)
 * @param {Object} vendor - The vendor whose status changed
 * @param {string} oldStatus - Previous status
 * @param {string} newStatus - New status
 */
exports.notifyVendorStatusChanged = async (vendor, oldStatus, newStatus) => {
  try {
    // Notification details
    let title, body;
    
    if (newStatus === 'approved') {
      title = 'Account Approved';
      body = `Congratulations ${vendor.fullName || 'Vendor'}! Your account has been approved.`;
    } else if (newStatus === 'rejected') {
      title = 'Account Status Update';
      body = `Your account status has been updated to: ${newStatus}. Please contact support for more information.`;
    } else {
      title = 'Account Status Changed';
      body = `Your account status has been changed from ${oldStatus} to ${newStatus}.`;
    }
    
    const data = {
      type: 'vendor',
      entityId: vendor.id.toString(),
      action: 'status_changed',
      oldStatus,
      newStatus,
      timestamp: new Date().toISOString()
    };
    
    // Send to vendor's specific topic
    const vendorTopic = `vendor_${vendor.id}`;
    await notificationService.sendTopicNotification(vendorTopic, title, body, data);
    
    // If vendor has a device token, send direct notification
    if (vendor.deviceToken) {
      await notificationService.sendNotification(vendor.deviceToken, title, body, data);
    }
    
    // Notify admin about the status change
    await notificationService.sendTopicNotification(TOPICS.ADMIN_ALERTS, 
      'Vendor Status Change', 
      `Vendor ${vendor.fullName || vendor.businessName || 'Unknown'} (ID: ${vendor.id}) status changed from ${oldStatus} to ${newStatus}`,
      data
    );
    
    console.log('Vendor status change notification sent successfully');
  } catch (error) {
    console.error('Error sending vendor status change notification:', error);
  }
};

/**
 * Send notification about order status change
 * @param {Object} order - The order that was updated
 * @param {string} oldStatus - Previous status
 * @param {string} newStatus - New status
 * @param {number} vendorId - ID of the vendor who owns the order
 */
exports.notifyOrderStatusChanged = async (order, oldStatus, newStatus, vendorId) => {
  try {
    // Get vendor details
    const vendor = await Vendor.findByPk(vendorId);
    const vendorName = vendor ? vendor.fullName || vendor.businessName || 'A vendor' : 'A vendor';
    
    // Notification details
    const title = 'Order Status Updated';
    const body = `Order #${order.orderNumber || order.id} status changed from ${oldStatus} to ${newStatus}`;
    const data = {
      type: 'order',
      entityId: order.id.toString(),
      action: 'status_changed',
      vendorId: vendorId.toString(),
      oldStatus,
      newStatus,
      timestamp: new Date().toISOString()
    };
    
    // Send to vendor's specific topic
    const vendorTopic = `vendor_${vendorId}`;
    await notificationService.sendTopicNotification(vendorTopic, title, body, data);
    
    // If this is an important status change, notify admins
    const importantStatusChanges = ['cancelled', 'completed', 'refunded'];
    if (importantStatusChanges.includes(newStatus)) {
      await notificationService.sendTopicNotification(TOPICS.ADMIN_ALERTS, 
        'Important Order Status Change', 
        `Order #${order.orderNumber || order.id} by vendor ${vendorName} (ID: ${vendorId}) changed to ${newStatus}`,
        data
      );
    }
    
    console.log('Order status change notification sent successfully');
  } catch (error) {
    console.error('Error sending order status change notification:', error);
  }
};

/**
 * Subscribe a device to relevant topics based on user role
 * @param {string} token - Device token
 * @param {string} role - User role (vendor, admin, customer)
 * @param {number} userId - User ID
 */
exports.subscribeDeviceToTopics = async (token, role, userId) => {
  try {
    if (!token) {
      console.error('Device token is missing');
      return;
    }
    
    // Subscribe to general topics
    await notificationService.subscribeToTopic(token, TOPICS.ALL_USERS);
    
    // Role-specific subscriptions
    if (role === 'vendor') {
      await notificationService.subscribeToTopic(token, TOPICS.ALL_VENDORS);
      await notificationService.subscribeToTopic(token, `vendor_${userId}`);
    } else if (role === 'admin') {
      await notificationService.subscribeToTopic(token, TOPICS.ADMIN_ALERTS);
      await notificationService.subscribeToTopic(token, TOPICS.VENDOR_UPDATES);
      await notificationService.subscribeToTopic(token, TOPICS.STORE_UPDATES);
      await notificationService.subscribeToTopic(token, TOPICS.PRODUCT_UPDATES);
    }
    
    console.log(`Device successfully subscribed to topics for ${role}`);
  } catch (error) {
    console.error('Error subscribing device to topics:', error);
  }
};

/**
 * Update device token for a vendor
 * @param {number} vendorId - Vendor ID
 * @param {string} deviceToken - New device token
 */
exports.updateVendorDeviceToken = async (vendorId, deviceToken) => {
  try {
    const vendor = await Vendor.findByPk(vendorId);
    
    if (!vendor) {
      console.error(`Vendor with ID ${vendorId} not found`);
      return false;
    }
    
    // Update the vendor's device token
    vendor.deviceToken = deviceToken;
    await vendor.save();
    
    // Subscribe to relevant topics
    await this.subscribeDeviceToTopics(deviceToken, 'vendor', vendorId);
    
    return true;
  } catch (error) {
    console.error('Error updating vendor device token:', error);
    return false;
  }
};

/**
 * Send notification about withdrawal status change
 * @param {Object} withdrawal - The withdrawal that was updated
 * @param {string} oldStatus - Previous status
 * @param {string} newStatus - New status
 * @param {number} vendorId - ID of the vendor who made the withdrawal
 * @param {Object} additionalInfo - Any additional information about the withdrawal (optional)
 */
exports.notifyWithdrawalStatusChanged = async (withdrawal, oldStatus, newStatus, vendorId, additionalInfo = {}) => {
  try {
    // Get vendor details
    const vendor = await Vendor.findByPk(vendorId);
    const vendorName = vendor ? vendor.fullName || vendor.businessName || 'A vendor' : 'A vendor';
    
    // Format amount with currency
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD' // You may want to use the actual currency from the withdrawal if available
    }).format(withdrawal.amount);
    
    // Create appropriate message based on status
    let statusMessage = '';
    switch (newStatus) {
      case 'approved':
        statusMessage = `Your withdrawal request for ${formattedAmount} has been approved.`;
        break;
      case 'processing':
        statusMessage = `Your withdrawal request for ${formattedAmount} is now being processed.`;
        break;
      case 'completed':
        statusMessage = `Your withdrawal for ${formattedAmount} has been completed. The funds should be in your account shortly.`;
        break;
      case 'rejected':
        statusMessage = `Your withdrawal request for ${formattedAmount} was rejected. ${additionalInfo.reason || 'Please contact support for more information.'}`;
        break;
      case 'cancelled':
        statusMessage = `Your withdrawal request for ${formattedAmount} has been cancelled.`;
        break;
      default:
        statusMessage = `Your withdrawal request for ${formattedAmount} status changed from ${oldStatus} to ${newStatus}.`;
    }
    
    // Notification details
    const title = 'Withdrawal Status Updated';
    const body = statusMessage;
    const data = {
      type: 'withdrawal',
      entityId: withdrawal.id.toString(),
      action: 'status_changed',
      vendorId: vendorId.toString(),
      oldStatus,
      newStatus,
      amount: withdrawal.amount.toString(),
      withdrawalId: withdrawal.id.toString(),
      timestamp: new Date().toISOString(),
      ...additionalInfo
    };
    
    // Send to vendor's device if they have a token
    if (vendor && vendor.deviceToken) {
      await notificationService.sendNotification(vendor.deviceToken, title, body, data);
    }
    
    // Send to vendor's specific topic
    const vendorTopic = `vendor_${vendorId}`;
    await notificationService.sendTopicNotification(vendorTopic, title, body, data);
    
    // Notify admins about important withdrawal status changes
    const importantStatusChanges = ['approved', 'rejected', 'completed'];
    if (importantStatusChanges.includes(newStatus)) {
      await notificationService.sendTopicNotification(TOPICS.ADMIN_ALERTS, 
        'Withdrawal Status Change', 
        `Vendor ${vendorName} (ID: ${vendorId}) withdrawal for ${formattedAmount} changed to ${newStatus}`,
        data
      );
    }
    
    console.log('Withdrawal status change notification sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending withdrawal status change notification:', error);
    return false;
  }
};
