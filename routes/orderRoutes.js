const express = require('express');
const orderController = require('../controllers/orderController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management endpoints
 */

/**
 * @swagger
 * /api/orders/store/{storeId}:
 *   get:
 *     summary: Get store orders
 *     description: Retrieve all orders for a specific store with pagination and filters
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: storeId
 *         in: path
 *         required: true
 *         description: Store ID
 *         schema:
 *           type: integer
 *       - $ref: '#/components/parameters/limit'
 *       - $ref: '#/components/parameters/page'
 *       - name: status
 *         in: query
 *         description: Filter by order status
 *         schema:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *       - name: startDate
 *         in: query
 *         description: Filter orders from this date (YYYY-MM-DD)
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         description: Filter orders until this date (YYYY-MM-DD)
 *         schema:
 *           type: string
 *           format: date
 *       - name: sort
 *         in: query
 *         description: Sort orders by field
 *         schema:
 *           type: string
 *           enum: [createdAt, total, status]
 *       - name: order
 *         in: query
 *         description: Sort direction
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
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
 *                     orders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           orderNumber:
 *                             type: string
 *                           customer_id:
 *                             type: integer
 *                           storeId:
 *                             type: integer
 *                           status:
 *                             type: string
 *                             enum: [pending, processing, shipped, delivered, cancelled]
 *                           total:
 *                             type: number
 *                             format: float
 *                           shippingAddress:
 *                             type: object
 *                           items:
 *                             type: array
 *                             items:
 *                               type: object
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     count:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/store/:storeId', authenticate, orderController.getOrdersByStoreId);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     description: Retrieve details of a specific order
 *     tags: [Orders]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Order ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
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
 *                     order:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         orderNumber:
 *                           type: string
 *                         customer_id:
 *                           type: integer
 *                         customer:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             name:
 *                               type: string
 *                             email:
 *                               type: string
 *                             phone:
 *                               type: string
 *                         storeId:
 *                           type: integer
 *                         store:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             name:
 *                               type: string
 *                         status:
 *                           type: string
 *                           enum: [pending, processing, shipped, delivered, cancelled]
 *                         total:
 *                           type: number
 *                           format: float
 *                         subTotal:
 *                           type: number
 *                           format: float
 *                         tax:
 *                           type: number
 *                           format: float
 *                         shippingFee:
 *                           type: number
 *                           format: float
 *                         discount:
 *                           type: number
 *                           format: float
 *                         shippingAddress:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                             phone:
 *                               type: string
 *                             address:
 *                               type: string
 *                             city:
 *                               type: string
 *                             state:
 *                               type: string
 *                             zipCode:
 *                               type: string
 *                             country:
 *                               type: string
 *                         billingAddress:
 *                           type: object
 *                         paymentMethod:
 *                           type: string
 *                         paymentStatus:
 *                           type: string
 *                         items:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               productId:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *                               price:
 *                                 type: number
 *                               quantity:
 *                                 type: integer
 *                               subtotal:
 *                                 type: number
 *                               image:
 *                                 type: string
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', orderController.getOrderById);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     summary: Update order status
 *     description: Update the status of an order (vendor only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Order ID
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
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *                 example: processing
 *               trackingNumber:
 *                 type: string
 *                 example: SHIP123456789
 *               trackingUrl:
 *                 type: string
 *                 example: https://shipping.com/track/SHIP123456789
 *               comments:
 *                 type: string
 *                 example: Order has been processed and will be shipped soon.
 *     responses:
 *       200:
 *         description: Order status updated successfully
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
 *                   example: Order status updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     order:
 *                       type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch('/:id/status', authenticate, orderController.updateOrderStatus);

module.exports = router;
