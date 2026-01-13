# Utility Functions Documentation

This directory contains reusable utility functions organized by functionality. All functions are pure, well-documented, and thoroughly tested.

## File Structure

```
utils/
├── constants.js      # Application-wide constants
├── validators.js     # Input validation functions
├── formatters.js     # Value formatting functions
├── storage.js        # Encrypted storage operations
├── navigation.js     # Navigation helper functions
├── permissions.js    # App permissions handling
└── index.js          # Central export point
```

## Usage

### Import all utilities
```javascript
import * as utils from 'src/utils';
```

### Import specific utilities
```javascript
import { formatCurrency, formatPhoneNumber } from 'src/utils/formatters';
import { validateEmail, validatePhone } from 'src/utils/validators';
import { SCREEN_NAMES, BOOKING_STATUS } from 'src/utils/constants';
import { resetToScreen, navigateToBooking } from 'src/utils/navigation';
import { getAuthToken, setAuthToken } from 'src/utils/storage';
import { requestLocationPermission } from 'src/utils/permissions';
```

## Module Details

### constants.js

Global constants for the application.

**Key Exports:**
- `API_BASE_URL` - Backend API base URL
- `API_ENDPOINTS` - API endpoint paths
- `GEOFENCE_POLYGONS` - Service area geofences
- `STORAGE_KEYS` - Encrypted storage key names
- `SCREEN_NAMES` - Navigation screen names
- `BOOKING_STATUS` - Booking status values
- `PAYMENT_METHODS` - Supported payment methods
- `TIP_AMOUNTS` - Available tip amounts

**Example:**
```javascript
import { SCREEN_NAMES, BOOKING_STATUS } from 'src/utils/constants';

// Use in navigation
navigate(SCREEN_NAMES.HOME);

// Use in logic
if (booking.status === BOOKING_STATUS.COMPLETED) {
  showCompletionScreen();
}
```

### validators.js

Pure validation functions for user input.

**Key Functions:**
- `validateEmail(email)` - Validates email format
- `validatePhone(phone)` - Validates phone number (Indian format)
- `validatePincode(pincode)` - Validates 6-digit postal code
- `validateName(name)` - Validates person name
- `isValidLocation(lat, lng)` - Validates geographic coordinates
- `isPointInPolygon(point, polygon)` - Checks if point is in polygon (geofencing)
- `validateEmail`, `hasMinLength`, `hasMaxLength`, `isInRange`, etc.

**Example:**
```javascript
import { validatePhone, validateEmail, isValidLocation } from 'src/utils/validators';

if (!validatePhone(userPhone)) {
  setPhoneError('Invalid phone number');
}

if (isValidLocation(latitude, longitude)) {
  setUserLocation({ lat: latitude, lng: longitude });
}
```

### formatters.js

Pure formatting functions for display values.

**Key Functions:**
- `formatCurrency(amount, includeSymbol)` - Format as ₹1,234
- `formatPhoneNumber(phone)` - Format as +91 98765 43210
- `formatDate(date, format)` - Multiple date formats supported
- `formatTime(date, includeSeconds)` - Format as HH:MM or HH:MM:SS
- `formatRelativeTime(date)` - Format as "2 hours ago"
- `truncateText(text, maxLength, suffix)` - Truncate with ellipsis
- `formatFileSize(bytes, decimals)` - Format as 1.5 MB
- `formatPercentage(value, total, decimals)` - Format as 75%
- `capitalize(str)`, `titleCase(str)`, `maskSensitive(str)`

**Example:**
```javascript
import { formatCurrency, formatDate, formatRelativeTime } from 'src/utils/formatters';

<Text>{formatCurrency(1234)}</Text>           // ₹1,234
<Text>{formatDate(new Date())}</Text>         // 13/01/2026
<Text>{formatRelativeTime(bookingDate)}</Text> // 2 hours ago
```

### storage.js

Higher-level encrypted storage operations with caching and expiry.

**Key Functions:**
- `getStorageData(key)` - Retrieve data from storage
- `setStorageData(key, data)` - Save data to storage
- `removeStorageData(key)` - Remove data from storage
- `getCachedData(key, expiryMinutes)` - Get cached data with expiry check
- `setCachedData(key, data, expiryMinutes)` - Save data with expiry
- `clearExpiredCache()` - Remove all expired cache
- `getAuthToken()` / `setAuthToken(token)` - Auth token management
- `getUserPreferences()` / `setUserPreferences(prefs)` - User preferences

**Example:**
```javascript
import { getAuthToken, setAuthToken, getCachedData, setCachedData } from 'src/utils/storage';

// Auth
const token = await getAuthToken();
await setAuthToken(newToken);

// Caching (expires in 60 minutes)
await setCachedData('user_profile', profileData, 60);
const cachedProfile = await getCachedData('user_profile', 60);
```

### navigation.js

Helper functions for common navigation patterns.

**Key Functions:**
- `resetToScreen(navigation, screenName, params)` - Reset to screen and clear history
- `resetToNestedScreen(navigation, tabName, screenName, params)` - Reset to nested screen
- `navigateToBooking(navigation, service, discount, tipAmount)` - Navigate to booking
- `navigateToTracking(navigation, bookingId)` - Navigate to service tracking
- `navigateToPayment(navigation, bookingDetails)` - Navigate to payment
- `navigateToChat(navigation, chatParams)` - Navigate to chat
- `navigateToHome()`, `navigateToProfile()`, `navigateToLogin()` - Quick navigation
- `safeGoBack(navigation)` - Go back or to home if can't go back
- `getCurrentRouteName(navigation)` - Get current screen name

