const express = require("express");
const {
  getServiceBookingItemDetails,
  getServiceBookingUserItemDetails,
  getServiceOngoingItemDetails,
  getServiceOngoingWorkerItemDetails,
} = require("../controllers/index.js");

const router = express.Router();

/**
 * POST /service/booking/item/details
 * Get booking details for a service (worker perspective)
 */
router.post("/service/booking/item/details", getServiceBookingItemDetails);

/**
 * POST /service/booking/user/item/details
 * Get booking details for a service (user perspective)
 */
router.post("/service/booking/user/item/details", getServiceBookingUserItemDetails);

/**
 * POST /service/ongoing/booking/item/details
 * Get ongoing booking details for a service (worker perspective)
 */
router.post("/service/ongoing/booking/item/details", getServiceOngoingItemDetails);

/**
 * POST /service/ongoing/worker/booking/item/details
 * Get ongoing booking details for a service (user perspective)
 */
router.post(
  "/service/ongoing/worker/booking/item/details",
  getServiceOngoingWorkerItemDetails
);

module.exports = router;
