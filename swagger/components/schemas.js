/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - price
 *         - categoryId
 *         - storeId
 *       properties:
 *         id:
 *           type: integer
 *           description: Auto-generated product ID
 *         title:
 *           type: string
 *           description: Product title
 *         description:
 *           type: string
 *           description: Product description
 *         price:
 *           type: number
 *           format: float
 *           description: Product price
 *         discountedPrice:
 *           type: number
 *           format: float
 *           description: Discounted product price
 *         categoryId:
 *           type: integer
 *           description: Category ID the product belongs to
 *         storeId:
 *           type: integer
 *           description: Store ID the product belongs to
 *         inventory:
 *           type: integer
 *           description: Product inventory count
 *         imageUrl:
 *           type: string
 *           description: Main product image URL
 *         additionalImages:
 *           type: array
 *           items:
 *             type: string
 *           description: Additional product images
 *         isActive:
 *           type: boolean
 *           description: Whether the product is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Product creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Product last update timestamp
 *     
 *     Coupon:
 *       type: object
 *       required:
 *         - code
 *         - discountType
 *         - discountValue
 *         - storeId
 *       properties:
 *         id:
 *           type: integer
 *           description: Auto-generated coupon ID
 *         code:
 *           type: string
 *           description: Coupon code
 *         discountType:
 *           type: string
 *           enum: [percentage, fixed_amount, shipping]
 *           description: Type of discount offered
 *         discountValue:
 *           type: number
 *           description: Value of the discount
 *         storeId:
 *           type: integer
 *           description: Store the coupon belongs to
 *         productId:
 *           type: integer
 *           description: Optional product ID if coupon is product-specific
 *         minPurchase:
 *           type: number
 *           description: Minimum purchase amount required
 *         maxUses:
 *           type: integer
 *           description: Maximum number of times the coupon can be used
 *         usageCount:
 *           type: integer
 *           description: Current usage count
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Coupon validity start date
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Coupon validity end date
 *         isActive:
 *           type: boolean
 *           description: Whether the coupon is active
 *     
 *     Error:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: error
 *         message:
 *           type: string
 *           example: Error message details
 *     
 *     ValidationError:
 *       allOf:
 *         - $ref: '#/components/schemas/Error'
 *         - type: object
 *           properties:
 *             errors:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   field:
 *                     type: string
 *                   message:
 *                     type: string
 */
