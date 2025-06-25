const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Vendor dashboard data endpoints
 */

// Protect all routes - only authenticated vendors can access
router.use(authenticate);

/**
 * @swagger
 * /api/dashboard/details:
 *   get:
 *     summary: Get vendor dashboard details
 *     description: Retrieve comprehensive dashboard data including revenue metrics, order statistics, and recent activities for the authenticated vendor
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: period
 *         in: query
 *         description: Period for the dashboard data
 *         schema:
 *           type: string
 *           enum: [today, week, month, year, all]
 *           default: month
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalRevenue:
 *                           type: number
 *                           format: float
 *                           example: 12500.75
 *                         totalOrders:
 *                           type: integer
 *                           example: 157
 *                         pendingOrders:
 *                           type: integer
 *                           example: 12
 *                         totalProducts:
 *                           type: integer
 *                           example: 48
 *                         totalCustomers:
 *                           type: integer
 *                           example: 87
 *                     revenueChart:
 *                       type: object
 *                       properties:
 *                         labels:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["Jan", "Feb", "Mar", "Apr", "May"]
 *                         data:
 *                           type: array
 *                           items:
 *                             type: number
 *                           example: [1200, 1900, 1300, 2100, 1700]
 *                     ordersChart:
 *                       type: object
 *                       properties:
 *                         labels:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]
 *                         data:
 *                           type: array
 *                           items:
 *                             type: number
 *                           example: [12, 25, 38, 72, 10]
 *                     recentOrders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           orderNumber:
 *                             type: string
 *                           customerName:
 *                             type: string
 *                           total:
 *                             type: number
 *                           status:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/details', dashboardController.getVendorDashboard);

module.exports = router;
