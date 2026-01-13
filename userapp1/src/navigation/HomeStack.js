/**
 * Home Stack Navigator
 * Handles home screen and service booking flow
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';

// Home & Service Screens
import HomeScreen from '../screens/home/HomeScreen';
import ServiceApp from '../screens/SecondPage';
import SingleService from '../screens/SingleService';
import PaintingServices from '../screens/Indiv';
import SearchItem from '../Components/SearchItem';
import QuickSearch from '../Components/QuickSearch';
import UserLocation from '../Components/userLocation';
import LocationSearch from '../Components/LocationSearch';

// Booking Flow Screens
import UserWaiting from '../Components/UserWaiting';
import ServiceInProgress from '../Components/ServiceInProgress';
import ServiceCompletion from '../Components/ServiceCompletion';
import Payment from '../Components/Paymentscreen';
import PaymentScreenRazor from '../Components/PaymentScreenRazor';
import Navigation from '../Components/Navigation';

// Notification Screen
import UserNotifications from '../screens/UserNotifications';

// Import screen names from constants
import { SCREEN_NAMES } from '../utils/constants';

const Stack = createNativeStackNavigator();

/**
 * Home Stack Navigator Component
 * Manages home screen and all service-related navigation flows
 */
const HomeStack = () => {
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
      {/* Main Home Screen */}
      <Stack.Screen
        name={SCREEN_NAMES.HOME}
        component={HomeScreen}
        options={{
          title: 'Home',
        }}
      />

      {/* Legacy Home Screen (SecondPage) */}
      <Stack.Screen
        name="ServiceApp"
        component={ServiceApp}
        options={{
          title: 'Services',
        }}
      />

      {/* Search Screens */}
      <Stack.Screen
        name="SearchItem"
        component={SearchItem}
        options={{
          title: 'Search Services',
          animation: 'fade',
        }}
      />

      <Stack.Screen
        name={SCREEN_NAMES.QUICK_SEARCH}
        component={QuickSearch}
        options={{
          title: 'Quick Search',
          animation: 'fade',
        }}
      />

      {/* Service Selection & Booking */}
      <Stack.Screen
        name="ServiceBooking"
        component={SingleService}
        options={{
          title: 'Book Service',
        }}
      />

      <Stack.Screen
        name="serviceCategory"
        component={PaintingServices}
        options={{
          title: 'Service Category',
        }}
      />

      {/* Location Selection */}
      <Stack.Screen
        name={SCREEN_NAMES.LOCATION_SELECTION}
        component={UserLocation}
        options={{
          title: 'Select Location',
        }}
      />

      <Stack.Screen
        name={SCREEN_NAMES.LOCATION_SEARCH}
        component={LocationSearch}
        options={{
          title: 'Search Location',
          animation: 'fade',
        }}
      />

      {/* Booking Flow Screens */}
      <Stack.Screen
        name={SCREEN_NAMES.USER_WAITING}
        component={UserWaiting}
        options={{
          title: 'Finding Service Provider',
          gestureEnabled: false, // Prevent back during waiting
        }}
      />

      <Stack.Screen
        name={SCREEN_NAMES.SERVICE_IN_PROGRESS}
        component={ServiceInProgress}
        options={{
          title: 'Service In Progress',
          gestureEnabled: false,
        }}
      />

      <Stack.Screen
        name="worktimescreen"
        component={ServiceInProgress}
        options={{
          title: 'Work Time',
          gestureEnabled: false,
        }}
      />

      <Stack.Screen
        name={SCREEN_NAMES.SERVICE_COMPLETION}
        component={ServiceCompletion}
        options={{
          title: 'Service Completed',
          gestureEnabled: false,
        }}
      />

      {/* Payment Screens */}
      <Stack.Screen
        name={SCREEN_NAMES.PAYMENT}
        component={Payment}
        options={{
          title: 'Payment',
          gestureEnabled: false,
        }}
      />

      <Stack.Screen
        name={SCREEN_NAMES.PAYMENT_RAZOR}
        component={PaymentScreenRazor}
        options={{
          title: 'Complete Payment',
          gestureEnabled: false,
        }}
      />

      {/* Navigation/Tracking */}
      <Stack.Screen
        name={SCREEN_NAMES.NAVIGATION}
        component={Navigation}
        options={{
          title: 'Track Service Provider',
        }}
      />

      <Stack.Screen
        name="UserNavigation"
        component={Navigation}
        options={{
          title: 'Navigation',
        }}
      />

      {/* Notifications */}
      <Stack.Screen
        name={SCREEN_NAMES.NOTIFICATIONS}
        component={UserNotifications}
        options={{
          title: 'Notifications',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
};

export default HomeStack;
