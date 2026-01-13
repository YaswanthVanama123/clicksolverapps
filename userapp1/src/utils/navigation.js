/**
 * Navigation utility functions
 * Helper functions for common navigation patterns and operations
 */

import { CommonActions } from '@react-navigation/native';
import { SCREEN_NAMES } from './constants';

/**
 * Resets navigation stack to a specific screen
 * Useful for navigating to screens and clearing history
 * @param {object} navigation - Navigation object
 * @param {string} screenName - Target screen name
 * @param {object} params - Route parameters (optional)
 * @returns {void}
 */
export const resetToScreen = (navigation, screenName, params = {}) => {
  try {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: screenName,
            params,
          },
        ],
      }),
    );
  } catch (error) {
    console.warn('Error resetting to screen:', error);
  }
};

/**
 * Resets navigation to a nested stack structure
 * Useful for navigating through tab-based navigation
 * @param {object} navigation - Navigation object
 * @param {string} tabName - Tab/stack name
 * @param {string} screenName - Screen within the tab
 * @param {object} params - Route parameters (optional)
 * @returns {void}
 */
export const resetToNestedScreen = (navigation, tabName, screenName, params = {}) => {
  try {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: tabName,
            state: {
              routes: [
                {
                  name: screenName,
                  params,
                },
              ],
            },
          },
        ],
      }),
    );
  } catch (error) {
    console.warn('Error resetting to nested screen:', error);
  }
};

/**
 * Navigates to booking location selection screen
 * @param {object} navigation - Navigation object
 * @param {object} service - Service details
 * @param {number} discount - Discount amount (optional)
 * @param {number} tipAmount - Tip amount (optional)
 * @returns {void}
 */
export const navigateToBooking = (navigation, service, discount = 0, tipAmount = 0) => {
  try {
    navigation.navigate(SCREEN_NAMES.LOCATION_SELECTION, {
      serviceName: service.name || service.serviceName,
      savings: discount,
      tipAmount,
      offer: service.offer || null,
    });
  } catch (error) {
    console.warn('Error navigating to booking:', error);
  }
};

/**
 * Navigates to service tracking screen
 * @param {object} navigation - Navigation object
 * @param {string} bookingId - Booking/Notification ID (base64 encoded)
 * @returns {void}
 */
export const navigateToTracking = (navigation, bookingId) => {
  try {
    navigation.navigate(SCREEN_NAMES.NAVIGATION, {
      encodedId: bookingId,
    });
  } catch (error) {
    console.warn('Error navigating to tracking:', error);
  }
};

/**
 * Navigates to payment screen
 * @param {object} navigation - Navigation object
 * @param {object} bookingDetails - Booking details with amount, id, etc.
 * @returns {void}
 */
export const navigateToPayment = (navigation, bookingDetails) => {
  try {
    navigation.navigate(SCREEN_NAMES.PAYMENT, bookingDetails);
  } catch (error) {
    console.warn('Error navigating to payment:', error);
  }
};

/**
 * Navigates to chat screen
 * @param {object} navigation - Navigation object
 * @param {object} chatParams - Chat parameters (requestId, senderType, etc.)
 * @returns {void}
 */
export const navigateToChat = (navigation, chatParams) => {
  try {
    navigation.navigate(SCREEN_NAMES.CHAT, chatParams);
  } catch (error) {
    console.warn('Error navigating to chat:', error);
  }
};

/**
 * Navigates to home tab
 * @param {object} navigation - Navigation object
 * @returns {void}
 */
export const navigateToHome = (navigation) => {
  try {
    resetToNestedScreen(navigation, SCREEN_NAMES.TABS, SCREEN_NAMES.HOME);
  } catch (error) {
    console.warn('Error navigating to home:', error);
  }
};

/**
 * Navigates to profile screen
 * @param {object} navigation - Navigation object
 * @returns {void}
 */
export const navigateToProfile = (navigation) => {
  try {
    navigation.navigate(SCREEN_NAMES.PROFILE);
  } catch (error) {
    console.warn('Error navigating to profile:', error);
  }
};

/**
 * Navigates to notifications screen
 * @param {object} navigation - Navigation object
 * @returns {void}
 */
export const navigateToNotifications = (navigation) => {
  try {
    navigation.navigate(SCREEN_NAMES.NOTIFICATIONS);
  } catch (error) {
    console.warn('Error navigating to notifications:', error);
  }
};

/**
 * Navigates to login screen and clears all navigation history
 * @param {object} navigation - Navigation object
 * @returns {void}
 */
export const navigateToLogin = (navigation) => {
  try {
    resetToScreen(navigation, SCREEN_NAMES.LOGIN);
  } catch (error) {
    console.warn('Error navigating to login:', error);
  }
};

/**
 * Navigates back if possible, otherwise navigates to home
 * @param {object} navigation - Navigation object
 * @returns {void}
 */
export const safeGoBack = (navigation) => {
  try {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigateToHome(navigation);
    }
  } catch (error) {
    console.warn('Error going back:', error);
  }
};

/**
 * Checks if a specific screen is currently in the navigation state
 * @param {object} navigation - Navigation object
 * @param {string} screenName - Screen name to check
 * @returns {boolean} True if screen is in navigation stack
 */
export const isScreenInStack = (navigation, screenName) => {
  try {
    return navigation.getState().routes.some(route => route.name === screenName);
  } catch (error) {
    console.warn('Error checking screen in stack:', error);
    return false;
  }
};

/**
 * Gets the current route name
 * @param {object} navigation - Navigation object
 * @returns {string|null} Current screen name or null
 */
export const getCurrentRouteName = (navigation) => {
  try {
    const state = navigation.getState();
    return state.routes[state.index]?.name || null;
  } catch (error) {
    console.warn('Error getting current route name:', error);
    return null;
  }
};

/**
 * Gets the previous route name
 * @param {object} navigation - Navigation object
 * @returns {string|null} Previous screen name or null
 */
export const getPreviousRouteName = (navigation) => {
  try {
    const state = navigation.getState();
    if (state.index > 0) {
      return state.routes[state.index - 1]?.name || null;
    }
    return null;
  } catch (error) {
    console.warn('Error getting previous route name:', error);
    return null;
  }
};

/**
 * Gets route parameters from navigation state
 * @param {object} navigation - Navigation object
 * @returns {object} Current route parameters
 */
export const getCurrentParams = (navigation) => {
  try {
    const state = navigation.getState();
    return state.routes[state.index]?.params || {};
  } catch (error) {
    console.warn('Error getting current params:', error);
    return {};
  }
};

export default {
  resetToScreen,
  resetToNestedScreen,
  navigateToBooking,
  navigateToTracking,
  navigateToPayment,
  navigateToChat,
  navigateToHome,
  navigateToProfile,
  navigateToNotifications,
  navigateToLogin,
  safeGoBack,
  isScreenInStack,
  getCurrentRouteName,
  getPreviousRouteName,
  getCurrentParams,
};
