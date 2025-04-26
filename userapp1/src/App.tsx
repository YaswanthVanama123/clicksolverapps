import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Platform,
  View,
} from 'react-native';
import {
  NavigationContainer,
  CommonActions,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import axios from 'axios';
import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';
import EncryptedStorage from 'react-native-encrypted-storage';
import { useTranslation } from 'react-i18next';
import SplashScreen from 'react-native-splash-screen';
import CodePush from 'react-native-code-push';
import {
  requestMultiple,
  requestNotifications,
  checkMultiple,
  PERMISSIONS,
  RESULTS,
} from 'react-native-permissions';

// i18n & helpers -----------------------------------------------------------
import './i18n/i18n';
import { changeAppLanguage } from './i18n/languageChange';

// context ------------------------------------------------------------------
import { ThemeProvider, useTheme } from './context/ThemeContext';

// icons --------------------------------------------------------------------
import Feather from 'react-native-vector-icons/Feather';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// utils --------------------------------------------------------------------
import { encode as btoa } from 'base-64';

// screens & components ------------------------------------------------------
import UserLocation from './Components/userLocation';
import Home from './screens/Home';
import WaitingUser from './Components/UserWaiting';
import Navigation from './Components/Navigation';
import ServiceInProgress from './Components/ServiceInProgress';
import Payment from './Components/Paymentscreen';
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
import VerificationScreen from './Components/VerificationScreen';
import PaymentScreenRazor from './Components/PaymentScreenRazor';
import AboutCS from './Components/AboutCS';
import ServiceBookingOngoingItem from './Components/ServiceBookingOngoingItem';
import ChatScreen from './Components/ChatScreen';
import LanguageSelector from './Components/LanguageSelector';

// --------------------------------------------------------------------------
const codePushOptions = {
  checkFrequency: CodePush.CheckFrequency.ON_APP_START,
  deploymentKey: '9osws50ZWw1_SwJJi-EynN9Xpz0mJlO43mKHPQ',
};

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/* -------------------------------------------------------------------------
 * TAB NAVIGATOR
 * ---------------------------------------------------------------------- */
function TabNavigator() {
  const { isDarkMode } = useTheme();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          size = focused ? 28 : 24;
          let iconName;
          if (route.name === 'Home') {
            iconName = 'home';
            return <Feather name={iconName} size={size} color={color} />;
          }
          if (route.name === 'Bookings') {
            iconName = 'clipboard';
            return <Feather name={iconName} size={size} color={color} />;
          }
          if (route.name === 'Tracking') {
            iconName = 'shopping-bag';
            return <Feather name={iconName} size={size} color={color} />;
          }
          if (route.name === 'Rewards') {
            iconName = 'wallet';
            return <Entypo name={iconName} size={size} color={color} />;
          }
          if (route.name === 'Account') {
            iconName = 'account-outline';
            return (
              <MaterialCommunityIcons name={iconName} size={size} color={color} />
            );
          }
        },
        tabBarActiveTintColor: '#ff4500',
        tabBarInactiveTintColor: isDarkMode ? 'lightgray' : 'gray',
        tabBarLabelStyle: { fontSize: 12 },
        tabBarStyle: {
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
          backgroundColor: isDarkMode ? '#222' : '#fff',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={ServiceApp}
        options={{ headerShown: false, tabBarLabel: t('tab_home', 'Home') }}
      />
      <Tab.Screen
        name="Bookings"
        component={RecentServices}
        options={{ headerShown: false, tabBarLabel: t('tab_bookings', 'Bookings') }}
      />
      <Tab.Screen
        name="Tracking"
        component={ServiceTrackingListScreen}
        options={{ headerShown: false, tabBarLabel: t('tab_tracking', 'Tracking') }}
      />
      <Tab.Screen
        name="Account"
        component={ProfileScreen}
        options={{ headerShown: false, tabBarLabel: t('tab_account', 'Account') }}
      />
    </Tab.Navigator>
  );
}

/* -------------------------------------------------------------------------
 * MAIN APP
 * ---------------------------------------------------------------------- */
