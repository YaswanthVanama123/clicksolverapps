/**
 * ErrorLogger - Centralized Error Logging
 *
 * Purpose:
 * - Log errors to console in development
 * - Ready for Firebase Crashlytics integration
 * - Capture error context and user information
 *
 * Usage:
 * - Import and use ErrorLogger.logError(error, context)
 */

import {Platform} from 'react-native';
// import crashlytics from '@react-native-firebase/crashlytics';
// Uncomment above when Firebase Crashlytics is set up

/**
 * Log error to console and crash reporting services
 * @param {Error} error - The error object
 * @param {string} context - Where the error occurred (e.g., 'ErrorBoundary', 'API Call')
 * @param {Object} additionalInfo - Any additional context
 */
export const logError = (error, context = 'Unknown', additionalInfo = {}) => {
  const isDev = __DEV__;

  // Always log to console in development
  if (isDev) {
    console.error(`[${context}] Error caught:`, error);
    if (Object.keys(additionalInfo).length > 0) {
      console.error('Additional Info:', additionalInfo);
    }
  }

  // Log to Firebase Crashlytics in production
  // Uncomment when Firebase Crashlytics is configured
  /*
  if (!isDev) {
    try {
      crashlytics().log(`Error in ${context}`);

      // Set custom attributes
      crashlytics().setAttribute('context', context);
      crashlytics().setAttribute('platform', Platform.OS);
      crashlytics().setAttribute('platform_version', Platform.Version.toString());

      // Add additional info as attributes
      Object.keys(additionalInfo).forEach(key => {
        const value = additionalInfo[key];
        if (typeof value === 'string' || typeof value === 'number') {
          crashlytics().setAttribute(key, value.toString());
        }
      });

      // Record the error
      crashlytics().recordError(error);
    } catch (crashlyticsError) {
      console.error('Failed to log to Crashlytics:', crashlyticsError);
    }
  }
  */
};

/**
 * Log custom non-fatal error
 * @param {string} message - Error message
 * @param {Object} context - Additional context
 */
export const logNonFatalError = (message, context = {}) => {
  const error = new Error(message);
  logError(error, 'Non-Fatal Error', context);
};

/**
 * Set user identifier for error tracking
 * @param {string} userId - User ID
 * @param {Object} userInfo - Additional user information
 */
export const setUserContext = (userId, userInfo = {}) => {
  const isDev = __DEV__;

  if (isDev) {
    console.log(`[ErrorLogger] User context set:`, {userId, ...userInfo});
  }

  // Set user in Crashlytics
  // Uncomment when Firebase Crashlytics is configured
  /*
  if (!isDev) {
    try {
      crashlytics().setUserId(userId);

      // Set additional user attributes
      Object.keys(userInfo).forEach(key => {
        const value = userInfo[key];
        if (typeof value === 'string' || typeof value === 'number') {
          crashlytics().setAttribute(`user_${key}`, value.toString());
        }
      });
    } catch (error) {
      console.error('Failed to set user context in Crashlytics:', error);
    }
  }
  */
};

/**
 * Clear user context (on logout)
 */
export const clearUserContext = () => {
  const isDev = __DEV__;

  if (isDev) {
    console.log('[ErrorLogger] User context cleared');
  }

  // Clear user in Crashlytics
  // Uncomment when Firebase Crashlytics is configured
  /*
  if (!isDev) {
    try {
      crashlytics().setUserId('');
    } catch (error) {
      console.error('Failed to clear user context in Crashlytics:', error);
    }
  }
  */
};

/**
 * Log breadcrumb for debugging
 * @param {string} message - Breadcrumb message
 * @param {Object} data - Additional data
 */
export const logBreadcrumb = (message, data = {}) => {
  const isDev = __DEV__;

  if (isDev) {
    console.log(`[Breadcrumb] ${message}`, data);
  }

  // Log to Crashlytics
  // Uncomment when Firebase Crashlytics is configured
  /*
  if (!isDev) {
    try {
      const breadcrumb = `${message} ${JSON.stringify(data)}`;
      crashlytics().log(breadcrumb);
    } catch (error) {
      console.error('Failed to log breadcrumb:', error);
    }
  }
  */
};

export default {
  logError,
  logNonFatalError,
  setUserContext,
  clearUserContext,
  logBreadcrumb,
};
