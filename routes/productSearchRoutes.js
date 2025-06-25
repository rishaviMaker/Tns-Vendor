const express = require('express');
const router = express.Router();
const productSearchController = require('../controllers/productSearchController');
const authMiddleware = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Product Catalog
 *   description: Product catalog search and request endpoints
 */

// Protect all routes - require authentication
router.use(authMiddleware.authenticate);
router.use(authMiddleware.authorize('vendor'));

/**
 * @swagger
 * /api/product-search/catalog:
 *   get:
 *     summary: Search catalog products
 *     description: Search and filter products available in the marketplace catalog
 *     tags: [Product Catalog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: q
 *         in: query
 *         description: Search query term
 *         schema:
 *           type: string
 *       - name: category
 *         in: query
 *         description: Filter by category ID
 *         schema:
 *           type: integer
 *       - name: brand
 *         in: query
 *         description: Filter by brand name
 *         schema:
 *           type: string
 *       - name: minPrice
 *         in: query
 *         description: Minimum price filter
 *         schema:
 *           type: number
 *       - name: maxPrice
 *         in: query
 *         description: Maximum price filter
 *         schema:
 *           type: number
 *       - name: attributes
 *         in: query
 *         description: Product attributes as JSON string
 *         schema:
 *           type: string
 *           example: '{"color":"red","size":"XL"}'
 *       - $ref: '#/components/parameters/limit'
 *       - $ref: '#/components/parameters/page'
 *       - name: sort
 *         in: query
 *         description: Sort field
 *         schema:
 *           type: string
 *           enum: [name, price, popularity]
 *       - name: order
 *         in: query
 *         description: Sort direction
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Catalog products retrieved successfully
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
 *                     products:
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
 *                           price:
 *                             type: number
 *                           categoryId:
 *                             type: integer
 *                           category:
 *                             type: string
 *                           brand:
 *                             type: string
 *                           images:
 *                             type: array
 *                             items:
 *                               type: string
 *                           attributes:
 *                             type: object
 *                     count:
 *                       type: integer
 *                     filters:
 *                       type: object
 *                       properties:
 *                         categories:
 *                           type: array
 *                           items:
 *                             type: object
 *                         brands:
 *                           type: array
 *                           items:
 *                             type: string
 *                         priceRange:
 *                           type: object
 *                           properties:
 *                             min:
 *                               type: number
 *                             max:
 *                               type: number
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/catalog', productSearchController.searchCatalogProducts);

/**
 * @swagger
 * /api/product-search/catalog/{id}:
 *   get:
 *     summary: Get catalog product details
 *     description: Retrieve detailed information about a specific catalog product
 *     tags: [Product Catalog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Catalog Product ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product details retrieved successfully
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
 *                     product:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         description:
 *                           type: string
 *                         price:
 *                           type: number
 *                         categoryId:
 *                           type: integer
 *                         category:
 *                           type: object
 *                         brand:
 *                           type: string
 *                         images:
 *                           type: array
 *                           items:
 *                             type: string
 *                         attributes:
 *                           type: object
 *                         variants:
 *                           type: array
 *                           items:
 *                             type: object
 *                         specifications:
 *                           type: array
 *                           items:
 *                             type: object
 *                         relatedProducts:
 *                           type: array
 *                           items:
 *                             type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/catalog/:id', productSearchController.getCatalogProductById);

/**
 * @swagger
 * /api/product-search/request:
 *   post:
 *     summary: Request new product
 *     description: Submit a request for a new product to be added to the catalog
 *     tags: [Product Catalog]
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
 *               - categoryId
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *                 example: High-performance Blender
 *               categoryId:
 *                 type: integer
 *                 example: 25
 *               description:
 *                 type: string
 *                 example: Professional-grade blender with multiple speed settings
 *               brand:
 *                 type: string
 *                 example: KitchenPro
 *               attributes:
 *                 type: object
 *                 example: {"power":"1200W","capacity":"2L","color":"Silver"}
 *               price:
 *                 type: number
 *                 format: float
 *                 example: 149.99
 *               expectedQuantity:
 *                 type: integer
 *                 example: 100
 *               notes:
 *                 type: string
 *                 example: Would like to stock this product for the holiday season
 *     responses:
 *       201:
 *         description: Product request submitted successfully
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
 *                   example: Product request submitted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     requestId:
 *                       type: integer
 *                     status:
 *                       type: string
 *                       example: pending
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/request', productSearchController.requestNewProduct);

/**
 * @swagger
 * /api/product-search/requests:
 *   get:
 *     summary: Get vendor product requests
 *     description: Retrieve all product requests made by the vendor
 *     tags: [Product Catalog]
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
 *           enum: [pending, approved, rejected]
 *       - name: sort
 *         in: query
 *         description: Sort field
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
 *                           categoryId:
 *                             type: integer
 *                           category:
 *                             type: string
 *                           description:
 *                             type: string
 *                           status:
 *                             type: string
 *                             enum: [pending, approved, rejected]
 *                           submittedAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                           notes:
 *                             type: string
 *                           adminNotes:
 *                             type: string
 *                     count:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/requests', productSearchController.getVendorProductRequests);

module.exports = router;
