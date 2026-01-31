# Controller Index Quick Reference

## How to Import Controllers

All features now have centralized index.js files for clean imports.

### Pattern 1: Import Specific Functions
```javascript
// Import only what you need
const { login, sendOtp, userLogout } = require('./features/auth');
const { acceptRequest, rejectRequest } = require('./features/booking');
const { createOrder, verifyPayment } = require('./features/payment');
```

### Pattern 2: Import Entire Module
```javascript
// Import entire feature module
const authController = require('./features/auth');
const bookingController = require('./features/booking');
const paymentController = require('./features/payment');

// Use with dot notation
authController.login(req, res);
bookingController.acceptRequest(req, res);
paymentController.createOrder(req, res);
```

---

## Feature Index Locations

| Feature | Import Path | Controllers |
|---------|-------------|-------------|
| Admin | `./features/admin` | 4 |
| Auth | `./features/auth` | 6 |
| Booking | `./features/booking` | 5 |
| Messaging | `./features/messaging` | 4 |
| Payment | `./features/payment` | 1 |
| Service | `./features/service` | 4 |
| Tracking | `./features/tracking` | 4 |
| User | `./features/user` | 7 |
| Worker | `./features/worker` | 10 |

---

## Example Route File Update

### Before:
```javascript
const { login } = require('./features/auth/auth.controller');
const { sendOtp } = require('./features/auth/auth.controller');
const { userLogout } = require('./features/auth/auth.controller');
```

### After:
```javascript
// Single import from index
const { login, sendOtp, userLogout } = require('./features/auth');
```

---

## All Available Functions by Feature

### Admin (11 functions)
```javascript
const {
  // Authentication
  adminLogin,

  // Dashboard
  administratorDetails,
  getDashboardDetails,

  // Worker Approval
  workerApprove,
  getPendingWorkers,
  getPendingWorkersNotStarted,
  getPendingWorkerDetails,
  updateIssues,
  updateApproveStatus,
  checkApprovalVerificationStatus,
} = require('./features/admin');
```

### Auth (27 functions)
```javascript
const {
  // Login
  Partnerlogin,
  adminLogin,
  login,
  workerAuthentication,

  // OTP
  WorkerSendOtp,
  WorkerValidateOtp,
  sendOtp,
  partnerSendOtp,
  partnerValidateOtp,
  validateOtp,
  workerVerifyOtp,
  verifyOTP,
  sendSMSVerification,

  // Session/Logout
  workerLogout,
  userLogout,
  sendLogoutNotificationAndDeleteTokens,

  // Status & Verification
  workerTokenVerification,
  accountDelete,
  loginStatus,
  checkOnboardingStatus,
  registrationStatus,

  // Cron
  updateWorkerNoDueStatus,
  sendDuePaymentNotifications,
} = require('./features/auth');
```

### Booking (15 functions)
```javascript
const {
  // Request Management
  acceptRequest,
  rejectRequest,
  cancelRequest,

  // Status
  checkStatus,
  checkTaskStatus,
  checkCancellationStatus,

  // Location
  getUserAndWorkerLocation,
  getLocationDetails,
  fetchLocationDetails,
  updateUserNavigationStatus,
  getAllLocations,

  // Details
  getServiceBookingItemDetails,
  getServiceBookingUserItemDetails,
  getServiceOngoingItemDetails,
  getServiceOngoingWorkerItemDetails,
} = require('./features/booking');
```

### Messaging (11 functions)
```javascript
const {
  // Chat
  sendMessageWorker,
  sendMessageUser,
  workerGetMessage,
  workerMessage,

  // Calls
  phoneCall,
  UserPhoneCall,
  userTrackingCall,
  workerTrackingCall,
  callMasking,
  initiateCall,

  // Translation
  translateText,
} = require('./features/messaging');
```

### Payment (8 functions)
```javascript
const {
  // Razorpay
  createOrder,
  verifyPayment,

  // Processing
  processPayment,
  paymentDetails,
  calculatePayment,
  getPaymentDetails,

  // Admin
  getWorkersPendingCashback,
  pendingBalanceWorkers,
} = require('./features/payment');
```

