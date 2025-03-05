import React, {useEffect, useRef, useState} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer, CommonActions} from '@react-navigation/native';
import messaging from '@react-native-firebase/messaging';
import {
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  View,
} from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import Feather from 'react-native-vector-icons/Feather';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import EncryptedStorage from 'react-native-encrypted-storage';
import RecentServices from './Components/RecentServices';
import Profile from './Components/Profile';
import PartnerSteps from './Components/PartnerSteps';
import LoginScreen from './Components/LoginScreen';
import RegistrationScreen from './Components/RegistrationScreen';
import HelloWorld from './Screens/HelloWorld';
import UPIIdDetailsScreen from './Components/UPIIdDetailsScreen';
import BankAccountScreen from './Components/BankAccountScreen';
import BalanceScreen from './Screens/BalanceScreen';
import RatingsScreen from './Components/ratingsScreen';
import EarningsScreen from './Screens/EarningsScreen';
import TaskConfirmation from './Components/TaskConfirmation';
import ServiceCompletionScreen from './Components/ServiceCompletionScreen';
import PaymentScanner from './Components/PaymentScanner';
import OTPVerification from './Components/OtpVerification';
import WorkerTimer from './Components/WorkerTimer';
import WorkerNavigationScreen from './Components/WorkerNavigationScreen';
import WorkerAcceptance from './Components/Acceptance';
import SignUpScreen from './Components/SignUpScreen';
import skills from './Components/Skills';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import ServiceTrackingListScreen from './Components/ServiceTrackingListScreen';
import ServiceTrackingItemScreen from './Components/ServiceTrackingItemScreen';
import TrackingConfirmation from './Components/TrackingConfirmation';
import Approval from './Components/Approval';
import IndividualWorkerPending from './Components/IndividualWorkerPending';
import ServiceBookingItem from './Components/ServiceBookingItem';
import CashbackScreen1 from './Components/CashbackScreen1';
import PendingCashbackWorkers from './Components/PendingCashbackWorkers';
import AdministratorDashboard from './Components/AdministratorDashboard';
import AdministratorAllTrackings from './Components/AdministratorAllTrackings';
import ApprovalPendingItems from './Components/ApprovalPendingItems';
import PendingBalanceWorkers from './Components/PendingBalanceWorkers';
import ServiceInProgress from './Components/ServiceInProgress';
import ServiceRegistration from './Components/ServiceRegistration';
import TaskCompletionScreen from './Components/TaskConformationScreen';
import HomeScreen from './Screens/Home';
import HomeComponent from './Screens/HomeComponent';
import {NavigationContainerRef} from '@react-navigation/native';
import axios from 'axios';
import WorkerOtpVerificationScreen from './Components/WorkerOtpVerificationScreen';
import ProfileChange from './Components/ProfileChange';
import PaymentConfirmationScreen from './Components/PaymentConfirmationScreen';
// Additional imports...

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabIcons = {
  Home: Ionicons,
  Services: Feather,
  Notification: Ionicons,
  Account: FontAwesome,
  Maps: MaterialIcons,
};

