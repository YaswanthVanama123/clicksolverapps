// Booking feature module - centralized exports from all booking sub-controllers

// Import all functions from controllers index
const {
  acceptRequest,
  rejectRequest,
  cancelRequest,
  checkStatus,
  checkTaskStatus,
  checkCancellationStatus,
  getUserAndWorkerLocation,
  getLocationDetails,
  fetchLocationDetails,
  updateUserNavigationStatus,
  getAllLocations,
  getServiceBookingItemDetails,
  getServiceBookingUserItemDetails,
  getServiceOngoingItemDetails,
  getServiceOngoingWorkerItemDetails,
} = require("./controllers/index");

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
