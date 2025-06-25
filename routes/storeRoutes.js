const express = require('express');
const storeController = require('../controllers/storeController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Stores
 *   description: Store management endpoints
 */

/**
 * @swagger
 * /api/stores:
 *   get:
 *     summary: Get all stores
 *     description: Retrieve a list of all stores with pagination
 *     tags: [Stores]
 *     parameters:
 *       - $ref: '#/components/parameters/limit'
 *       - $ref: '#/components/parameters/page'
 *       - name: status
 *         in: query
 *         description: Filter stores by status
 *         schema:
 *           type: string
 *           enum: [active, inactive, pending, rejected]
 *     responses:
 *       200:
 *         description: List of stores retrieved successfully
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
 *                     stores:
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
 *                           vendorId:
 *                             type: integer
 *                           status:
 *                             type: string
 *                             enum: [active, inactive, pending, rejected]
 *                           logo:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     count:
 *                       type: integer
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', storeController.getAllStores);

/**
 * @swagger
 * /api/stores/{id}:
 *   get:
 *     summary: Get store by ID
 *     description: Retrieve a store by its ID
 *     tags: [Stores]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Store ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Store details
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
 *                     store:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         description:
 *                           type: string
 *                         vendorId:
 *                           type: integer
 *                         status:
 *                           type: string
 *                           enum: [active, inactive, pending, rejected]
 *                         logo:
 *                           type: string
 *                         address:
 *                           type: string
 *                         contactEmail:
 *                           type: string
 *                         contactPhone:
 *                           type: string
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         vendor:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             name:
 *                               type: string
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', storeController.getStoreById);

/**
 * @swagger
 * /api/stores/vendor/{vendorId}:
 *   get:
 *     summary: Get stores by vendor ID
 *     description: Retrieve all stores belonging to a specific vendor
 *     tags: [Stores]
 *     parameters:
 *       - name: vendorId
 *         in: path
 *         required: true
 *         description: Vendor ID
 *         schema:
 *           type: integer
 *       - $ref: '#/components/parameters/limit'
 *       - $ref: '#/components/parameters/page'
 *     responses:
 *       200:
 *         description: List of vendor's stores
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
 *                     stores:
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
 *                           status:
 *                             type: string
 *                           logo:
 *                             type: string
 *                     count:
 *                       type: integer
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/vendor/:vendorId', storeController.getStoreByVendorId);

/**
 * @swagger
 * /api/stores/{id}:
 *   patch:
 *     summary: Update store
 *     description: Update store details
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Store ID
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
 *                 example: My Updated Store
 *               description:
 *                 type: string
 *                 example: A detailed store description
 *               address:
 *                 type: string
 *                 example: 123 Market St, City, Country
 *               contactEmail:
 *                 type: string
 *                 format: email
 *                 example: store@example.com
 *               contactPhone:
 *                 type: string
 *                 example: +919876543210
 *               operatingHours:
 *                 type: object
 *                 example: {"monday":"9:00 AM - 5:00 PM","tuesday":"9:00 AM - 5:00 PM"}
 *     responses:
 *       200:
 *         description: Store updated successfully
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
 *                     store:
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
router.patch('/:id', authenticate, storeController.updateStore);

/**
 * @swagger
 * /api/stores/{id}/status:
 *   patch:
 *     summary: Update store status
 *     description: Update a store's status (active/inactive)
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Store ID
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
 *                 enum: [active, inactive, pending, rejected]
 *                 example: active
 *     responses:
 *       200:
 *         description: Store status updated successfully
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
 *                   example: Store status updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     store:
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
router.patch('/:id/status', authenticate, storeController.updateStoreStatus);

/**
 * @swagger
 * /api/stores/{id}/verify-vendor:
 *   patch:
 *     summary: Verify store vendor
 *     description: Approve or reject a vendor's store (admin only)
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Store ID
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - approved
 *             properties:
 *               approved:
 *                 type: boolean
 *                 example: true
 *               comments:
 *                 type: string
 *                 example: Store meets all requirements
 *     responses:
 *       200:
 *         description: Vendor verification status updated
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
 *                   example: Store has been approved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch('/:id/verify-vendor', authenticate, storeController.verifyVendor);

module.exports = router;
