/**
 * API Endpoints Constants
 * Organized by feature for easy maintenance and updates
 */

const API_ENDPOINTS = {
  // Authentication & User Management
  AUTH: {
    LOGIN: '/api/user/login',
    SIGNUP: '/api/user/signup',
    SEND_OTP: '/api/otp/send',
    VALIDATE_OTP: '/api/validate',
    LOGOUT: '/api/userLogout',
    STORE_FCM_TOKEN: '/api/user/fcm-token',
  },

  // User Profile
  USER: {
    PROFILE: '/api/user/profile',
    UPDATE_PROFILE: '/api/user/details/update',
    UPDATE_PROFILE_IMAGE: '/api/user/updateProfileImage',
    DELETE_ACCOUNT: '/api/user/details/delete',
    GET_USER: '/api/get/user',
    LOCATION: '/api/user/location',
    ADDRESSES: '/api/user/addresses',
    VALIDATE_SERVICE_AREA: '/api/user/validate-service-area',
    SERVICE_REMINDER: '/api/user/service-reminder',
    GET_ADDRESSES: '/api/user/addresses',
    ADD_ADDRESS: '/api/user/addresses',
    UPDATE_ADDRESS: '/api/user/addresses',
    DELETE_ADDRESS: '/api/user/addresses',
    SET_DEFAULT_ADDRESS: '/api/user/addresses/default',
    GET_QUICK_BOOK_PREFERENCES: '/api/user/quick-book/preferences',
    UPDATE_QUICK_BOOK_PREFERENCES: '/api/user/quick-book/preferences',
  },

  // Services & Categories
  SERVICES: {
    HOME_SERVICES: '/api/home/services',
    SINGLE_SERVICE: '/api/single/service',
    SERVICE_CATEGORIES: '/api/services/categories',
  },

  // Booking & Workers
  BOOKING: {
    FIND_WORKERS_NEARBY: '/api/workers-nearby',
    CHECK_STATUS: '/api/checking/status',
    CANCEL_BOOKING: '/api/user/cancellation',
    CREATE_USER_ACTION: '/api/user/action',
    CANCEL_USER_ACTION: '/api/user/action/cancel',
    TRACK_DETAILS: '/api/user/track/details',
    QUICK_BOOK: '/api/booking/quick-book',
  },

  // Worker Related
  WORKER: {
    NAVIGATION_DETAILS: '/api/worker/navigation',
    VERIFICATION_STATUS: '/api/worker/verification',
    INITIATE_CALL: '/api/worker/call',
  },

  // Offers & Referrals
  OFFERS: {
    GET_USER_OFFERS: '/api/user/offers',
    VALIDATE_OFFER: '/api/user/validate-offer',
  },

  REFERRALS: {
    GET_REFERRALS: '/api/user/referrals',
  },

  // Feedback
  FEEDBACK: {
    SUBMIT_FEEDBACK: '/api/user/feedback',
  },

  // Translation
  TRANSLATION: {
    TRANSLATE: '/api/translate',
  },

  // Notifications
  NOTIFICATIONS: {
    GET_NOTIFICATIONS: '/api/user/notifications',
    MARK_AS_READ: '/api/user/notifications/read',
  },

  // Payment
  PAYMENT: {
    CREATE_ORDER: '/api/payment/create-order',
    VERIFY_PAYMENT: '/api/payment/verify',
    PAYMENT_STATUS: '/api/payment/status',
  },

  // Chat
  CHAT: {
    GET_MESSAGES: '/api/chat/messages',
    SEND_MESSAGE: '/api/chat/send',
  },

  // Location Search
  LOCATION: {
    SEARCH: '/api/location/search',
    GEOCODE: '/api/location/geocode',
    REVERSE_GEOCODE: '/api/location/reverse-geocode',
  },

  // Help & Support
  HELP: {
    GET_FAQ: '/api/help/faq',
    SUBMIT_TICKET: '/api/help/ticket',
  },
};

export default API_ENDPOINTS;
