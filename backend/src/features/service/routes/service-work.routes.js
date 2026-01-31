const express = require('express');
const router = express.Router();

// Import service controllers
const {
  startStopwatch,
  stopStopwatch,
  getTimerValue,
  CheckStartTime,
} = require('../controllers/index');

const {
  workCompletedRequest,
  workCompletionCancel,
  serviceCompleted,
  getWorkDetails,
  userWorkerInProgressDetails,
} = require('../controllers/index');

// Import worker controllers
const {
  WorkerWorkInProgressDetails,
  workerWorkingStatusUpdated,
} = require('../../worker/controllers/worker-booking-query.controller.js');

const {
  workerWorkingStatusUpdated: workerStatusUpdate,
} = require('../../worker/controllers/worker-service-status.controller.js');

/**
 * Service Work Timer Routes
 * Handles service work timing, completion, and worker status updates
 */

// POST /work/time/start - Start the work timer
router.post('/work/time/start', async (req, res) => {
  try {
    const { notification_id } = req.body;
    if (!notification_id) {
      return res.status(400).json({ error: 'notification_id is required' });
    }

    const result = await startStopwatch(notification_id);
    res.status(200).json({ worked_time: result });
  } catch (error) {
    console.error('Error starting stopwatch:', error);
    res.status(500).json({ error: 'Failed to start stopwatch' });
  }
});

// POST /work/time/started - Check if start time exists, create if not
router.post('/work/time/started', CheckStartTime);

// POST /work/time/completed - Mark work as completed and update worker life details
router.post('/work/time/completed', async (req, res) => {
  const { notification_id } = req.body;
  try {
    // Stop stopwatch and get worker_id
    const workerId = await stopStopwatch(notification_id);

    // Get time_worked and calculate totalAmount
    const { time_worked } = await paymentDetails(notification_id);
    const totalAmount = calculatePayment(time_worked);

    // Update worker life details
    const updatedWorkerLife = await updateWorkerLifeDetails(
      workerId,
      totalAmount
    );

    res.status(200).json({
      message: 'Worker life details updated successfully',
      updatedWorkerLife,
    });
  } catch (error) {
    console.error('Error processing work time completion:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /work/time/completed/request - Send work completion request notification
router.post('/work/time/completed/request', workCompletedRequest);

// POST /timer/value - Get the current timer value for a notification
router.post('/timer/value', getTimerValue);

// POST /work/completion/cancel - Cancel work completion
router.post('/work/completion/cancel', workCompletionCancel);

/**
 * Worker Details and Status Routes
 * Handles worker detail retrieval and status updates
 */

// POST /worker/details - Get work details for a notification
router.post('/worker/details', getWorkDetails);

// POST /worker/confirm/completed - Mark service as completed
router.post('/worker/confirm/completed', serviceCompleted);

/**
 * Work Progress and Status Routes
 * Handles progress tracking and status updates for users and workers
 */

// POST /user/work/progress/details - Get user-worker in-progress details
router.post('/user/work/progress/details', userWorkerInProgressDetails);

// POST /worker/work/progress/details - Get worker work in-progress details
router.post('/worker/work/progress/details', WorkerWorkInProgressDetails);

// POST /worker/working/status/updated - Update worker's working status and notify user
router.post('/worker/working/status/updated', workerStatusUpdate);

module.exports = router;
