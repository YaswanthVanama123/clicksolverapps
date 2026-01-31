// Load environment variables from .env file
require('dotenv').config();

// Import Firebase configuration
const firebaseAdmin = require('./firebase.config');

// Application configuration
const appConfig = {
  secretKey: process.env.JWT_SECRET_KEY,
  environment: process.env.NODE_ENV || 'development',
};

// Export all configuration in a structured way
module.exports = {
  // Firebase Admin SDK instance
  firebase: firebaseAdmin,

  // Application-specific configuration
  app: appConfig,

  // Direct access to individual configs for backward compatibility
  secretKey: appConfig.secretKey,
  environment: appConfig.environment,
};
