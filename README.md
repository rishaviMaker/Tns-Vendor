# Simplified Vendor Backend System

A Node.js backend system focused exclusively on vendor/seller management with MySQL database integration.

## Features

- **Vendor Authentication**: Secure login and registration system with JWT authentication specifically for vendors.
- **Vendor Management**: Complete vendor profile management system.
- **Store Management**: Create and manage vendor stores with products and categories.
- **Order Management**: Track and manage customer orders.
- **Coupon Management**: Create and manage discount coupons with various types and conditions.
- **Withdrawal Management**: Request and track fund withdrawals with different payment channels and status tracking.
- **Push Notifications**: Real-time notifications using Firebase Cloud Messaging.

## Tech Stack

- **Node.js**: Backend JavaScript runtime
- **Express.js**: Web framework for Node.js
- **MySQL**: Relational database
- **Sequelize**: ORM for MySQL
- **JWT**: JSON Web Tokens for authentication
- **Firebase Admin SDK**: For push notifications

## Project Structure

```
├── config/             # Configuration files
│   ├── db.js          # Database configuration
│   └── firebase.js    # Firebase configuration
├── controllers/        # Request handlers
│   ├── vendorController.js
│   ├── storeController.js
│   ├── productController.js
│   ├── categoryController.js
│   ├── orderController.js
│   └── discountController.js
├── middlewares/        # Custom middleware functions
│   ├── auth.js        # Authentication middleware
│   └── errorHandler.js # Error handling middleware
├── models/             # Database models
│   ├── Vendor.js
│   ├── Store.js
│   ├── Product.js
│   ├── Category.js
│   ├── Order.js
│   ├── OrderProduct.js
│   ├── OrderAddress.js
│   ├── Payment.js
│   ├── Shipment.js
│   ├── User.js
│   └── Discount.js
├── routes/             # API routes
│   ├── vendorRoutes.js
│   ├── storeRoutes.js
│   ├── productRoutes.js
│   ├── categoryRoutes.js
│   ├── orderRoutes.js
│   └── discountRoutes.js
├── services/           # Business logic
│   ├── notificationService.js
│   ├── eventNotificationService.js
│   └── fileUploadService.js
├── utils/              # Utility functions
│   ├── database.js     # Database initialization
│   ├── AppError.js     # Custom error class
│   └── catchAsync.js   # Async error handler
├── .env                # Environment variables
├── app.js              # Express app initialization
├── server.js           # Server entry point
├── package.json        # Project dependencies
└── firebase-key.json   # Firebase credentials
```

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```
# Server Configuration
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=vendor_db
DB_FORCE_SYNC=false

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=90d

# Firebase Configuration
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com
```

## Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com/
2. Generate a new private key from Project settings > Service accounts
3. Save the JSON file as `firebase-key.json` in the root directory

## Database Setup

1. Create a MySQL database named `vendor_db` (or your preferred name)
2. Update the database configuration in `.env`
3. The application will create all required tables on startup

## Running the Application

Development mode with auto-restart:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

## API Endpoints

### Vendor Routes

- `GET /api/vendors` - Get all vendors
- `GET /api/vendors/:id` - Get vendor by ID
- `POST /api/vendors/register` - Register a new vendor
- `POST /api/vendors/login` - Login vendor
- `PATCH /api/vendors/profile/:id` - Update vendor profile
- `PATCH /api/vendors/upload-logo/:id` - Upload vendor logo
- `GET /api/vendors/dashboard/:id` - Get vendor dashboard statistics

### Store Routes

- `GET /api/stores` - Get all stores
- `GET /api/stores/:id` - Get store by ID
- `POST /api/stores` - Create a new store
- `PATCH /api/stores/:id` - Update store details
- `DELETE /api/stores/:id` - Delete a store

### Product Routes

- `GET /api/products` - Get all products for a vendor's store
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create a new product
- `PATCH /api/products/:id` - Update product details
- `DELETE /api/products/:id` - Delete a product
- `PATCH /api/products/:id/images` - Upload product images

### Category Routes

- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create a new category
- `PATCH /api/categories/:id` - Update category details
- `DELETE /api/categories/:id` - Delete a category

### Order Routes

- `GET /api/orders/store/:storeId` - Get all orders for a specific store
- `GET /api/orders/:id` - Get comprehensive order details by ID
- `PATCH /api/orders/:id/status` - Update order status

### Coupon Routes

- `GET /api/coupons` - Get all coupons for a vendor's store
- `GET /api/coupons/:id` - Get coupon details by ID
- `GET /api/coupons/generate-code` - Generate a unique coupon code
- `POST /api/coupons` - Create a new coupon
- `PATCH /api/coupons/:id` - Update coupon details
- `DELETE /api/coupons/:id` - Delete a coupon

### Withdrawal Routes

- `GET /api/withdrawals` - Get all withdrawals with optional filtering
- `GET /api/withdrawals/:id` - Get withdrawal details by ID
- `POST /api/withdrawals` - Create a new withdrawal request
- `PATCH /api/withdrawals/:id/cancel` - Cancel a withdrawal request
- `POST /api/withdrawals/:id/retry` - Retry a failed withdrawal request
- `GET /api/withdrawals/export-csv` - Export withdrawals as CSV
- `GET /api/withdrawals/export-excel` - Export withdrawals as Excel

## Coupon Management System

The system includes a comprehensive coupon management feature that allows vendors to create and manage various types of discount coupons for their stores.

### Coupon Types

- **Percentage Discount**: Apply a percentage discount to the order total or specific products
- **Fixed Amount Discount**: Apply a fixed amount discount to the order total or specific products
- **Shipping Discount**: Provide free or discounted shipping

### Coupon Features

- **Store-specific Coupons**: Each coupon is associated with a specific vendor store
- **Product Targeting**: Apply coupons to all products or specific products
- **Usage Limits**: Set maximum usage count per coupon
- **Date Restrictions**: Set start and end dates for coupon validity
- **Minimum Order Value**: Set minimum order value required for coupon application
- **Automatic Code Generation**: Generate unique coupon codes automatically

### Implementation Details

- Coupons are stored in the `ec_discounts` table
- Vendor authentication is required for all coupon operations
- Vendors can only manage coupons for their own stores
- Product ownership is validated when creating product-specific coupons
- Coupon codes are validated for uniqueness
