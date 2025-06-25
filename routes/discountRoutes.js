const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discountController');
const { authenticate } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Coupons
 *   description: Coupon/Discount management APIs
 */

// All routes are protected - require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/coupons:
 *   get:
 *     summary: Get all coupons
 *     description: Retrieve a list of all coupons for the authenticated vendor's stores
 *     tags: [Coupons]
 *     parameters:
 *       - $ref: '#/components/parameters/limit'
 *       - $ref: '#/components/parameters/page'
 *       - name: storeId
 *         in: query
 *         schema:
 *           type: integer
 *         description: Filter coupons by store ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of coupons
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
 *                     coupons:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Coupon'
 *                     count:
 *                       type: integer
 *                       example: 10
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', discountController.getCoupons);

/**
 * @swagger
 * /api/coupons/generate-code:
 *   get:
 *     summary: Generate a unique coupon code
 *     description: Generate a random unique coupon code that can be used when creating a new coupon
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A unique coupon code
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
 *                     code:
 *                       type: string
 *                       example: SUMMER25
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/generate-code', discountController.generateCouponCode);

/**
 * @swagger
 * /api/coupons/{id}:
 *   get:
 *     summary: Get a coupon by ID
 *     description: Retrieve a coupon by its ID
 *     tags: [Coupons]
 *     parameters:
 *       - $ref: '#/components/parameters/couponId'
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Coupon details
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
 *                     coupon:
 *                       $ref: '#/components/schemas/Coupon'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', discountController.getCouponById);

/**
 * @swagger
 * /api/coupons:
 *   post:
 *     summary: Create a new coupon
 *     description: Create a new coupon/discount for a store
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - discountType
 *               - discountValue
 *               - storeId
 *             properties:
 *               code:
 *                 type: string
 *                 example: SUMMER25
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed_amount, shipping]
 *                 example: percentage
 *               discountValue:
 *                 type: number
 *                 example: 25
 *               storeId:
 *                 type: integer
 *                 example: 1
 *               productId:
 *                 type: integer
 *                 example: null
 *               minPurchase:
 *                 type: number
 *                 example: 100
 *               maxUses:
 *                 type: integer
 *                 example: 100
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-06-01T00:00:00.000Z
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-06-30T23:59:59.000Z
 *     responses:
 *       201:
 *         description: Coupon created successfully
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
 *                     coupon:
 *                       $ref: '#/components/schemas/Coupon'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/', discountController.createCoupon);

/**
 * @swagger
 * /api/coupons/{id}:
 *   patch:
 *     summary: Update a coupon
 *     description: Update an existing coupon/discount
 *     tags: [Coupons]
 *     parameters:
 *       - $ref: '#/components/parameters/couponId'
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed_amount, shipping]
 *               discountValue:
 *                 type: number
 *               productId:
 *                 type: integer
 *               minPurchase:
 *                 type: number
 *               maxUses:
 *                 type: integer
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Coupon updated successfully
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
 *                     coupon:
 *                       $ref: '#/components/schemas/Coupon'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch('/:id', discountController.updateCoupon);

/**
 * @swagger
 * /api/coupons/{id}:
 *   delete:
 *     summary: Delete a coupon
 *     description: Delete a coupon by its ID
 *     tags: [Coupons]
 *     parameters:
 *       - $ref: '#/components/parameters/couponId'
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Coupon deleted successfully
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
 *                   example: Coupon deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/:id', discountController.deleteCoupon);

module.exports = router;
