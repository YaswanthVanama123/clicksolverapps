// Booking controllers - centralized exports from all booking sub-controllers

// Import from sub-controllers
const {
  acceptRequest,
  rejectRequest,
  cancelRequest,
} = require("./booking-request.controller.js");

const {
  checkStatus,
  checkTaskStatus,
  checkCancellationStatus,
} = require("./booking-status.controller.js");

const {
  getUserAndWorkerLocation,
  getLocationDetails,
  fetchLocationDetails,
  updateUserNavigationStatus,
  getAllLocations,
} = require("./booking-location.controller.js");

const {
  getServiceBookingItemDetails,
  getServiceBookingUserItemDetails,
  getServiceOngoingItemDetails,
  getServiceOngoingWorkerItemDetails,
} = require("./booking-details.controller.js");

// Export all functions from sub-controllers
module.exports = {
  // Request Management
  acceptRequest,
  rejectRequest,
  cancelRequest,

  // Status Tracking
  checkStatus,
  checkTaskStatus,
  checkCancellationStatus,

  // Location & Navigation
  getUserAndWorkerLocation,
  getLocationDetails,
  fetchLocationDetails,
  updateUserNavigationStatus,
  getAllLocations,

  // Service Details
  getServiceBookingItemDetails,
  getServiceBookingUserItemDetails,
  getServiceOngoingItemDetails,
  getServiceOngoingWorkerItemDetails,
};
