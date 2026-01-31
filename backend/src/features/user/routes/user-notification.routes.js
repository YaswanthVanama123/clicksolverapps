// ============================================================================
// USER NOTIFICATION ROUTES
// ============================================================================
// This module handles all user notification-related routes including:
// - Fetching user notifications
// - Storing new user notifications
// ============================================================================

const express = require('express');
const router = express.Router();

// Middleware imports
const { authenticateToken } = require('../../../middlewares');

// Controller imports
const {
  getUserNotifications,
  storeUserNotification,
} = require('../controllers');

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /user/notifications
 * Fetch all user notifications for the authenticated user
 * Query Parameters:
 *   - fcmToken (required): FCM token to filter notifications
 * Response:
 *   - Array of notifications with title, body, encodedId, data, and receivedat
 */
router.get('/user/notifications', authenticateToken, getUserNotifications);

/**
 * POST /user/store-notification
 * Store a new user notification
 * Request Body:
 *   - fcmToken (string): FCM token
 *   - notification (object):
 *     - title (string): Notification title
 *     - body (string): Notification body
 *     - data (object): Notification data
 *     - receivedAt (timestamp): When notification was received
 *     - userNotificationId (string): Unique notification ID
 * Response:
 *   - Stored notification object
 */
router.post('/user/store-notification', authenticateToken, storeUserNotification);

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = router;
