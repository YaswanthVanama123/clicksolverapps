import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { SecureStorage } from '../utils/storage';
import firebaseService from '../services/firebase.service';
import fcmTokenService from '../services/fcmToken.service';
import printService from '../services/print.service';
import soundVibrationService from '../services/soundVibration.service';
import { useSettings } from './SettingsContext';

/**
 * Orders Context
 * Manages order state and real-time updates for admin app
 */

interface Order {
  orderId: string;
  customerName: string;
  workerName?: string;
  services: Array<{name: string; price: number}>;
  totalAmount: number;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  date: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  phone?: string;
}

interface OrdersContextType {
  orders: Order[];
  pendingOrders: Order[];
  activeOrders: Order[];
  completedOrders: Order[];
  loading: boolean;
  error: string | null;
  refreshOrders: () => Promise<void>;
  acceptOrder: (orderId: string) => Promise<boolean>;
  rejectOrder: (orderId: string, reason: string) => Promise<boolean>;
  completeOrder: (orderId: string) => Promise<boolean>;
  printOrderReceipt: (orderId: string) => Promise<boolean>;
}

const defaultContext: OrdersContextType = {
  orders: [],
  pendingOrders: [],
  activeOrders: [],
  completedOrders: [],
  loading: false,
  error: null,
  refreshOrders: async () => {},
  acceptOrder: async () => false,
  rejectOrder: async () => false,
  completeOrder: async () => false,
  printOrderReceipt: async () => false,
};

const OrdersContext = createContext<OrdersContextType>(defaultContext);

export const useOrders = () => {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }
  return context;
};

interface OrdersProviderProps {
  children: ReactNode;
}

export const OrdersProvider: React.FC<OrdersProviderProps> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { soundEnabled, vibrationEnabled, autoRefresh, refreshInterval } = useSettings();

  // Filter orders by status
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const activeOrders = orders.filter(o => o.status === 'accepted' || o.status === 'in_progress');
  const completedOrders = orders.filter(o => o.status === 'completed');

  useEffect(() => {
    // Initialize services
    initializeServices();

    // Initial fetch
    refreshOrders();

    // Setup FCM listeners
    setupNotificationListeners();

    // Setup auto-refresh
    let intervalId: NodeJS.Timeout;
    if (autoRefresh) {
      intervalId = setInterval(() => {
        refreshOrders();
      }, refreshInterval);
    }

    // Monitor app state
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (intervalId) clearInterval(intervalId);
      subscription?.remove();
    };
  }, [autoRefresh, refreshInterval]);

  const initializeServices = async () => {
    try {
      await firebaseService.initialize();
      await soundVibrationService.initialize();
      const token = await fcmTokenService.requestPermissionAndGetToken();
      if (token) {
        await fcmTokenService.syncTokenWithBackend(token);
      }
      console.log('Services initialized successfully');
    } catch (error) {
      console.error('Error initializing services:', error);
    }
  };

  const setupNotificationListeners = () => {
    // Handle new order notifications
    // firebaseService handles the notification display
    // We refresh orders when notification is received
    console.log('Notification listeners setup');
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      // App came to foreground, refresh orders
      refreshOrders();
    }
  };

  const refreshOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await SecureStorage.getItem('acs_token');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      // Fetch orders from API
      const response = await fetch('https://backend.clicksolver.com/admin/orders', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
        console.log(`Fetched ${data.orders?.length || 0} orders`);
      } else {
        setError('Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error refreshing orders:', err);
      setError('Error refreshing orders');
    } finally {
      setLoading(false);
    }
  };

  const acceptOrder = async (orderId: string): Promise<boolean> => {
    try {
      const token = await SecureStorage.getItem('acs_token');
      if (!token) return false;

      const response = await fetch(`https://backend.clicksolver.com/admin/orders/${orderId}/accept`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Play success sound/vibration
        if (soundEnabled) soundVibrationService.playSuccessSound();
        if (vibrationEnabled) soundVibrationService.vibrateForOrderAcceptance();

        // Refresh orders
        await refreshOrders();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error accepting order:', error);
      return false;
    }
  };

  const rejectOrder = async (orderId: string, reason: string): Promise<boolean> => {
    try {
      const token = await SecureStorage.getItem('acs_token');
      if (!token) return false;

      const response = await fetch(`https://backend.clicksolver.com/admin/orders/${orderId}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        // Play cancellation sound/vibration
        if (vibrationEnabled) soundVibrationService.vibrateForOrderCancellation();

        // Refresh orders
        await refreshOrders();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error rejecting order:', error);
      return false;
    }
  };

  const completeOrder = async (orderId: string): Promise<boolean> => {
    try {
      const token = await SecureStorage.getItem('acs_token');
      if (!token) return false;

      const response = await fetch(`https://backend.clicksolver.com/admin/orders/${orderId}/complete`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Play success sound/vibration
        if (soundEnabled) soundVibrationService.playSuccessSound();
        if (vibrationEnabled) soundVibrationService.vibrate('short');

        // Refresh orders
        await refreshOrders();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error completing order:', error);
      return false;
    }
  };

  const printOrderReceipt = async (orderId: string): Promise<boolean> => {
    try {
      const order = orders.find(o => o.orderId === orderId);
      if (!order) return false;

      return await printService.printReceipt(order);
    } catch (error) {
      console.error('Error printing receipt:', error);
      return false;
    }
  };

  const value: OrdersContextType = {
    orders,
    pendingOrders,
    activeOrders,
    completedOrders,
    loading,
    error,
    refreshOrders,
    acceptOrder,
    rejectOrder,
    completeOrder,
    printOrderReceipt,
  };

  return (
    <OrdersContext.Provider value={value}>
      {children}
    </OrdersContext.Provider>
  );
};

export default OrdersContext;
