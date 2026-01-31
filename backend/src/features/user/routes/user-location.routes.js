const express = require('express');
const { authenticateToken } = require('../../../middlewares/authMiddleware');
const {
  storeUserLocation,
  storeUserFcmToken,
  getUserAddressDetails,
} = require('../controllers');

const router = express.Router();

/**
 * POST /user/location
 * Store user location (longitude and latitude)
 * Requires: authenticateToken middleware
 */
router.post('/location', authenticateToken, storeUserLocation);

/**
 * POST /user/store-fcm-token
 * Store FCM token for push notifications
 * Requires: authenticateToken middleware
 */
router.post('/store-fcm-token', authenticateToken, storeUserFcmToken);

/**
 * GET /user/address/details
 * Retrieve user address details from a notification
 * Query params: notification_id
 */
router.get('/address/details', getUserAddressDetails);

module.exports = router;
