import React, { useEffect, useRef, useState } from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';
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
import Feather from 'react-native-vector-icons/Feather';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Import ThemeProvider and useTheme hook from our global context
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

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  // Use global theme to update tab styles dynamically
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

function App() {
  const navigationRef = useRef<any>(null);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  // Request all required permissions
  async function requestAllPermissions() {
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
      } else {
        console.log('All necessary Android permissions are already granted.');
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
      } else {
        console.log('All necessary iOS permissions are already granted.');
      }
    }
  }

  // Get FCM token and store it in the backend if needed.
  async function getTokens() {
    try {
      const token = await messaging().getToken();
      console.log("token", token);
      const fcm = await EncryptedStorage.getItem('fcm_token');
      const cs_token = await EncryptedStorage.getItem('cs_token');
      console.log('Stored FCM token:', fcm);
      if (!fcm && cs_token) {
        const token = await messaging().getToken();
        await EncryptedStorage.setItem('fcm_token', token);
        const cs_token = await EncryptedStorage.getItem('cs_token');
        if (cs_token) {
          await axios.post(
            `http://192.168.55.102:5000/api/user/store-fcm-token`,
            { fcmToken: token },
            { headers: { Authorization: `Bearer ${cs_token}` } }
          );
        }
      }
    } catch (error) {
      console.error('Error storing FCM token in the backend:', error);
    }
  }

  // Store notification in backend
  async function storeNotificationInBackend(notification: any) {
    try {
      const pcs_token = await EncryptedStorage.getItem('cs_token');
      const fcmToken = await EncryptedStorage.getItem('fcm_token');
      await axios.post(
        `http://192.168.55.102:5000/api/user/store-notification`,
        { notification, fcmToken },
        { headers: { Authorization: `Bearer ${pcs_token}` } }
      );
      console.log('Notification stored in backend:', notification);
    } catch (error) {
      console.error('Failed to store notification in backend:', error);
    }
  }

  // Store notification locally and then backend
  async function storeNotificationLocally(notification: any) {
    try {
      const existingNotifications = await EncryptedStorage.getItem('notifications');
      let notifications = existingNotifications ? JSON.parse(existingNotifications) : [];
      notifications.push(notification);
      await EncryptedStorage.setItem('notifications', JSON.stringify(notifications));
      console.log('Notification stored locally:', notification);
      storeNotificationInBackend(notification);
    } catch (error) {
      console.error('Failed to store notification locally:', error);
    }
  }

  // Navigate based on notification data
  async function handleNotificationNavigation(remoteMessage: any) {
    if (!remoteMessage || !remoteMessage.data) return;
    const notificationId = remoteMessage.data.notification_id;
    const encodedNotificationId = btoa(notificationId);
    const screen = remoteMessage.data.screen;
    if (!navigationRef.current || !screen) {
      return;
    }
    console.log('Navigating based on notification to screen:', screen);
    const navigationActions: any = {
      UserNavigation: () =>
        navigationRef.current.dispatch(
          CommonActions.navigate('UserNavigation', {
            encodedId: encodedNotificationId,
          })
        ),
      worktimescreen: () =>
        navigationRef.current.dispatch(
          CommonActions.navigate('ServiceInProgress', {
            encodedId: encodedNotificationId,
          })
        ),
      Paymentscreen: () =>
        navigationRef.current.dispatch(
          CommonActions.navigate('Paymentscreen', {
            encodedId: encodedNotificationId,
          })
        ),
      Home: () => {
        if (encodedNotificationId) {
          navigationRef.current.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {
                  name: 'Tabs',
                  state: {
                    routes: [
                      {
                        name: 'Home',
                        params: { encodedId: encodedNotificationId },
                      },
                    ],
                  },
                },
              ],
            })
          );
        } else {
          navigationRef.current.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {
                  name: 'Tabs',
                  state: {
                    routes: [{ name: 'Home' }],
                  },
                },
              ],
            })
          );
        }
      },
    };
    if (navigationActions[screen]) {
      navigationActions[screen]();
    }
  }

  useEffect(() => {
    PushNotification.configure({
      onNotification: function (notification) {
        if (notification.userInteraction) {
          handleNotificationNavigation({ data: notification.data });
        }
      },
    });

    requestAllPermissions();
    getTokens();

    PushNotification.createChannel(
      {
        channelId: 'default-channel-id',
        channelName: 'Default Channel',
        channelDescription: 'A default channel',
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      created => console.log(`createChannel returned '${created}'`)
    );

    const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
      console.log('A new FCM message arrived!', JSON.stringify(remoteMessage));
      await handleNotificationNavigation(remoteMessage);
      const notification = {
        title: remoteMessage.notification?.title || 'No title',
        body: remoteMessage.notification?.body || 'No body',
        data: remoteMessage.data,
        userNotificationId: remoteMessage.data.user_notification_id,
        receivedAt: new Intl.DateTimeFormat('en-IN', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(new Date()),
      };
      storeNotificationLocally(notification);
      PushNotification.localNotification({
        channelId: 'default-channel-id',
        title: notification.title,
        message: notification.body,
        playSound: true,
        soundName: 'default',
        data: remoteMessage.data,
        userInfo: remoteMessage.data,
      });
    });

    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Message handled in the background!', JSON.stringify(remoteMessage));
      await handleNotificationNavigation(remoteMessage);
      const notification = {
        title: remoteMessage.notification?.title || 'No title',
        body: remoteMessage.notification?.body || 'No body',
        receivedAt: new Intl.DateTimeFormat('en-IN', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(new Date()),
      };
      storeNotificationLocally(notification);
    });

    messaging()
      .getInitialNotification()
      .then(async remoteMessage => {
        if (remoteMessage) {
          console.log('Notification caused app to open from quit state:', JSON.stringify(remoteMessage));
          await handleNotificationNavigation(remoteMessage);
          const notification = {
            title: remoteMessage.notification?.title || 'No title',
            body: remoteMessage.notification?.body || 'No body',
            receivedAt: new Intl.DateTimeFormat('en-IN', {
              timeZone: 'Asia/Kolkata',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            }).format(new Date()),
          };
          storeNotificationLocally(notification);
        }
      });

    const unsubscribeOnNotificationOpenedApp = messaging().onNotificationOpenedApp(async remoteMessage => {
      console.log('Notification opened from background state:', JSON.stringify(remoteMessage));
      await handleNotificationNavigation(remoteMessage);
    });

    return () => {
      unsubscribeOnMessage();
      unsubscribeOnNotificationOpenedApp();
    };
  }, []);

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
        console.error('Error retrieving tokens:', error);
        setInitialRoute('Login');
        navigationRef.current?.navigate('Login');
      }
    };
    checkOnboarding();
  }, []);

  useEffect(() => {
    SplashScreen.hide();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator initialRouteName={initialRoute}>
          <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="UserLocation" component={UserLocation} options={{ headerShown: false }} />
          <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="VerificationScreen" component={VerificationScreen} options={{ headerShown: false }} />
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
          <Stack.Screen name="SignupDetails" component={SignUpScreen} options={{ headerShown: false }} />
          <Stack.Screen name="LocationSearch" component={LocationSearch} options={{ headerShown: false }} />
          <Stack.Screen name="EditProfile" component={EditProfile} options={{ headerShown: false }} />
          <Stack.Screen name="ServiceTrackingItem" component={ServiceTrackingItemScreen} options={{ headerShown: false }} />
          <Stack.Screen name="serviceBookingItem" component={ServiceBookingItem} options={{ headerShown: false }} />
          <Stack.Screen name="Notifications" component={UserNotifications} options={{ headerShown: false }} />
          <Stack.Screen name="Help" component={HelpScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ServiceInProgress" component={ServiceInProgress} options={{ headerShown: false }} />
          <Stack.Screen name="AboutCS" component={AboutCS} options={{ headerShown: false }} />
          <Stack.Screen name="ServiceBookingOngoingItem" component={ServiceBookingOngoingItem} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}

export default App;
