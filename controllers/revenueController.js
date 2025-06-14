const { Payment } = require('../models/Payment');
const AppError = require('../utils/AppError');
const revenueService = require('../services/revenueService');

/**
 * Get revenue summary for the authenticated vendor
 * This provides a breakdown of revenue by status (pending, completed, etc.)
 */
exports.getRevenueSummary = async (req, res, next) => {
  try {
    const vendorId = req.user.id;
    
    const revenue = await revenueService.getVendorRevenue(vendorId);
    
    return res.status(200).json({
      status: 'success',
      data: {
        revenue
      }
    });
  } catch (error) {
    console.error('Error getting revenue summary:', error);
    return next(new AppError(`Failed to fetch revenue summary: ${error.message}`, 500));
  }
};

/**
 * Get detailed revenue statistics for vendor dashboard
 * Includes monthly trends and revenue breakdown
 */
exports.getRevenueStats = async (req, res, next) => {
  try {
    const vendorId = req.user.id;
    
    const stats = await revenueService.getRevenueStats(vendorId);
    
    return res.status(200).json({
      status: 'success',
      data: {
        stats
      }
    });
  } catch (error) {
    console.error('Error getting revenue stats:', error);
    return next(new AppError(`Failed to fetch revenue statistics: ${error.message}`, 500));
  }
};

/**
 * Get recent payment transactions for the vendor
 */
exports.getRecentTransactions = async (req, res, next) => {
  try {
    const vendorId = req.user.id;
    const { limit = 10, offset = 0, status } = req.query;
    
    // Build the query conditions
    const whereClause = {
      customer_id: vendorId,
      customer_type: 'vendor'
    };
    
    // Add status filter if provided
    if (status) {
      whereClause.status = status;
    }
    
    const transactions = await Payment.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    const totalCount = await Payment.count({
      where: whereClause
    });
    
    return res.status(200).json({
      status: 'success',
      results: transactions.length,
      total: totalCount,
      data: {
        transactions
      }
    });
  } catch (error) {
    console.error('Error getting recent transactions:', error);
    return next(new AppError(`Failed to fetch recent transactions: ${error.message}`, 500));
  }
};

/**
 * Get payment transaction by ID
 * Vendors can only view their own transactions
 */
exports.getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;
    
    const transaction = await Payment.findOne({
      where: {
        id,
        customer_id: vendorId,
        customer_type: 'vendor'
      }
    });
    
    if (!transaction) {
      return next(new AppError('Transaction not found or you do not have permission to view it', 404));
    }
    
    return res.status(200).json({
      status: 'success',
      data: {
        transaction
      }
    });
  } catch (error) {
    console.error('Error getting transaction details:', error);
    return next(new AppError(`Failed to fetch transaction details: ${error.message}`, 500));
  }
};
