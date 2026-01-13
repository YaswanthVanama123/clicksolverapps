/**
 * Example usage of Zustand stores in React Native components
 *
 * This file demonstrates common patterns and best practices
 * for using the Zustand stores in your application.
 */

import React, {useEffect, useState} from 'react';
import {View, Text, Button, FlatList, Alert} from 'react-native';
import {
  useAuthStore,
  useBookingStore,
  useUserStore,
  useNotificationStore,
  bookingSelectors,
  userSelectors,
  notificationSelectors,
} from './store';

// ============================================================================
// Example 1: Authentication Flow
// ============================================================================

export const LoginExample = ({navigation}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');

  // Access auth store
  const {login, isLoading, isAuthenticated} = useAuthStore();

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const result = await useAuthStore.getState().checkAuth();
      if (result.isAuthenticated) {
        navigation.replace('Home');
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async () => {
    const result = await login(phoneNumber, otp);

    if (result.success) {
      navigation.replace('Home');
    } else {
      Alert.alert('Login Failed', result.error);
    }
  };

  return (
    <View>
      {/* Your login UI */}
      <Button
        title={isLoading ? 'Logging in...' : 'Login'}
        onPress={handleLogin}
        disabled={isLoading}
      />
    </View>
  );
};

// ============================================================================
// Example 2: Using Selectors for Better Performance
// ============================================================================

export const OptimizedComponent = () => {
  // This component only re-renders when isAuthenticated changes
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // Using predefined selectors
  const cartTotal = useBookingStore(bookingSelectors.cartTotal);
  const cartCount = useBookingStore(bookingSelectors.cartCount);
  const unreadCount = useNotificationStore(notificationSelectors.unreadCount);

  return (
    <View>
      <Text>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</Text>
      <Text>Cart Items: {cartCount}</Text>
      <Text>Cart Total: ${cartTotal.toFixed(2)}</Text>
      <Text>Unread Notifications: {unreadCount}</Text>
    </View>
  );
};

// ============================================================================
// Example 3: Cart Management
// ============================================================================

export const ServiceListExample = ({services}) => {
  const addToCart = useBookingStore(state => state.addToCart);
  const cart = useBookingStore(state => state.cart);

  const handleAddToCart = service => {
    addToCart(service);
    Alert.alert('Success', `${service.name} added to cart`);
  };

  const isInCart = serviceId => {
    return cart.some(item => item.id === serviceId);
  };

  return (
    <FlatList
      data={services}
      keyExtractor={item => item.id}
      renderItem={({item}) => (
        <View>
          <Text>{item.name}</Text>
          <Text>${item.price}</Text>
          <Button
            title={isInCart(item.id) ? 'In Cart' : 'Add to Cart'}
            onPress={() => handleAddToCart(item)}
            disabled={isInCart(item.id)}
          />
        </View>
      )}
    />
  );
};

// ============================================================================
// Example 4: Cart Screen with Checkout
// ============================================================================

export const CartExample = ({navigation}) => {
  const cart = useBookingStore(state => state.cart);
  const removeFromCart = useBookingStore(state => state.removeFromCart);
  const updateQuantity = useBookingStore(state => state.updateQuantity);
  const startBooking = useBookingStore(state => state.startBooking);
  const selectedAddress = useBookingStore(state => state.selectedAddress);
  const cartTotal = useBookingStore(bookingSelectors.cartTotal);
  const totalAmount = useBookingStore(bookingSelectors.totalAmount);

  const handleCheckout = async () => {
    if (!selectedAddress) {
      Alert.alert('Error', 'Please select an address');
      return;
    }

    if (cart.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    const result = await startBooking({
      paymentMethod: 'card', // or 'cash', 'wallet', etc.
    });

    if (result.success) {
      navigation.navigate('BookingConfirmation', {
        bookingId: result.bookingId,
      });
    } else {
      Alert.alert('Booking Failed', result.error);
    }
  };

  return (
    <View>
      <FlatList
        data={cart}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View>
            <Text>{item.name}</Text>
            <Text>Quantity: {item.quantity}</Text>
            <Text>${(item.price * item.quantity).toFixed(2)}</Text>
            <Button
              title="+"
              onPress={() => updateQuantity(item.id, item.quantity + 1)}
            />
            <Button
              title="-"
              onPress={() => updateQuantity(item.id, item.quantity - 1)}
            />
            <Button
              title="Remove"
              onPress={() => removeFromCart(item.id)}
            />
          </View>
        )}
      />
      <Text>Subtotal: ${cartTotal.toFixed(2)}</Text>
      <Text>Total: ${totalAmount.toFixed(2)}</Text>
      <Button title="Checkout" onPress={handleCheckout} />
    </View>
  );
};

// ============================================================================
// Example 5: User Profile Management
// ============================================================================

