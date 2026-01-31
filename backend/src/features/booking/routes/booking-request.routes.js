const express = require('express');
const router = express.Router();

// Import controllers
const {
  acceptRequest,
  rejectRequest,
  cancelRequest,
} = require('../controllers/index');

// Import middlewares
const { authenticateWorkerToken } = require('../../../middlewares/authworkerMiddleware');

/**
 * POST /accept/request
 * Accept a booking request
 * Middleware: authenticateWorkerToken
 */
router.post('/accept/request', authenticateWorkerToken, acceptRequest);

/**
 * POST /reject/request
 * Reject a booking request
 * Middleware: authenticateWorkerToken
 */
router.post('/reject/request', authenticateWorkerToken, rejectRequest);

/**
 * POST /user/cancellation
 * Cancel a booking request from user
 * No middleware required (public endpoint)
 */
router.post('/user/cancellation', cancelRequest);

module.exports = router;
