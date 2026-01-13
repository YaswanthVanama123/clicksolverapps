# Zustand Store Setup for UserApp1

This directory contains the Zustand state management setup for the user application.

## Installation

Zustand has been added to the dependencies. Run:

```bash
npm install
# or
yarn install
```

## Store Structure

### 1. authStore.js
Manages authentication state and operations.

**State:**
- `token`: Authentication token
- `user`: Current user data
- `isAuthenticated`: Authentication status
- `isLoading`: Loading state

**Actions:**
- `setToken(token)`: Set authentication token
- `setUser(user)`: Set user data
- `login(phoneNumber, otp)`: Login with phone and OTP
- `logout()`: Logout and clear data
- `checkAuth()`: Check authentication status on app start

**Usage:**
```javascript
import {useAuthStore} from './store';

// In your component
const MyComponent = () => {
  const {user, isAuthenticated, login, logout} = useAuthStore();

  // Or use selectors for better performance
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return (
    // Your component JSX
  );
};
```

### 2. bookingStore.js
Manages booking cart and checkout process.

**State:**
- `cart`: Array of services in cart
- `selectedServices`: Selected services
- `selectedAddress`: Delivery/service address
- `bookingInProgress`: Booking status
- `currentBookingId`: Active booking ID
- `tipAmount`: Tip amount
- `appliedOffer`: Applied offer/coupon
- `discount`: Calculated discount

**Actions:**
- `addToCart(service)`: Add service to cart
- `removeFromCart(serviceId)`: Remove service from cart
- `updateQuantity(serviceId, quantity)`: Update service quantity
- `setAddress(address)`: Set service address
- `setTip(amount)`: Set tip amount
- `applyOffer(offer)`: Apply offer/coupon
- `clearCart()`: Clear entire cart
- `startBooking(data)`: Start booking process
- `completeBooking()`: Complete and clear booking

**Usage:**
```javascript
import {useBookingStore, bookingSelectors} from './store';

const CartComponent = () => {
  const cart = useBookingStore(state => state.cart);
  const addToCart = useBookingStore(state => state.addToCart);
  const cartTotal = useBookingStore(bookingSelectors.cartTotal);

  return (
    // Your component JSX
  );
};
```

### 3. userStore.js
Manages user profile and preferences.

**State:**
- `profile`: User profile data
- `savedAddresses`: Array of saved addresses
- `preferences`: User preferences
- `recentServices`: Recently viewed/used services

**Actions:**
- `setProfile(profile)`: Set user profile
- `addAddress(address)`: Add new address
- `removeAddress(addressId)`: Remove address
- `setDefaultAddress(addressId)`: Set default address
- `updatePreferences(prefs)`: Update preferences
- `addRecentService(service)`: Add to recent services
- `loadUserData()`: Load persisted data
- `clearUserData()`: Clear all user data

**Usage:**
```javascript
import {useUserStore, userSelectors} from './store';

const ProfileComponent = () => {
  const profile = useUserStore(state => state.profile);
  const savedAddresses = useUserStore(state => state.savedAddresses);
  const addAddress = useUserStore(state => state.addAddress);

  return (
    // Your component JSX
  );
};
```

### 4. notificationStore.js
Manages notifications and FCM token.

**State:**
- `notifications`: Array of notifications
- `unreadCount`: Count of unread notifications
- `fcmToken`: Firebase Cloud Messaging token

**Actions:**
- `addNotification(notification)`: Add new notification
- `markAsRead(notificationId)`: Mark notification as read
- `markAllAsRead()`: Mark all as read
- `clearNotifications()`: Clear all notifications
- `setFCMToken(token)`: Set FCM token
- `loadNotifications()`: Load from storage
- `fetchNotifications()`: Fetch from API
- `deleteNotification(notificationId)`: Delete notification

**Usage:**
```javascript
import {useNotificationStore, notificationSelectors} from './store';

const NotificationComponent = () => {
  const unreadCount = useNotificationStore(state => state.unreadCount);
  const notifications = useNotificationStore(state => state.notifications);
  const markAsRead = useNotificationStore(state => state.markAsRead);

  return (
    // Your component JSX
  );
};
```

## Best Practices

### 1. Use Selectors for Better Performance
```javascript
// Good - Only re-renders when isAuthenticated changes
const isAuthenticated = useAuthStore(state => state.isAuthenticated);

// Bad - Re-renders on any state change
const {isAuthenticated} = useAuthStore();
```

### 2. Use Provided Selectors
```javascript
import {useBookingStore, bookingSelectors} from './store';

// Calculate cart total efficiently
const cartTotal = useBookingStore(bookingSelectors.cartTotal);
const cartCount = useBookingStore(bookingSelectors.cartCount);
```

### 3. Access Multiple Stores
```javascript
import {useStores} from './store';

const MyComponent = () => {
  const {auth, booking, user, notification} = useStores();

  // Access all stores
};
```

### 4. Async Actions
All async actions return a result object:
```javascript
const result = await login(phoneNumber, otp);

if (result.success) {
  // Handle success
  console.log('Login successful');
} else {
  // Handle error
  console.error(result.error);
}
```

## Persistence

The stores use `react-native-encrypted-storage` for secure data persistence:

- **authStore**: Persists token and user data
- **userStore**: Persists profile, addresses, preferences, and recent services
- **notificationStore**: Persists notifications and FCM token

Data is automatically loaded on app start and saved when updated.

## Development Tools

Zustand DevTools are enabled in development mode (`__DEV__`). You can use React Native Debugger or Flipper to inspect store state and actions.

## API Integration

Replace placeholder API endpoints in each store with your actual backend endpoints:

```javascript
// Example in authStore.js
const response = await axios.post('/api/auth/login', {
  phoneNumber,
  otp,
});

// Update to your actual endpoint
const response = await axios.post('https://your-api.com/auth/login', {
  phoneNumber,
  otp,
});
```

## Example: Complete Login Flow

```javascript
import React, {useState} from 'react';
import {useAuthStore} from './store';

const LoginScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const {login, isLoading} = useAuthStore();

  const handleLogin = async () => {
    const result = await login(phoneNumber, otp);

    if (result.success) {
      // Navigate to home screen
      navigation.navigate('Home');
    } else {
      // Show error
      Alert.alert('Login Failed', result.error);
    }
  };

  return (
    // Your login UI
  );
};
```

## Example: Cart Management

```javascript
import React from 'react';
import {useBookingStore, bookingSelectors} from './store';

const CartScreen = () => {
  const cart = useBookingStore(state => state.cart);
  const cartTotal = useBookingStore(bookingSelectors.cartTotal);
  const updateQuantity = useBookingStore(state => state.updateQuantity);
  const removeFromCart = useBookingStore(state => state.removeFromCart);
  const startBooking = useBookingStore(state => state.startBooking);

  const handleCheckout = async () => {
    const result = await startBooking({
      // Additional booking data
    });

    if (result.success) {
      // Navigate to booking confirmation
      navigation.navigate('BookingConfirmation', {
        bookingId: result.bookingId
      });
    }
  };

  return (
    // Your cart UI
  );
};
```

## Notes

- All stores use the devtools middleware for debugging in development
- Async actions include error handling and return success/error objects
- State updates are optimized with action names for better debugging
- Cart calculations handle quantity updates and discount application
- Notification store integrates with FCM for push notifications
- User preferences and addresses persist across app sessions
