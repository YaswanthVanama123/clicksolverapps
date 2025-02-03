import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import EncryptedStorage from 'react-native-encrypted-storage';
import App from './src/App';
import { name as appName } from './app.json';

// Function to format date consistently
const formatReceivedAt = () => {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date());
};

// Register main application component
AppRegistry.registerComponent(appName, () => App);

// Function to store notifications locally
const storeNotificationLocally = async (notification) => {
  try {
    // Retrieve existing notifications from storage
    const existingNotifications = await EncryptedStorage.getItem('Requestnotifications');
    let notifications = existingNotifications ? JSON.parse(existingNotifications) : [];

    // Add the new notification to the array
    notifications.push(notification);

    // Store updated notifications in local storage
    await EncryptedStorage.setItem('Requestnotifications', JSON.stringify(notifications));
    console.log(notifications);
    console.log('Notification stored successfully'); 
  } catch (error) {
    console.error('Failed to store notification locally:', error);
  }
};

// Background message handler
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  try {
    console.log("terminated FCM message:", remoteMessage);

    // Create notification object with consistent timestamp format
    const notification = {
      data: remoteMessage.data,
      receivedAt: formatReceivedAt(),
    };

    // Store the notification locally if it matches criteria
    if (notification.data?.screen === 'Acceptance') {
      await storeNotificationLocally(notification);
    } else {
      console.log('Notification does not match criteria. Not storing.');
    }
  } catch (error) {
    console.error('Failed to handle background message:', error);
  }
});

// Define the Headless JS task
const FCMBackgroundTask = async (remoteMessage) => {
  console.log('Headless JS task received FCM message:', remoteMessage);

  const notification = {
    data: remoteMessage.data,
    receivedAt: formatReceivedAt(), // Using consistent format function
  };

  if (notification.data?.screen === 'Acceptance') {
    await storeNotificationLocally(notification);
  } else {
    console.log('Headless JS notification does not match criteria. Not storing.');
  }
};

// Register the Headless JS task
AppRegistry.registerHeadlessTask('FCMBackgroundTask', () => FCMBackgroundTask);
