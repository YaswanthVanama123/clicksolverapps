const express = require('express');
const router = express.Router();
const { authenticateWorkerToken } = require('../../../middlewares/authworkerMiddleware');
const {
  addWorker,
  workerProfileScreenDetails,
  profileChangesSubmit,
  getWorkerProfileDetails,
  getWorkerProfleDetails,
  workerProfileUpdate,
  workerProfileDetails,
  getWorkerReviewDetails,
  workerMessage,
  getVerificationStatus,
} = require('../controllers/index');

// ============================================================================
// WORKER PROFILE ROUTES
// ============================================================================

/**
 * POST /add/worker
 * Add a new worker
 * Body: Worker details
 */
router.post('/add/worker', async (req, res) => {
  try {
    const newWorker = await addWorker(req.body);
    res.status(201).json(newWorker);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /worker/profile
 * Get worker profile screen details (requires authentication)
 * Headers: Authorization: Bearer <token>
 */
router.post(
  '/worker/profile',
  authenticateWorkerToken,
  workerProfileScreenDetails
);

/**
 * POST /profile
 * Get worker profile details with ratings (requires authentication)
 * Headers: Authorization: Bearer <token>
 */
router.post(
  '/profile',
  authenticateWorkerToken,
  workerProfileDetails
);

/**
 * GET /profile/detsils
 * Get worker profile details from workerskills (requires authentication)
 * Headers: Authorization: Bearer <token>
 */
router.get(
  '/profile/detsils',
  authenticateWorkerToken,
  getWorkerProfileDetails
);

/**
 * GET /worker/profile/details
 * Get worker profile details from workersverified (requires authentication)
 * Headers: Authorization: Bearer <token>
 */
router.get(
  '/worker/profile/details',
  authenticateWorkerToken,
  getWorkerProfleDetails
);

/**
 * POST /worker/updateProfileImage
 * Update worker profile image (requires authentication)
 * Headers: Authorization: Bearer <token>
 * Body: { profileImage: string }
 */
router.post(
  '/worker/updateProfileImage',
  authenticateWorkerToken,
  workerProfileUpdate
);

/**
 * POST /profile/changes/submit
 * Submit profile changes with form data (requires authentication)
 * Headers: Authorization: Bearer <token>
 * Body: { formData: object, selectedStatus: string }
 */
router.post(
  '/profile/changes/submit',
  authenticateWorkerToken,
  profileChangesSubmit
);

/**
 * GET /worker/verification/status
 * Get worker verification status (no authentication required)
 * Query: worker_id (optional)
 */
router.get(
  '/worker/verification/status',
  getVerificationStatus
);

/**
 * GET /worker/ratings
 * Get worker review ratings (requires authentication)
 * Headers: Authorization: Bearer <token>
 */
router.get(
  '/worker/ratings',
  authenticateWorkerToken,
  getWorkerReviewDetails
);

/**
 * POST /worker/details/rating
 * Submit or get worker details with rating (requires authentication)
 * Headers: Authorization: Bearer <token>
 * Body: { notification_id: string }
 */
router.post(
  '/worker/details/rating',
  async (req, res) => {
    const { notification_id } = req.body;
    await workerProfileDetails(req, res, notification_id);
  }
);

/**
 * POST /worker/message
 * Send or store worker message (requires authentication)
 * Headers: Authorization: Bearer <token>
 * Body: Message details
 */
router.post(
  '/worker/message',
  workerMessage
);

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = router;
