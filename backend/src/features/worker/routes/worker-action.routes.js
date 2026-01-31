const express = require('express');
const router = express.Router();
const { authenticateWorkerToken } = require('../../../middlewares/authworkerMiddleware');
const {
  createWorkerAction,
  workerScreenChange,
  workerSearch,
} = require('../controllers/index');

// ============================================================================
// WORKER ACTION ROUTES
// ============================================================================

/**
 * POST /worker/action
 * Create a worker action for tracking and navigation
 * Headers: Authorization: Bearer <token>
 * Body: { encodedId: string, screen: string }
 */
router.post(
  '/worker/action',
  authenticateWorkerToken,
  createWorkerAction
);

/**
 * POST /worker/screen/change
 * Update worker screen and track route changes
 * Headers: Authorization: Bearer <token>
 * Body: { worker_id: string, screen: string, params: { encodedId: string } }
 */
router.post(
  '/worker/screen/change',
  authenticateWorkerToken,
  workerScreenChange
);

/**
 * GET /worker/search
 * Search for workers based on criteria
 * Headers: Authorization: Bearer <token>
 * Query: Search parameters (e.g., location, service, etc.)
 */
router.get(
  '/worker/search',
  authenticateWorkerToken,
  workerSearch
);

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = router;