function App() {
  // refs ------------------------------------------------------------------
  const navigationRef = useNavigationContainerRef();
  const isNavigationReady = useRef(false); // imperative flag

  // state -----------------------------------------------------------------
  const [initialRoute, setInitialRoute] = useState(null);
  const [appState, setAppState] = useState(AppState.currentState);

  /* -----------------------------------------------
   * UTILS
   * -------------------------------------------- */
  const deferIfNavNotReady = useCallback(
    async (remoteMessage) => {
      if (!isNavigationReady.current) {
        await EncryptedStorage.setItem(
          'pendingNotification',
          JSON.stringify(remoteMessage)
        );
        return true; // deferred
      }
      return false; // continue
    },
    []
  );

  const handleNotificationNavigation = useCallback(
    async (remoteMessage) => {
      if (!remoteMessage?.data) return;

      // defer if nav not ready yet
      const deferred = await deferIfNavNotReady(remoteMessage);
      if (deferred) return;

      const { notification_id: notificationId, screen } = remoteMessage.data;
      if (!notificationId || !screen) return;

      const encodedId = btoa(notificationId);

      const actions = {
        UserNavigation: () =>
          navigationRef.dispatch(
            CommonActions.navigate('UserNavigation', { encodedId })
          ),
        worktimescreen: () =>
          navigationRef.dispatch(
            CommonActions.navigate('ServiceInProgress', { encodedId })
          ),
        Paymentscreen: () =>
          navigationRef.dispatch(
            CommonActions.navigate('Paymentscreen', { encodedId })
          ),
        Home: () =>
          navigationRef.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {
                  name: 'Tabs',
                  params: { screen: 'Home', params: { encodedId } },
                },
              ],
            })
          ),
      };

      actions[screen]?.();
    },
    [deferIfNavNotReady, navigationRef]
  );

  /* -----------------------------------------------
   * REQUEST PERMISSIONS (optional – keep your logic)
   * -------------------------------------------- */
  const requestAllPermissions = async () => {
    // try {
    //   if (Platform.OS === 'android') {
    //     const perms = [
    //       PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
    //       PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
    //     ];
    //     const statuses = await checkMultiple(perms);
    //     const toAsk = perms.filter((p) => statuses[p] !== RESULTS.GRANTED);
    //     if (toAsk.length) await requestMultiple(toAsk);
    //     if (Platform.Version >= 33) {
    //       await requestNotifications(['alert', 'sound', 'badge']);
    //     }
    //   } else if (Platform.OS === 'ios') {
    //     const perms = [
    //       PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
    //       PERMISSIONS.IOS.NOTIFICATIONS,
    //     ];
    //     const statuses = await checkMultiple(perms);
    //     const toAsk = perms.filter((p) => statuses[p] !== RESULTS.GRANTED);
    //     if (toAsk.length) await requestMultiple(toAsk);
    //   }
    // } catch (err) {
    //   // console.log('Permission request error', err);
    // }
  };

  /* -----------------------------------------------
   * FCM TOKEN
   * -------------------------------------------- */
  const syncFcmToken = async () => {
    try {
      const token = await messaging().getToken();
      const stored = await EncryptedStorage.getItem('fcm_token');
      const auth = await EncryptedStorage.getItem('cs_token');
      if (!stored && auth) {
        await axios.post(
          'https://backend.clicksolver.com/api/user/store-fcm-token',
          { fcmToken: token },
          { headers: { Authorization: `Bearer ${auth}` } }
        );
        await EncryptedStorage.setItem('fcm_token', token);
      }
    } catch (err) {
      // console.log('syncFcmToken error', err);
    }
  };

  /* -----------------------------------------------
   * NOTIFICATION HELPERS
   * -------------------------------------------- */
  const storeNotificationLocally = async (notification) => {
    try {
      const existing = await EncryptedStorage.getItem('notifications');
      const list = existing ? JSON.parse(existing) : [];
      list.push(notification);
      await EncryptedStorage.setItem('notifications', JSON.stringify(list));
    } catch (err) {
      console.log('storeNotificationLocally error', err);
    }
  };

  const flushPendingNotification = useCallback(async () => {
    const pending = await EncryptedStorage.getItem('pendingNotification');
    console.log("Pending notifications")
    if (pending) {
      await handleNotificationNavigation(JSON.parse(pending));
      await EncryptedStorage.removeItem('pendingNotification');
    }
  }, [handleNotificationNavigation]);

  /* -----------------------------------------------
   * EFFECT: INITIAL ROUTE
   * -------------------------------------------- */
  useEffect(() => {
    (async () => {
      const onboarded = await EncryptedStorage.getItem('onboarded');
      setInitialRoute(onboarded ? 'Tabs' : 'OnboardingScreen');
    })(); 
  }, []);

  /* -----------------------------------------------
   * EFFECT: CODEPUSH
   * -------------------------------------------- */
  useEffect(() => {
    CodePush.sync({ installMode: CodePush.InstallMode.IMMEDIATE, updateDialog: true });
  }, []);

  /* -----------------------------------------------
   * EFFECT: PUSH / FCM CONFIG
   * -------------------------------------------- */
  useEffect(() => {
    requestAllPermissions();
    syncFcmToken();

    PushNotification.createChannel({ channelId: 'default', channelName: 'Default' }, () => {});
    PushNotification.createChannel({ channelId: 'silent', channelName: 'Silent', importance: 1, vibrate: false }, () => {});

    PushNotification.configure({
      onNotification: (notification) => {
        if (notification.userInteraction) {
          handleNotificationNavigation({ data: notification.data });
        }
      },
      popInitialNotification: true,
      requestPermissions: false,
    });

    const unsubscribeMessage = messaging().onMessage(async (msg) => {
      console.log("Fcm message arrived",msg)
      await handleNotificationNavigation(msg);
      storeNotificationLocally({
        title: msg.notification?.title ?? '',
        body: msg.notification?.body ?? '',
        data: msg.data,
        receivedAt: new Date().toISOString(),
      });
      PushNotification.localNotification({
        channelId: 'default',
        title: msg.notification?.title ?? '',
        message: msg.notification?.body ?? '',
        data: msg.data,
      });
    });

    messaging().setBackgroundMessageHandler(async (msg) => {
      console.log("Background notification catch",msg)
      await EncryptedStorage.setItem('pendingNotification', JSON.stringify(msg));
      storeNotificationLocally({
        title: msg.notification?.title ?? '',
        body: msg.notification?.body ?? '',
        data: msg.data,
        receivedAt: new Date().toISOString(),
      });
    });

    messaging().getInitialNotification().then(handleNotificationNavigation);

    const unsubscribeOpened = messaging().onNotificationOpenedApp(handleNotificationNavigation);

    return () => {
      unsubscribeMessage();
      unsubscribeOpened();
    };
  }, [handleNotificationNavigation]);

  /* -----------------------------------------------
   * EFFECT: APP STATE (flush pending)
   * -------------------------------------------- */
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      setAppState(next);
      if (next === 'active') flushPendingNotification();
    });
    return () => sub.remove();
  }, [flushPendingNotification]);

  /* -----------------------------------------------
   * EFFECT: SPLASH
   * -------------------------------------------- */
  useEffect(() => {
    SplashScreen.hide();
  }, []);

  /* -----------------------------------------------
   * RENDER
   * -------------------------------------------- */
  if (!initialRoute) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <NavigationContainer
        ref={navigationRef}
        onReady={async () => {
          isNavigationReady.current = true;
          await flushPendingNotification();
        }}
      >
        <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
          {/* bottom tabs */}
          <Stack.Screen name="Tabs" component={TabNavigator} />

          {/* auth / onboarding */}
          <Stack.Screen name="LanguageSelector" component={LanguageSelector} />
          <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="VerificationScreen" component={VerificationScreen} />
          <Stack.Screen name="SignUpScreen" component={SignUpScreen} />

          {/* main flow */}
          <Stack.Screen name="UserLocation" component={UserLocation} />
          <Stack.Screen name="OrderScreen" component={OrderScreen} />
          <Stack.Screen name="DeleteAccount" component={AccountDelete} />
          <Stack.Screen name="ReferralScreen" component={ReferralScreen} />
          <Stack.Screen name="Myrefferals" component={Myrefferals} />
          <Stack.Screen name="userwaiting" component={WaitingUser} />
          <Stack.Screen name="UserNavigation" component={Navigation} />
          <Stack.Screen name="ServiceInProgress" component={ServiceInProgress} />
          <Stack.Screen name="worktimescreen" component={ServiceInProgress} />
          <Stack.Screen name="Paymentscreen" component={Payment} />
          <Stack.Screen name="ServiceBooking" component={SingleService} />
          <Stack.Screen name="RecentServices" component={RecentServices} />
          <Stack.Screen name="serviceCategory" component={PaintingServices} />
          <Stack.Screen name="SearchItem" component={SearchItem} />
          <Stack.Screen name="LocationSearch" component={LocationSearch} />
          <Stack.Screen name="EditProfile" component={EditProfile} />
          <Stack.Screen name="ServiceTrackingItem" component={ServiceTrackingItemScreen} />
          <Stack.Screen name="serviceBookingItem" component={ServiceBookingItem} />
          <Stack.Screen name="Notifications" component={UserNotifications} />
          <Stack.Screen name="Help" component={HelpScreen} />
          <Stack.Screen name="AboutCS" component={AboutCS} />
          <Stack.Screen name="ServiceBookingOngoingItem" component={ServiceBookingOngoingItem} />
          <Stack.Screen name="ChatScreen" component={ChatScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}

export default CodePush(codePushOptions)(App);
