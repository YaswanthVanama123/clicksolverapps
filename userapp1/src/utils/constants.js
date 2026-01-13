/**
 * Application-wide constants
 * Centralized configuration for API endpoints, storage keys, navigation screens, and business logic values
 */

// API Configuration
export const API_BASE_URL = 'https://backend.clicksolver.com/api';

export const API_ENDPOINTS = {
  LOGIN: '/login',
  VALIDATE_TOKEN: '/validate-token',
  GET_USER: '/get/user',
  UPDATE_USER: '/user/update',
  USER_LOCATION: '/user/location',
  LOCATION_NAVIGATION: '/user/location/navigation',
  WORKER_NAVIGATION: '/worker/navigation/details',
  WORKER_CALL: '/worker/call',
  WORKER_VERIFICATION: '/worker/verification/status',
  BOOKING_CANCEL: '/user/work/cancel',
  USER_ACTION: '/user/action',
};

// Geofence Polygons for service areas
// Extracted from userLocation.js - coordinates in [longitude, latitude] format
export const GEOFENCE_POLYGONS = [
  {
    id: 'zone1',
    name: 'Hyderabad Zone 1',
    coordinates: [
      [17.006761409194525, 80.53093335197622],
      [17.005373260064985, 80.53291176992008],
      [16.998813039026402, 80.52664649280518],
      [16.993702747389463, 80.52215964720267],
      [16.98846563857974, 80.5205112174242],
      [16.985436512096513, 80.52097340481015],
      [16.982407772736835, 80.51886205401541],
      [16.987520443064497, 80.51325397397363],
      [16.99023324951544, 80.51463921162184],
      [16.995343035509578, 80.51463907310551],
      [16.997739960285273, 80.5172774280341],
      [16.998812144956858, 80.5151667160207],
      [17.001713715885202, 80.51609017256038],
      [17.002827038610846, 80.51776432647671],
      [17.003291715895045, 80.52011454583169],
      [17.00505854929827, 80.52875703518436],
      [17.00682448638898, 80.5309333429243],
      [17.006761409194525, 80.53093335197622],
    ],
  },
  {
    id: 'zone2',
    name: 'Hyderabad Zone 2',
    coordinates: [
      [16.743659016732067, 81.08236641250511],
      [16.74034916284056, 81.1094786505995],
      [16.75332517520627, 81.11236934565574],
      [16.75189061713202, 81.12344773457119],
      [16.74132482137297, 81.13930188707656],
      [16.738499354073056, 81.14316076908437],
      [16.727924964128718, 81.14435289187736],
      [16.72342039833586, 81.14527321552549],
      [16.714353330434236, 81.14475480852309],
      [16.703383261743355, 81.13502168775335],
      [16.696706590762375, 81.11606570973981],
      [16.690277614635917, 81.11161284859327],
      [16.690514707521203, 81.10219147444412],
      [16.682222407654322, 81.09411194809388],
      [16.680443872924542, 81.08526753004003],
      [16.681096564850336, 81.08063131598783],
      [16.68719744307066, 81.07017793961404],
      [16.70130255228827, 81.06808977263063],
      [16.696116367178703, 81.04868074812543],
      [16.712614628885774, 81.05789409014807],
      [16.730789178638346, 81.06475183815792],
      [16.74056558441238, 81.0761195443987],
      [16.743659016732067, 81.08236641250511],
    ],
  },
  {
    id: 'zone3',
    name: 'Hyderabad Zone 3',
    coordinates: [
      [16.67255137959924, 81.03321330178159],
      [16.6824145262823, 81.04647950748898],
      [16.6901906618056, 81.05994340182195],
      [16.694552978963202, 81.06568533268029],
      [16.677859504990124, 81.07340809687918],
      [16.681463988530027, 81.09657586209278],
      [16.68506890661233, 81.11340498431895],
      [16.68392977309564, 81.12271419996296],
      [16.68750736693913, 81.13547809505661],
      [16.689781680226105, 81.14855623455043],
      [16.701923001073155, 81.14795977957687],
      [16.710268916909044, 81.13191111175911],
      [16.710459773455327, 81.13230954617364],
      [16.715581889330167, 81.14954722240287],
      [16.734167808346427, 81.14736380596997],
      [16.749717375531958, 81.14795614271736],
      [16.753503098884124, 81.12557160723918],
      [16.75689984714704, 81.10200134965078],
      [16.739837869176796, 81.07013329316601],
      [16.719937818724915, 81.05944242728924],
      [16.707614321072228, 81.04677046623345],
      [16.707993326270454, 81.0238103387914],
      [16.672526135042432, 81.03270663044418],
    ],
  },
  {
    id: 'zone4',
    name: 'Hyderabad Zone 4',
    coordinates: [
      [17.091730887270444, 80.60650204489468],
      [17.09513456976032, 80.62335172753689],
      [17.109038349803853, 80.63004799391479],
      [17.121936424446076, 80.63527313830275],
      [17.131033832357872, 80.6446897485315],
      [17.13762235049235, 80.62366357630856],
      [17.13463581504783, 80.60368200587993],
    ],
  },
  {
    id: 'gachibowli',
    name: 'Gachibowli',
    coordinates: [
      [17.441144863330976, 78.3376254568987],
      [17.428701935872226, 78.35687667241433],
      [17.42800101387249, 78.3767413879973],
      [17.43381411455306, 78.38748327347525],
      [17.445021109810384, 78.40529511275628],
      [17.47106054889956, 78.3945966028669],
      [17.472566887863067, 78.37674057114202],
      [17.467409875390615, 78.35340358285953],
      [17.45496302403113, 78.34790606796042],
      [17.441697955004187, 78.33820169415065],
      [17.441144863330976, 78.3376254568987],
    ],
  },
];

