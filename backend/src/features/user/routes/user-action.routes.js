// ============================================================================
// USER ACTION AND TRACKING ROUTES
// ============================================================================
// This file defines all routes for user action management and tracking
// functionality, including action creation, cancellation, and status tracking.
// ============================================================================

const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../../../middlewares/authMiddleware.js");

// ============================================================================
// CONTROLLER IMPORTS
// ============================================================================
// Import user action and tracking controllers
const {
  createUserAction,
  userActionRemove,
  getUserTrackRoute,
  userCancelNavigation,
} = require('../controllers');

// Import auth status controller for login status check
const { loginStatus } = require("../../auth/controllers/auth-status.controller");

// ============================================================================
// ROUTE DEFINITIONS
// ============================================================================

/**
 * POST /user/action
 * Create a new user action for tracking user journey and service booking
 * Requires authentication token
 */
router.post("/user/action", authenticateToken, createUserAction);

/**
 * POST /user/action/cancel
 * Cancel a user action and remove it from tracking
 * Requires authentication token
 */
router.post("/user/action/cancel", authenticateToken, userActionRemove);

/**
 * GET /user/track/details
 * Fetch user tracking details and route information
 * Requires authentication token
 */
router.get("/user/track/details", authenticateToken, getUserTrackRoute);

/**
 * POST /user/tryping/cancel
 * Cancel user navigation/typing action
 * Requires authentication token
 */
router.post("/user/tryping/cancel", authenticateToken, userCancelNavigation);

/**
 * GET /user/login/status
 * Check user login status and fetch user details
 * Requires authentication token
 */
router.get("/user/login/status", authenticateToken, loginStatus);

/**
 * POST /user/active/update
 * Update user's last active timestamp
 * Requires authentication token
 */
router.post("/user/active/update", authenticateToken, userActionRemove);

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = router;
