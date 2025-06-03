# Simplified Vendor Backend System

A Node.js backend system focused exclusively on vendor/seller management with MySQL database integration.

## Features

- **Vendor Authentication**: Secure login and registration system with JWT authentication specifically for vendors.
- **Vendor Management**: Complete vendor profile management system.
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
│   └── vendorController.js
├── middlewares/        # Custom middleware functions
│   └── errorHandler.js # Error handling middleware
├── models/             # Database models
│   └── Vendor.js
├── routes/             # API routes
│   └── vendorRoutes.js
├── services/           # Business logic
│   ├── notificationService.js
│   └── fileUploadService.js
├── utils/              # Utility functions
│   └── database.js     # Database initialization
├── .env                # Environment variables
├── app.js              # Express app initialization
├── server.js           # Server entry point
└── package.json        # Project dependencies
└── firebase-key.json # Firebase credentials
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