// EncryptedStorage Keys
export const STORAGE_KEYS = {
  CS_TOKEN: 'cs_token',
  USER_DATA: 'user_data',
  LOCATION_DATA: 'location_data',
  BOOKING_HISTORY: 'booking_history',
  USER_PREFERENCES: 'user_preferences',
  PENDING_NOTIFICATION: 'pendingNotification',
  LAST_SYNC: 'last_sync_time',
  CACHE_EXPIRY: 'cache_expiry_',
};

// Navigation Screen Names
export const SCREEN_NAMES = {
  // Auth screens
  LOGIN: 'Login',
  SIGN_UP: 'SignUp',
  VERIFICATION: 'Verification',
  LOGIN_AUTH: 'LoginAuth',

  // Main navigation
  TABS: 'Tabs',
  HOME: 'Home',
  PROFILE: 'ProfileScreen',
  NOTIFICATIONS: 'UserNotifications',

  // Booking flow
  SINGLE_SERVICE: 'SingleService',
  LOCATION_SELECTION: 'userLocation',
  LOCATION_SEARCH: 'LocationSearch',
  USER_WAITING: 'userwaiting',
  SERVICE_IN_PROGRESS: 'ServiceInProgress',
  SERVICE_COMPLETION: 'ServiceCompletion',
  SERVICE_TRACKING: 'ServiceTrackingListScreen',
  SERVICE_TRACKING_ITEM: 'ServiceTrackingItemScreen',

  // Navigation/Maps
  NAVIGATION: 'Navigation',
  OLA_MAPS: 'Olamaps',

  // Payment
  PAYMENT: 'Paymentscreen',
  PAYMENT_RAZOR: 'PaymentScreenRazor',
  PHONEPE: 'Phonepe',

  // Chat & Support
  CHAT: 'ChatScreen',
  HELP: 'HelpScreen',

  // Profile Management
  EDIT_PROFILE: 'EditProfile',
  ACCOUNT_DELETE: 'AccountDelete',
  REFERRALS: 'ReferralScreen',
  MY_REFERRALS: 'Myrefferals',

  // Other
  QUICK_SEARCH: 'QuickSearch',
  ABOUT: 'AboutCS',
  LANGUAGE_SELECTOR: 'LanguageSelector',
  SKILL_REGISTRATION: 'SkillRegistration',
};

// Booking Status Constants
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
};

// Payment Methods
export const PAYMENT_METHODS = {
  RAZORPAY: 'razorpay',
  PHONEPE: 'phonepe',
  UPI: 'upi',
  WALLET: 'wallet',
  CASH: 'cash',
};

// Tip Amounts (in rupees)
export const TIP_AMOUNTS = [0, 50, 100, 200, 500];

// Cancellation Reasons
export const CANCELLATION_REASONS = {
  BETTER_PRICE: 'found_better_price',
  WRONG_LOCATION: 'wrong_location',
  WRONG_SERVICE: 'wrong_service',
  MORE_TIME: 'more_time',
  OTHERS: 'others',
};

// Default Values
export const DEFAULT_VALUES = {
  MAP_ZOOM_LEVEL: 18,
  LOCATION_TIMEOUT: 15000,
  LOCATION_MAX_AGE: 10000,
  API_TIMEOUT: 30000,
  NOTIFICATION_REFRESH_INTERVAL: 60000, // 60 seconds
};

// Timeout Values (in milliseconds)
export const TIMEOUT_VALUES = {
  LOCATION_REQUEST: 15000,
  API_REQUEST: 30000,
  TOKEN_VALIDATION: 5000,
  NOTIFICATION_FETCH: 10000,
};

// Ratings
export const RATINGS = {
  MIN: 0,
  MAX: 5,
};

// Service-related constants
export const SERVICE_CONSTANTS = {
  CANCELLATION_WINDOW_MINUTES: 2,
  MINIMUM_RATING: 3.0,
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  GEOFENCE_POLYGONS,
  STORAGE_KEYS,
  SCREEN_NAMES,
  BOOKING_STATUS,
  PAYMENT_METHODS,
  TIP_AMOUNTS,
  CANCELLATION_REASONS,
  DEFAULT_VALUES,
  TIMEOUT_VALUES,
  RATINGS,
  SERVICE_CONSTANTS,
};