export const ProfileExample = () => {
  const profile = useUserStore(state => state.profile);
  const savedAddresses = useUserStore(state => state.savedAddresses);
  const addAddress = useUserStore(state => state.addAddress);
  const setDefaultAddress = useUserStore(state => state.setDefaultAddress);

  const handleAddAddress = async () => {
    const newAddress = {
      type: 'home',
      addressLine1: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      isDefault: false,
    };

    const result = await addAddress(newAddress);

    if (result.success) {
      Alert.alert('Success', 'Address added successfully');
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handleSetDefault = async addressId => {
    const result = await setDefaultAddress(addressId);

    if (result.success) {
      Alert.alert('Success', 'Default address updated');
    } else {
      Alert.alert('Error', result.error);
    }
  };

  return (
    <View>
      <Text>Name: {profile?.name}</Text>
      <Text>Phone: {profile?.phoneNumber}</Text>

      <Text>Saved Addresses:</Text>
      <FlatList
        data={savedAddresses}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View>
            <Text>{item.addressLine1}</Text>
            <Text>{item.city}, {item.state} {item.zipCode}</Text>
            {item.isDefault && <Text>Default</Text>}
            {!item.isDefault && (
              <Button
                title="Set as Default"
                onPress={() => handleSetDefault(item.id)}
              />
            )}
          </View>
        )}
      />

      <Button title="Add New Address" onPress={handleAddAddress} />
    </View>
  );
};

// ============================================================================
// Example 6: Notifications
// ============================================================================

export const NotificationsExample = () => {
  const notifications = useNotificationStore(state => state.notifications);
  const unreadCount = useNotificationStore(state => state.unreadCount);
  const markAsRead = useNotificationStore(state => state.markAsRead);
  const markAllAsRead = useNotificationStore(state => state.markAllAsRead);

  useEffect(() => {
    // Load notifications on mount
    useNotificationStore.getState().loadNotifications();
  }, []);

  return (
    <View>
      <View>
        <Text>Notifications ({unreadCount} unread)</Text>
        <Button title="Mark All as Read" onPress={markAllAsRead} />
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={{opacity: item.isRead ? 0.5 : 1}}>
            <Text>{item.title}</Text>
            <Text>{item.message}</Text>
            <Text>{new Date(item.timestamp).toLocaleString()}</Text>
            {!item.isRead && (
              <Button
                title="Mark as Read"
                onPress={() => markAsRead(item.id)}
              />
            )}
          </View>
        )}
      />
    </View>
  );
};

// ============================================================================
// Example 7: Combined Store Usage
// ============================================================================

export const DashboardExample = () => {
  const user = useAuthStore(state => state.user);
  const cartCount = useBookingStore(bookingSelectors.cartCount);
  const unreadCount = useNotificationStore(notificationSelectors.unreadCount);
  const recentServices = useUserStore(state => state.recentServices);

  return (
    <View>
      <Text>Welcome, {user?.name}!</Text>
      <Text>Cart Items: {cartCount}</Text>
      <Text>Unread Notifications: {unreadCount}</Text>

      <Text>Recently Viewed Services:</Text>
      <FlatList
        horizontal
        data={recentServices}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View>
            <Text>{item.name}</Text>
            <Text>${item.price}</Text>
          </View>
        )}
      />
    </View>
  );
};

// ============================================================================
// Example 8: Logout and Cleanup
// ============================================================================

export const LogoutExample = ({navigation}) => {
  const logout = useAuthStore(state => state.logout);
  const clearCart = useBookingStore(state => state.clearCart);
  const clearUserData = useUserStore(state => state.clearUserData);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            // Clear all stores
            await logout();
            clearCart();
            await clearUserData();

            // Navigate to login
            navigation.replace('Login');
          },
        },
      ],
    );
  };

  return (
    <View>
      <Button title="Logout" onPress={handleLogout} color="red" />
    </View>
  );
};

// ============================================================================
// Example 9: FCM Token Management (for Push Notifications)
// ============================================================================

export const FCMTokenExample = () => {
  useEffect(() => {
    // Initialize FCM and save token
    const initializeFCM = async () => {
      try {
        // Get FCM token from Firebase
        // const token = await messaging().getToken();

        // Save token to store
        // await useNotificationStore.getState().setFCMToken(token);

        // Listen for token refresh
        // messaging().onTokenRefresh(async newToken => {
        //   await useNotificationStore.getState().setFCMToken(newToken);
        // });
      } catch (error) {
        console.error('FCM initialization error:', error);
      }
    };

    initializeFCM();
  }, []);

  return null; // This is typically in App.js or a provider
};

// ============================================================================
// Example 10: Loading User Data on App Start
// ============================================================================

export const AppInitializationExample = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check authentication
        await useAuthStore.getState().checkAuth();

        // Load user data
        await useUserStore.getState().loadUserData();

        // Load notifications
        await useNotificationStore.getState().loadNotifications();

        setIsReady(true);
      } catch (error) {
        console.error('App initialization error:', error);
        setIsReady(true);
      }
    };

    initializeApp();
  }, []);

  if (!isReady) {
    return <Text>Loading...</Text>;
  }

  return <Text>App Ready</Text>;
};
