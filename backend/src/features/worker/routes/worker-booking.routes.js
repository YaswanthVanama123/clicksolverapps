const express = require('express');
const {
  getWorkerBookings,
  getWorkerOngoingBookings,
  workerLifeDetails,
  getWorkerServiceHistory,
  currentService,
  workerNavigationCancel,
} = require('../controllers/index');
const { authenticateWorkerToken } = require('../../../middlewares');

const router = express.Router();

/**
 * GET /worker/bookings
 * Retrieve all bookings for a worker
 * Authentication: Required (Worker token)
 */
router.get('/bookings', authenticateWorkerToken, getWorkerBookings);

/**
 * GET /worker/ongoingBookings
 * Retrieve ongoing bookings for a worker
 * Authentication: Required (Worker token)
 */
router.get('/ongoingBookings', authenticateWorkerToken, getWorkerOngoingBookings);

/**
 * GET /worker/life/details
 * Retrieve worker lifetime details and statistics
 * Authentication: Required (Worker token)
 */
router.get('/life/details', authenticateWorkerToken, workerLifeDetails);

/**
 * GET /worker/service/history
 * Retrieve service history for a worker
 * Authentication: Required (Worker token)
 */
router.get('/service/history', getWorkerServiceHistory);

/**
 * GET /worker/current/service
 * Retrieve current service details for a worker
 * Authentication: Optional
 */
router.get('/current/service', currentService);

/**
 * POST /worker/work/cancel
 * Cancel an ongoing work/service booking
 * Authentication: Required (Worker token)
 * Body: notification_id or relevant cancel parameters
 */
router.post('/work/cancel', authenticateWorkerToken, workerNavigationCancel);

module.exports = router;
