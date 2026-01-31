const express = require("express");
const router = express.Router();
const {
  insertTracking,
  getWorkerTrackingServices,
  getUserTrackingServices,
  getAllTrackingServices,
  getServiceTrackingWorkerItemDetails,
  getServiceTrackingUserItemDetails,
  serviceTrackingUpdateStatus,
  serviceDeliveryVerification,
} = require("../controllers/index.js");
const {
  authenticateToken,
} = require("../../../middlewares/authMiddleware.js");
const {
  authenticateWorkerToken,
} = require("../../../middlewares/authworkerMiddleware.js");

// POST /add/tracking - Add tracking for a service
router.post("/add/tracking", insertTracking);

// GET /worker/tracking/services - Get tracking services for worker
router.get(
  "/worker/tracking/services",
  authenticateWorkerToken,
  getWorkerTrackingServices
);

// GET /user/tracking/services - Get tracking services for user
router.get(
  "/user/tracking/services",
  authenticateToken,
  getUserTrackingServices
);

// GET /all/tracking/services - Get all tracking services
router.get("/all/tracking/services", getAllTrackingServices);

// POST /service/tracking/worker/item/details - Get service tracking worker item details
router.post(
  "/service/tracking/worker/item/details",
  getServiceTrackingWorkerItemDetails
);

// POST /service/tracking/user/item/details - Get service tracking user item details
router.post(
  "/service/tracking/user/item/details",
  getServiceTrackingUserItemDetails
);

// POST /service/tracking/update/status - Update service tracking status
router.post("/service/tracking/update/status", serviceTrackingUpdateStatus);

// POST /service/tracking/delivery/verification - Verify delivery with OTP
router.post(
  "/service/tracking/delivery/verification",
  serviceDeliveryVerification
);

module.exports = router;
