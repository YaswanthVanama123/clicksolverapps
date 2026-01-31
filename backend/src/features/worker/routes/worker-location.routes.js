const express = require('express');
const {
  storeWorkerLocation,
  updateWorkerLocation,
  getWorkerNavigationDetails,
  workerCancelNavigation,
  workerNavigationCancel,
  getWorkersNearby,
  getWorkerTrackRoute,
} = require('../controllers/index');
const {
  authenticateWorkerToken,
  authenticateToken,
} = require('../../../middlewares');

const router = express.Router();

/**
 * POST /worker/location
 * Store worker location
 * Authentication: Not required
 * Body: { longitude, latitude, workerId }
 */
router.post('/location', storeWorkerLocation);

/**
 * POST /worker/location/update
 * Update authenticated worker's location
 * Authentication: Required (Worker token)
 * Body: { longitude, latitude }
 */
router.post('/location/update', authenticateWorkerToken, updateWorkerLocation);

/**
 * POST /worker/navigation/details
 * Retrieve worker navigation details
 * Authentication: Not required
 * Body: { notificationId }
 */
router.post('/navigation/details', getWorkerNavigationDetails);

/**
 * GET /worker/track/details
 * Retrieve worker track route details
 * Authentication: Required (Worker token)
 * Query: notification_id or relevant tracking parameters
 */
router.get('/track/details', authenticateWorkerToken, getWorkerTrackRoute);

/**
 * POST /worker/tryping/cancel
 * Cancel worker navigation
 * Authentication: Not required
 * Body: { notification_id }
 */
router.post('/tryping/cancel', workerCancelNavigation);

/**
 * POST /workers-nearby
 * Find workers nearby for a service request
 * Authentication: Required (User token)
 * Body: { area, pincode, city, alternateName, alternatePhoneNumber, serviceBooked, discount, tipAmount, offer }
 */
router.post('/workers-nearby', authenticateToken, getWorkersNearby);

module.exports = router;
