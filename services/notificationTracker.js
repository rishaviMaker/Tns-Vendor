/**
 * Notification Tracker Service
 * Handles tracking and preventing duplicate notifications
 */

// In-memory store of recent notifications (in production this should be a Redis or database solution)
const recentNotifications = new Map();

// TTL for notification records in milliseconds (5 minutes)
const NOTIFICATION_TTL = 5 * 60 * 1000;

/**
 * Generate a unique key for a notification
 * @param {string} type - Notification type
 * @param {string} entityId - ID of the entity (product, vendor, order, etc.)
 * @param {string} action - Action performed (created, updated, deleted, etc.)
 * @param {string} recipientId - ID of the recipient (device token or topic)
 * @returns {string} - Unique notification key
 */
const generateNotificationKey = (type, entityId, action, recipientId) => {
  return `${type}:${entityId}:${action}:${recipientId}`;
};

/**
 * Check if a notification was recently sent to avoid duplicates
 * @param {string} type - Notification type (product, vendor, order, etc.)
 * @param {string} entityId - ID of the entity
 * @param {string} action - Action performed
 * @param {string} recipientId - ID of the recipient (device token or topic)
 * @returns {boolean} - True if the notification was recently sent
 */
exports.wasRecentlySent = (type, entityId, action, recipientId) => {
  const key = generateNotificationKey(type, entityId, action, recipientId);
  return recentNotifications.has(key);
};

/**
 * Mark a notification as sent
 * @param {string} type - Notification type
 * @param {string} entityId - ID of the entity
 * @param {string} action - Action performed
 * @param {string} recipientId - ID of the recipient
 */
exports.markAsSent = (type, entityId, action, recipientId) => {
  const key = generateNotificationKey(type, entityId, action, recipientId);
  recentNotifications.set(key, Date.now());
  
  // Set expiration for this entry
  setTimeout(() => {
    recentNotifications.delete(key);
  }, NOTIFICATION_TTL);
};

/**
 * Clean up expired notification records
 * Called periodically to prevent memory leaks
 */
exports.cleanupExpiredRecords = () => {
  const now = Date.now();
  for (const [key, timestamp] of recentNotifications.entries()) {
    if (now - timestamp > NOTIFICATION_TTL) {
      recentNotifications.delete(key);
    }
  }
};

// Start a cleanup interval
setInterval(exports.cleanupExpiredRecords, NOTIFICATION_TTL);
