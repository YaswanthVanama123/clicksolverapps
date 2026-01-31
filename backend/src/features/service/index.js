/**
 * Service Feature Module
 *
 * This module manages all service-related functionality including:
 * - Service catalog and discovery (service.controller.js)
 * - Service tracking and monitoring (service-tracking.controller.js)
 * - Work timer management (service-timer.controller.js)
 * - Work completion flow (service-work.controller.js)
 * - Shared utilities (service.helpers.js)
 */

// Import all exports from controllers index
const {
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
  // Helper Functions
  updateWorkerAction,
  getCurrentTimestamp,
  formatTime,
  parseTime,
  sendFCMNotification,
} = require('./controllers/index');

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

