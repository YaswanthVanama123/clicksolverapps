import {useEffect} from 'react';
import {AppState} from 'react-native';
import {CommonActions} from '@react-navigation/native';
import {encode} from 'base-64';
import messaging from '@react-native-firebase/messaging';
import EncryptedStorage from 'react-native-encrypted-storage';

/**
 * useNavigationNotifications Hook
 * Handles FCM notifications specific to navigation screen
 * @param {string} decodedId - Decoded notification ID
 * @param {object} navigation - React Navigation object
 */
const useNavigationNotifications = (decodedId, navigation) => {
  useEffect(() => {
    if (!decodedId) return;

    const handleNotificationData = data => {
      if (data && data.notification_id) {
        if (data.notification_id.toString() === decodedId) {
          const notification_id = data.notification_id;
          const encodedNotificationId = encode(notification_id.toString());

          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {
                  name: data.screen,
                  params: {encodedId: encodedNotificationId},
                },
              ],
            }),
          );
        }
      }
    };

    // 1. Cold start notifications
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage && remoteMessage.data) {
          handleNotificationData(remoteMessage.data);
        }
      });

    // 2. Foreground notifications
    const unsubscribeForeground = messaging().onMessage(remoteMessage => {
      if (remoteMessage && remoteMessage.data) {
        handleNotificationData(remoteMessage.data);
      }
    });

    // 3. Background notifications (tapped)
    const unsubscribeOpened = messaging().onNotificationOpenedApp(
      remoteMessage => {
        if (remoteMessage && remoteMessage.data) {
          handleNotificationData(remoteMessage.data);
        }
      },
    );

    return () => {
      unsubscribeForeground();
      unsubscribeOpened();
    };
  }, [decodedId, navigation]);

  // 4. Handle pending notifications when app becomes active
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      async nextAppState => {
        if (nextAppState === 'active') {
          try {
            const pending = await EncryptedStorage.getItem(
              'pendingNotification',
            );
            if (pending) {
              const remoteMessage = JSON.parse(pending);
              if (remoteMessage.data && remoteMessage.data.notification_id) {
                const notification_id = remoteMessage.data.notification_id;
                const encodedNotificationId = encode(notification_id.toString());

                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [
                      {
                        name: remoteMessage.data.screen,
                        params: {encodedId: encodedNotificationId},
                      },
                    ],
                  }),
                );
              }
              await EncryptedStorage.removeItem('pendingNotification');
            }
          } catch (error) {
            console.error(
              '[Navigation] Error handling pending notification:',
              error,
            );
          }
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [navigation]);
};

export default useNavigationNotifications;
