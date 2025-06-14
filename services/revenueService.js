const { Payment } = require('../models/Payment');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');
// const AppError = require('../utils/AppError');

/**
 * Service to handle vendor revenue calculations and tracking
 */
const revenueService = {
  /**
   * Calculate total revenue for a vendor by payment status
   * @param {number} vendorId - The vendor ID (customer_id in payments table)
   * @returns {Object} - Object containing revenue details by status
   */
  async getVendorRevenue(vendorId) {
    try {
      // Get all vendor revenue grouped by status
      const revenueByStatus = await Payment.findAll({
        attributes: [
          'status',
          [sequelize.fn('SUM', sequelize.col('amount')), 'total_revenue'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'transaction_count']
        ],
        where: {
          customer_id: vendorId
           // Ensure we only get vendor-related payments
          // We don't filter by refunded_amount here as we'll handle that separately
        },
        group: ['status']
      });

      // Calculate refunded amount for the vendor
      const refundedAmount = await Payment.sum('refunded_amount', {
        where: {
          customer_id: vendorId,
          customer_type: 'vendor',
          refunded_amount: {
            [Op.gt]: 0 // Only include records with refunded_amount > 0
          }
        }
      }) || 0;

      // Initialize revenue object with all possible statuses
      const revenue = {
        pending: 0,
        completed: 0,
        failed: 0,
        refunded: refundedAmount,
        total: 0,
        available: 0,
        transaction_count: 0
      };

      // Fill in actual values from database
      revenueByStatus.forEach(item => {
        const status = item.dataValues.status;
        const amount = parseFloat(item.dataValues.total_revenue) || 0;
        const count = parseInt(item.dataValues.transaction_count) || 0;
        
        if (revenue.hasOwnProperty(status)) {
          revenue[status] = amount;
        }
        
        revenue.transaction_count += count;
        revenue.total += amount;
      });

      // Calculate available balance (completed minus refunded)
      revenue.available = Math.max(0, revenue.completed - revenue.refunded);

      return revenue;
    } catch (error) {
      console.error('Error calculating vendor revenue:', error);
      throw new Error(`Failed to calculate vendor revenue: ${error.message}`);
    }
  },

  /**
   * Check if a vendor has sufficient available balance for a withdrawal
   * @param {number} vendorId - The vendor ID
   * @param {number} amount - The withdrawal amount to check
   * @returns {Object} - Object containing validation result and available balance
   */
  async validateWithdrawalAmount(vendorId, amount) {
    try {
      const revenue = await this.getVendorRevenue(vendorId);
      
      const isValid = revenue.available >= amount;
      
      return {
        isValid,
        available: revenue.available,
        requested: amount,
        shortfall: isValid ? 0 : (amount - revenue.available)
      };
    } catch (error) {
      console.error('Error validating withdrawal amount:', error);
      throw new Error(`Failed to validate withdrawal amount: ${error.message}`);
    }
  },

  /**
   * Get detailed revenue breakdown for dashboard display
   * @param {number} vendorId - The vendor ID
   * @returns {Object} - Detailed revenue statistics
   */
  async getRevenueStats(vendorId) {
    try {
      const revenue = await this.getVendorRevenue(vendorId);
      
      // Get monthly revenue trend for the last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const monthlyRevenue = await Payment.findAll({
        attributes: [
          [sequelize.fn('YEAR', sequelize.col('created_at')), 'year'],
          [sequelize.fn('MONTH', sequelize.col('created_at')), 'month'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'monthly_total'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: {
          customer_id: vendorId,
          customer_type: 'vendor',
          status: 'completed',
          created_at: {
            [Op.gte]: sixMonthsAgo
          }
        },
        group: [
          sequelize.fn('YEAR', sequelize.col('created_at')),
          sequelize.fn('MONTH', sequelize.col('created_at'))
        ],
        order: [
          [sequelize.fn('YEAR', sequelize.col('created_at')), 'ASC'],
          [sequelize.fn('MONTH', sequelize.col('created_at')), 'ASC']
        ]
      });
      
      // Format the monthly trend data
      const trend = monthlyRevenue.map(item => ({
        year: item.dataValues.year,
        month: item.dataValues.month,
        revenue: parseFloat(item.dataValues.monthly_total) || 0,
        count: parseInt(item.dataValues.count) || 0
      }));
      
      return {
        ...revenue,
        trend
      };
    } catch (error) {
      console.error('Error generating revenue statistics:', error);
      throw new Error(`Failed to generate revenue statistics: ${error.message}`);
    }
  }
};

module.exports = revenueService;
