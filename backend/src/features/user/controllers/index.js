// ============================================================================
// USER CONTROLLERS - CENTRAL EXPORT
// ============================================================================
// This index aggregates all user-related controller functions from the
// ultra-granular modular structure. Each subdomain is clearly separated
// for maintainability and discoverability.
// ============================================================================

// ----------------------------------------------------------------------------
// PROFILE MANAGEMENT (6 functions)
// Handles user profile operations, account details, and registration
// ----------------------------------------------------------------------------
const {
  getUserById,
  userProfileDetails,
  userProfileUpdate,
  accountDetailsUpdate,
  userCompleteSignUp,
  registerUser,
} = require('./user-profile.controller');

// ----------------------------------------------------------------------------
// BOOKING MANAGEMENT (3 functions)
// Manages user bookings, history, and ongoing service tracking
// ----------------------------------------------------------------------------
const {
  getUserBookings,
  getUserAllBookings,
  getUserOngoingBookings,
} = require('./user-booking.controller');

// ----------------------------------------------------------------------------
// NOTIFICATION MANAGEMENT (3 functions)
// Push notification handling and FCM token management
// ----------------------------------------------------------------------------
const {
  storeUserFcmToken,
  storeUserNotification,
  getUserNotifications,
} = require('./user-notification.controller');

// ----------------------------------------------------------------------------
// ACTION AND TRACKING MANAGEMENT (6 functions)
// User action tracking, route management, and cancellation handling
// ----------------------------------------------------------------------------
const {
  createUserAction,
  userActionRemove,
} = require('./user-action-manage.controller');

// User tracking and route details
const {
  getUserTrackRoute,
} = require('./user-tracking.controller');

// Navigation cancellation - all cancellation functions
const {
  userCancelNavigation,
  userNavigationCancel,
  userCancellationStatus,
} = require('./user-navigation-cancel.controller');

// ----------------------------------------------------------------------------
// OFFER AND COUPON MANAGEMENT (5 functions)
// Subdivided into: Coupons, Referrals, Offer Fetching, and Validation
// ----------------------------------------------------------------------------
const { userCoupons } = require('./user-coupon.controller');
const { userReferrals } = require('./user-referral.controller');
const { fetchOffers, getSpecialOffers } = require('./user-offer-fetch.controller');
const { offerValidation } = require('./user-offer-validate.controller');

// ----------------------------------------------------------------------------
// LOCATION MANAGEMENT (1 function)
// User location storage
// ----------------------------------------------------------------------------
const { storeUserLocation } = require('./user-location-store.controller');

// ----------------------------------------------------------------------------
// ADDRESS MANAGEMENT (1 function)
// User address details retrieval
// ----------------------------------------------------------------------------
const { getUserAddressDetails } = require('./user-address.controller');

// ----------------------------------------------------------------------------
// CALL MANAGEMENT (2 functions)
// Phone call initiation for user-worker communication
// ----------------------------------------------------------------------------
const {
  UserPhoneCall,
  userTrackingCall,
} = require('./user-call.controller');

// ----------------------------------------------------------------------------
// SESSION MANAGEMENT (1 function)
// User session and last login tracking
// ----------------------------------------------------------------------------
const { userUpdateLastLogin } = require('./user-session.controller');

// ----------------------------------------------------------------------------
// FEEDBACK MANAGEMENT (1 function)
// User feedback and rating submission
// ----------------------------------------------------------------------------
const { submitFeedback } = require('./user-feedback.controller');

// ============================================================================
// EXPORTS
// ============================================================================
// All user functions exported in organized groups
// ============================================================================

module.exports = {
  // --------------------------------------------------------------------------
  // PROFILE MANAGEMENT (6 functions)
  // --------------------------------------------------------------------------
  getUserById,
  userProfileDetails,
  userProfileUpdate,
  accountDetailsUpdate,
  userCompleteSignUp,
  registerUser,

  // --------------------------------------------------------------------------
  // BOOKING MANAGEMENT (3 functions)
  // --------------------------------------------------------------------------
  getUserBookings,
  getUserAllBookings,
  getUserOngoingBookings,

  // --------------------------------------------------------------------------
  // NOTIFICATION MANAGEMENT (3 functions)
  // --------------------------------------------------------------------------
  storeUserFcmToken,
  storeUserNotification,
  getUserNotifications,

  // --------------------------------------------------------------------------
  // ACTION AND TRACKING MANAGEMENT (6 functions)
  // --------------------------------------------------------------------------
  createUserAction,
  userActionRemove,
  getUserTrackRoute,
  userCancelNavigation,
  userNavigationCancel,
  userCancellationStatus,

  // --------------------------------------------------------------------------
  // OFFER AND COUPON MANAGEMENT (5 functions)
  // --------------------------------------------------------------------------
  userCoupons,
  userReferrals,
  fetchOffers,
  offerValidation,
  getSpecialOffers,

  // --------------------------------------------------------------------------
  // LOCATION MANAGEMENT (1 function)
  // --------------------------------------------------------------------------
  storeUserLocation,

  // --------------------------------------------------------------------------
  // ADDRESS MANAGEMENT (1 function)
  // --------------------------------------------------------------------------
  getUserAddressDetails,

  // --------------------------------------------------------------------------
  // CALL MANAGEMENT (2 functions)
  // --------------------------------------------------------------------------
  UserPhoneCall,
  userTrackingCall,

  // --------------------------------------------------------------------------
  // SESSION MANAGEMENT (1 function)
  // --------------------------------------------------------------------------
  userUpdateLastLogin,

  // --------------------------------------------------------------------------
  // FEEDBACK MANAGEMENT (1 function)
  // --------------------------------------------------------------------------
  submitFeedback,
};

// ============================================================================
// TOTAL: 29 FUNCTIONS EXPORTED
// ============================================================================
