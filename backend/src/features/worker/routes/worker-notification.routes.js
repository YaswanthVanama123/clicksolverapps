const express = require('express');
const router = express.Router();
const { authenticateWorkerToken } = require('../../../middlewares/authworkerMiddleware');
const {
  storeFcmToken,
  storeNotification,
  getWorkerNotifications,
} = require('../controllers/index');

// ============================================================================
// WORKER NOTIFICATION ROUTES
// ============================================================================

/**
 * POST /worker/store-fcm-token
 * Store or update FCM token for a worker
 * Requires authentication
 * Headers: Authorization: Bearer <token>
 * Body: { fcmToken: string }
 */
router.post(
  '/worker/store-fcm-token',
  authenticateWorkerToken,
  storeFcmToken
);

/**
 * POST /worker/store-notification
 * Store a notification for a worker
 * Requires authentication
 * Headers: Authorization: Bearer <token>
 * Body: { fcmToken: string, notification: { title: string, body: string, data: object, receivedAt: string, userNotificationId: string } }
 */
router.post(
  '/worker/store-notification',
  authenticateWorkerToken,
  storeNotification
);

/**
 * GET /worker/notifications
 * Retrieve all notifications for the authenticated worker
 * Requires authentication
 * Headers: Authorization: Bearer <token>
 * Query: fcmToken (optional)
 */
router.get(
  '/worker/notifications',
  authenticateWorkerToken,
  getWorkerNotifications
);

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = router;
