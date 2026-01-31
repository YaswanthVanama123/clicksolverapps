/**
 * TRACKING FEATURE MODULE
 * Consolidated exports for all tracking-related controllers
 *
 * Module Structure:
 * - controllers/: Contains all tracking controller functions
 *   - tracking-route.controller.js: Ola Maps API integration for route calculations
 *   - tracking-service.controller.js: Service tracking CRUD operations
 *   - tracking-location.controller.js: Location-based navigation operations
 * - routes/: Contains route definitions
 *   - tracking.routes.js: Express routes for tracking endpoints
 *
 * This module has been subdivided for better maintainability and separation of concerns.
 */

// Import all controllers from the controllers index
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
} = require("./controllers/index");

// Export all tracking functions
module.exports = {
  // Route/Maps functions
  getRoute,

  // Service tracking functions
  insertTracking,
  getWorkerTrackingServices,
  getAllTrackingServices,
  getUserTrackingServices,

  // Location functions
  getAllLocations,
  getUserAndWorkerLocation,
  getLocationDetails,
  fetchLocationDetails,
};
