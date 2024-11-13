import React, { useEffect, useRef, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { PermissionsAndroid, Platform, SafeAreaView, StyleSheet, Alert, ActivityIndicator, View } from 'react-native';
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
import Ionicons from 'react-native-vector-icons/Ionicons'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
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
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            size = focused ? 28 : 24;  // Slight size change when active

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
              return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
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
        })} 
      >
        <Tab.Screen name="Home" component={HelloWorld} options={{ headerShown: false }} />
        <Tab.Screen name="Bookings" component={RecentServices} options={{ headerShown: false }} />
        <Tab.Screen name="Tracking" component={ServiceTrackingListScreen} options={{ headerShown: false }} />
        {/* <Tab.Screen name="Native" component={CashbackScreen1} options={{ headerShown: false }} />    */}
        <Tab.Screen name="Account" component={AdministratorDashboard} options={{ headerShown: false }} />
      </Tab.Navigator>
    </SafeAreaView> 
  );
}
    
function App(): React.JSX.Element {
  const navigationRef = useRef(null);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
            PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          ]);

          if (
            granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED &&
            granted['android.permission.ACCESS_COARSE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED &&
            granted['android.permission.ACCESS_BACKGROUND_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
          ) {
            console.log('Location permissions granted');
          } else {
            console.log('Location permission denied');
          }

          if (granted['android.permission.POST_NOTIFICATIONS'] === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Notification permission granted');
          } else {
            console.log('Notification permission denied');
          }
        }
      } catch (err) {
        console.warn(err);
      }
    };

    requestPermissions();
    SplashScreen.hide();
  }, []);

  useEffect(() => {
    const checkPartnerStepsStatus = async () => {
      try {
        const pcsToken = await EncryptedStorage.getItem('pcs_token');
        console.log('pcs_token:', pcsToken);
  
        if (pcsToken) {
          const partnerStepsToken = await EncryptedStorage.getItem('partnerSteps');
          const verification = await EncryptedStorage.getItem('verification');
          console.log('partnerSteps:', partnerStepsToken);
          
          if (partnerStepsToken === 'completed') {
            console.log("compl")
            if(verification === 'true'){
              setInitialRoute('Tabs'); // Navigate to Tabs
              navigationRef.current?.navigate('Tabs'); // Force navigation to Tabs
            }else{
              console.log("approval")
              setInitialRoute('ApprovalScreen');
              navigationRef.current?.navigate('ApprovalScreen');
            }

          } else {
            console.log("Redirecting to PartnerSteps");
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
        <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name='PartnerSteps' component={PartnerSteps} options={{title: 'partnerSteps', headerShown: false}} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login', headerShown: false }} />
        <Stack.Screen name="SkillRegistration" component={RegistrationScreen} options={{ title: 'SkillRegistration', headerShown: false }} />
        <Stack.Screen name="Acceptance" component={WorkerAcceptance} options={{ title: 'Acceptance' }} />
        <Stack.Screen name='WorkerNavigation' component={WorkerNavigationScreen} options={{title: 'WorkerNavigation', headerShown: false}} />
        <Stack.Screen name='TimingScreen' component={WorkerTimer} options={{ title: 'TimingScreen',headerShown: false }} />
        <Stack.Screen name='OtpVerification' component={OTPVerification} options={{ title: 'OtpVerification', headerShown: false}} />
        <Stack.Screen name='PaymentScreen' component={PaymentScanner} options={{title: 'PaymentScreen', headerShown: false}} />
        <Stack.Screen name='ServiceCompleted' component={ServiceCompletionScreen} options={{title: 'PaymentCompleted', headerShown: false}} />
        <Stack.Screen name='TaskConfirmation' component={TaskConfirmation} options={{title: 'TaskConfirmation', headerShown: false}} />
        <Stack.Screen name='Profile' component={Profile} options={{title: 'Profile'}} />
        <Stack.Screen name='Earnings' component={EarningsScreen} options={{headerShown: false}} />
        <Stack.Screen name='RatingsScreen' component={RatingsScreen} options={{headerShown: false}} />
        <Stack.Screen name='BalanceScreen' component={BalanceScreen} options={{headerShown: false}} />
        <Stack.Screen name='BankAccountScreen' component={BankAccountScreen} options={{title: 'BankAccountScreen', headerShown: false}} />
        <Stack.Screen name='SignupDetails' component={SignUpScreen} options={{title: 'BankAccountScreen', headerShown: false}} />
        <Stack.Screen name='UpiIDScreen' component={UPIIdDetailsScreen} options={{title: 'UpiIDScreen', headerShown: false}} />
        <Stack.Screen name='ApprovalScreen' component={Approval} options={{title: 'Approval', headerShown: false}} />
        <Stack.Screen name='ServiceTrackingItem' component={ServiceTrackingItemScreen} options={{title: 'ServiceTrackingItem', headerShown: false}} />
        <Stack.Screen name='TrackingConfirmation' component={TrackingConfirmation} options={{title: 'TrackingConfirmation', headerShown: false}} />
        <Stack.Screen name='IndividualWorkerPending' component={IndividualWorkerPending} options={{title: 'IndividualWorkerPending', headerShown: false}} />
        <Stack.Screen name='WorkerProfile' component={skills} options={{title: 'WorkerProfile', headerShown: false}} />
        <Stack.Screen name='serviceBookingItem' component={ServiceBookingItem} options={{title: 'serviceBookingItem', headerShown: false}} />
        <Stack.Screen name='WorkerPendingCashback' component={CashbackScreen1} options={{title: 'WorkerPendingCashback', headerShown: false}} />
        <Stack.Screen name='AdministratorAllTrackings' component={AdministratorAllTrackings} options={{title: 'AdministratorAllTrackings', headerShown: false}} />
        <Stack.Screen name='AdministratorDashboard' component={AdministratorDashboard} options={{title: 'AdministratorDashboard', headerShown: false}} />
        <Stack.Screen name='ApprovalPendingItems' component={ApprovalPendingItems} options={{title: 'ApprovalPendingItems', headerShown: false}} />
        <Stack.Screen name='PendingCashbackWorkers' component={PendingCashbackWorkers} options={{title: 'PendingCashbackWorkers', headerShown: false}} />
        <Stack.Screen name='PendingBalanceWorkers' component={PendingBalanceWorkers} options={{title: 'PendingBalanceWorkers', headerShown: false}} />
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
