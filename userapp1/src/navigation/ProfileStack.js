/**
 * Profile Stack Navigator
 * Handles profile and account management screens
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';

// Profile Screens
import ProfileScreen from '../Components/ProfileScreen';
import EditProfile from '../Components/EditProfile';
import AccountDelete from '../Components/AccountDelete';
import ReferralScreen from '../Components/ReferralScreen';
import Myrefferals from '../Components/Myrefferals';
import LanguageSelector from '../Components/LanguageSelector';

// Import screen names from constants
import { SCREEN_NAMES } from '../utils/constants';

const Stack = createNativeStackNavigator();

/**
 * Profile Stack Navigator Component
 * Manages all profile-related screens
 */
const ProfileStack = () => {
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
      {/* Main Profile Screen */}
      <Stack.Screen
        name={SCREEN_NAMES.PROFILE}
        component={ProfileScreen}
        options={{
          title: 'Profile',
        }}
      />

      {/* Edit Profile */}
      <Stack.Screen
        name={SCREEN_NAMES.EDIT_PROFILE}
        component={EditProfile}
        options={{
          title: 'Edit Profile',
        }}
      />

      {/* Account Deletion */}
      <Stack.Screen
        name={SCREEN_NAMES.ACCOUNT_DELETE}
        component={AccountDelete}
        options={{
          title: 'Delete Account',
          animation: 'slide_from_bottom',
        }}
      />

      {/* Referral Screens */}
      <Stack.Screen
        name={SCREEN_NAMES.REFERRALS}
        component={ReferralScreen}
        options={{
          title: 'Refer & Earn',
        }}
      />

      <Stack.Screen
        name={SCREEN_NAMES.MY_REFERRALS}
        component={Myrefferals}
        options={{
          title: 'My Referrals',
        }}
      />

      {/* Language Settings */}
      <Stack.Screen
        name={SCREEN_NAMES.LANGUAGE_SELECTOR}
        component={LanguageSelector}
        options={{
          title: 'Language Settings',
        }}
      />
    </Stack.Navigator>
  );
};

export default ProfileStack;
