// ============================================================================
// WORKER FEATURE - ULTRA-GRANULAR EXPORTS
// ============================================================================
// This index aggregates all worker-related controller functions from the
// ultra-granular modular structure. Each subdomain is clearly separated
// for maintainability and discoverability.
// ============================================================================

// ----------------------------------------------------------------------------
// PROFILE MANAGEMENT (7 functions)
// Handles worker profile operations, updates, and review management
// ----------------------------------------------------------------------------
const {
  workerProfileScreenDetails,
  profileChangesSubmit,
  getWorkerProfileDetails,
  getWorkerProfleDetails,
  workerProfileUpdate,
  workerProfileDetails,
  getWorkerReviewDetails,
} = require('./worker-profile.controller');

// ----------------------------------------------------------------------------
// ONBOARDING AND REGISTRATION (7 functions)
// Manages worker registration, signup, and onboarding workflow
// ----------------------------------------------------------------------------
const {
  workerCompleteSignUp,
  registrationSubmit,
  skillWorkerRegistration,
  onboardingSteps,
  addWorker,
  getServicesPhoneNumber,
  getServicesRegisterPhoneNumber,
} = require('./worker-onboarding.controller');

// ----------------------------------------------------------------------------
// FINANCIAL OPERATIONS (13 functions)
// Banking, UPI, earnings tracking, cashback, and payment management
// NOW SUBDIVIDED INTO ULTRA-FOCUSED FILES:
// - worker-banking.controller.js (2 functions)
// - worker-upi.controller.js (2 functions)
// - worker-earnings.controller.js (1 function)
// - worker-balance.controller.js (3 functions)
// - worker-cashback.controller.js (3 functions)
// - worker-financial-admin.controller.js (2 functions)
// - worker-financial.controller.js (main financial logic)
// ----------------------------------------------------------------------------

// Banking operations - Bank account and fund account management (2 functions)
const {
  addBankAccount,
  createFundAccount,
} = require('./worker-banking.controller');

// UPI operations - UPI ID management and validation (2 functions)
const {
  addUpiId,
  validateAndSaveUPI,
} = require('./worker-upi.controller');

// Earnings operations - Earnings retrieval and calculation (1 function)
const {
  getWorkerEarnings,
} = require('./worker-earnings.controller');

// Balance operations - Balance management and history (3 functions)
const {
  balanceAmmountToPay,
  getWorkerBalanceDetails,
  balanceHistory,
} = require('./worker-balance.controller');

// Cashback operations - Cashback management and history (3 functions)
const {
  getWorkerCashbackDetails,
  workerCashbackPayed,
  cashbackHistory,
} = require('./worker-cashback.controller');

// Financial administration operations - Pending balance and cashback retrieval (2 functions)
const {
  pendingBalanceWorkers,
  getWorkersPendingCashback,
} = require('./worker-financial-admin.controller');

// Main financial controller (additional logic if needed)
const financialController = require('./worker-financial.controller');

// Location update operations (1 function)
const {
  updateWorkerLocationRoute,
} = require('./worker-location-update.controller');

// Booking query operations (if needed)
const bookingQueryController = require('./worker-booking-query.controller');

// Details operations
const detailsController = require('./worker-details.controller');

// Lifetime operations
const lifetimeController = require('./worker-lifetime.controller');

// Navigation operations
const navigationController = require('./worker-navigation.controller');

// Navigation cancel operations
const navigationCancelController = require('./worker-navigation-cancel.controller');

// Nearby operations
const nearbyController = require('./worker-nearby.controller');

// Service history operations
const serviceHistoryController = require('./worker-service-history.controller');

// Service status operations
const serviceStatusController = require('./worker-service-status.controller');

// Main worker controller
const mainWorkerController = require('./worker.controller');

// ----------------------------------------------------------------------------
// LOCATION AND NAVIGATION (7 functions)
// Location tracking, navigation, and nearby worker matching
// ----------------------------------------------------------------------------
const {
  storeWorkerLocation,
  updateWorkerLocation,
  getWorkerNavigationDetails,
  workerCancelNavigation,
  workerCancellationStatus,
  workerNavigationCancel,
  getWorkersNearby,
} = require('./worker-location.controller');

// ----------------------------------------------------------------------------
// BOOKING AND SERVICE MANAGEMENT (10 functions)
// Service bookings, work tracking, status updates, and service history
// ----------------------------------------------------------------------------
const {
  getWorkerBookings,
  getWorkerOngoingBookings,
  currentService,
  getWorkerServiceHistory,
  WorkerWorkInProgressDetails,
  workerWorkingStatusUpdated,
  workerLifeDetails,
  updateWorkerLifeDetails,
  getWorkerDetails,
  workerDetails,
} = require('./worker-booking.controller');

