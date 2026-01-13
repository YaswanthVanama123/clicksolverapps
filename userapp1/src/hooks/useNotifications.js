import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';
import EncryptedStorage from 'react-native-encrypted-storage';
import axios from 'axios';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { encode as btoa } from 'base-64';

const API_BASE_URL = 'https://backend.clicksolver.com/api';

/**
 * Custom hook for Firebase Cloud Messaging notifications
 * Handles notification permissions, FCM setup, foreground/background notifications, and navigation
 *
 * @param {Object} navigationRef - React Navigation ref for handling notification navigation
 * @returns {Object} Notification state and methods
 * @property {Array} notifications - List of stored notifications
 * @property {Object|null} lastNotification - Most recent notification
 * @property {boolean} loading - Loading state
 * @property {Error|null} error - Error object if operation failed
 * @property {string} permissionStatus - Notification permission status
 * @property {string|null} fcmToken - FCM device token
 * @property {Function} requestNotificationPermission - Request notification permission
 * @property {Function} getNotifications - Get stored notifications
 * @property {Function} clearNotifications - Clear all notifications
 * @property {Function} markAsRead - Mark notification as read
 */
const useNotifications = (navigationRef = null) => {
  const [notifications, setNotifications] = useState([]);
  const [lastNotification, setLastNotification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('unknown');
  const [fcmToken, setFcmToken] = useState(null);

  const isMountedRef = useRef(true);
  const unsubscribeMessageRef = useRef(null);
  const unsubscribeOpenedRef = useRef(null);

  /**
   * Request notification permissions
   * @returns {Promise<string>} Permission status
   */
  const requestNotificationPermission = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let status;

      if (Platform.OS === 'android') {
        // Android 13+ requires explicit notification permission
        if (Platform.Version >= 33) {
          const permission = PERMISSIONS.ANDROID.POST_NOTIFICATIONS;
          status = await request(permission);
        } else {
          // Older Android versions have notifications enabled by default
          status = RESULTS.GRANTED;
        }
      } else if (Platform.OS === 'ios') {
        // iOS requires explicit permission
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        status = enabled ? RESULTS.GRANTED : RESULTS.DENIED;
      }

      setPermissionStatus(status);
      return status;
    } catch (err) {
      const errorMessage = `Failed to request notification permission: ${err.message}`;
      console.error(errorMessage, err);
      setError({ message: errorMessage, originalError: err });
      return RESULTS.DENIED;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Setup FCM and get token
   */
  const setupFCM = useCallback(async () => {
    try {
      // Request permission first
      const permStatus = await requestNotificationPermission();
      if (permStatus !== RESULTS.GRANTED) {
        console.warn('Notification permission not granted');
        return;
      }

      // Get FCM token
      const token = await messaging().getToken();
      setFcmToken(token);

      // Store token and sync with backend
      const storedToken = await EncryptedStorage.getItem('user_fcm_token');
      const authToken = await EncryptedStorage.getItem('cs_token');

      if (token !== storedToken && authToken) {
        try {
          await axios.post(
            `${API_BASE_URL}/user/store-fcm-token`,
            { fcmToken: token },
            { headers: { Authorization: `Bearer ${authToken}` } }
          );
          await EncryptedStorage.setItem('user_fcm_token', token);
        } catch (syncErr) {
          console.error('Failed to sync FCM token with backend:', syncErr);
        }
      }

      // Create notification channels for Android
      if (Platform.OS === 'android') {
        PushNotification.createChannel(
          {
            channelId: 'default',
            channelName: 'Default Notifications',
            channelDescription: 'Default notification channel',
            importance: 4,
            vibrate: true,
          },
          () => {}
        );

        PushNotification.createChannel(
          {
            channelId: 'silent',
            channelName: 'Silent Notifications',
            channelDescription: 'Silent notification channel',
            importance: 1,
            vibrate: false,
            playSound: false,
          },
          () => {}
        );
      }
    } catch (err) {
      console.error('setupFCM error:', err);
      setError({ message: 'Failed to setup FCM', originalError: err });
    }
  }, [requestNotificationPermission]);

  /**
   * Store notification locally in EncryptedStorage
   * @param {Object} notification - Notification data
   */
  const storeNotificationLocally = useCallback(async (notification) => {
    try {
      const existing = await EncryptedStorage.getItem('notifications');
      const list = existing ? JSON.parse(existing) : [];

      const notificationData = {
        id: notification.messageId || Date.now().toString(),
        title: notification.notification?.title || notification.title || '',
        body: notification.notification?.body || notification.body || '',
        data: notification.data || {},
        receivedAt: new Date().toISOString(),
        read: false,
        ...notification,
      };

      list.unshift(notificationData);

      // Keep only last 100 notifications
      const trimmedList = list.slice(0, 100);

      await EncryptedStorage.setItem('notifications', JSON.stringify(trimmedList));

      if (isMountedRef.current) {
        setNotifications(trimmedList);
        setLastNotification(notificationData);
      }

      return notificationData;
    } catch (err) {
      console.error('storeNotificationLocally error:', err);
    }
  }, []);

  /**
   * Handle notification navigation
   * @param {Object} remoteMessage - FCM remote message
   */
  const handleNotificationNavigation = useCallback(
    async (remoteMessage) => {
      if (!remoteMessage?.data || !navigationRef) {
        return;
      }

      const { notification_id: notificationId, screen, ...extraData } = remoteMessage.data;

      if (!notificationId || !screen) {
        return;
      }

      const encodedId = btoa(notificationId);

      // Navigation actions based on screen
      const navigationActions = {
        UserNavigation: () => {
          navigationRef.current?.navigate('UserNavigation', { encodedId, ...extraData });
        },
        worktimescreen: () => {
          navigationRef.current?.navigate('ServiceInProgress', { encodedId, ...extraData });
        },
        Paymentscreen: () => {
          navigationRef.current?.navigate('Paymentscreen', { encodedId, ...extraData });
        },
        Home: () => {
          navigationRef.current?.reset({
            index: 0,
            routes: [
              {
                name: 'Tabs',
                params: { screen: 'Home', params: { encodedId, ...extraData } },
              },
            ],
          });
        },
        ServiceInProgress: () => {
          navigationRef.current?.navigate('ServiceInProgress', { encodedId, ...extraData });
        },
        Tracking: () => {
          navigationRef.current?.navigate('Tabs', {
            screen: 'Tracking',
            params: { encodedId, ...extraData },
          });
        },
        Notifications: () => {
          navigationRef.current?.navigate('Notifications', { encodedId, ...extraData });
        },
      };

      const action = navigationActions[screen];
      if (action && typeof action === 'function') {
        action();
      }
    },
    [navigationRef]
  );

  /**
   * Setup notification listeners
   */
  const setupNotificationListeners = useCallback(() => {
    // Configure PushNotification
    PushNotification.configure({
      onNotification: (notification) => {
        if (notification.userInteraction) {
          // User tapped notification
          handleNotificationNavigation({ data: notification.data });
        }
      },
      popInitialNotification: true,
      requestPermissions: false,
    });

    // Foreground message handler
    const unsubscribeMessage = messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground FCM message:', remoteMessage);

      // Store notification
      await storeNotificationLocally(remoteMessage);

      // Handle navigation if needed
      await handleNotificationNavigation(remoteMessage);

      // Display local notification
      PushNotification.localNotification({
        channelId: 'default',
        title: remoteMessage.notification?.title || '',
        message: remoteMessage.notification?.body || '',
        playSound: true,
        soundName: 'default',
        importance: 'high',
        priority: 'high',
        userInfo: remoteMessage.data,
        id: remoteMessage.messageId || Math.floor(Math.random() * 100000),
      });
    });

    // Background message handler
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background FCM message:', remoteMessage);

      // Store notification
      await storeNotificationLocally(remoteMessage);

      // Store for deferred navigation
      await EncryptedStorage.setItem(
        'pendingNotification',
        JSON.stringify(remoteMessage)
      );
    });

    // Notification opened from quit state
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('Notification opened from quit state:', remoteMessage);
          handleNotificationNavigation(remoteMessage);
        }
      });

    // Notification opened from background state
    const unsubscribeOpened = messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened from background:', remoteMessage);
      handleNotificationNavigation(remoteMessage);
    });

    unsubscribeMessageRef.current = unsubscribeMessage;
    unsubscribeOpenedRef.current = unsubscribeOpened;

    return () => {
      if (unsubscribeMessage) unsubscribeMessage();
      if (unsubscribeOpened) unsubscribeOpened();
    };
  }, [handleNotificationNavigation, storeNotificationLocally]);

  /**
   * Get stored notifications from EncryptedStorage
   * @returns {Promise<Array>} List of notifications
   */
  const getNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const stored = await EncryptedStorage.getItem('notifications');
      const list = stored ? JSON.parse(stored) : [];

      if (isMountedRef.current) {
        setNotifications(list);
      }

      return list;
    } catch (err) {
      console.error('getNotifications error:', err);
      setError({ message: 'Failed to get notifications', originalError: err });
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear all notifications
   */
  const clearNotifications = useCallback(async () => {
    try {
      await EncryptedStorage.removeItem('notifications');
      setNotifications([]);
      return true;
    } catch (err) {
      console.error('clearNotifications error:', err);
      setError({ message: 'Failed to clear notifications', originalError: err });
      return false;
    }
  }, []);

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   */
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const stored = await EncryptedStorage.getItem('notifications');
      const list = stored ? JSON.parse(stored) : [];

      const updatedList = list.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      );

      await EncryptedStorage.setItem('notifications', JSON.stringify(updatedList));

      if (isMountedRef.current) {
        setNotifications(updatedList);
      }

      return true;
    } catch (err) {
      console.error('markAsRead error:', err);
      return false;
    }
  }, []);

  /**
   * Check and handle pending notification
   */
  const checkPendingNotification = useCallback(async () => {
    try {
      const pending = await EncryptedStorage.getItem('pendingNotification');
      if (pending) {
        const notification = JSON.parse(pending);
        await handleNotificationNavigation(notification);
        await EncryptedStorage.removeItem('pendingNotification');
      }
    } catch (err) {
      console.error('checkPendingNotification error:', err);
    }
  }, [handleNotificationNavigation]);

  // Setup on mount
  useEffect(() => {
    setupFCM();
    const cleanup = setupNotificationListeners();
    getNotifications();
    checkPendingNotification();

    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [setupFCM, setupNotificationListeners, getNotifications, checkPendingNotification]);

  return {
    notifications,
    lastNotification,
    loading,
    error,
    permissionStatus,
    fcmToken,
    requestNotificationPermission,
    getNotifications,
    clearNotifications,
    markAsRead,
    checkPendingNotification,
  };
};

export default useNotifications;
