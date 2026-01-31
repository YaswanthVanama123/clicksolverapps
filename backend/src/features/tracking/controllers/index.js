/**
 * TRACKING CONTROLLERS INDEX
 * Consolidated exports for all tracking-related controllers
 *
 * Module Structure:
 * - tracking-route.controller.js: Ola Maps API integration for route calculations
 * - tracking-service.controller.js: Service tracking CRUD operations
 * - tracking-location.controller.js: Location-based navigation operations
 *
 * This module exports all controller functions for use in routes and other parts of the application.
 */

// Import route controller (Ola Maps integration)
const {
  getRoute,
} = require("./tracking-route.controller");

// Import service tracking controller
const {
  insertTracking,
  getWorkerTrackingServices,
  getAllTrackingServices,
  getUserTrackingServices,
} = require("./tracking-service.controller");

// Import location controller
const {
  getAllLocations,
  getUserAndWorkerLocation,
  getLocationDetails,
  fetchLocationDetails,
} = require("./tracking-location.controller");

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
