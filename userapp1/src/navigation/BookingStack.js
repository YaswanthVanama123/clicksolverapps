/**
 * Booking Stack Navigator
 * Handles booking history and order management screens
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';

// Booking Screens
import RecentServices from '../Components/RecentServices';
import OrderScreen from '../Components/OrderScreen';
import ServiceBookingItem from '../Components/ServiceBookingItem';
import ServiceBookingOngoingItem from '../Components/ServiceBookingOngoingItem';

// Import screen names from constants
import { SCREEN_NAMES } from '../utils/constants';

const Stack = createNativeStackNavigator();

/**
 * Booking Stack Navigator Component
 * Manages all booking-related screens (history, details, ongoing orders)
 */
const BookingStack = () => {
  const { isDarkMode } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: isDarkMode ? '#121212' : '#F8F9FA',
        },
      }}
    >
      {/* Main Bookings List Screen */}
      <Stack.Screen
        name="RecentServices"
        component={RecentServices}
        options={{
          title: 'My Bookings',
        }}
      />

      {/* Order Details Screen */}
      <Stack.Screen
        name="OrderScreen"
        component={OrderScreen}
        options={{
          title: 'Order Details',
        }}
      />

      {/* Individual Booking Item (Completed) */}
      <Stack.Screen
        name="serviceBookingItem"
        component={ServiceBookingItem}
        options={{
          title: 'Booking Details',
        }}
      />

      {/* Individual Booking Item (Ongoing) */}
      <Stack.Screen
        name="ServiceBookingOngoingItem"
        component={ServiceBookingOngoingItem}
        options={{
          title: 'Ongoing Booking',
        }}
      />
    </Stack.Navigator>
  );
};

export default BookingStack;