### Service (37 functions)
```javascript
const {
  // Catalog
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

  // Tracking
  insertTracking,
  getWorkerTrackingServices,
  getUserTrackingServices,
  getAllTrackingServices,
  getServiceTrackingWorkerItemDetails,
  getServiceTrackingUserItemDetails,
  serviceTrackingUpdateStatus,
  serviceDeliveryVerification,

  // Timer
  startStopwatch,
  stopStopwatch,
  getTimerValue,
  CheckStartTime,
  TimeStart,

  // Work
  workCompletedRequest,
  workCompletionCancel,
  serviceCompleted,
  getWorkDetails,
  getServiceCompletedDetails,
  userWorkerInProgressDetails,
  getTimeDifferenceInIST,

  // Helpers
  updateWorkerAction,
  getCurrentTimestamp,
  formatTime,
  parseTime,
  sendFCMNotification,
} = require('./features/service');
```

### Tracking (9 functions)
```javascript
const {
  // Route
  getRoute,

  // Service Tracking
  insertTracking,
  getWorkerTrackingServices,
  getAllTrackingServices,
  getUserTrackingServices,

  // Location
  getAllLocations,
  getUserAndWorkerLocation,
  getLocationDetails,
  fetchLocationDetails,
} = require('./features/tracking');
```

### User (28 functions)
```javascript
const {
  // Profile
  getUserById,
  userProfileDetails,
  userProfileUpdate,
  accountDetailsUpdate,
  userCompleteSignUp,
  registerUser,

  // Booking
  getUserBookings,
  getUserAllBookings,
  getUserOngoingBookings,

  // Notification
  storeUserFcmToken,
  storeUserNotification,
  getUserNotifications,

  // Action
  createUserAction,
  userActionRemove,
  getUserTrackRoute,
  userCancelNavigation,
  userNavigationCancel,
  userCancellationStatus,

  // Offers
  userCoupons,
  userReferrals,
  fetchOffers,
  offerValidation,
  getSpecialOffers,

  // Location
  storeUserLocation,
  getUserAddressDetails,
  UserPhoneCall,
  userTrackingCall,
  userUpdateLastLogin,
} = require('./features/user');
```

### Worker (55 functions)
```javascript
const {
  // Profile (7)
  workerProfileScreenDetails,
  profileChangesSubmit,
  getWorkerProfileDetails,
  getWorkerProfleDetails,
  workerProfileUpdate,
  workerProfileDetails,
  getWorkerReviewDetails,

  // Onboarding (7)
  workerCompleteSignUp,
  registrationSubmit,
  skillWorkerRegistration,
  onboardingSteps,
  addWorker,
  getServicesPhoneNumber,
  getServicesRegisterPhoneNumber,

  // Financial (11)
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

  // Location (7)
  storeWorkerLocation,
  updateWorkerLocation,
  getWorkerNavigationDetails,
  workerCancelNavigation,
  workerCancellationStatus,
  workerNavigationCancel,
  getWorkersNearby,

  // Booking (10)
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

  // Notification (4)
  sendNotificationsToWorkers,
  getWorkerNotifications,
  storeNotification,
  storeFcmToken,

  // Action (3)
  createWorkerAction,
  getWorkerTrackRoute,
  workerScreenChange,

  // Communication (4)
  workerTrackingCall,
  phoneCall,
  workerMessage,
  workerGetMessage,

  // Verification (2)
  workerApprove,
  workerSearch,
} = require('./features/worker');
```

---

## Benefits

✅ **Single Import Point**: One import statement per feature
✅ **Better Organization**: Functions grouped logically
✅ **Easier Maintenance**: Changes isolated to specific files
✅ **Backward Compatible**: Existing code still works
✅ **IDE Friendly**: Better autocomplete and IntelliSense

---

## Migration Checklist

When updating route files:

- [ ] Replace individual controller imports with index imports
- [ ] Test all endpoints to ensure they still work
- [ ] Remove unused imports
- [ ] Update any direct references to old controller files
- [ ] Run tests to verify functionality

---

**Last Updated**: 2026-01-28
**Total Functions**: ~201 across 9 features
