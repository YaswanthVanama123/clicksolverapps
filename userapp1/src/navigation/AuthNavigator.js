/**
 * Auth Navigator
 * Handles authentication and onboarding flow
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Auth Screens
import OnboardingScreen from '../Components/OnboardingScreen';
import LoginScreen from '../Components/LoginScreen';
import SignUpScreen from '../Components/SignUpScreen';
import VerificationScreen from '../Components/VerificationScreen';
import LanguageSelector from '../Components/LanguageSelector';

// Import screen names from constants
import { SCREEN_NAMES } from '../utils/constants';

const Stack = createNativeStackNavigator();

/**
 * Auth Navigator Component
 * Handles the authentication flow: Language > Onboarding > Login > Verification > SignUp
 */
const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: false, // Disable back gesture in auth flow
      }}
    >
      {/* Language Selection (Optional first step) */}
      <Stack.Screen
        name="LanguageSelector"
        component={LanguageSelector}
        options={{
          title: 'Select Language',
        }}
      />

      {/* Onboarding Screens */}
      <Stack.Screen
        name="OnboardingScreen"
        component={OnboardingScreen}
        options={{
          title: 'Welcome',
          gestureEnabled: false,
        }}
      />

      {/* Login Screen */}
      <Stack.Screen
        name={SCREEN_NAMES.LOGIN}
        component={LoginScreen}
        options={{
          title: 'Login',
          animation: 'fade',
        }}
      />

      {/* OTP Verification */}
      <Stack.Screen
        name={SCREEN_NAMES.VERIFICATION}
        component={VerificationScreen}
        options={{
          title: 'Verify OTP',
          gestureEnabled: true,
        }}
      />

      {/* Sign Up (New User Registration) */}
      <Stack.Screen
        name={SCREEN_NAMES.SIGN_UP}
        component={SignUpScreen}
        options={{
          title: 'Sign Up',
          gestureEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