function TabNavigator() {
  return (
    <SafeAreaView style={styles.container}>
      <Tab.Navigator
        screenOptions={({route}) => ({
          tabBarIcon: ({focused, color, size}) => {
            let iconName;
            size = focused ? 28 : 24; // Slight size change when active

            if (route.name === 'Home') {
              iconName = 'home';
              return <Feather name={iconName} size={size} color={color} />;
            } else if (route.name === 'Bookings') {
              iconName = 'clipboard';
              return <Feather name={iconName} size={size} color={color} />;
            } else if (route.name === 'Tracking') {
              iconName = 'wallet';
              return <Entypo name={iconName} size={size} color={color} />;
            } else if (route.name === 'Native') {
              iconName = 'shopping-bag';
              return <Feather name={iconName} size={size} color={color} />;
            } else if (route.name === 'Account') {
              iconName = 'account-outline';
              return (
                <MaterialCommunityIcons
                  name={iconName}
                  size={size}
                  color={color}
                />
              );
            }
          },
          tabBarActiveTintColor: '#ff4500',
          tabBarInactiveTintColor: 'gray',
          tabBarLabelStyle: {
            fontSize: 12,
          },
          tabBarStyle: {
            height: 60,
            paddingBottom: 5,
            paddingTop: 5,
          },
        })}>
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{headerShown: false}}
        />
        <Tab.Screen
          name="Bookings"
          component={RecentServices}
          options={{headerShown: false}}
        />
        <Tab.Screen
          name="Tracking"
          component={ServiceTrackingListScreen}
          options={{headerShown: false}}
        />
        {/* <Tab.Screen name="Native" component={CashbackScreen1} options={{ headerShown: false }} />    */}
        <Tab.Screen
          name="Account"
          component={skills}
          options={{headerShown: false}}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

function App(): React.JSX.Element {
  // const navigationRef = useRef(null);
  const navigationRef = useRef<NavigationContainerRef>(null);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const handleForceLogout = async () => {
    try {
        console.log("Logging out due to session expiration...");
        
        const fcm_token = await EncryptedStorage.getItem('fcm_token');

        if (fcm_token) {
            await axios.post('https://backend.clicksolver.com/api/workerLogout', { fcm_token });
        }

        await EncryptedStorage.removeItem("pcs_token");
        await EncryptedStorage.removeItem("fcm_token");
        await EncryptedStorage.removeItem("workerSessionToken");

        navigationRef.current?.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: "Login" }],
            })
        );
    } catch (error) {
        console.error("Error handling force logout:", error);
    }
};

// useEffect(() => {
//   const storeToken = async () => {
//     try {
//       await EncryptedStorage.setItem(
//         'pcs_token',
//         'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ3b3JrZXJfaWQiOjUsImlhdCI6MTc0MDQwNDYwMCwiZXhwIjo2MDYwNDA0NjAwfQ.dijhyH9Nx-GslxxiApazwIF_zNUaXnKYBuwPYRYYMhc'
//       );
//     } catch (error) {
//       console.error('Error storing token:', error);
//     }
//   };

