import {useEffect} from 'react';
import messaging from '@react-native-firebase/messaging';
import EncryptedStorage from 'react-native-encrypted-storage';
import {Buffer} from 'buffer';
import {CommonActions} from '@react-navigation/native';
import {AppState} from 'react-native';

/**
 * Custom hook for handling FCM notifications specific to UserWaiting screen
 * Handles navigation when worker accepts the booking
 */
const useWaitingScreenNotifications = ({
  decodedId,
  encodedData,
  service,
  navigation,
}) => {
  /**
   * Handle notification data and navigate if needed
   */
  const handleNotification = data => {
    if (data && data.notification_id && decodedId) {
      // Compare notification_id with decodedId
      if (data.notification_id.toString() === decodedId) {
        // Encode the notification_id
        const encodedNotificationId = Buffer.from(
          data.notification_id.toString(),
          'utf-8',
        ).toString('base64');

        // Navigate to target screen from notification
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: data.screen, // Target screen specified in notification
                params: {encodedId: encodedNotificationId, service: service},
              },
            ],
          }),
        );
      }
    }
  };

  // 1. Handle cold start notifications (app opened from quit state)
  useEffect(() => {
    if (!decodedId) return;

    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage && remoteMessage.data) {
          handleNotification(remoteMessage.data);
        }
      });
  }, [decodedId, navigation, service]);

  // 2. Handle foreground notifications
  useEffect(() => {
    if (!decodedId) return;

    const unsubscribe = messaging().onMessage(async remoteMessage => {
      if (remoteMessage && remoteMessage.data) {
        handleNotification(remoteMessage.data);
      }
    });

    return unsubscribe;
  }, [decodedId, navigation, service]);

  // 3. Handle background notifications (user tapped notification)
  useEffect(() => {
    if (!decodedId) return;

    const unsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
      if (remoteMessage && remoteMessage.data) {
        handleNotification(remoteMessage.data);
      }
    });

    return unsubscribe;
  }, [decodedId, navigation, service]);

  // 4. Handle pending notifications when app becomes active
  useEffect(() => {
    const handleAppStateChange = async nextAppState => {
      if (nextAppState === 'active') {
        try {
          const pending = await EncryptedStorage.getItem('pendingNotification');
          if (pending) {
            const remoteMessage = JSON.parse(pending);
            if (remoteMessage.data) {
              // Check if notification matches current screen
              if (
                remoteMessage.data.notification_id.toString() === decodedId &&
                remoteMessage.data.screen === 'UserNavigation'
              ) {
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [
                      {
                        name: 'UserNavigation',
                        params: {encodedId: encodedData},
                      },
                    ],
                  }),
                );
              }
            }
            await EncryptedStorage.removeItem('pendingNotification');
          }
        } catch (error) {
          console.error('[WaitingScreen] Error handling pending notification:', error);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [decodedId, encodedData, navigation]);

  return {
    handleNotification,
  };
};

export default useWaitingScreenNotifications;