// ----------------------------------------------------------------------------
// NOTIFICATION AND FCM (4 functions)
// Push notification management and FCM token handling
// ----------------------------------------------------------------------------
const {
  sendNotificationsToWorkers,
  getWorkerNotifications,
  storeNotification,
  storeFcmToken,
} = require('./worker-notification.controller');

// ----------------------------------------------------------------------------
// ACTION AND TRACKING (3 functions)
// Worker action tracking, route tracking, and screen state management
// ----------------------------------------------------------------------------
const {
  createWorkerAction,
  getWorkerTrackRoute,
  workerScreenChange,
} = require('./worker-action.controller');

// Verification operations (2 functions)
const {
  workerApprove,
  workerSearch,
} = require('./worker-verification.controller');

// Verification status operations (1 function)
const {
  getVerificationStatus,
} = require('./worker-verification-status.controller');

// Communication operations (4 functions)
const {
  workerTrackingCall,
  phoneCall,
  workerMessage,
  workerGetMessage,
} = require('./worker-communication.controller');

// ============================================================================
// EXPORTS
// ============================================================================
// All 57 worker functions exported in organized groups
// ============================================================================

module.exports = {
  // --------------------------------------------------------------------------
  // PROFILE MANAGEMENT (7 functions)
  // --------------------------------------------------------------------------
  workerProfileScreenDetails,
  profileChangesSubmit,
  getWorkerProfileDetails,
  getWorkerProfleDetails,
  workerProfileUpdate,
  workerProfileDetails,
  getWorkerReviewDetails,

  // --------------------------------------------------------------------------
  // ONBOARDING AND REGISTRATION (7 functions)
  // --------------------------------------------------------------------------
  workerCompleteSignUp,
  registrationSubmit,
  skillWorkerRegistration,
  onboardingSteps,
  addWorker,
  getServicesPhoneNumber,
  getServicesRegisterPhoneNumber,

  // --------------------------------------------------------------------------
  // FINANCIAL OPERATIONS (13 functions)
  // --------------------------------------------------------------------------
  addBankAccount,
  createFundAccount,
  addUpiId,
  validateAndSaveUPI,
  getWorkerEarnings,
  balanceAmmountToPay,
  getWorkerBalanceDetails,
  getWorkerCashbackDetails,
  workerCashbackPayed,
  cashbackHistory,
  balanceHistory,
  pendingBalanceWorkers,
  getWorkersPendingCashback,

  // --------------------------------------------------------------------------
  // LOCATION AND NAVIGATION (7 functions)
  // --------------------------------------------------------------------------
  storeWorkerLocation,
  updateWorkerLocation,
  getWorkerNavigationDetails,
  workerCancelNavigation,
  workerCancellationStatus,
  workerNavigationCancel,
  getWorkersNearby,

  // --------------------------------------------------------------------------
  // BOOKING AND SERVICE MANAGEMENT (10 functions)
  // --------------------------------------------------------------------------
  getWorkerBookings,
  getWorkerOngoingBookings,
  currentService,
  getWorkerServiceHistory,
  WorkerWorkInProgressDetails,
  workerWorkingStatusUpdated,
  workerLifeDetails,
  updateWorkerLifeDetails,
  getWorkerDetails,
  workerDetails,

  // --------------------------------------------------------------------------
  // NOTIFICATION AND FCM (4 functions)
  // --------------------------------------------------------------------------
  sendNotificationsToWorkers,
  getWorkerNotifications,
  storeNotification,
  storeFcmToken,

  // --------------------------------------------------------------------------
  // ACTION AND TRACKING (3 functions)
  // --------------------------------------------------------------------------
  createWorkerAction,
  getWorkerTrackRoute,
  workerScreenChange,

  // --------------------------------------------------------------------------
  // COMMUNICATION (4 functions)
  // --------------------------------------------------------------------------
  workerTrackingCall,
  phoneCall,
  workerMessage,
  workerGetMessage,

  // --------------------------------------------------------------------------
  // VERIFICATION AND APPROVAL (2 functions)
  // --------------------------------------------------------------------------
  workerApprove,
  workerSearch,

  // --------------------------------------------------------------------------
  // VERIFICATION STATUS (1 function)
  // --------------------------------------------------------------------------
  getVerificationStatus,

  // --------------------------------------------------------------------------
  // ADDITIONAL EXPORTS (For auxiliary controllers)
  // --------------------------------------------------------------------------
  financialController,
  bookingQueryController,
  detailsController,
  lifetimeController,
  navigationController,
  navigationCancelController,
  nearbyController,
  serviceHistoryController,
  serviceStatusController,
  mainWorkerController,
};

// ============================================================================
// TOTAL: 58 MAIN FUNCTIONS EXPORTED + AUXILIARY CONTROLLERS
// ============================================================================
