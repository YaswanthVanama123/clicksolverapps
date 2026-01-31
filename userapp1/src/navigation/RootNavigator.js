/**
 * Root Navigator
 * Main navigation container with authentication flow logic
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, ActivityIndicator, AppState } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';
import EncryptedStorage from 'react-native-encrypted-storage';
import messaging from '@react-native-firebase/messaging';
import { encode as btoa } from 'base-64';

// Navigators
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

// Navigation ref
import { navigationRef } from './navigationRef';

// Shared Screens (accessible from anywhere)
import ChatScreen from '../Components/ChatScreen';
import HelpScreen from '../Components/HelpScreen';
import AboutCS from '../Components/AboutCS';
import LocationSearch from '../Components/LocationSearch';
import ServiceTrackingItemScreen from '../Components/ServiceTrackingItemScreen';

// Store
import useAuthStore from '../store/authStore';

// Constants
import { SCREEN_NAMES } from '../utils/constants';
import { useTheme } from '../context/ThemeContext';

const Stack = createNativeStackNavigator();

/**
 * Root Navigator Component
 * Handles app-level navigation and authentication state
 */
const RootNavigator = () => {
  const { isDarkMode } = useTheme();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const isNavigationReady = useRef(false);
  const [appState, setAppState] = useState(AppState.currentState);

  /**
   * Check onboarding status and authentication on app load
   */
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);

      // Check if user has completed onboarding
      const onboarded = await EncryptedStorage.getItem('onboarded');
      const hasCompletedOnboarding = onboarded === 'true';

      // Check authentication status
      const authResult = await checkAuth();
      const isUserAuthenticated = authResult?.isAuthenticated || false;

      // Determine initial route
      if (!hasCompletedOnboarding) {
        setShowOnboarding(true);
        setInitialRoute('Auth');
      } else if (isUserAuthenticated) {
        setInitialRoute('Main');
      } else {
        setInitialRoute('Auth');
      }
    } catch (error) {
      console.error('Error initializing app:', error);
      setInitialRoute('Auth');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle notification navigation
   */
  const handleNotificationNavigation = useCallback(
    async (remoteMessage) => {
      if (!remoteMessage?.data || !isNavigationReady.current) {
        // Store notification for later if navigation not ready
        if (remoteMessage?.data) {
          await EncryptedStorage.setItem(
            'pendingNotification',
            JSON.stringify(remoteMessage)
          );
        }
        return;
      }

      const { notification_id: notificationId, screen } = remoteMessage.data;
      if (!notificationId || !screen) return;

      const encodedId = btoa(notificationId);

      // Navigate based on screen type
      const navigationActions = {
        UserNavigation: () =>
          navigationRef.current?.dispatch(
            CommonActions.navigate('Main', {
              screen: 'HomeTab',
              params: {
                screen: 'UserNavigation',
                params: { encodedId },
              },
            })
          ),
        worktimescreen: () =>
          navigationRef.current?.dispatch(
            CommonActions.navigate('Main', {
              screen: 'HomeTab',
              params: {
                screen: SCREEN_NAMES.SERVICE_IN_PROGRESS,
                params: { encodedId },
              },
            })
          ),
        Paymentscreen: () =>
          navigationRef.current?.dispatch(
            CommonActions.navigate('Main', {
              screen: 'HomeTab',
              params: {
                screen: SCREEN_NAMES.PAYMENT,
                params: { encodedId },
              },
            })
          ),
        Home: () =>
          navigationRef.current?.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {
                  name: 'Main',
                  state: {
                    routes: [
                      {
                        name: 'HomeTab',
                        state: {
                          routes: [
                            { name: SCREEN_NAMES.HOME, params: { encodedId } },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            })
          ),
      };

      navigationActions[screen]?.();
    },
    [navigationRef]
  );

  /**
   * Flush pending notifications
   */
  const flushPendingNotification = useCallback(async () => {
    const pending = await EncryptedStorage.getItem('pendingNotification');
    if (pending) {
      await handleNotificationNavigation(JSON.parse(pending));
      await EncryptedStorage.removeItem('pendingNotification');
    }
  }, [handleNotificationNavigation]);

  /**
   * Handle app state changes
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setAppState(nextAppState);
      if (nextAppState === 'active') {
        flushPendingNotification();
      }
    });

    return () => subscription.remove();
  }, [flushPendingNotification]);

  /**
   * Handle FCM messages
   */
  useEffect(() => {
    // Handle foreground messages
    const unsubscribeMessage = messaging().onMessage(handleNotificationNavigation);

    // Handle background messages
    messaging().setBackgroundMessageHandler(async (msg) => {
      await EncryptedStorage.setItem('pendingNotification', JSON.stringify(msg));
    });

    // Handle notification opened app
    messaging().getInitialNotification().then(handleNotificationNavigation);

    const unsubscribeOpened = messaging().onNotificationOpenedApp(
      handleNotificationNavigation
    );

    return () => {
      unsubscribeMessage();
      unsubscribeOpened();
    };
  }, [handleNotificationNavigation]);

  /**
   * Mark navigation as ready
   */
  const onNavigationReady = useCallback(async () => {
    isNavigationReady.current = true;
    await flushPendingNotification();
  }, [flushPendingNotification]);

  // Show loading screen while initializing
  if (isLoading || !initialRoute) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDarkMode ? '#121212' : '#F8F9FA',
        }}
      >
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: {
          backgroundColor: isDarkMode ? '#121212' : '#F8F9FA',
        },
      }}
    >
      {/* Auth Flow */}
      <Stack.Screen name="Auth" component={AuthNavigator} />

      {/* Main App (Authenticated) */}
      <Stack.Screen
        name="Main"
        component={MainNavigator}
        options={{
          gestureEnabled: false,
        }}
      />

      {/* Shared/Modal Screens */}
      <Stack.Screen
        name={SCREEN_NAMES.CHAT}
        component={ChatScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />

      <Stack.Screen
        name={SCREEN_NAMES.HELP}
        component={HelpScreen}
        options={{
          presentation: 'modal',
        }}
      />

      <Stack.Screen
        name={SCREEN_NAMES.ABOUT}
        component={AboutCS}
        options={{
          presentation: 'modal',
        }}
      />

      <Stack.Screen
        name="LocationSearchModal"
        component={LocationSearch}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />

      <Stack.Screen
        name={SCREEN_NAMES.SERVICE_TRACKING_ITEM}
        component={ServiceTrackingItemScreen}
        options={{
          presentation: 'card',
        }}
      />
    </Stack.Navigator>
  );
};

export default RootNavigator;
