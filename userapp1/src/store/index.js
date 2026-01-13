// Export all stores
export {default as useAuthStore} from './authStore';
export {default as useBookingStore} from './bookingStore';
export {default as useUserStore} from './userStore';
export {default as useNotificationStore} from './notificationStore';

// Combined hook for accessing all stores
// Useful when you need multiple stores in a single component
export const useStores = () => {
  const auth = useAuthStore();
  const booking = useBookingStore();
  const user = useUserStore();
  const notification = useNotificationStore();

  return {
    auth,
    booking,
    user,
    notification,
  };
};

// Selectors for better performance
// Use these to subscribe to specific parts of the store
export const authSelectors = {
  isAuthenticated: state => state.isAuthenticated,
  user: state => state.user,
  token: state => state.token,
  isLoading: state => state.isLoading,
};

export const bookingSelectors = {
  cart: state => state.cart,
  cartCount: state => state.cart.length,
  cartTotal: state =>
    state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
  selectedAddress: state => state.selectedAddress,
  bookingInProgress: state => state.bookingInProgress,
  totalAmount: state => {
    const subtotal = state.cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    return subtotal + state.tipAmount - state.discount;
  },
};

export const userSelectors = {
  profile: state => state.profile,
  savedAddresses: state => state.savedAddresses,
  defaultAddress: state =>
    state.savedAddresses.find(addr => addr.isDefault) ||
    state.savedAddresses[0],
  preferences: state => state.preferences,
  recentServices: state => state.recentServices,
};

export const notificationSelectors = {
  notifications: state => state.notifications,
  unreadCount: state => state.unreadCount,
  fcmToken: state => state.fcmToken,
  unreadNotifications: state =>
    state.notifications.filter(n => !n.isRead),
};
