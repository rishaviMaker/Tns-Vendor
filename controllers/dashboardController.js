const { Payment } = require('../models/Payment');
const { Order } = require('../models/Order');
const { Discount } = require('../models/Discount');
const { ProductRequest } = require('../models/ProductRequest');
const { Review } = require('../models/Review');
const { Store } = require('../models/Store');
const AppError = require('../utils/AppError');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');
const { CustomerWithdrawal } = require('../models/CustomerWithdrawal');

/**
 * Get dashboard statistics for a vendor
 * This provides a comprehensive overview of the vendor's business
 */
const dashboardController = {
  async getVendorDashboard(req, res, next) {
    try {
      const vendorId = req.user.id;
      console.log(vendorId);
      // Find the store associated with this vendor
      const store = await Store.findOne({
        where: { customerId: vendorId },
        attributes: ['id', 'name']
      });

      if (!store) {
        return next(new AppError('Vendor has no associated store', 400));
      }
      
      const storeId = store.id;
      
      // Get date ranges for different periods
      const now = new Date();
      const todayStart = new Date(now.setHours(0, 0, 0, 0));
      const last30Days = new Date(now);
      last30Days.setDate(last30Days.getDate() - 30);
      
      // Get total revenue
      const totalRevenue = await Payment.sum('amount', {
        where: {
          customer_id: vendorId,
          status: 'completed'
        }
      }) || 0;
      
      // Get orders count
      const ordersCount = await Order.count({
        where: { store_id: storeId }
      });
      
      // Get coupons count
      const couponsCount = await Discount.count({
        where: { store_id: storeId }
      });
      
      // Get reviews count
      const reviewsCount = await Review.count({
        where: { store_id: storeId }
      });
      
      // Get total withdrawals
      const totalWithdrawals = await CustomerWithdrawal.sum('amount', {
        where: {
          customer_id: vendorId,
          status: 'completed'
        }
      }) || 0;
      
      // Get total fees paid
      const totalFees = await CustomerWithdrawal.sum('fee', {
        where: {
          customer_id: vendorId,
          status: 'completed'
        }
      }) || 0;
      
      // Calculate current balance
      const currentBalance = totalRevenue - totalWithdrawals - totalFees;
      
      // Get revenue data for last 30 days - for graph
      const dailyRevenue = await Payment.findAll({
        attributes: [
          [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'revenue']
        ],
        where: {
          customer_id: vendorId,
          customer_type: 'vendor',
          status: 'completed',
          payment_type: 'revenue',
          created_at: {
            [Op.gte]: last30Days
          }
        },
        group: [sequelize.fn('DATE', sequelize.col('created_at'))],
        order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
      });
      
      // Process the data for the sales chart
      const salesChartData = dailyRevenue.map(item => ({
        date: item.get('date'),
        revenue: parseFloat(item.get('revenue') || 0).toFixed(2)
      }));
      
      // Get payment data by status (for pie chart)
      const paymentsByStatus = await Payment.findAll({
        attributes: [
          'status',
          [sequelize.fn('SUM', sequelize.col('amount')), 'total']
        ],
        where: {
          customer_id: vendorId,
          customer_type: 'vendor',
          created_at: {
            [Op.gte]: last30Days
          }
        },
        group: ['status']
      });
      
      // Format payment status data
      const paymentStatusData = {};
      paymentsByStatus.forEach(item => {
        paymentStatusData[item.status] = parseFloat(item.get('total') || 0).toFixed(2);
      });
      
      // Get recent orders
      const recentOrders = await Order.findAll({
        where: { store_id: storeId },
        order: [['created_at', 'DESC']],
        limit: 10
      });
      
      // Calculate earnings breakdown
      const earningsBreakdown = {
        withdrawals: parseFloat(totalWithdrawals).toFixed(2),
        fees: parseFloat(totalFees).toFixed(2),
        balance: parseFloat(currentBalance).toFixed(2)
      };
      
      // Format response data
      const dashboardData = {
        revenue: parseFloat(totalRevenue).toFixed(2),
        orders: ordersCount,
        coupons: couponsCount,
        reviews: reviewsCount,
        earnings: {
          total: parseFloat(totalRevenue).toFixed(2),
          balance: parseFloat(currentBalance).toFixed(2),
          breakdown: earningsBreakdown,
          period: 'last30days'
        },
        sales_report: {
          data: salesChartData,
          period: 'last30days'
        },
        payment_status: paymentStatusData,
        recent_orders: recentOrders
      };
      
      return res.status(200).json({
        status: 'success',
        data: dashboardData
      });
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      return next(new AppError(`Failed to fetch dashboard data: ${error.message}`, 500));
    }
  }
};

module.exports = dashboardController;
