// Controllers - exports from all sub-controllers

// Import all sub-controllers
const loginController = require("./auth-login.controller.js");
const otpController = require("./auth-otp.controller.js");
const sessionController = require("./auth-session.controller.js");
const statusController = require("./auth-status.controller.js");
const cronController = require("./auth-cron.controller.js");

// Export all functions from sub-controllers
module.exports = {
  // Login & Authentication functions
  ...loginController,

  // OTP Management functions
  ...otpController,

  // Session & Logout functions
  ...sessionController,

  // Status & Account Management functions
  ...statusController,

  // Cron Job functions
  ...cronController,
};
