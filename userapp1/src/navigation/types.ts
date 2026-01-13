/**
 * Navigation Type Definitions
 * TypeScript types for React Navigation
 */

import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

/**
 * Root Stack Param List
 */
export type RootStackParamList = {
  // Auth & Onboarding
  Splash: undefined;
  LanguageSelector: undefined;
  OnboardingScreen: undefined;
  Login: undefined;
  SignUpScreen: undefined;
  VerificationScreen: { phoneNumber?: string };

  // Main Navigation
  Main: NavigatorScreenParams<MainTabParamList>;

  // Shared Screens (accessible from multiple stacks)
  ChatScreen: {
    workerId?: string;
    bookingId?: string;
    workerName?: string;
  };
  HelpScreen: undefined;
  AboutCS: undefined;
  LocationSearch: {
    onLocationSelected?: (location: any) => void;
  };
};

/**
 * Main Tab Param List (Bottom Tabs)
 */
export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  BookingsTab: NavigatorScreenParams<BookingStackParamList>;
  TrackingTab: undefined;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

/**
 * Home Stack Param List
 */
export type HomeStackParamList = {
  Home: { encodedId?: string };
  SearchItem: undefined;
  QuickSearch: undefined;
  ServiceBooking: {
    serviceId: string;
    serviceName: string
  };
  serviceCategory: {
    serviceObject: string;
    id: string
  };
  UserLocation: {
    serviceId?: string;
    serviceName?: string;
    area?: string;
    city?: string;
    pincode?: string;
  };
  userwaiting: {
    encodedId: string;
    area?: string;
    city?: string;
    pincode?: string;
    alternateName?: string;
    alternatePhoneNumber?: string;
    serviceBooked?: string;
    location?: any;
    offer?: any;
  };
  ServiceInProgress: {
    encodedId: string;
    area?: string;
    city?: string;
    pincode?: string;
  };
  ServiceCompletion: {
    encodedId?: string;
    bookingId?: string;
  };
  Paymentscreen: {
    encodedId: string;
    amount?: number;
    workerId?: string;
  };
  PaymentScreenRazor: {
    encodedId?: string;
    amount?: number;
    orderId?: string;
  };
  UserNavigation: {
    encodedId: string;
    workerLocation?: any;
  };
  Notifications: undefined;
};

/**
 * Booking Stack Param List
 */
export type BookingStackParamList = {
  RecentServices: undefined;
  OrderScreen: { bookingId?: string };
  ServiceBookingItem: {
    item: any;
    encodedId?: string;
  };
  ServiceBookingOngoingItem: {
    item: any;
    encodedId?: string;
  };
};

/**
 * Profile Stack Param List
 */
export type ProfileStackParamList = {
  ProfileScreen: undefined;
  EditProfile: undefined;
  AccountDelete: undefined;
  ReferralScreen: undefined;
  Myrefferals: undefined;
  LanguageSettings: undefined;
};

/**
 * Tracking Screen Params
 */
export type TrackingScreenParams = {
  ServiceTrackingListScreen: undefined;
  ServiceTrackingItem: {
    encodedId: string;
    item: any;
  };
};

/**
 * Screen Props Types
 */
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  BottomTabScreenProps<MainTabParamList, T>;

export type HomeStackScreenProps<T extends keyof HomeStackParamList> =
  NativeStackScreenProps<HomeStackParamList, T>;

export type BookingStackScreenProps<T extends keyof BookingStackParamList> =
  NativeStackScreenProps<BookingStackParamList, T>;

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> =
  NativeStackScreenProps<ProfileStackParamList, T>;

/**
 * Declare global navigation types for better TypeScript support
 */
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
