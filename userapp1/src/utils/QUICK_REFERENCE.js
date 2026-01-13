/**
 * UTILS QUICK REFERENCE GUIDE
 * Quick copy-paste examples for common tasks
 */

// ============================================================================
// CONSTANTS - Access predefined values
// ============================================================================

import {
  SCREEN_NAMES,
  BOOKING_STATUS,
  PAYMENT_METHODS,
  API_BASE_URL,
  GEOFENCE_POLYGONS,
  STORAGE_KEYS
} from 'src/utils/constants';

// Example: Navigate using screen names
// navigate(SCREEN_NAMES.HOME);

// Example: Check booking status
// if (booking.status === BOOKING_STATUS.COMPLETED) { ... }

// ============================================================================
// VALIDATORS - Validate user input
// ============================================================================

import {
  validateEmail,
  validatePhone,
  validatePincode,
  validateName,
  isValidLocation,
  isPointInPolygon
} from 'src/utils/validators';

// Example: Validate phone in form
/*
if (!validatePhone(phoneInput)) {
  setPhoneError('Invalid phone number');
}
*/

// Example: Check if user location is in service area
/*
const inServiceArea = GEOFENCE_POLYGONS.some(zone =>
  isPointInPolygon([longitude, latitude], zone.coordinates)
);
*/

// ============================================================================
// FORMATTERS - Format values for display
// ============================================================================

import {
  formatCurrency,
  formatPhoneNumber,
  formatDate,
  formatTime,
  formatRelativeTime,
  truncateText
} from 'src/utils/formatters';

// Example: Display booking amount
// <Text>{formatCurrency(999.99)}</Text> → ₹1,000

// Example: Display formatted phone
// <Text>{formatPhoneNumber('9876543210')}</Text> → +91 98765 43210

// Example: Display relative time
// <Text>{formatRelativeTime(createdAt)}</Text> → 2 hours ago

// ============================================================================
// STORAGE - Secure data persistence with caching
// ============================================================================

import {
  getAuthToken,
  setAuthToken,
  getStorageData,
  setStorageData,
  getCachedData,
  setCachedData,
  clearAuthToken
} from 'src/utils/storage';

// Example: Handle authentication
/*
// Check token on app start
const token = await getAuthToken();
if (token) {
  // User is logged in
} else {
  navigate(SCREEN_NAMES.LOGIN);
}

// Save token after login
await setAuthToken(loginResponse.token);

// Logout
await clearAuthToken();
*/

// Example: Cache user data for 30 minutes
/*
// Save to cache
await setCachedData('user_profile', profileData, 30);

// Retrieve from cache
const cached = await getCachedData('user_profile', 30);
if (cached) {
  setProfile(cached); // Use cached data
}
*/

// ============================================================================
// NAVIGATION - Navigate between screens
// ============================================================================

import {
  resetToScreen,
  navigateToBooking,
  navigateToTracking,
  navigateToHome,
  navigateToLogin,
  safeGoBack,
  getCurrentRouteName
} from 'src/utils/navigation';

// Example: Navigate to booking after selecting service
/*
const handleSelectService = (service) => {
  navigateToBooking(navigation, service, discount, tipAmount);
};
*/

// Example: Navigate to tracking after booking confirmed
/*
navigateToTracking(navigation, encodedBookingId);
*/

// Example: Reset to home (clear navigation history)
/*
resetToScreen(navigation, SCREEN_NAMES.HOME);
*/

// Example: Safe back button
/*
<TouchableOpacity onPress={() => safeGoBack(navigation)}>
  <Text>Back</Text>
</TouchableOpacity>
*/

// ============================================================================
// PERMISSIONS - Handle app permissions
// ============================================================================

import {
  requestLocationPermission,
  requestCameraPermission,
  requestNotificationPermission,
  isLocationPermissionGranted,
  isCameraPermissionGranted,
  openAppSettings
} from 'src/utils/permissions';

// Example: Get user location with permission check
/*
const getLocation = async () => {
  const granted = await requestLocationPermission();
  if (granted) {
    Geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      handleLocation(latitude, longitude);
    });
  } else {
    Alert.alert('Permission Denied', 'Please enable location access');
    openAppSettings();
  }
};
*/

// Example: Check permissions on app start
/*
useEffect(() => {
  const checkPermissions = async () => {
    const locationOk = await isLocationPermissionGranted();
    const notificationOk = await isNotificationPermissionGranted();

    if (!locationOk) {
      await requestLocationPermission();
    }
  };

  checkPermissions();
}, []);
*/

// ============================================================================
// COMPLETE EXAMPLE: Booking Flow
// ============================================================================

/*
import { formatCurrency, validatePhone } from 'src/utils/formatters';
import { navigateToBooking, navigateToTracking } from 'src/utils/navigation';
import { setCachedData, getAuthToken } from 'src/utils/storage';
import { BOOKING_STATUS } from 'src/utils/constants';

// Screen 1: Service selection
const handleSelectService = (service) => {
  const discount = calculateDiscount(service);
  navigateToBooking(navigation, service, discount, 0);
};

// Screen 2: Location confirmation
const handleConfirmLocation = async () => {
  try {
    const token = await getAuthToken();
    const response = await axios.post(
      API_BASE_URL + '/booking/create',
      { ...bookingData },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Cache booking details
    await setCachedData('current_booking', response.data, 60);

    // Navigate to tracking
    navigateToTracking(navigation, response.data.encodedId);
  } catch (error) {
    showError('Failed to create booking');
  }
};

// Display in UI
<Text>{formatCurrency(service.price)}</Text>
<Text>{formatPhoneNumber(workerPhone)}</Text>
*/

// ============================================================================
// COMMON PATTERNS
// ============================================================================

// Pattern 1: Initialize app with auth check
/*
useEffect(() => {
  const initializeApp = async () => {
    const token = await getAuthToken();
    if (token) {
      navigateToHome(navigation);
    } else {
      navigateToLogin(navigation);
    }
  };
  initializeApp();
}, [navigation]);
*/

// Pattern 2: Form validation before submission
/*
const handleSubmit = () => {
  const errors = {};

  if (!validateName(name)) {
    errors.name = 'Invalid name';
  }
  if (!validatePhone(phone)) {
    errors.phone = 'Invalid phone';
  }
  if (!validateEmail(email)) {
    errors.email = 'Invalid email';
  }

  if (Object.keys(errors).length > 0) {
    setErrors(errors);
    return;
  }

  submitForm();
};
*/

// Pattern 3: Async storage operations with loading state
/*
const [loading, setLoading] = useState(false);

const fetchAndCacheData = async () => {
  setLoading(true);
  try {
    const cached = await getCachedData('key', 60);
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }

    const response = await fetchFromAPI();
    await setCachedData('key', response, 60);
    setData(response);
  } catch (error) {
    showError('Failed to load data');
  } finally {
    setLoading(false);
  }
};
*/

// Pattern 4: Permission-gated features
/*
const handleOpenCamera = async () => {
  const granted = await requestCameraPermission();
  if (!granted) {
    Alert.alert(
      'Camera Permission Required',
      'Enable camera access in settings',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => openAppSettings() }
      ]
    );
    return;
  }
  openCamera();
};
*/

export default {
  // This file is just for reference and documentation
  // Import utilities directly from individual files
};
