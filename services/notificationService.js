const { messaging } = require('../config/firebase');

/**
 * Send push notification to a specific device using Firebase Cloud Messaging
 * @param {string} token - Firebase device token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data to send with notification
 * @returns {Promise<string>} Message ID if successful
 */
exports.sendNotification = async (token, title, body, data = {}) => {
  try {
    if (!token) {
      console.error('FCM token is missing');
      return null;
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
 * @returns {Promise<Object>} Response containing successful and failed counts
 */
exports.sendMulticastNotification = async (tokens, title, body, data = {}) => {
  try {
    if (!tokens || !tokens.length) {
      console.error('FCM tokens are missing');
      return null;
    }

    const message = {
      tokens,
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
 * @returns {Promise<string>} Message ID if successful
 */
exports.sendTopicNotification = async (topic, title, body, data = {}) => {
  try {
    if (!topic) {
      console.error('Topic is missing');
      return null;
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
