/**
 * App.tsx
 * Main Application Entry Point with New Navigation Structure
 */

import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { requestTrackingPermission } from 'react-native-tracking-transparency';
import PushNotification from 'react-native-push-notification';
import messaging from '@react-native-firebase/messaging';
import SplashScreen from 'react-native-splash-screen';
import CodePush from 'react-native-code-push';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';

// i18n
import './i18n/i18n';

// Context
import { ThemeProvider } from './context/ThemeContext';

// Navigation
import { RootNavigator, navigationRef } from './navigation';

// Error Boundary
import ErrorBoundary from './Components/ErrorBoundary';

// CodePush Configuration
const codePushOptions = {
  checkFrequency: CodePush.CheckFrequency.ON_APP_START,
  deploymentKey: '1b231e43-2817-11f0-ba9f-1a459c0f37ba',
  serverUrl: 'http://206.189.137.144:3000',
};

/**
 * Main App Component
 */
function App() {
  /**
   * Initialize app on mount
   */
  useEffect(() => {
    initializeApp();
  }, []);

  /**
   * Initialize all app services
   */
  const initializeApp = async () => {
    try {
      // Hide splash screen
      SplashScreen.hide();

      // Request tracking permission (iOS)
      if (Platform.OS === 'ios') {
        await requestTrackingPermission();
      }

      // Configure push notifications
      configurePushNotifications();

      // Sync FCM token
      await syncFcmToken();

      // Run CodePush sync
      CodePush.sync({
        installMode: CodePush.InstallMode.IMMEDIATE,
        updateDialog: true,
      });
    } catch (error) {
      console.error('App initialization error:', error);
    }
  };

  /**
   * Configure push notification channels and handlers
   */
  const configurePushNotifications = () => {
    // Create notification channels
    PushNotification.createChannel(
      {
        channelId: 'default',
        channelName: 'Default',
        importance: 4,
        vibrate: true,
      },
      () => {}
    );

    PushNotification.createChannel(
      {
        channelId: 'silent',
        channelName: 'Silent',
        importance: 1,
        vibrate: false,
      },
      () => {}
    );

    // Configure push notification
    PushNotification.configure({
      onNotification: (notification) => {
        // Handle notification tap
        if (notification.userInteraction) {
          handleNotificationTap(notification);
        }
      },
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });
  };

  /**
   * Handle notification tap
   */
  const handleNotificationTap = (notification) => {
    // Notification data will be handled by RootNavigator
    console.log('Notification tapped:', notification);
  };

  /**
   * Sync FCM token with backend
   */
  const syncFcmToken = async () => {
    try {
      const token = await messaging().getToken();
      const stored = await EncryptedStorage.getItem('user_fcm_token');
      const authToken = await EncryptedStorage.getItem('cs_token');

      // Only sync if token is not stored and user is authenticated
      if (!stored && authToken && token) {
        await axios.post(
          'https://backend.clicksolver.com/api/user/store-fcm-token',
          { fcmToken: token },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        await EncryptedStorage.setItem('user_fcm_token', token);
      }
    } catch (error) {
      console.error('FCM token sync error:', error);
    }
  };

  /**
   * Handle foreground messages
   */
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log('FCM message received in foreground:', remoteMessage);

      // Store notification locally
      await storeNotificationLocally(remoteMessage);

      // Show local notification
      PushNotification.localNotification({
        channelId: 'default',
        title: remoteMessage.notification?.title ?? 'New Notification',
        message: remoteMessage.notification?.body ?? '',
        playSound: true,
        soundName: 'default',
        importance: 'high',
        priority: 'high',
        userInfo: remoteMessage.data,
        id: remoteMessage.messageId || Math.floor(Math.random() * 100000),
      });
    });

    return unsubscribe;
  }, []);

  /**
   * Store notification locally
   */
  const storeNotificationLocally = async (notification) => {
    try {
      const existing = await EncryptedStorage.getItem('notifications');
      const list = existing ? JSON.parse(existing) : [];
      list.push({
        title: notification.notification?.title ?? '',
        body: notification.notification?.body ?? '',
        data: notification.data,
        receivedAt: new Date().toISOString(),
      });
      await EncryptedStorage.setItem('notifications', JSON.stringify(list));
    } catch (error) {
      console.error('Error storing notification:', error);
    }
  };

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NavigationContainer ref={navigationRef}>
          <RootNavigator navigationRef={navigationRef} />
        </NavigationContainer>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default CodePush(codePushOptions)(App);
