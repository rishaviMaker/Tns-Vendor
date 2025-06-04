const { messaging } = require('../config/firebase');
const notificationTracker = require('./notificationTracker');
const { Vendor } = require('../models/Vendor');

/**
 * Check if notifications are enabled for a vendor
 * @param {string} token - Firebase device token
 * @returns {Promise<boolean>} - Whether notifications are enabled
 */
async function areNotificationsEnabled(token) {
  try {
    if (!token) return false;
    
    // Find the vendor with this device token
    const vendor = await Vendor.findOne({ where: { deviceToken: token } });
    
    // If no vendor found with this token or notifications explicitly disabled, return false
    if (!vendor || vendor.notificationsEnabled === false) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking notification preferences:', error);
    // Default to true in case of error
    return true;
  }
}

/**
 * Send push notification to a specific device using Firebase Cloud Messaging
 * @param {string} token - Firebase device token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data to send with notification
 * @param {boolean} preventDuplicates - Whether to prevent duplicate notifications (default: true)
 * @returns {Promise<string>} Message ID if successful
 */
exports.sendNotification = async (token, title, body, data = {}, preventDuplicates = true) => {
  try {
    if (!token) {
      console.error('FCM token is missing');
      return null;
    }
    
    // Check if notifications are enabled for this device token
    const notificationsEnabled = await areNotificationsEnabled(token);
    if (!notificationsEnabled) {
      console.log(`Notifications are disabled for device ${token}`);
      return null;
    }
    
    // Check for duplicate notifications if prevention is enabled
    if (preventDuplicates && data.type && data.entityId) {
      const type = data.type;
      const entityId = data.entityId;
      const action = data.action || 'notification';
      
      // Skip if this notification was recently sent to this device
      if (notificationTracker.wasRecentlySent(type, entityId, action, token)) {
        console.log(`Skipping duplicate notification of type ${type} for entity ${entityId} to device ${token}`);
        return null;
      }
      
      // Mark this notification as sent
      notificationTracker.markAsSent(type, entityId, action, token);
    }

    const message = {
      token,
      notification: {
        title,
        body
      },
      data: typeof data === 'object' ? data : {}
    };

    const response = await messaging.send(message);
    console.log('Notification sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Error sending notification:', error);
    return null;
  }
};

/**
 * Send notification to multiple devices
 * @param {Array<string>} tokens - Array of Firebase device tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data to send with notification
 * @param {boolean} preventDuplicates - Whether to prevent duplicate notifications (default: true)
 * @returns {Promise<Object>} Response containing successful and failed counts
 */
exports.sendMulticastNotification = async (tokens, title, body, data = {}, preventDuplicates = true) => {
  try {
    if (!tokens || !tokens.length) {
      console.error('FCM tokens are missing');
      return null;
    }
    
    // Remove duplicate tokens to prevent sending the same notification to the same device multiple times
    const uniqueTokens = [...new Set(tokens)];
    
    // Check which tokens have notifications enabled
    const tokensWithNotificationsStatus = await Promise.all(
      uniqueTokens.map(async (token) => ({
        token,
        enabled: await areNotificationsEnabled(token)
      }))
    );
    
    // Filter out tokens with disabled notifications
    const tokensWithNotificationsEnabled = tokensWithNotificationsStatus
      .filter(item => item.enabled)
      .map(item => item.token);
    
    // Filter out tokens that have recently received this notification
    let filteredTokens = tokensWithNotificationsEnabled;
    
    if (preventDuplicates && data.type && data.entityId) {
      const type = data.type;
      const entityId = data.entityId;
      const action = data.action || 'notification';
      
      filteredTokens = uniqueTokens.filter(token => {
        const isDuplicate = notificationTracker.wasRecentlySent(type, entityId, action, token);
        if (isDuplicate) {
          console.log(`Skipping duplicate notification of type ${type} for entity ${entityId} to device ${token}`);
        } else {
          // Mark as sent for future checks
          notificationTracker.markAsSent(type, entityId, action, token);
        }
        return !isDuplicate;
      });
      
      if (filteredTokens.length === 0) {
        console.log('All notifications were duplicates, skipping send');
        return null;
      }
    }

    // Use filtered tokens instead of original tokens array
    const message = {
      tokens: filteredTokens,
      notification: {
        title,
        body
      },
      data: typeof data === 'object' ? data : {}
    };

    const response = await messaging.sendMulticast(message);
    console.log(
      `Notification sent to ${response.successCount} devices, failed: ${response.failureCount}`
    );
    return response;
  } catch (error) {
    console.error('Error sending multicast notification:', error);
    return null;
  }
};

/**
 * Send notification to a topic
 * @param {string} topic - Topic name
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data to send with notification
 * @param {boolean} preventDuplicates - Whether to prevent duplicate notifications (default: true)
 * @returns {Promise<string>} Message ID if successful
 */
exports.sendTopicNotification = async (topic, title, body, data = {}, preventDuplicates = true) => {
  try {
    if (!topic) {
      console.error('Topic is missing');
      return null;
    }
    
    // Check for duplicate notifications if prevention is enabled
    if (preventDuplicates && data.type && data.entityId) {
      const type = data.type;
      const entityId = data.entityId;
      const action = data.action || 'notification';
      
      // Skip if this notification was recently sent to this topic
      if (notificationTracker.wasRecentlySent(type, entityId, action, `topic:${topic}`)) {
        console.log(`Skipping duplicate notification of type ${type} for entity ${entityId} to topic ${topic}`);
        return null;
      }
      
      // Mark this notification as sent
      notificationTracker.markAsSent(type, entityId, action, `topic:${topic}`);
    }

    const message = {
      topic,
      notification: {
        title,
        body
      },
      data: typeof data === 'object' ? data : {}
    };

    const response = await messaging.send(message);
    console.log('Topic notification sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Error sending topic notification:', error);
    return null;
  }
};

/**
 * Subscribe a device to a topic
 * @param {string|Array<string>} tokens - Firebase device token(s)
 * @param {string} topic - Topic name
 * @returns {Promise<Object>} Response object
 */
exports.subscribeToTopic = async (tokens, topic) => {
  try {
    if (!tokens || !topic) {
      console.error('Tokens or topic is missing');
      return null;
    }

    // If a single token is passed, convert it to an array
    const tokenArray = Array.isArray(tokens) ? tokens : [tokens];

    const response = await messaging.subscribeToTopic(tokenArray, topic);
    console.log('Successfully subscribed to topic:', response);
    return response;
  } catch (error) {
    console.error('Error subscribing to topic:', error);
    return null;
  }
};

/**
 * Unsubscribe a device from a topic
 * @param {string|Array<string>} tokens - Firebase device token(s)
 * @param {string} topic - Topic name
 * @returns {Promise<Object>} Response object
 */
exports.unsubscribeFromTopic = async (tokens, topic) => {
  try {
    if (!tokens || !topic) {
      console.error('Tokens or topic is missing');
      return null;
    }

    // If a single token is passed, convert it to an array
    const tokenArray = Array.isArray(tokens) ? tokens : [tokens];

    const response = await messaging.unsubscribeFromTopic(tokenArray, topic);
    console.log('Successfully unsubscribed from topic:', response);
    return response;
  } catch (error) {
    console.error('Error unsubscribing from topic:', error);
    return null;
  }
};
