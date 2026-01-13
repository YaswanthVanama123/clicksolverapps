# Custom React Hooks for userapp1

This directory contains custom React hooks that provide reusable logic for common operations in the userapp1 application.

## Available Hooks

### 1. useAuth
Authentication management hook that handles token persistence, user state, and authentication checks.

**Features:**
- Wraps authentication state management
- Token persistence with EncryptedStorage
- Auto-checks authentication on mount
- User data management

**Usage:**
```javascript
import { useAuth } from '../hooks';

function MyComponent() {
  const {
    isAuthenticated,
    user,
    loading,
    error,
    login,
    logout,
    checkAuth,
    updateUser,
    getToken
  } = useAuth();

  const handleLogin = async (token, userData) => {
    try {
      await login(token, userData);
      // Handle successful login
    } catch (err) {
      // Handle error
    }
  };

  return (
    // Your component JSX
  );
}
```

### 2. useApi
Generic hook for API calls with loading and error state management.

**Features:**
- Handles loading states automatically
- Error handling with detailed error objects
- Supports manual execution
- Request cancellation
- Cleanup on unmount

**Usage:**
```javascript
import { useApi } from '../hooks';
import axios from 'axios';

function MyComponent() {
  const fetchUserData = async (userId) => {
    const response = await axios.get(`/api/users/${userId}`);
    return response.data;
  };

  const {
    data,
    loading,
    error,
    execute,
    reset,
    cancel
  } = useApi(fetchUserData, {
    immediate: false, // Don't execute on mount
    onSuccess: (data) => console.log('Success:', data),
    onError: (error) => console.error('Error:', error)
  });

  const loadData = () => {
    execute(123); // Pass userId
  };

  return (
    // Your component JSX
  );
}
```

### 3. useStorage
Abstraction over EncryptedStorage for secure data persistence.

**Features:**
- Encrypted storage operations
- Automatic JSON parsing/stringification
- Loading states for all operations
- Error handling
- Batch operations

**Usage:**
```javascript
import { useStorage } from '../hooks';

function MyComponent() {
  const {
    getItem,
    setItem,
    removeItem,
    clear,
    getMultipleItems,
    setMultipleItems,
    loading,
    error
  } = useStorage();

  const saveData = async () => {
    await setItem('user_preferences', { theme: 'dark', language: 'en' });
  };

  const loadData = async () => {
    const preferences = await getItem('user_preferences');
    console.log(preferences);
  };

  return (
    // Your component JSX
  );
}
```

### 4. useLocation
Location services hook with permission handling and geofencing.

**Features:**
- Location permission management
- Get current location
- Watch position changes
- Geofence checking (point-in-polygon)
- Cleanup on unmount

**Usage:**
```javascript
import { useLocation } from '../hooks';

function MyComponent() {
  const {
    location,
    loading,
    error,
    permissionStatus,
    requestLocationPermission,
    getCurrentLocation,
    watchPosition,
    stopWatching,
    checkGeofence,
    isInGeofence
  } = useLocation();

  const getLocation = async () => {
    // Request permission first
    const status = await requestLocationPermission();

    if (status === 'granted') {
      // Get current location
      const location = await getCurrentLocation();
      console.log(location);
    }
  };

  const startTracking = async () => {
    await watchPosition((location) => {
      console.log('Location updated:', location);
    });
  };

  useEffect(() => {
    return () => stopWatching(); // Cleanup
  }, []);

  return (
    // Your component JSX
  );
}
```

### 5. useBooking
High-level booking operations hook.

**Features:**
- Quick booking functionality
- Instant booking with preferences
- Cancel bookings
- Get booking details and history
- Rate bookings
- Automatic state updates

**Usage:**
```javascript
import { useBooking } from '../hooks';

function MyComponent() {
  const {
    bookings,
    currentBooking,
    loading,
    error,
    quickBook,
    instantBook,
    cancelBooking,
    getBookingDetails,
    getBookingHistory,
    rateBooking,
    refreshBookings
  } = useBooking();

  const createBooking = async () => {
    try {
      const booking = await quickBook(
        'service-123',
        'address-456',
        {
          scheduled_time: '2024-01-15T10:00:00Z',
          notes: 'Please arrive on time'
        }
      );
      console.log('Booking created:', booking);
    } catch (err) {
      console.error('Booking failed:', err);
    }
  };

  return (
    // Your component JSX
  );
}
```

### 6. useNotifications
Firebase Cloud Messaging (FCM) notifications hook.

**Features:**
- FCM setup and token management
- Foreground/background notification handling
- Notification permissions
- Store notifications locally
- Navigate based on notification data
- Mark notifications as read

**Usage:**
```javascript
import { useNotifications } from '../hooks';
import { useNavigationContainerRef } from '@react-navigation/native';

function MyComponent() {
  const navigationRef = useNavigationContainerRef();

  const {
    notifications,
    lastNotification,
    loading,
    error,
    permissionStatus,
    fcmToken,
    requestNotificationPermission,
    getNotifications,
    clearNotifications,
    markAsRead
  } = useNotifications(navigationRef);

  const setupNotifications = async () => {
    const status = await requestNotificationPermission();
    console.log('Permission status:', status);
    console.log('FCM Token:', fcmToken);
  };

  return (
    // Your component JSX
  );
}
```

## Import Methods

### Named Imports
```javascript
import { useAuth, useApi, useStorage } from '../hooks';
```

### Individual Imports
```javascript
import useAuth from '../hooks/useAuth';
import useApi from '../hooks/useApi';
```

## Best Practices

1. **Error Handling**: Always handle errors returned by hooks
```javascript
if (error) {
  Alert.alert('Error', error.message);
}
```

2. **Cleanup**: Hooks handle cleanup automatically, but ensure components using them follow React best practices
```javascript
useEffect(() => {
  return () => {
    // Cleanup if needed
  };
}, []);
```

3. **Loading States**: Use loading states to show appropriate UI feedback
```javascript
if (loading) {
  return <ActivityIndicator />;
}
```

4. **TypeScript Support**: All hooks have JSDoc comments for IntelliSense support in VS Code

5. **Memoization**: Hooks use `useCallback` and `useMemo` internally for performance optimization

## Hook Dependencies

These hooks depend on the following packages:
- `react-native-encrypted-storage` - Secure storage
- `react-native-geolocation-service` - Location services
- `react-native-permissions` - Permission management
- `@react-native-firebase/messaging` - FCM notifications
- `react-native-push-notification` - Local notifications
- `axios` - HTTP requests
- `base-64` - Base64 encoding

## Notes

- All hooks handle component unmounting and cleanup automatically
- Hooks use EncryptedStorage for sensitive data persistence
- Error objects include original error for debugging
- All async operations are properly handled with try-catch
- Hooks are optimized with proper React hooks patterns (useCallback, useMemo, etc.)
