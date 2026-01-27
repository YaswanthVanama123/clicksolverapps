import messaging from '@react-native-firebase/messaging';
import { Alert, Platform } from 'react-native';

/**
 * Firebase Service
 * Handles Firebase Cloud Messaging and notification management for admin app
 */

class FirebaseService {
  /**
   * Initialize Firebase messaging
   */
  async initialize(): Promise<void> {
    try {
      await this.requestPermission();
      this.setupNotificationListeners();
      console.log('Firebase service initialized');
    } catch (error) {
      console.error('Error initializing Firebase service:', error);
    }
  }

  /**
   * Request notification permission
   * @returns {Promise<boolean>} Permission granted status
   */
  async requestPermission(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Notification permission granted:', authStatus);
        return true;
      }
      console.log('Notification permission denied');
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Setup notification listeners
   */
  setupNotificationListeners(): void {
    // Foreground message handler
    messaging().onMessage(async remoteMessage => {
      console.log('Foreground notification received:', remoteMessage);
      this.handleForegroundNotification(remoteMessage);
    });

    // Background message handler (needs to be registered outside component)
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Background notification received:', remoteMessage);
      // Handle background notification
    });

    // Notification opened app from quit state
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('App opened from quit state by notification:', remoteMessage);
          this.handleNotificationOpen(remoteMessage);
        }
      });

    // Notification opened app from background state
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('App opened from background by notification:', remoteMessage);
      this.handleNotificationOpen(remoteMessage);
    });
  }

  /**
   * Handle foreground notification
   * @param {object} remoteMessage - Firebase remote message
   */
  handleForegroundNotification(remoteMessage: any): void {
    if (remoteMessage.notification) {
      // Show alert or custom notification UI
      Alert.alert(
        remoteMessage.notification.title || 'Notification',
        remoteMessage.notification.body || '',
        [{ text: 'OK', onPress: () => console.log('Notification dismissed') }]
      );
    }
  }

  /**
   * Handle notification open (when user taps notification)
   * @param {object} remoteMessage - Firebase remote message
   */
  handleNotificationOpen(remoteMessage: any): void {
    console.log('Notification data:', remoteMessage.data);
    // Navigate to appropriate screen based on notification data
    if (remoteMessage.data?.type === 'order') {
      // Navigate to order screen
    } else if (remoteMessage.data?.type === 'worker') {
      // Navigate to worker screen
    }
  }

  /**
   * Subscribe to topic
   * @param {string} topic - Topic name to subscribe
   */
  async subscribeToTopic(topic: string): Promise<void> {
    try {
      await messaging().subscribeToTopic(topic);
      console.log(`Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error(`Error subscribing to topic ${topic}:`, error);
    }
  }

  /**
   * Unsubscribe from topic
   * @param {string} topic - Topic name to unsubscribe
   */
  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      await messaging().unsubscribeFromTopic(topic);
      console.log(`Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error(`Error unsubscribing from topic ${topic}:`, error);
    }
  }

  /**
   * Get notification badge count (iOS only)
   * @returns {Promise<number>} Badge count
   */
  async getBadgeCount(): Promise<number> {
    if (Platform.OS === 'ios') {
      try {
        const count = await messaging().getBadge();
        return count;
      } catch (error) {
        console.error('Error getting badge count:', error);
        return 0;
      }
    }
    return 0;
  }

  /**
   * Set notification badge count (iOS only)
   * @param {number} count - Badge count to set
   */
  async setBadgeCount(count: number): Promise<void> {
    if (Platform.OS === 'ios') {
      try {
        await messaging().setBadge(count);
        console.log(`Badge count set to: ${count}`);
      } catch (error) {
        console.error('Error setting badge count:', error);
      }
    }
  }
}

const firebaseService = new FirebaseService();
export default firebaseService;
