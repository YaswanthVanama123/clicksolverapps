const express = require("express");
const router = express.Router();

// Import all tracking controllers
const {
  getRoute,
  insertTracking,
  getWorkerTrackingServices,
  getAllTrackingServices,
  getUserTrackingServices,
  getAllLocations,
  getUserAndWorkerLocation,
  getLocationDetails,
  fetchLocationDetails,
} = require("../controllers/index");

/**
 * POST /route
 * Get route details using Ola Maps API
 * Controller: tracking-route.controller.js
 */
router.post("/route", getRoute);

/**
 * GET /location/navigation
 * Get location details for navigation
 * Controller: tracking-location.controller.js
 */
router.get("/location/navigation", getLocationDetails);

/**
 * GET /user/location/navigation
 * Get user location details for navigation
 * Fetches location details and handles navigation timeout
 * Controller: tracking-location.controller.js
 */
router.get("/user/location/navigation", async (req, res) => {
  try {
    const { notification_id } = req.query;

    if (!notification_id) {
      return res.status(400).json({ error: "Missing notification_id" });
    }

    const locationDetails = await fetchLocationDetails(notification_id);
    res.json(locationDetails);

    // Start the interval to update user_navigation_cancel_status to 'timeup' after 2 minutes
    const intervalSetForNotifications = new Set();
    if (notification_id && !intervalSetForNotifications.has(notification_id)) {
      console.log("userlocationpath");
      intervalSetForNotifications.add(notification_id);
      // Note: updateUserNavigationStatus needs to be imported from controller.js
      // setTimeout(
      //   () => updateUserNavigationStatus(notification_id),
      //   2 * 60 * 1000
      // ); // 2 minutes
    }
  } catch (err) {
    console.error("Error fetching location details:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /service/location/navigation
 * Get user and worker location for service navigation
 * Controller: tracking-location.controller.js
 */
router.post("/service/location/navigation", getUserAndWorkerLocation);

/**
 * GET /locations
 * Get all available locations
 * Controller: tracking-location.controller.js
 */
router.get("/locations", getAllLocations);

/**
 * GET /api/location/navigation
 * API endpoint for location navigation details
 * Controller: tracking-location.controller.js
 */
router.get("/api/location/navigation", getLocationDetails);

module.exports = router;
