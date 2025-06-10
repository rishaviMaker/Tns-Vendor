const { messaging } = require('../config/firebase');
const notificationTracker = require('./notificationTracker');
const { Vendor } = require('../models/Vendor');

/**
 * Get a human-readable excerpt of a token for logs
 * @param {string} token - Firebase device token to format for logs
 * @returns {string} - Truncated token for logging
 */
function getTokenExcerpt(token) {
  if (!token || typeof token !== 'string') return 'invalid-token';
  return token.substring(0, 20) + '...';
}

/**
 * Check if notifications are enabled for a vendor
 * @param {string} token - Firebase device token
 * @param {Object} data - The notification data, used to determine if it's a critical notification
 * @returns {Promise<boolean>} - Whether notifications are enabled
 */
async function areNotificationsEnabled(token, data = {}) {
  try {
    if (!token) return false;
    
    // Always allow OTPs and critical notifications to be sent, regardless of preferences
    if (data.type === 'otp' || 
        data.type === 'authentication' || 
        data.critical === true) {
      return true;
    }
    
    // Find the vendor with this device token
    const vendor = await Vendor.findOne({ where: { deviceToken: token } });
    
    // If no vendor found with this token, return true to allow notification
    // Only block if a vendor is found AND notifications are explicitly disabled
    if (!vendor) {
      return true; // No record means we don't know the preference, so allow it
    } else if (vendor.notificationsEnabled === false) {
      console.log(`Vendor has explicitly disabled notifications: ${vendor.id}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking notification preferences:', error);
    // Default to true in case of error to allow notifications
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
    
    // Get a cleaner token for logging (truncated for privacy)
    const shortToken = token.substring(0, 20) + '...';
    
    // Check if notifications are enabled for this device token
    // Pass the data to check if this is an OTP or critical notification
    const notificationsEnabled = await areNotificationsEnabled(token, data);
    // if (!notificationsEnabled) {
    //   console.log(`Notifications are disabled for device ${shortToken}`);
    //   return null;
    // }
    
    // Check for duplicate notifications if prevention is enabled
    if (preventDuplicates && data.type && data.entityId) {
      const type = data.type;
      const entityId = data.entityId;
      const action = data.action || 'notification';
      
      // Skip if this notification was recently sent to this device
      if (notificationTracker.wasRecentlySent(type, entityId, action, token)) {
        console.log(`Skipping duplicate notification of type ${type} for entity ${entityId} to device ${shortToken}`);
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
    console.log(`Notification sent successfully to ${shortToken}`);
    return response;
  } catch (error) {
    // Check for specific Firebase error codes
    if (error.code === 'messaging/registration-token-not-registered') {
      console.log(`Token ${getTokenExcerpt(token)} is not registered`);
    } else if (error.code === 'messaging/mismatched-credential' || 
               error.code === 'messaging/authentication-error') {
      console.error('Firebase authentication error. Check your credentials.');
    } else if (error.errorInfo && error.errorInfo.message && 
              error.errorInfo.message.includes('Notifications are disabled')) {
      console.log(`Notifications are disabled for device ${getTokenExcerpt(token)}`);
    } else if (error.errorInfo && error.errorInfo.code) {
      console.error(`Firebase error ${error.errorInfo.code}:`, error.errorInfo.message);
    } else {
      console.error('Error sending notification:', error);
    }
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
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      console.error('FCM tokens array is empty or invalid');
      return null;
    }

    // Filter out duplicate tokens
    const uniqueTokens = [...new Set(tokens)];
    
    // Filter out tokens where notifications are disabled
    const enabledTokens = [];
    for (const token of uniqueTokens) {
      // Check if notifications are enabled for this device token
      // Pass data to see if this is a critical notification that should bypass preferences
      const notificationsEnabled = await areNotificationsEnabled(token, data);
      if (notificationsEnabled) {
        enabledTokens.push(token);
      } else {
        console.log(`Notifications are disabled for device ${getTokenExcerpt(token)}`);
      }
    }
    
    if (enabledTokens.length === 0) {
      console.log(`No enabled notification tokens found out of ${tokens.length} total tokens, skipping notification`);
      return null;
    }
    
    let filteredTokens = enabledTokens;
    
    // Check for duplicate notifications if prevention is enabled
    if (preventDuplicates && data.type && data.entityId) {
      const type = data.type;
      const entityId = data.entityId;
      const action = data.action || 'notification';
      
      // For each token, check if this notification was recently sent
      filteredTokens = enabledTokens.filter(token => {
        const isDuplicate = notificationTracker.wasRecentlySent(type, entityId, action, token);
        if (isDuplicate) {
          console.log(`Skipping duplicate notification of type ${type} for entity ${entityId} to device ${getTokenExcerpt(token)}`);
          return false;
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
    
    // Log failed notification sends for reference
    // Firebase returns responses in the same order as the input tokens
    if (response.failureCount > 0 && response.responses) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success && filteredTokens[idx]) {
          const token = filteredTokens[idx];
          const error = resp.error;
          
          if (error) {
            console.log(`Failed to send notification to ${getTokenExcerpt(token)}: ${error.code || 'Unknown error'}`);
          }
        }
      });
    }
    
    return response;
  } catch (error) {
    console.error('Error sending multicast notification:', error);
    if (error.errorInfo && Array.isArray(error.results)) {
      // Handle batch error responses and log them
      error.results.forEach((result, idx) => {
        if (result.error && filteredTokens[idx]) {
          console.log(`Error for token ${getTokenExcerpt(filteredTokens[idx])}: ${result.error.message}`);
        }
      });
    }
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
