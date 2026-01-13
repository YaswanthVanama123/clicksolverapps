/**
 * TypeScript type definitions for Zustand stores
 *
 * If your project uses TypeScript, you can use these type definitions
 * to get better type safety and autocomplete.
 */

// ============================================================================
// Auth Store Types
// ============================================================================

export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  avatar?: string;
  createdAt?: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthActions {
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  login: (phoneNumber: string, otp: string) => Promise<ActionResult>;
  logout: () => Promise<ActionResult>;
  checkAuth: () => Promise<ActionResult & {isAuthenticated: boolean}>;
}

export type AuthStore = AuthState & AuthActions;

// ============================================================================
// Booking Store Types
// ============================================================================

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration?: number;
  category?: string;
  image?: string;
}

export interface CartItem extends Service {
  quantity: number;
}

export interface Address {
  id?: string;
  type: 'home' | 'work' | 'other';
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export interface Offer {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  maxDiscount?: number;
  minOrderValue?: number;
  description?: string;
  expiresAt?: string;
}

export interface BookingState {
  cart: CartItem[];
  selectedServices: Service[];
  selectedAddress: Address | null;
  bookingInProgress: boolean;
  currentBookingId: string | null;
  tipAmount: number;
  appliedOffer: Offer | null;
  discount: number;
}

export interface BookingActions {
  addToCart: (service: Service) => void;
  removeFromCart: (serviceId: string) => void;
  updateQuantity: (serviceId: string, quantity: number) => void;
  setAddress: (address: Address) => void;
  setTip: (amount: number) => void;
  applyOffer: (offer: Offer) => void;
  clearCart: () => void;
  startBooking: (data: any) => Promise<ActionResult & {bookingId?: string}>;
  completeBooking: () => void;
}

export type BookingStore = BookingState & BookingActions;

// ============================================================================
// User Store Types
// ============================================================================

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  phoneNumber: string;
  avatar?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  createdAt?: string;
}

export interface UserPreferences {
  language?: string;
  notifications?: boolean;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  currency?: string;
  theme?: 'light' | 'dark' | 'auto';
}

export interface UserState {
  profile: UserProfile | null;
  savedAddresses: Address[];
  preferences: UserPreferences;
  recentServices: Service[];
}

export interface UserActions {
  setProfile: (profile: UserProfile) => void;
  addAddress: (address: Address) => Promise<ActionResult & {address?: Address}>;
  removeAddress: (addressId: string) => Promise<ActionResult>;
  setDefaultAddress: (addressId: string) => Promise<ActionResult>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<ActionResult>;
  addRecentService: (service: Service) => void;
  loadUserData: () => Promise<void>;
  clearUserData: () => Promise<void>;
}

export type UserStore = UserState & UserActions;

// ============================================================================
// Notification Store Types
// ============================================================================

export interface Notification {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'booking' | 'offer';
  timestamp: string;
  isRead: boolean;
  data?: any;
  imageUrl?: string;
  actionUrl?: string;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  fcmToken: string | null;
}

export interface NotificationActions {
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  setFCMToken: (token: string) => Promise<void>;
  loadNotifications: () => Promise<void>;
  fetchNotifications: () => Promise<ActionResult>;
  deleteNotification: (notificationId: string) => Promise<ActionResult>;
}

export type NotificationStore = NotificationState & NotificationActions;

// ============================================================================
// Common Types
// ============================================================================

export interface ActionResult {
  success: boolean;
  error?: string;
  data?: any;
}

// ============================================================================
// Store Selectors Types
// ============================================================================

export interface AuthSelectors {
  isAuthenticated: (state: AuthStore) => boolean;
  user: (state: AuthStore) => User | null;
  token: (state: AuthStore) => string | null;
  isLoading: (state: AuthStore) => boolean;
}

export interface BookingSelectors {
  cart: (state: BookingStore) => CartItem[];
  cartCount: (state: BookingStore) => number;
  cartTotal: (state: BookingStore) => number;
  selectedAddress: (state: BookingStore) => Address | null;
  bookingInProgress: (state: BookingStore) => boolean;
  totalAmount: (state: BookingStore) => number;
}

export interface UserSelectors {
  profile: (state: UserStore) => UserProfile | null;
  savedAddresses: (state: UserStore) => Address[];
  defaultAddress: (state: UserStore) => Address | undefined;
  preferences: (state: UserStore) => UserPreferences;
  recentServices: (state: UserStore) => Service[];
}

export interface NotificationSelectors {
  notifications: (state: NotificationStore) => Notification[];
  unreadCount: (state: NotificationStore) => number;
  fcmToken: (state: NotificationStore) => string | null;
  unreadNotifications: (state: NotificationStore) => Notification[];
}

// ============================================================================
// Combined Stores Hook Type
// ============================================================================

export interface AllStores {
  auth: AuthStore;
  booking: BookingStore;
  user: UserStore;
  notification: NotificationStore;
}
