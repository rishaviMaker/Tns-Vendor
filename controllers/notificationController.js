const { Notification } = require('../models/Notification');
const AppError = require('../utils/AppError');
const { Op } = require('sequelize');

/**
 * Get all notifications for the authenticated vendor
 * @route GET /api/vendors/notifications
 * @access Private (Vendor)
 */
exports.getNotifications = async (req, res, next) => {
  try {
    // Make sure we have a vendor from the authentication middleware
    const vendorId = req.user.id;
    console.log("vendorId", vendorId);
    console.log("request", req.path);
    
    if (!req.user || !req.user.id) {
      return next(new AppError('Authentication required. Please login.', 401));
    }
    
    // const vendorId = req.user.id;
    // console.log("vendorId",vendorId);
    const { page = 1, limit = 20, type, read } = req.query;
    
    // Build query conditions
    const whereClause = {
      vendor_id: vendorId
    };
    
    // Filter by notification type if provided
    if (type) {
      whereClause.type = type;
    }
    
    // Filter by read status if provided
    if (read !== undefined) {
      whereClause.is_read = read === 'true';
    }
    
    // Get paginated notifications
    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });
    
    // Process notifications - parse JSON data
    const processedNotifications = notifications.map(notification => {
      const notif = notification.toJSON();
      
      // Parse data JSON if exists
      if (notif.data && typeof notif.data === 'string') {
        try {
          notif.data = JSON.parse(notif.data);
        } catch (error) {
          console.error('Error parsing notification data:', error);
          notif.data = {};
        }
      }
      
      return notif;
    });
    
    // Count unread notifications
    const unreadCount = await Notification.count({
      where: {
        vendor_id: vendorId,
        is_read: false
      }
    });
    
    res.status(200).json({
      status: 'success',
      results: processedNotifications.length,
      total: count,
      unread: unreadCount,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        notifications: processedNotifications
      }
    });
  } catch (error) {
    console.error('Error in getNotifications:', error);
    next(new AppError(`Error fetching notifications: ${error.message}`, 500));
  }
};

/**
 * Mark a notification as read
 * @route PATCH /api/vendors/notifications/:id/read
 * @access Private (Vendor)
 */
exports.markAsRead = async (req, res, next) => {
  try {
    // Verify authentication
    if (!req.user || !req.user.id) {
      return next(new AppError('Authentication required. Please login.', 401));
    }
    
    const { id } = req.params;
    const vendorId = req.user.id;
    
    const notification = await Notification.findOne({
      where: {
        id: id,
        vendor_id: vendorId
      }
    });
    
    if (!notification) {
      return next(new AppError('Notification not found or you do not have permission to access it', 404));
    }
    
    // Update to mark as read
    notification.is_read = true;
    notification.updated_at = new Date();
    await notification.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Notification marked as read',
      data: {
        notification
      }
    });
  } catch (error) {
    console.error('Error in markAsRead:', error);
    next(new AppError(`Error updating notification: ${error.message}`, 500));
  }
};

/**
 * Mark all notifications as read
 * @route PATCH /api/vendors/notifications/mark-all-read
 * @access Private (Vendor)
 */
exports.markAllAsRead = async (req, res, next) => {
  try {
    // Verify authentication
    if (!req.user || !req.user.id) {
      return next(new AppError('Authentication required. Please login.', 401));
    }
    
    const vendorId = req.user.id;
    
    // Update all unread notifications
    await Notification.update(
      {
        is_read: true,
        updated_at: new Date()
      },
      {
        where: {
          vendor_id: vendorId,
          is_read: false
        }
      }
    );
    
    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error in markAllAsRead:', error);
    next(new AppError(`Error updating notifications: ${error.message}`, 500));
  }
};

/**
 * Delete a notification
 * @route DELETE /api/vendors/notifications/:id
 * @access Private (Vendor)
 */
exports.deleteNotification = async (req, res, next) => {
  try {
    // Verify authentication
    if (!req.user || !req.user.id) {
      return next(new AppError('Authentication required. Please login.', 401));
    }
    
    const { id } = req.params;
    const vendorId = req.user.id;
    
    const notification = await Notification.findOne({
      where: {
        id: id,
        vendor_id: vendorId
      }
    });
    
    if (!notification) {
      return next(new AppError('Notification not found or you do not have permission to access it', 404));
    }
    
    // Delete the notification
    await notification.destroy();
    
    res.status(200).json({
      status: 'success',
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteNotification:', error);
    next(new AppError(`Error deleting notification: ${error.message}`, 500));
  }
};

/**
 * Get notification count (unread)
 * @route GET /api/vendors/notifications/count
 * @access Private (Vendor)
 */
exports.getNotificationCount = async (req, res, next) => {
  try {
    // Verify authentication
    if (!req.user || !req.user.id) {
      return next(new AppError('Authentication required. Please login.', 401));
    }
    
    const vendorId = req.user.id;
    
    // Count unread notifications
    const unreadCount = await Notification.count({
      where: {
        vendor_id: vendorId,
        is_read: false
      }
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error in getNotificationCount:', error);
    next(new AppError(`Error fetching notification count: ${error.message}`, 500));
  }
};
