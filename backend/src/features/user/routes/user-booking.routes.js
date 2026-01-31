const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../../middlewares/authMiddleware');
const {
  getUserAllBookings,
  getUserOngoingBookings,
  userNavigationCancel,
} = require('../controllers');
const { cancelRequest } = require('../../booking/controllers');

/**
 * GET /user/bookings
 * Retrieve all user bookings (completed and in progress)
 * Requires: Authentication token
 */
router.get('/bookings', authenticateToken, getUserAllBookings);

/**
 * GET /user/ongoingBookings
 * Retrieve user's ongoing bookings
 * Requires: Authentication token
 */
router.get('/ongoingBookings', authenticateToken, getUserOngoingBookings);

/**
 * POST /user/cancellation
 * Cancel a booking request before acceptance
 * Body: { user_notification_id }
 */
router.post('/cancellation', cancelRequest);

/**
 * POST /user/work/cancel
 * Cancel an accepted booking
 * Body: { notification_id, offer_code (optional) }
 * Requires: Authentication token (optional, handled in controller)
 */
router.post('/work/cancel', userNavigationCancel);

module.exports = router;