**Example:**
```javascript
import {
  resetToScreen,
  navigateToBooking,
  getCurrentRouteName
} from 'src/utils/navigation';

// Navigate with history cleared
resetToScreen(navigation, SCREEN_NAMES.HOME);

// Navigate to booking
navigateToBooking(navigation, selectedService, 100, 50);

// Check current screen
const currentScreen = getCurrentRouteName(navigation);
```

### permissions.js

App permissions handling for Android and iOS.

**Key Functions:**
- `requestLocationPermission()` - Request location access
- `requestCameraPermission()` - Request camera access
- `requestNotificationPermission()` - Request notification permission
- `checkPermissionStatus(permission)` - Check specific permission status
- `isLocationPermissionGranted()` - Check if location is permitted
- `isCameraPermissionGranted()` - Check if camera is permitted
- `isNotificationPermissionGranted()` - Check if notifications are permitted
- `openAppSettings()` - Open app settings
- `requestMultiplePermissions(permissions)` - Request multiple at once
- `areAllPermissionsGranted(permissions)` - Check all are granted

**Example:**
```javascript
import {
  requestLocationPermission,
  isLocationPermissionGranted
} from 'src/utils/permissions';

// Request permission
const granted = await requestLocationPermission();

// Check if granted
const hasPermission = await isLocationPermissionGranted();

// Handle blocked permission
if (!granted) {
  openAppSettings();
}
```

## Best Practices

### 1. Use Constants Instead of Magic Strings
```javascript
// BAD
navigate('Home');

// GOOD
import { SCREEN_NAMES } from 'src/utils/constants';
navigate(SCREEN_NAMES.HOME);
```

### 2. Validate User Input
```javascript
import { validatePhone, validateEmail } from 'src/utils/validators';

const onSubmit = () => {
  if (!validatePhone(phone)) {
    setError('Invalid phone number');
    return;
  }
  // Proceed
};
```

### 3. Format Values for Display
```javascript
import { formatCurrency, formatDate, formatPhoneNumber } from 'src/utils/formatters';

<Text>{formatCurrency(bookingAmount)}</Text>
<Text>{formatDate(bookingDate)}</Text>
<Text>{formatPhoneNumber(workerPhone)}</Text>
```

### 4. Use Cached Storage for Performance
```javascript
import { getCachedData, setCachedData } from 'src/utils/storage';

// Cache expires in 30 minutes
await setCachedData('booking_list', bookings, 30);
const cached = await getCachedData('booking_list', 30);
```

### 5. Use Navigation Helpers
```javascript
import { resetToScreen, navigateToHome, safeGoBack } from 'src/utils/navigation';

// Reset navigation after login
resetToScreen(navigation, SCREEN_NAMES.HOME);

// Safe back navigation
<Button onPress={() => safeGoBack(navigation)} />
```

### 6. Check Permissions Before Access
```javascript
import { requestLocationPermission } from 'src/utils/permissions';

const getLocation = async () => {
  const granted = await requestLocationPermission();
  if (granted) {
    Geolocation.getCurrentPosition(...);
  }
};
```

## Testing

All utility functions are designed to be testable with no side effects (pure functions where possible).

**Example test:**
```javascript
import { validateEmail, formatCurrency } from 'src/utils';

describe('Validators', () => {
  test('validateEmail should validate correct email', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
  });
});

describe('Formatters', () => {
  test('formatCurrency should format amount correctly', () => {
    expect(formatCurrency(1234)).toBe('₹1,234');
    expect(formatCurrency(1000000)).toBe('₹10,00,000');
  });
});
```

## Performance Considerations

- All validators and formatters are synchronous and lightweight
- Storage operations are asynchronous; use `await` or `.then()`
- Cached data has automatic expiry to prevent stale data
- Navigation functions use `useCallback` internally when needed
- Permissions are cached by the OS; don't request repeatedly

## Contributing

When adding new utilities:

1. Place in appropriate file (validator → validators.js, etc.)
2. Add JSDoc comments with parameters and return types
3. Make functions pure when possible (no side effects)
4. Export from both file and index.js
5. Add to this README with usage examples
6. Write unit tests
7. Handle errors gracefully with console.warn logs

## Common Issues

### "Token not found" when accessing storage
```javascript
// Always check for null/undefined
const token = await getAuthToken();
if (!token) {
  // Handle missing token - redirect to login
}
```

### Geofence check always returns false
```javascript
// Ensure coordinates are [longitude, latitude] not [latitude, longitude]
const point = [longitude, latitude]; // CORRECT
const point = [latitude, longitude]; // WRONG
```

### Permissions showing blocked when they should be granted
```javascript
// On Android, some permissions need to be in AndroidManifest.xml
// Always handle the permission request result properly
const granted = await requestLocationPermission();
if (granted) {
  // Permission is granted
} else {
  // Permission is denied or blocked
  openAppSettings(); // Let user enable manually
}
```
