const express = require("express");
const router = express.Router();

// Import call-related controllers from messaging module
const {
  phoneCall,
  UserPhoneCall,
  userTrackingCall,
  workerTrackingCall,
  callMasking,
  initiateCall,
} = require("../controllers/index");

/**
 * POST /worker/call
 * Initiate phone call from worker to user
 * Body: { decodedId }
 */
router.post("/worker/call", phoneCall);

/**
 * POST /user/call
 * Initiate phone call from user to worker
 * Body: { decodedId }
 */
router.post("/user/call", UserPhoneCall);

/**
 * POST /worker/tracking/call
 * Initiate tracking call from worker to user
 * Body: { tracking_id }
 */
router.post("/worker/tracking/call", workerTrackingCall);

/**
 * POST /user/tracking/call
 * Initiate tracking call from user to worker
 * Body: { tracking_id }
 */
router.post("/user/tracking/call", userTrackingCall);

/**
 * POST /callMasking
 * Initiate call masking using Bonvoice AutoCall API
 * Body: { workerNumber, customerNumber, virtualDID }
 */
router.post("/callMasking", callMasking);

/**
 * POST /initiateCall
 * Initiate IVR call with call masking
 * Body: { from, to, scheduled, timezone_id, scheduled_datetime }
 */
router.post("/initiateCall", initiateCall);

module.exports = router;
