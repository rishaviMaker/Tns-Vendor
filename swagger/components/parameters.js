/**
 * @swagger
 * components:
 *   parameters:
 *     productId:
 *       name: id
 *       in: path
 *       required: true
 *       schema:
 *         type: integer
 *       description: The product ID
 *     
 *     storeId:
 *       name: id
 *       in: path
 *       required: true
 *       schema:
 *         type: integer
 *       description: The store ID
 *     
 *     couponId:
 *       name: id
 *       in: path
 *       required: true
 *       schema:
 *         type: integer
 *       description: The coupon/discount ID
 *
 *     vendorId:
 *       name: id
 *       in: path
 *       required: true
 *       schema:
 *         type: integer
 *       description: The vendor ID
 *
 *     categoryId:
 *       name: id
 *       in: path
 *       required: true
 *       schema:
 *         type: integer
 *       description: The category ID
 *
 *     limit:
 *       name: limit
 *       in: query
 *       schema:
 *         type: integer
 *         default: 10
 *       description: The number of items to return
 *     
 *     page:
 *       name: page
 *       in: query
 *       schema:
 *         type: integer
 *         default: 1
 *       description: The page number
 *     
 *     sort:
 *       name: sort
 *       in: query
 *       schema:
 *         type: string
 *         enum: [asc, desc]
 *         default: desc
 *       description: Sort order
 */
