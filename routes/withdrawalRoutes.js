const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawalController');
const { authenticate } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Withdrawals
 *   description: Vendor withdrawal management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Withdrawal:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Withdrawal ID
 *         vendorId:
 *           type: integer
 *           description: ID of the vendor
 *         amount:
 *           type: number
 *           format: float
 *           description: Withdrawal amount
 *         currency:
 *           type: string
 *           description: Currency code
 *         status:
 *           type: string
 *           enum: [pending, processing, completed, failed, cancelled]
 *           description: Current status of the withdrawal
 *         paymentMethod:
 *           type: string
 *           enum: [bank_transfer, paypal, wallet, other]
 *           description: Method of withdrawal
 *         bankDetails:
 *           type: object
 *           description: Bank account details if payment method is bank_transfer
 *         paymentReference:
 *           type: string
 *           description: External payment reference
 *         notes:
 *           type: string
 *           description: Additional notes
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when withdrawal was created
 *         processedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when withdrawal was processed
 */

// Protect all withdrawal routes with authentication
router.use(authenticate);

/**
 * @swagger
 * /api/withdrawals:
 *   get:
 *     summary: Get all withdrawals
 *     description: Retrieve all withdrawals for the authenticated vendor with optional filtering
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/limit'
 *       - $ref: '#/components/parameters/page'
 *       - name: status
 *         in: query
 *         description: Filter by withdrawal status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed, cancelled]
 *       - name: startDate
 *         in: query
 *         description: Filter by start date (YYYY-MM-DD)
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         description: Filter by end date (YYYY-MM-DD)
 *         schema:
 *           type: string
 *           format: date
 *       - name: minAmount
 *         in: query
 *         description: Minimum amount filter
 *         schema:
 *           type: number
 *       - name: maxAmount
 *         in: query
 *         description: Maximum amount filter
 *         schema:
 *           type: number
 *       - name: sort
 *         in: query
 *         description: Sort field
 *         schema:
 *           type: string
 *           enum: [createdAt, amount, status]
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
 *         description: Withdrawals retrieved successfully
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
 *                     withdrawals:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Withdrawal'
 *                     count:
 *                       type: integer
 *                       description: Total number of withdrawals matching the criteria
 *                     totalAmount:
 *                       type: number
 *                       description: Sum of all filtered withdrawal amounts
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', withdrawalController.getWithdrawals);

/**
 * @swagger
 * /api/withdrawals/export-csv:
 *   get:
 *     summary: Export withdrawals as CSV
 *     description: Export filtered withdrawals as a CSV file
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: status
 *         in: query
 *         description: Filter by withdrawal status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed, cancelled]
 *       - name: startDate
 *         in: query
 *         description: Filter by start date (YYYY-MM-DD)
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         description: Filter by end date (YYYY-MM-DD)
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: CSV file containing withdrawal records
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/export-csv', withdrawalController.exportWithdrawalsCSV);

/**
 * @swagger
 * /api/withdrawals/export-excel:
 *   get:
 *     summary: Export withdrawals as Excel
 *     description: Export filtered withdrawals as an Excel file
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: status
 *         in: query
 *         description: Filter by withdrawal status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed, cancelled]
 *       - name: startDate
 *         in: query
 *         description: Filter by start date (YYYY-MM-DD)
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         description: Filter by end date (YYYY-MM-DD)
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Excel file containing withdrawal records
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/export-excel', withdrawalController.exportWithdrawalsExcel);

/**
 * @swagger
 * /api/withdrawals/{id}:
 *   get:
 *     summary: Get withdrawal details
 *     description: Retrieve detailed information for a specific withdrawal
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Withdrawal ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Withdrawal details retrieved successfully
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
 *                     withdrawal:
 *                       $ref: '#/components/schemas/Withdrawal'
 *                     timeline:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                           notes:
 *                             type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', withdrawalController.getWithdrawalById);

/**
 * @swagger
 * /api/withdrawals:
 *   post:
 *     summary: Create withdrawal request
 *     description: Submit a new withdrawal request
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - paymentMethod
 *             properties:
 *               amount:
 *                 type: number
 *                 format: float
 *                 description: Amount to withdraw
 *                 minimum: 1
 *                 example: 500
 *               paymentMethod:
 *                 type: string
 *                 enum: [bank_transfer, paypal, wallet, other]
 *                 description: Method of withdrawal
 *                 example: bank_transfer
 *               bankDetails:
 *                 type: object
 *                 description: Required if payment method is bank_transfer
 *                 properties:
 *                   bankName:
 *                     type: string
 *                     example: Bank of Example
 *                   accountNumber:
 *                     type: string
 *                     example: "1234567890"
 *                   accountHolderName:
 *                     type: string
 *                     example: John Doe
 *                   branchCode:
 *                     type: string
 *                     example: "001"
 *                   swiftCode:
 *                     type: string
 *                     example: EXAMPLECODE
 *               paypalEmail:
 *                 type: string
 *                 format: email
 *                 description: Required if payment method is paypal
 *                 example: vendor@example.com
 *               notes:
 *                 type: string
 *                 description: Additional notes for the withdrawal
 *                 example: Monthly revenue withdrawal
 *     responses:
 *       201:
 *         description: Withdrawal request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Withdrawal request submitted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     withdrawalId:
 *                       type: integer
 *                     estimatedProcessingTime:
 *                       type: string
 *                       example: 3-5 business days
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - Insufficient balance or daily limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Insufficient balance or daily withdrawal limit exceeded
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/', withdrawalController.createWithdrawal);

/**
 * @swagger
 * /api/withdrawals/{id}/cancel:
 *   patch:
 *     summary: Cancel withdrawal request
 *     description: Cancel a pending withdrawal request
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Withdrawal ID
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for cancellation
 *                 example: Changed my mind
 *     responses:
 *       200:
 *         description: Withdrawal cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Withdrawal request cancelled successfully
 *       400:
 *         description: Bad request - Cannot cancel withdrawal that is not in pending status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Only pending withdrawals can be cancelled
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch('/:id/cancel', withdrawalController.cancelWithdrawal);

/**
 * @swagger
 * /api/withdrawals/{id}/retry:
 *   post:
 *     summary: Retry failed withdrawal
 *     description: Retry a previously failed withdrawal request
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Withdrawal ID
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               updatedDetails:
 *                 type: object
 *                 description: Updated payment details if needed
 *     responses:
 *       200:
 *         description: Withdrawal retry initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Withdrawal retry initiated successfully
 *       400:
 *         description: Bad request - Only failed withdrawals can be retried
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Only failed withdrawals can be retried
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/:id/retry', withdrawalController.retryWithdrawal);

/**
 * @swagger
 * /api/withdrawals/{id}/status:
 *   patch:
 *     summary: Update withdrawal status
 *     description: Update the status of a withdrawal (admin only)
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Withdrawal ID
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [processing, completed, failed]
 *                 description: New status for the withdrawal
 *               notes:
 *                 type: string
 *                 description: Admin notes about the status change
 *               paymentReference:
 *                 type: string
 *                 description: Payment reference for completed withdrawals
 *     responses:
 *       200:
 *         description: Withdrawal status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Withdrawal status updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - Requires admin role
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Admin access required
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch('/:id/status', withdrawalController.updateWithdrawalStatus);

module.exports = router;
