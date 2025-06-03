const admin = require('firebase-admin');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Firebase Admin SDK
const serviceAccount = require('../firebase-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

// Get Firebase messaging service
const messaging = admin.messaging();

module.exports = { admin, messaging };
