const express = require('express');
const router = express.Router();

// Import admin controllers
const {
  adminLogin,
  administratorDetails,
  getDashboardDetails,
  getPendingWorkers,
  getPendingWorkersNotStarted,
  getPendingWorkerDetails,
  updateIssues,
  updateApproveStatus,
  checkApprovalVerificationStatus,
  workerApprove,
  sendNotificationsToWorkers,
} = require('../controllers/index');

// Import middlewares
const {
  authAdminMiddleware,
} = require('../../../middlewares/authAdminMiddleware');

const {
  authenticateWorkerToken,
} = require('../../../middlewares/authworkerMiddleware');

/**
 * Admin Routes
 * Handles all admin-related endpoints for worker management, verification, and notifications
 */

// GET /admin/login - Admin login endpoint
router.get('/login', adminLogin);

// POST /administrator/service/date/details - Get administrator details (dashboard analytics)
router.post('/administrator/service/date/details', administratorDetails);

// GET /workers/pending/verification - Get list of pending workers who have started registration
router.get('/workers/pending/verification', getPendingWorkers);

// GET /workers/pending/notStarted - Get list of pending workers who have not started registration
router.get('/workers/pending/notStarted', getPendingWorkersNotStarted);

// POST /individual/worker/pending/verification - Get details of a specific pending worker
router.post('/individual/worker/pending/verification', getPendingWorkerDetails);

// POST /update/worker/issues - Update worker issues
router.post('/update/worker/issues', updateIssues);

// POST /aprove/tracking/update/status - Update worker approval status
router.post('/aprove/tracking/update/status', updateApproveStatus);

// POST /check/approval/verification/status - Check worker approval and verification status
router.post(
  '/check/approval/verification/status',
  authenticateWorkerToken,
  checkApprovalVerificationStatus
);

// POST /worker/approved - Approve worker and move to verified workers
router.post('/worker/approved', workerApprove);

// POST /send/notifications - Send notifications to workers
router.post('/send/notifications', sendNotificationsToWorkers);

module.exports = router;
