import React, { useEffect, useRef, useState } from 'react';
import { AppState, Platform, View, ActivityIndicator,Button } from 'react-native';
import { NavigationContainer, CommonActions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import axios from 'axios';
import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';
import EncryptedStorage from 'react-native-encrypted-storage';
import SplashScreen from 'react-native-splash-screen';
import {
  checkMultiple,
  requestMultiple,
  requestNotifications,
  PERMISSIONS,
  RESULTS,
} from 'react-native-permissions';
// 1) Import i18n to initialize
import './i18n/i18n';

// 2) Import helper to change language
import { changeAppLanguage } from './i18n/languageChange';

import Feather from 'react-native-vector-icons/Feather';
import Entypo from 'react-native-vector-icons/Entypo'; 
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Polyfill for btoa using base-64 library (install with: npm install base-64)
import { encode as btoa } from 'base-64';

// Import ThemeProvider and useTheme hook from your global context
import { ThemeProvider, useTheme } from './context/ThemeContext';

// Import all screens and components
import UserLocation from './Components/userLocation';
import WaitingUser from './Components/UserWaiting';
import Navigation from './Components/Navigation';
import ServiceInProgress from './Components/ServiceInProgress';
import Payment from './Components/Paymentscreen';
import Rating from './Components/RatingScreen';
import ServiceApp from './screens/SecondPage';
import PaintingServices from './screens/Indiv';
import SearchItem from './Components/SearchItem';
import HelpScreen from './Components/HelpScreen';
import SingleService from './screens/SingleService';
import RecentServices from './Components/RecentServices';
import ProfileScreen from './Components/ProfileScreen';
import EditProfile from './Components/EditProfile';
import LocationSearch from './Components/LocationSearch';
import LoginScreen from './Components/LoginScreen';
import SignUpScreen from './Components/SignUpScreen';
import ServiceTrackingItemScreen from './Components/ServiceTrackingItemScreen';
import ServiceTrackingListScreen from './Components/ServiceTrackingListScreen';
import ServiceBookingItem from './Components/ServiceBookingItem';
import UserNotifications from './screens/UserNotifications';
import AccountDelete from './Components/AccountDelete';
import ReferralScreen from './Components/ReferralScreen';
import OnboardingScreen from './Components/OnboardingScreen';
import OrderScreen from './Components/OrderScreen';
import Myrefferals from './Components/Myrefferals';
import Help from './Components/Help';
import VerificationScreen from './Components/VerificationScreen';
import PaymentScreenRazor from './Components/PaymentScreenRazor';
import AboutCS from './Components/AboutCS';
import ServiceBookingOngoingItem from './Components/ServiceBookingOngoingItem';
import ChatScreen from './Components/ChatScreen';
import LanguageSelector from './Components/LanguageSelector';
import CodePush from 'react-native-code-push';

const codePushOptions = {
  checkFrequency: CodePush.CheckFrequency.ON_APP_START,
  deploymentKey: '9osws50ZWw1_SwJJi-EynN9Xpz0mJlO43mKHPQ',
};

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();



/** 
 * Bottom Tab Navigator
 */
function TabNavigator() {
  const { isDarkMode } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          size = focused ? 28 : 24;
          let iconName;
          if (route.name === 'Home') {
            iconName = 'home';
            return <Feather name={iconName} size={size} color={color} />;
          } else if (route.name === 'Bookings') {
            iconName = 'clipboard';
            return <Feather name={iconName} size={size} color={color} />;
          } else if (route.name === 'Rewards') {
            iconName = 'wallet';
            return <Entypo name={iconName} size={size} color={color} />;
          } else if (route.name === 'Tracking') {
            iconName = 'shopping-bag';
            return <Feather name={iconName} size={size} color={color} />;
          } else if (route.name === 'Account') {
            iconName = 'account-outline';
            return (
              <MaterialCommunityIcons name={iconName} size={size} color={color} />
            );
          }
        },
        tabBarActiveTintColor: '#ff4500',
        // Update inactive tint based on theme (e.g., light mode: gray, dark mode: lightgray)
        tabBarInactiveTintColor: isDarkMode ? 'lightgray' : 'gray',
        tabBarLabelStyle: { fontSize: 12 },
        // Update the tab bar background color based on the active theme
        tabBarStyle: {
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
          backgroundColor: isDarkMode ? '#222' : '#fff',
        },
      })}
    >
      <Tab.Screen name="Home" component={ServiceApp} options={{ headerShown: false }} />
      <Tab.Screen name="Bookings" component={RecentServices} options={{ headerShown: false }} />
      <Tab.Screen name="Tracking" component={ServiceTrackingListScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Account" component={ProfileScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

/**
 * Main App Component
 */
function App() {
  const navigationRef = useRef(null);
  const [initialRoute, setInitialRoute] = useState(null);
  const [isNavReady, setIsNavReady] = useState(false);

  /**
   * Process pending notification from storage.
   */
  const processPendingNotification = async () => {
    try {
      const pending = await EncryptedStorage.getItem('pendingNotification');
      if (pending) {
        const remoteMessage = JSON.parse(pending);
        console.log('Processing pending notification:', remoteMessage);
        await handleNotificationNavigation(remoteMessage);
        await EncryptedStorage.removeItem('pendingNotification');
        console.log('Pending notification processed and removed.');
      } else {
        console.log('No pending notification found.');
      }
    } catch (error) {
      console.error('Error processing pending notification:', error);
    }
  };

  /**
   * Request all required permissions
   */
  async function requestAllPermissions() {
    console.log('Requesting permissions...');
    if (Platform.OS === 'android') {
      const androidPermissions = [
        PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
        PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION,
        PERMISSIONS.ANDROID.READ_CONTACTS,
      ];
      const currentStatuses = await checkMultiple(androidPermissions);
      console.log('Current Android Permission Statuses:', currentStatuses);
      const permissionsToRequest = androidPermissions.filter(
        perm => currentStatuses[perm] !== RESULTS.GRANTED
      );
      if (permissionsToRequest.length > 0) {
        const newStatuses = await requestMultiple(permissionsToRequest);
        console.log('Updated Android Permission Statuses:', newStatuses);
      }
      if (Platform.Version >= 33) {
        const { status } = await requestNotifications(['alert', 'sound', 'badge']);
        console.log('Notification permission status:', status);
      }
    } else if (Platform.OS === 'ios') {
      const iosPermissions = [
        PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
        PERMISSIONS.IOS.LOCATION_ALWAYS,
        PERMISSIONS.IOS.NOTIFICATIONS,
        PERMISSIONS.IOS.CONTACTS,
      ];
      const currentStatuses = await checkMultiple(iosPermissions);
      console.log('Current iOS Permission Statuses:', currentStatuses);
      const permissionsToRequest = iosPermissions.filter(
        perm => currentStatuses[perm] !== RESULTS.GRANTED
      );
      if (permissionsToRequest.length > 0) {
        const newStatuses = await requestMultiple(iosPermissions);
        console.log('Updated iOS Permission Statuses:', newStatuses);
      }
    }
  }

  /**
   * Get FCM token and store it in the backend if needed.
   */
  async function getTokens() {
    try {
      const token = await messaging().getToken();
      console.log('FCM token:', token);
      const fcm = await EncryptedStorage.getItem('fcm_token');
      const cs_token = await EncryptedStorage.getItem('cs_token');
      console.log('Stored FCM token:', fcm);
      if (!fcm && cs_token) {
        await EncryptedStorage.setItem('fcm_token', token);
        await axios.post(
          'https://backend.clicksolver.com/api/user/store-fcm-token',
          { fcmToken: token },
          { headers: { Authorization: `Bearer ${cs_token}` } }
        );
      }
    } catch (error) {
      console.error('Error storing FCM token in the backend:', error);
    }
  }

  /**
   * Store a notification locally and optionally in the backend.
   */
  async function storeNotificationLocally(notification) {
    try {
      const existing = await EncryptedStorage.getItem('notifications');
      const notifications = existing ? JSON.parse(existing) : [];
      notifications.push(notification);
      await EncryptedStorage.setItem('notifications', JSON.stringify(notifications));
      console.log('Notification stored locally:', notification);
      // Optionally: call your backend API here.
    } catch (error) {
      console.error('Failed to store notification locally:', error);
    }
  }

  /**
   * Navigate based on notification data.
   */
  async function handleNotificationNavigation(remoteMessage) {
    if (!remoteMessage || !remoteMessage.data) {
      console.log('No valid remoteMessage data for navigation.');
      return;
    }
    const { notification_id: notificationId, screen } = remoteMessage.data;
    if (!notificationId || !screen || !navigationRef.current) {
      console.log('Missing notificationId, screen, or navigation ref.');
      return;
    }
    const encodedId = btoa(notificationId);
    console.log('Navigating based on notification to screen:', screen, 'with id:', encodedId);
    const actions = {
      UserNavigation: () =>
        navigationRef.current.dispatch(
          CommonActions.navigate('UserNavigation', { encodedId })
        ),
      worktimescreen: () =>
        navigationRef.current.dispatch(
          CommonActions.navigate('ServiceInProgress', { encodedId })
        ),
      Paymentscreen: () =>
        navigationRef.current.dispatch(
          CommonActions.navigate('Paymentscreen', { encodedId })
        ),
      Home: () =>
        navigationRef.current.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{
              name: 'Tabs',
              params: { screen: 'Home', params: { encodedId } },
            }],
          })
        ),
    };
    if (actions[screen]) {
      actions[screen]();
      console.log('Navigation action executed for screen:', screen);
    } else {
      console.log('No navigation action defined for screen:', screen);
    }
  }

  /**
   * Listen for AppState changes.
   */
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      console.log('AppState changed to:', nextAppState);
      if (nextAppState === 'active' && isNavReady) {
        console.log('App is active and navigation is ready. Processing pending notification.');
        await processPendingNotification();
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isNavReady]);

  /**
   * CodePush updates
   */
  useEffect(() => {
    CodePush.sync({
      installMode: CodePush.InstallMode.IMMEDIATE,
      updateDialog: true,
    });
  }, []);

  /**
   * FCM & Push Notification Configuration
   */
  useEffect(() => {
    // Configure local push notifications.
    PushNotification.configure({
      onNotification: function (notification) {
        console.log('PushNotification onNotification:', notification);
        if (notification.userInteraction) {
          handleNotificationNavigation({ data: notification.data });
        }
      },
      popInitialNotification: true,
      requestPermissions: false,
    });
    requestAllPermissions();
    getTokens();

    // Create channels if needed.
    PushNotification.createChannel(
      {
        channelId: 'default-channel-id',
        channelName: 'Default Channel',
      },
      created => console.log(`Default channel created: ${created}`)
    );
    PushNotification.createChannel(
      {
        channelId: 'silent_channel',
        channelName: 'Silent Channel',
        importance: 1,
        vibrate: false,
      },
      created => console.log(`Silent channel created: ${created}`)
    );

    // Handle foreground messages.
    const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
      console.log('FCM foreground message:', JSON.stringify(remoteMessage));
      await handleNotificationNavigation(remoteMessage);
      const notification = {
        title: remoteMessage.notification?.title || 'No title',
        body: remoteMessage.notification?.body || 'No body',
        data: remoteMessage.data,
        receivedAt: new Date().toISOString(),
      };
      storeNotificationLocally(notification);
      PushNotification.localNotification({
        channelId: 'default-channel-id',
        title: notification.title,
        message: notification.body,
        data: remoteMessage.data,
      });
    });

    // Handle background messages (data-only payloads).
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('FCM background message:', JSON.stringify(remoteMessage));
      try {
        // Save pending notification for later processing.
        await EncryptedStorage.setItem('pendingNotification', JSON.stringify(remoteMessage));
        console.log('Stored pending notification in EncryptedStorage.');
      } catch (error) {
        console.error('Error storing pending notification:', error);
      }
      const notification = {
        title: remoteMessage.notification?.title || 'No title',
        body: remoteMessage.notification?.body || 'No body',
        data: remoteMessage.data,
        receivedAt: new Date().toISOString(),
      };
      storeNotificationLocally(notification);
    });

    // If app was opened from a quit state by tapping the notification.
    messaging().getInitialNotification().then(async remoteMessage => {
      if (remoteMessage) {
        console.log('Opened from quit state with notification:', JSON.stringify(remoteMessage));
        await handleNotificationNavigation(remoteMessage);
        const notification = {
          title: remoteMessage.notification?.title || 'No title',
          body: remoteMessage.notification?.body || 'No body',
          receivedAt: new Date().toISOString(),
        };
        storeNotificationLocally(notification);
      }
    });

    // Listen when a user taps a notification while app is in background.
    const unsubscribeOnNotificationOpenedApp = messaging().onNotificationOpenedApp(
      async remoteMessage => {
        console.log('Notification opened from background:', JSON.stringify(remoteMessage));
        await handleNotificationNavigation(remoteMessage);
      }
    );

    return () => {
      unsubscribeOnMessage();
      unsubscribeOnNotificationOpenedApp();
    };
  }, []);

  /**
   * Check onboarding status and set initial route.
   */
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const onboarded = await EncryptedStorage.getItem('onboarded');
        if (onboarded) {
          setInitialRoute('Tabs');
          navigationRef.current?.navigate('Tabs');
        } else {
          setInitialRoute('OnboardingScreen');
          navigationRef.current?.navigate('OnboardingScreen');
        }
      } catch (error) {
        console.error('Error retrieving onboarding status:', error);
        setInitialRoute('Login');
        navigationRef.current?.navigate('Login');
      }
    };
    checkOnboarding();
  }, []);

  /**
   * Hide SplashScreen once app is ready.
   */
  useEffect(() => {
    SplashScreen.hide();
    console.log('SplashScreen hidden.');
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }


  /**
   * Render App with NavigationContainer's onReady callback
   */
  return (
    <ThemeProvider>
      <NavigationContainer
        ref={navigationRef}
        onReady={async () => {
          console.log('NavigationContainer is ready.');
          setIsNavReady(true);
          await processPendingNotification();
        }}
      >
        {/* <LanguageSelector /> */}

        <Stack.Navigator initialRouteName={initialRoute}>
          <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="LanguageSelector" component={LanguageSelector} options={{ title: 'Select Language' }} />
          <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="VerificationScreen" component={VerificationScreen} options={{ headerShown: false }} />
          <Stack.Screen name="SignUpScreen" component={SignUpScreen} options={{ headerShown: false }} />
          <Stack.Screen name="UserLocation" component={UserLocation} options={{ headerShown: false }} />
          <Stack.Screen name="OrderScreen" component={OrderScreen} options={{ headerShown: false }} />
          <Stack.Screen name="DeleteAccount" component={AccountDelete} options={{ headerShown: false }} />
          <Stack.Screen name="ReferralScreen" component={ReferralScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Myrefferals" component={Myrefferals} options={{ headerShown: false }} />
          <Stack.Screen name="userwaiting" component={WaitingUser} options={{ headerShown: false }} />
          <Stack.Screen name="UserNavigation" component={Navigation} options={{ headerShown: false }} />
          <Stack.Screen name="worktimescreen" component={ServiceInProgress} options={{ headerShown: false }} />
          <Stack.Screen name="Paymentscreen" component={Payment} options={{ headerShown: false }} />
          <Stack.Screen name="Rating" component={Rating} options={{ headerShown: false }} />
          <Stack.Screen name="ServiceBooking" component={SingleService} options={{ headerShown: false }} />
          <Stack.Screen name="RecentServices" component={RecentServices} options={{ headerShown: false }} />
          <Stack.Screen name="serviceCategory" component={PaintingServices} options={{ headerShown: false }} />
          <Stack.Screen name="SearchItem" component={SearchItem} options={{ headerShown: false }} />
          <Stack.Screen name="LocationSearch" component={LocationSearch} options={{ headerShown: false }} />
          <Stack.Screen name="EditProfile" component={EditProfile} options={{ headerShown: false }} />
          <Stack.Screen name="ServiceTrackingItem" component={ServiceTrackingItemScreen} options={{ headerShown: false }} />
          <Stack.Screen name="serviceBookingItem" component={ServiceBookingItem} options={{ headerShown: false }} />
          <Stack.Screen name="Notifications" component={UserNotifications} options={{ headerShown: false }} />
          <Stack.Screen name="Help" component={HelpScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ServiceInProgress" component={ServiceInProgress} options={{ headerShown: false }} />
          <Stack.Screen name="AboutCS" component={AboutCS} options={{ headerShown: false }} />
          <Stack.Screen name="ServiceBookingOngoingItem" component={ServiceBookingOngoingItem} options={{ headerShown: false }} />
          <Stack.Screen name="ChatScreen" component={ChatScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}

export default CodePush(codePushOptions)(App);
