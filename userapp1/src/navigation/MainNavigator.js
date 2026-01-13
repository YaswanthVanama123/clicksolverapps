/**
 * Main Navigator (Bottom Tabs)
 * Main app navigation with bottom tabs for authenticated users
 */

import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

// Icons
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Stack Navigators
import HomeStack from './HomeStack';
import BookingStack from './BookingStack';
import ProfileStack from './ProfileStack';

// Tracking Screen
import ServiceTrackingListScreen from '../Components/ServiceTrackingListScreen';

const Tab = createBottomTabNavigator();

/**
 * Main Navigator Component
 * Bottom tab navigation for the main app
 */
const MainNavigator = () => {
  const { isDarkMode } = useTheme();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // Tab Bar Icons
        tabBarIcon: ({ focused, color, size }) => {
          const iconSize = focused ? 28 : 24;

          if (route.name === 'HomeTab') {
            return <Feather name="home" size={iconSize} color={color} />;
          }
          if (route.name === 'BookingsTab') {
            return <Feather name="clipboard" size={iconSize} color={color} />;
          }
          if (route.name === 'TrackingTab') {
            return <Feather name="shopping-bag" size={iconSize} color={color} />;
          }
          if (route.name === 'ProfileTab') {
            return (
              <MaterialCommunityIcons
                name="account-outline"
                size={iconSize}
                color={color}
              />
            );
          }
        },

        // Tab Bar Styling
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: isDarkMode ? '#B4B4B4' : '#6B7280',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: Platform.OS === 'ios' ? 0 : 5,
        },
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          backgroundColor: isDarkMode ? '#1A1A2E' : '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: isDarkMode ? '#2A2A3E' : '#E5E7EB',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarItemStyle: {
          paddingVertical: 5,
        },

        // Header
        headerShown: false,

        // Animation
        tabBarHideOnKeyboard: true,
      })}
    >
      {/* Home Tab */}
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarLabel: t('tab_home', 'Home'),
          title: 'Home',
        }}
      />

      {/* Bookings Tab */}
      <Tab.Screen
        name="BookingsTab"
        component={BookingStack}
        options={{
          tabBarLabel: t('tab_bookings', 'Bookings'),
          title: 'Bookings',
          tabBarBadge: undefined, // Can be used to show booking count
        }}
      />

      {/* Tracking Tab */}
      <Tab.Screen
        name="TrackingTab"
        component={ServiceTrackingListScreen}
        options={{
          tabBarLabel: t('tab_tracking', 'Tracking'),
          title: 'Tracking',
          tabBarBadge: undefined, // Can be used to show active tracking count
        }}
      />

      {/* Profile Tab */}
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          tabBarLabel: t('tab_account', 'Account'),
          title: 'Account',
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
