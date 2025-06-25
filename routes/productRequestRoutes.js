const express = require('express');
const productRequestController = require('../controllers/productRequestController');
const auth = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Product Requests
 *   description: Product requests management endpoints
 */

// Protect all routes
router.use(auth.authenticate);

/**
 * @swagger
 * /api/product-requests/create:
 *   post:
 *     summary: Create product request
 *     description: Submit a new product request
 *     tags: [Product Requests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the requested product
 *                 example: Organic Honey
 *               description:
 *                 type: string
 *                 description: Detailed description of the product
 *                 example: Raw organic honey sourced from local farms
 *               categoryId:
 *                 type: integer
 *                 description: Category ID for the product
 *                 example: 12
 *               brandName:
 *                 type: string
 *                 description: Brand name if applicable
 *                 example: Nature's Best
 *               estimatedPrice:
 *                 type: number
 *                 description: Estimated price for the product
 *                 format: float
 *                 example: 15.99
 *               quantity:
 *                 type: integer
 *                 description: Expected quantity to stock
 *                 example: 50
 *               specifications:
 *                 type: object
 *                 description: Additional specifications
 *                 example: {"size":"500ml","packaging":"Glass jar"}
 *               priority:
 *                 type: string
 *                 description: Request priority
 *                 enum: [low, medium, high]
 *                 example: medium
 *     responses:
 *       201:
 *         description: Product request created successfully
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
 *                   example: Product request created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     status:
 *                       type: string
 *                       example: pending
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/create', productRequestController.createProductRequest);

/**
 * @swagger
 * /api/product-requests:
 *   get:
 *     summary: Get all product requests
 *     description: Retrieve all product requests for the authenticated vendor
 *     tags: [Product Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/limit'
 *       - $ref: '#/components/parameters/page'
 *       - name: status
 *         in: query
 *         description: Filter by request status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, cancelled]
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
 *       - name: sort
 *         in: query
 *         description: Field to sort by
 *         schema:
 *           type: string
 *           enum: [createdAt, name, status]
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
 *         description: Product requests retrieved successfully
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
 *                     requests:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                           categoryId:
 *                             type: integer
 *                           categoryName:
 *                             type: string
 *                           status:
 *                             type: string
 *                             enum: [pending, approved, rejected, cancelled]
 *                           estimatedPrice:
 *                             type: number
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                     count:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', productRequestController.getAllProductRequests);

/**
 * @swagger
 * /api/product-requests/{id}:
 *   get:
 *     summary: Get product request details
 *     description: Retrieve details for a specific product request
 *     tags: [Product Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Product request ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product request retrieved successfully
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
 *                     request:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         description:
 *                           type: string
 *                         categoryId:
 *                           type: integer
 *                         category:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             name:
 *                               type: string
 *                         brandName:
 *                           type: string
 *                         estimatedPrice:
 *                           type: number
 *                           format: float
 *                         quantity:
 *                           type: integer
 *                         specifications:
 *                           type: object
 *                         status:
 *                           type: string
 *                           enum: [pending, approved, rejected, cancelled]
 *                         vendorId:
 *                           type: integer
 *                         adminNotes:
 *                           type: string
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
router.get('/:id', productRequestController.getProductRequestById);

/**
 * @swagger
 * /api/product-requests/{id}:
 *   patch:
 *     summary: Update product request
 *     description: Update a pending product request
 *     tags: [Product Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Product request ID
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Product Name
 *               description:
 *                 type: string
 *                 example: Updated product description
 *               categoryId:
 *                 type: integer
 *               brandName:
 *                 type: string
 *               estimatedPrice:
 *                 type: number
 *                 format: float
 *               quantity:
 *                 type: integer
 *               specifications:
 *                 type: object
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *     responses:
 *       200:
 *         description: Product request updated successfully
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
 *                   example: Product request updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     request:
 *                       type: object
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
router.patch('/:id', productRequestController.updateProductRequest);

/**
 * @swagger
 * /api/product-requests/{id}:
 *   delete:
 *     summary: Cancel product request
 *     description: Cancel a pending product request
 *     tags: [Product Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Product request ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product request cancelled successfully
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
 *                   example: Product request cancelled successfully
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
router.delete('/:id', productRequestController.cancelProductRequest);

module.exports = router;
