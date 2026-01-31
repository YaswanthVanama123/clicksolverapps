// ============================================================================
// WORKER FEATURE - ULTRA-GRANULAR EXPORTS
// ============================================================================
// This index aggregates all worker-related controller functions from the
// ultra-granular modular structure. Each subdomain is clearly separated
// for maintainability and discoverability.
// ============================================================================

// Import all controllers from the controllers/index
const {
  // Profile Management (7 functions)
  workerProfileScreenDetails,
  profileChangesSubmit,
  getWorkerProfileDetails,
  getWorkerProfleDetails,
  workerProfileUpdate,
  workerProfileDetails,
  getWorkerReviewDetails,

  // Onboarding and Registration (7 functions)
  workerCompleteSignUp,
  registrationSubmit,
  skillWorkerRegistration,
  onboardingSteps,
  addWorker,
  getServicesPhoneNumber,
  getServicesRegisterPhoneNumber,

  // Financial Operations (13 functions)
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

  // Location and Navigation (7 functions)
  storeWorkerLocation,
  updateWorkerLocation,
  getWorkerNavigationDetails,
  workerCancelNavigation,
  workerCancellationStatus,
  workerNavigationCancel,
  getWorkersNearby,

  // Booking and Service Management (10 functions)
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

  // Notification and FCM (4 functions)
  sendNotificationsToWorkers,
  getWorkerNotifications,
  storeNotification,
  storeFcmToken,

  // Action and Tracking (3 functions)
  createWorkerAction,
  getWorkerTrackRoute,
  workerScreenChange,

  // Communication (4 functions)
  workerTrackingCall,
  phoneCall,
  workerMessage,
  workerGetMessage,

  // Verification and Approval (2 functions)
  workerApprove,
  workerSearch,
} = require('./controllers/index');

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
};

// ============================================================================
// TOTAL: 57 FUNCTIONS EXPORTED
// ==========================================================================
