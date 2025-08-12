import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import EncryptedStorage from 'react-native-encrypted-storage';

import DashboardScreen from './Components/DashboardScreen';
import LoginScreen from './Components/LoginScreen';
import PendingBalanceWorkers from './Components/PendingBalanceWorkers';
import PendingCashbackWorkers from './Components/PendingCashbackWorkers';
import ApprovalPendingItems from './Components/ApprovalPendingItems';
import AdministratorAllTrackings from './Components/AdministratorAllTrackings';
import ServiceTrackingItemScreen from './Components/ServiceTrackingItemScreen';
import IndividualWorkerPending from './Components/IndividualWorkerPending';
import WorkerPendingCashback from './Components/WorkerPendingCashback';
import WorkerPendingBalance from './Components/WorkerPendingBalance';
import WorkerDataBySearch from './Components/WorkerDataBySearch';
import WorkerStartingStage from './Components/WorkerStartingStage';
import TrackingConfirmation from './Components/TrackingConfirmation';

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('LoginScreen');

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await EncryptedStorage.getItem('acs_token');

        if (token) {
          console.log("There is a token:", token);
          setInitialRoute('DashboardScreen');
        }
      } catch (error) {
        console.error('Error retrieving token:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, []);

  // Wait for token check before rendering the navigator
  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen 
          name="DashboardScreen" 
          component={DashboardScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="WorkerDataBySearch" 
          component={WorkerDataBySearch} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="LoginScreen" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="PendingBalanceWorkers" 
          component={PendingBalanceWorkers} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="PendingCashbackWorkers" 
          component={PendingCashbackWorkers} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="ApprovalPendingItems" 
          component={ApprovalPendingItems} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="AdministratorAllTrackings" 
          component={AdministratorAllTrackings} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="ServiceTrackingItem" 
          component={ServiceTrackingItemScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen
          name="IndividualWorkerPending"
          component={IndividualWorkerPending}
          options={{ title: 'IndividualWorkerPending', headerShown: false }}
        />
        <Stack.Screen
          name="WorkerPendingCashback"
          component={WorkerPendingCashback}
          options={{ title: 'WorkerPendingCashback', headerShown: false }}
        />
        <Stack.Screen
          name="WorkerPendingBalance"
          component={WorkerPendingBalance}
          options={{ title: 'WorkerPendingCashback', headerShown: false }}
        />
        <Stack.Screen
          name="WorkerStartingStage"
          component={WorkerStartingStage}
          options={{ title: 'WorkerStartingStage', headerShown: false }}
        />
        <Stack.Screen
          name="TrackingConfirmation"
          component={TrackingConfirmation}
          options={{ title: 'TrackingConfirmation', headerShown: false }}
        />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}
