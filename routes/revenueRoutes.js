const express = require('express');
const router = express.Router();
const revenueController = require('../controllers/revenueController');
const authMiddleware = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Revenue
 *   description: Revenue and transaction management endpoints
 */

// Protect all routes - require authentication
router.use(authMiddleware.authenticate);
router.use(authMiddleware.authorize('vendor'));

/**
 * @swagger
 * /api/revenue/summary:
 *   get:
 *     summary: Get revenue summary
 *     description: Retrieve summarized revenue data for the vendor with filtering options
 *     tags: [Revenue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: period
 *         in: query
 *         description: Time period for the summary
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly, all]
 *           default: monthly
 *       - name: startDate
 *         in: query
 *         description: Start date for custom period (YYYY-MM-DD)
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         description: End date for custom period (YYYY-MM-DD)
 *         schema:
 *           type: string
 *           format: date
 *       - name: storeId
 *         in: query
 *         description: Filter by store ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Revenue summary retrieved successfully
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
 *                     totalRevenue:
 *                       type: number
 *                       format: float
 *                       example: 25750.50
 *                     totalOrders:
 *                       type: integer
 *                       example: 385
 *                     averageOrderValue:
 *                       type: number
 *                       format: float
 *                       example: 66.88
 *                     pendingPayouts:
 *                       type: number
 *                       format: float
 *                       example: 8760.25
 *                     lastPayout:
 *                       type: object
 *                       properties:
 *                         amount:
 *                           type: number
 *                           format: float
 *                           example: 3520.75
 *                         date:
 *                           type: string
 *                           format: date-time
 *                           example: "2023-05-15T10:30:00Z"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/summary', revenueController.getRevenueSummary);

/**
 * @swagger
 * /api/revenue/stats:
 *   get:
 *     summary: Get revenue statistics
 *     description: Retrieve detailed revenue statistics and charts data
 *     tags: [Revenue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: period
 *         in: query
 *         description: Time period for statistics
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly, all]
 *           default: monthly
 *       - name: storeId
 *         in: query
 *         description: Filter by store ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Revenue statistics retrieved successfully
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
 *                     revenueByCategory:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             type: string
 *                           amount:
 *                             type: number
 *                           percentage:
 *                             type: number
 *                     revenueByProduct:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           productId:
 *                             type: integer
 *                           productName:
 *                             type: string
 *                           amount:
 *                             type: number
 *                     revenueOverTime:
 *                       type: object
 *                       properties:
 *                         labels:
 *                           type: array
 *                           items:
 *                             type: string
 *                         data:
 *                           type: array
 *                           items:
 *                             type: number
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/stats', revenueController.getRevenueStats);

/**
 * @swagger
 * /api/revenue/transactions:
 *   get:
 *     summary: Get recent transactions
 *     description: Retrieve a list of recent revenue transactions with pagination
 *     tags: [Revenue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/limit'
 *       - $ref: '#/components/parameters/page'
 *       - name: type
 *         in: query
 *         description: Filter by transaction type
 *         schema:
 *           type: string
 *           enum: [order, payout, refund, adjustment]
 *       - name: status
 *         in: query
 *         description: Filter by transaction status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, cancelled]
 *       - name: startDate
 *         in: query
 *         description: Start date for transactions (YYYY-MM-DD)
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         description: End date for transactions (YYYY-MM-DD)
 *         schema:
 *           type: string
 *           format: date
 *       - name: sort
 *         in: query
 *         description: Field to sort by
 *         schema:
 *           type: string
 *           enum: [createdAt, amount, type]
 *           default: createdAt
 *       - name: order
 *         in: query
 *         description: Sort direction
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
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
 *                     transactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           referenceId:
 *                             type: string
 *                           type:
 *                             type: string
 *                             enum: [order, payout, refund, adjustment]
 *                           amount:
 *                             type: number
 *                             format: float
 *                           status:
 *                             type: string
 *                             enum: [pending, completed, failed, cancelled]
 *                           description:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     count:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/transactions', revenueController.getRecentTransactions);

/**
 * @swagger
 * /api/revenue/transactions/{id}:
 *   get:
 *     summary: Get transaction by ID
 *     description: Retrieve details of a specific transaction
 *     tags: [Revenue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Transaction ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Transaction details retrieved successfully
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
 *                     transaction:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         referenceId:
 *                           type: string
 *                         type:
 *                           type: string
 *                           enum: [order, payout, refund, adjustment]
 *                         amount:
 *                           type: number
 *                           format: float
 *                         fee:
 *                           type: number
 *                           format: float
 *                         net:
 *                           type: number
 *                           format: float
 *                         status:
 *                           type: string
 *                           enum: [pending, completed, failed, cancelled]
 *                         description:
 *                           type: string
 *                         metadata:
 *                           type: object
 *                           description: Additional transaction data depending on type
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/transactions/:id', revenueController.getTransactionById);

module.exports = router;
