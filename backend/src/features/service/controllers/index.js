/**
 * Service Controllers Index
 *
 * This module aggregates and exports all service controller functions.
 * It serves as a single entry point for all service-related business logic.
 */

// Import all controller modules
const serviceController = require('./service.controller.js');
const serviceTrackingController = require('./service-tracking.controller.js');
const serviceTimerController = require('./service-timer.controller.js');
const serviceWorkController = require('./service-work.controller.js');
const serviceHelpers = require('./service.helpers.js');

// Export all functions from service catalog controller
const {
  homeServices,
  getServices,
  getElectricianServices,
  getPlumberServices,
  getCleaningServices,
  getPaintingServices,
  getVehicleServices,
  getIndividualServices,
  getServicesBySearch,
  getServiceByName,
  subservices,
  insertRelatedService,
} = serviceController;

// Export all functions from service tracking controller
const {
  insertTracking,
  getWorkerTrackingServices,
  getUserTrackingServices,
  getAllTrackingServices,
  getServiceTrackingWorkerItemDetails,
  getServiceTrackingUserItemDetails,
  serviceTrackingUpdateStatus,
  serviceDeliveryVerification,
} = serviceTrackingController;

// Export all functions from service timer controller
const {
  startStopwatch,
  stopStopwatch,
  getTimerValue,
  CheckStartTime,
  TimeStart,
} = serviceTimerController;

// Export all functions from service work controller
const {
  workCompletedRequest,
  workCompletionCancel,
  serviceCompleted,
  getWorkDetails,
  getServiceCompletedDetails,
  userWorkerInProgressDetails,
  getTimeDifferenceInIST,
} = serviceWorkController;

// Export helper functions (typically these wouldn't be exported from index)
// But including them for flexibility
const {
  updateWorkerAction,
  getCurrentTimestamp,
  formatTime,
  parseTime,
  sendFCMNotification,
} = serviceHelpers;

module.exports = {
  // Service Catalog Functions
  homeServices,
  getServices,
  getElectricianServices,
  getPlumberServices,
  getCleaningServices,
  getPaintingServices,
  getVehicleServices,
  getIndividualServices,
  getServicesBySearch,
  getServiceByName,
  subservices,
  insertRelatedService,

  // Service Tracking Functions
  insertTracking,
  getWorkerTrackingServices,
  getUserTrackingServices,
  getAllTrackingServices,
  getServiceTrackingWorkerItemDetails,
  getServiceTrackingUserItemDetails,
  serviceTrackingUpdateStatus,
  serviceDeliveryVerification,

  // Service Timer Functions
  startStopwatch,
  stopStopwatch,
  getTimerValue,
  CheckStartTime,
  TimeStart,

  // Service Work Functions
  workCompletedRequest,
  workCompletionCancel,
  serviceCompleted,
  getWorkDetails,
  getServiceCompletedDetails,
  userWorkerInProgressDetails,
  getTimeDifferenceInIST,

  // Helper Functions (optional exports)
  updateWorkerAction,
  getCurrentTimestamp,
  formatTime,
  parseTime,
  sendFCMNotification,
};