//   storeToken();
// }, []);


  useEffect(() => {

    const checkSessionOnAppStart = async () => {
      try {
        const pcsToken = await EncryptedStorage.getItem("pcs_token");
  
        if (!pcsToken) {
          console.warn("No PCS token found, logging out...");
          handleForceLogout();
          return;
        }
  

          const response = await axios.post(
            "https://backend.clicksolver.com/api/worker/token/verification",
            { pcsToken }, // Sending pcsToken in the request body
            {
              headers: { Authorization: `Bearer ${pcsToken}` },
            }
          );
        
          console.log(response.status)
  
        if (response.status === 205) {
          console.warn("Session expired, logging out...");
          handleForceLogout();
        } else {
          console.log("Session valid, continuing...");
        }
      } catch (error) {
        console.error("Error checking session validity:", error);
        // Optional: Handle network errors gracefully, retry logic can be added here
      }
    };
  
    // ✅ Only run this when the app starts from a terminated state
    checkSessionOnAppStart();
  }, []);

  // useEffect(() => {
  //   const requestPermissions = async () => {
  //     try {
  //       const authStatus = await messaging().requestPermission();
  //       const enabled =
  //         authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
  //         authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  
  //       if (enabled) {
  //         console.log("Notification permissions enabled.");
  //       } else {
  //         console.log("Notification permissions denied.");
  //       }
  //     } catch (err) {
  //       console.warn("Error requesting notification permissions:", err);
  //     }
  //   };
  
  //   const handleForceLogout = async () => {
  //     try {
  //       console.log("Logging out due to FORCE_LOGOUT message...");
  //       await EncryptedStorage.removeItem("pcs_token");
  //       await EncryptedStorage.removeItem("workerSessionToken");
  //       navigationRef.current?.dispatch(
  //         CommonActions.reset({
  //           index: 0,
  //           routes: [{ name: "Login" }],
  //         })
  //       );
  //     } catch (error) {
  //       console.error("Error handling force logout:", error);
  //     }
  //   };
  
  //   // ✅ Handle Foreground Notifications
  //   const handleForegroundNotification = () => {
  //     const unsubscribe = messaging().onMessage(async (remoteMessage) => {
  //       if (!remoteMessage?.data) return;
  
  //       const notificationId = remoteMessage.data?.notification_id;
  //       const screen = remoteMessage.data?.screen;
  
  //       if (!navigationRef.current) {
  //         console.warn("Navigation reference is not set yet.");
  //         return;
  //       }
  
  //       if (screen === "Home") {
  //         navigationRef.current.dispatch(
  //           CommonActions.reset({
  //             index: 0,
  //             routes: [{ name: "Tabs", state: { routes: [{ name: "Home" }] } }],
  //           })
  //         );
  //       } else if (screen === "TaskConfirmation") {
  //         navigationRef.current.navigate("TaskConfirmation", {
  //           encodedId: notificationId,
  //         });
  //       } else if (remoteMessage.data?.action === "FORCE_LOGOUT") {
  //         handleForceLogout();
  //       }
  //     });
  
  //     return unsubscribe; // ✅ Ensure cleanup when component unmounts
  //   };
  
  //   // ✅ Handle Background Notifications
  //   const handleBackgroundNotification = async () => {
  //     messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  //       if (!remoteMessage?.data) return;
  
  //       const notificationId = remoteMessage.data?.notification_id;
  //       const screen = remoteMessage.data?.screen;
  
  //       if (!navigationRef.current) {
  //         console.warn("Navigation reference is not set yet.");
  //         return;
  //       }
  
  //       if (screen === "Home") {
  //         navigationRef.current.dispatch(
  //           CommonActions.reset({
  //             index: 0,
  //             routes: [{ name: "Home" }],
  //           })
  //         );
  //       } else if (screen === "TaskConfirmation") {
  //         navigationRef.current.navigate("TaskConfirmation", {
  //           encodedId: notificationId,
  //         });
  //       } else if (remoteMessage.data?.action === "FORCE_LOGOUT") {
  //         handleForceLogout();
  //       }
  //     });
  //   };
  
  //   // ✅ Handle Notifications when App is Opened from Terminated State
  //   const handleInitialNotification = async () => {
  //     const remoteMessage = await messaging().getInitialNotification();
  //     if (!remoteMessage?.data) return; // ✅ Prevent errors when remoteMessage is null
  
  //     const screen = remoteMessage.data?.screen;
  //     if (!navigationRef.current) {
  //       console.warn("Navigation reference is not set yet.");
  //       return;
  //     }
  
  //     if (screen === "Home") {
  //       navigationRef.current.dispatch(
  //         CommonActions.reset({
  //           index: 0,
  //           routes: [{ name: "Tabs", state: { routes: [{ name: "Home" }] } }],
  //         })
  //       );
  //     } else if (screen === "TaskConfirmation") {
  //       navigationRef.current.navigate("TaskConfirmation", {
  //         encodedId: remoteMessage.data?.notification_id,
  //       });
  //     } else if (remoteMessage.data?.action === "FORCE_LOGOUT") {
  //       handleForceLogout();
  //     }
  //   };
  
  //   // Variable to store the foreground unsubscribe function
  //   let unsubscribeForeground: () => void = () => {};
  
  //   // Call async functions inside an IIFE
  //   (async () => {
  //     await requestPermissions();
  //     unsubscribeForeground = handleForegroundNotification();
  //     await handleBackgroundNotification();
  //     await handleInitialNotification();
  //   })();
  
  //   // Return the cleanup function synchronously
  //   return () => {
  //     if (unsubscribeForeground) {
  //       unsubscribeForeground();
  //     }
  //   };
  // }, []);
  
  

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          console.log('Notification permissions enabled.');
        } else {
          console.log('Notification permissions denied.');
        }
      } catch (err) {
        console.warn('Error requesting notification permissions:', err);
      }
    };

    const handleForegroundNotification = () => {
      messaging().onMessage(async remoteMessage => {
        const notificationId = remoteMessage.data?.notification_id;
        const screen = remoteMessage.data?.screen;

        if (!navigationRef.current) {
          console.warn('Navigation reference is not set yet.');
          return;
        }

        if (screen === 'Home') {
          navigationRef.current.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{name: 'Tabs', state: {routes: [{name: 'Home'}]}}],
            }),
          );
        } else if (screen === 'TaskConfirmation') {
          navigationRef.current.navigate('TaskConfirmation', {
            encodedId: notificationId,
          });
        }
        else if (remoteMessage.data?.action === "FORCE_LOGOUT") {
          handleForceLogout();
        }
      });
    };

    const handleBackgroundNotification = () => {
      messaging().setBackgroundMessageHandler(async remoteMessage => {
        const notificationId = remoteMessage.data?.notification_id;
        const screen = remoteMessage.data?.screen;

        if (!navigationRef.current) {
          console.warn('Navigation reference is not set yet.');
          return;
        }

        if (screen === 'Home') {
          navigationRef.current.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{name: 'Home'}],
            }),
          );
        } else if (screen === 'TaskConfirmation') {
          navigationRef.current.navigate('TaskConfirmation', {
            encodedId: notificationId,
          });
        }
        else if (remoteMessage.data?.action === "FORCE_LOGOUT") {
          handleForceLogout();
        }
      });
    };

    const handleInitialNotification = async () => {
      const remoteMessage = await messaging().getInitialNotification();
      const screen = remoteMessage?.data?.screen;

      if (!navigationRef.current) {
        console.warn('Navigation reference is not set yet.');
        return;
      }

      if (screen === 'Home') {
        navigationRef.current.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: 'Tabs', state: {routes: [{name: 'Home'}]}}],
          }),
        );
      } else if (screen === 'TaskConfirmation') {
        navigationRef.current.navigate('TaskConfirmation', {
          encodedId: remoteMessage?.data?.notification_id,
        });
      }
      else if (remoteMessage?.data?.action === "FORCE_LOGOUT") {
        handleForceLogout();
      }
    };

    const setupNotificationHandlers = async () => {
      await requestPermissions();
      handleForegroundNotification();
      handleBackgroundNotification();
      handleInitialNotification();
    };

    setupNotificationHandlers();
    SplashScreen.hide();
  }, []);

  useEffect(() => {
    const checkPartnerStepsStatus = async () => {
      try {
        const pcsToken = await EncryptedStorage.getItem('pcs_token');
        console.log('pcs_token:', pcsToken);

        if (pcsToken) {
          const partnerStepsToken = await EncryptedStorage.getItem(
            'partnerSteps',
          );
          const verification = await EncryptedStorage.getItem('verification');
          console.log('partnerSteps:', partnerStepsToken);

          if (partnerStepsToken === 'completed') {
            console.log('compl', verification);
            if (verification === 'true') {
              setInitialRoute('Tabs'); // Navigate to Tabs
              navigationRef.current?.navigate('Tabs'); // Force navigation to Tabs
            } else {
              console.log('approval');
              setInitialRoute('ApprovalScreen');
              navigationRef.current?.navigate('ApprovalScreen');
            }
          } else {
            console.log('Redirecting to PartnerSteps');
            setInitialRoute('PartnerSteps'); // Navigate to PartnerSteps
            navigationRef.current?.navigate('PartnerSteps'); // Force navigation to PartnerSteps
          }
        } else {
          console.log('Redirecting to Login');
          setInitialRoute('Login');
          navigationRef.current?.navigate('Login'); // Force navigation to Login
        }
      } catch (error) {
        console.error('Error retrieving tokens:', error);
        setInitialRoute('Login'); // Default to Login if error occurs
        navigationRef.current?.navigate('Login'); // Force navigation to Login
      }
    };

    checkPartnerStepsStatus();
  }, []);

  // Show a loading screen or null until initialRoute is determined
  if (!initialRoute) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen
          name="Tabs"
          component={TabNavigator}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="PartnerSteps"
          component={PartnerSteps}
          options={{title: 'partnerSteps', headerShown: false}}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{title: 'Login', headerShown: false}}
        />
        <Stack.Screen
          name="SkillRegistration"
          component={RegistrationScreen}
          options={{title: 'SkillRegistration', headerShown: false}}
        />
        <Stack.Screen
          name="Acceptance"
          component={WorkerAcceptance}
          options={{title: 'Acceptance'}}
        />
        <Stack.Screen
          name="ServiceRegistration"
          component={ServiceRegistration}
          options={{title: 'ServiceRegistration', headerShown: false}}
        />
        <Stack.Screen
          name="UserNavigation"
          component={WorkerNavigationScreen}
          options={{title: 'UserNavigation', headerShown: false}}
        />
        <Stack.Screen
          name="worktimescreen"
          component={ServiceInProgress}
          options={{title: 'worktimescreen', headerShown: false}}
        />
        <Stack.Screen
          name="OtpVerification"
          component={OTPVerification}
          options={{title: 'OtpVerification', headerShown: false}}
        />
        <Stack.Screen
          name="PaymentConfirmationScreen"
          component={PaymentConfirmationScreen}
          options={{title: 'PaymentConfirmationScreen ', headerShown: false}}
        />
        <Stack.Screen
          name="Paymentscreen"
          component={PaymentScanner}
          options={{title: 'Paymentscreen', headerShown: false}}
        />
        <Stack.Screen
          name="ServiceCompleted"
          component={ServiceCompletionScreen}
          options={{title: 'PaymentCompleted', headerShown: false}}
        />
        <Stack.Screen
          name="TaskConfirmation"
          component={TaskConfirmation}
          options={{title: 'TaskConfirmation', headerShown: false}}
        />
        <Stack.Screen
          name="Profile"
          component={Profile}
          options={{title: 'Profile'}}
        />
        <Stack.Screen
          name="Earnings"
          component={EarningsScreen}
          options={{headerShown: false}}
        /> 
        <Stack.Screen
          name="RatingsScreen"
          component={RatingsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="BalanceScreen"
          component={BalanceScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="BankAccountScreen"
          component={BankAccountScreen}
          options={{title: 'BankAccountScreen', headerShown: false}}
        />
        <Stack.Screen
          name="WorkerOtpVerificationScreen"
          component={WorkerOtpVerificationScreen}
          options={{title: 'WorkerOtpVerificationScreen', headerShown: false}}
        />

        <Stack.Screen
          name="SignupDetails"
          component={SignUpScreen}
          options={{title: 'BankAccountScreen', headerShown: false}}
        />
        <Stack.Screen
          name="UpiIDScreen"
          component={UPIIdDetailsScreen}
          options={{title: 'UpiIDScreen', headerShown: false}}
        />
        <Stack.Screen
          name="ApprovalScreen"
          component={Approval}
          options={{title: 'Approval', headerShown: false}}
        />
        <Stack.Screen
          name="ServiceTrackingItem"
          component={ServiceTrackingItemScreen}
          options={{title: 'ServiceTrackingItem', headerShown: false}}
        />
        <Stack.Screen
          name="TrackingConfirmation"
          component={TrackingConfirmation}
          options={{title: 'TrackingConfirmation', headerShown: false}}
        />
        <Stack.Screen
          name="IndividualWorkerPending"
          component={IndividualWorkerPending}
          options={{title: 'IndividualWorkerPending', headerShown: false}}
        />
        <Stack.Screen
          name="WorkerProfile"
          component={ProfileChange}
          options={{title: 'WorkerProfile', headerShown: false}}
        />
        <Stack.Screen
          name="serviceBookingItem"
          component={ServiceBookingItem}
          options={{title: 'serviceBookingItem', headerShown: false}}
        />
        <Stack.Screen
          name="WorkerPendingCashback"
          component={CashbackScreen1}
          options={{title: 'WorkerPendingCashback', headerShown: false}}
        />
        <Stack.Screen
          name="AdministratorAllTrackings"
          component={AdministratorAllTrackings}
          options={{title: 'AdministratorAllTrackings', headerShown: false}}
        />
        <Stack.Screen
          name="AdministratorDashboard"
          component={AdministratorDashboard}
          options={{title: 'AdministratorDashboard', headerShown: false}}
        />
        <Stack.Screen
          name="ApprovalPendingItems"
          component={ApprovalPendingItems}
          options={{title: 'ApprovalPendingItems', headerShown: false}}
        />
        <Stack.Screen
          name="PendingCashbackWorkers"
          component={PendingCashbackWorkers}
          options={{title: 'PendingCashbackWorkers', headerShown: false}}
        />
        <Stack.Screen
          name="PendingBalanceWorkers"
          component={PendingBalanceWorkers}
          options={{title: 'PendingBalanceWorkers', headerShown: false}}
        />
        <Stack.Screen
          name="ProfileChange"
          component={ProfileChange}
          options={{title: 'ProfileChange', headerShown: false}}
        />
        <Stack.Screen
          name="ServiceInProgress"
          component={ServiceInProgress}
          options={{title: 'ServiceInProgress', headerShown: false}}
        />
        {/* Additional screens here */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabBarStyle: {
    backgroundColor: '#ffffff',
    paddingBottom: 10,
    height: 70,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tabBarLabelStyle: {
    fontSize: 12,
    paddingBottom: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
