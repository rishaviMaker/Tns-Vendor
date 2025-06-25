const express = require('express');
const categoryController = require('../controllers/categoryController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Product category management endpoints
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories
 *     description: Retrieve a list of all product categories with pagination
 *     tags: [Categories]
 *     parameters:
 *       - $ref: '#/components/parameters/limit'
 *       - $ref: '#/components/parameters/page'
 *       - name: parentId
 *         in: query
 *         schema:
 *           type: integer
 *         description: Filter by parent category ID
 *     responses:
 *       200:
 *         description: List of categories retrieved successfully
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
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           slug:
 *                             type: string
 *                           description:
 *                             type: string
 *                           parentId:
 *                             type: integer
 *                             nullable: true
 *                           image:
 *                             type: string
 *                           level:
 *                             type: integer
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     count:
 *                       type: integer
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', categoryController.getAllCategories);

/**
 * @swagger
 * /api/categories/tree:
 *   get:
 *     summary: Get category tree
 *     description: Retrieve a hierarchical tree of all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Category tree retrieved successfully
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
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           slug:
 *                             type: string
 *                           description:
 *                             type: string
 *                           image:
 *                             type: string
 *                           level:
 *                             type: integer
 *                           children:
 *                             type: array
 *                             items:
 *                               $ref: '#/components/schemas/Category'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/tree', categoryController.getCategoryTree);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     description: Retrieve a category by its ID
 *     tags: [Categories]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Category ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Category details
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
 *                     category:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         slug:
 *                           type: string
 *                         description:
 *                           type: string
 *                         parentId:
 *                           type: integer
 *                           nullable: true
 *                         image:
 *                           type: string
 *                         level:
 *                           type: integer
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', categoryController.getCategoryById);

/**
 * @swagger
 * /api/categories/{id}/subcategories:
 *   get:
 *     summary: Get subcategories
 *     description: Retrieve all subcategories of a specific category
 *     tags: [Categories]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Parent category ID
 *         schema:
 *           type: integer
 *       - $ref: '#/components/parameters/limit'
 *       - $ref: '#/components/parameters/page'
 *     responses:
 *       200:
 *         description: List of subcategories
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
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           slug:
 *                             type: string
 *                           description:
 *                             type: string
 *                           parentId:
 *                             type: integer
 *                           image:
 *                             type: string
 *                           level:
 *                             type: integer
 *                     count:
 *                       type: integer
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id/subcategories', categoryController.getSubcategories);

module.exports = router;
