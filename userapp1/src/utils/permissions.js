/**
 * Permissions utility functions
 * Handles Android and iOS app permissions
 */

import { Platform, Linking, Alert, PermissionsAndroid } from 'react-native';
import {
  request,
  check,
  openSettings,
  PERMISSIONS,
  RESULTS,
} from 'react-native-permissions';

/**
 * Requests location permission
 * Handles both Android and iOS with appropriate dialogs
 * @returns {Promise<boolean>} True if permission granted
 */
export const requestLocationPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      return await requestAndroidLocationPermission();
    } else {
      return await requestIOSLocationPermission();
    }
  } catch (error) {
    console.warn('Error requesting location permission:', error);
    return false;
  }
};

/**
 * Requests location permission on Android
 * @private
 * @returns {Promise<boolean>} True if permission granted
 */
const requestAndroidLocationPermission = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'This app needs access to your location to provide services',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    console.warn('Android location permission error:', error);
    return false;
  }
};

/**
 * Requests location permission on iOS
 * @private
 * @returns {Promise<boolean>} True if permission granted
 */
const requestIOSLocationPermission = async () => {
  try {
    const status = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);

    if (status === RESULTS.DENIED) {
      const result = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      return result === RESULTS.GRANTED;
    }

    return status === RESULTS.GRANTED;
  } catch (error) {
    console.warn('iOS location permission error:', error);
    return false;
  }
};

/**
 * Requests camera permission
 * @returns {Promise<boolean>} True if permission granted
 */
export const requestCameraPermission = async () => {
  try {
    const permission = Platform.OS === 'ios'
      ? PERMISSIONS.IOS.CAMERA
      : PERMISSIONS.ANDROID.CAMERA;

    const status = await check(permission);

    if (status === RESULTS.DENIED) {
      const result = await request(permission);
      return result === RESULTS.GRANTED;
    }

    if (status === RESULTS.BLOCKED) {
      showPermissionBlockedAlert('Camera');
      return false;
    }

    return status === RESULTS.GRANTED;
  } catch (error) {
    console.warn('Error requesting camera permission:', error);
    return false;
  }
};

/**
 * Requests notification permission
 * @returns {Promise<boolean>} True if permission granted
 */
export const requestNotificationPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      return await requestAndroidNotificationPermission();
    } else {
      return await requestIOSNotificationPermission();
    }
  } catch (error) {
    console.warn('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Requests notification permission on Android
 * @private
 * @returns {Promise<boolean>} True if permission granted
 */
const requestAndroidNotificationPermission = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      {
        title: 'Notification Permission',
        message: 'This app needs permission to send you notifications',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    console.warn('Android notification permission error:', error);
    return false;
  }
};

/**
 * Requests notification permission on iOS
 * @private
 * @returns {Promise<boolean>} True if permission granted
 */
const requestIOSNotificationPermission = async () => {
  try {
    const status = await check(PERMISSIONS.IOS.NOTIFICATION_CENTER);

    if (status === RESULTS.DENIED) {
      const result = await request(PERMISSIONS.IOS.NOTIFICATION_CENTER);
      return result === RESULTS.GRANTED;
    }

    return status === RESULTS.GRANTED;
  } catch (error) {
    console.warn('iOS notification permission error:', error);
    return false;
  }
};

/**
 * Checks status of a specific permission
 * @param {string} permission - Permission constant from PERMISSIONS
 * @returns {Promise<string>} Permission status (GRANTED, DENIED, BLOCKED, etc.)
 */
export const checkPermissionStatus = async (permission) => {
  try {
    const status = await check(permission);
    return status;
  } catch (error) {
    console.warn('Error checking permission status:', error);
    return RESULTS.UNAVAILABLE;
  }
};

/**
 * Checks if location permission is granted
 * @returns {Promise<boolean>} True if permission is granted
 */
export const isLocationPermissionGranted = async () => {
  try {
    const permission = Platform.OS === 'ios'
      ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
      : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

    const status = await checkPermissionStatus(permission);
    return status === RESULTS.GRANTED;
  } catch (error) {
    console.warn('Error checking location permission:', error);
    return false;
  }
};

/**
 * Checks if camera permission is granted
 * @returns {Promise<boolean>} True if permission is granted
 */
export const isCameraPermissionGranted = async () => {
  try {
    const permission = Platform.OS === 'ios'
      ? PERMISSIONS.IOS.CAMERA
      : PERMISSIONS.ANDROID.CAMERA;

    const status = await checkPermissionStatus(permission);
    return status === RESULTS.GRANTED;
  } catch (error) {
    console.warn('Error checking camera permission:', error);
    return false;
  }
};

/**
 * Checks if notification permission is granted
 * @returns {Promise<boolean>} True if permission is granted
 */
export const isNotificationPermissionGranted = async () => {
  try {
    const permission = Platform.OS === 'ios'
      ? PERMISSIONS.IOS.NOTIFICATION_CENTER
      : PERMISSIONS.ANDROID.POST_NOTIFICATIONS;

    const status = await checkPermissionStatus(permission);
    return status === RESULTS.GRANTED;
  } catch (error) {
    console.warn('Error checking notification permission:', error);
    return false;
  }
};

/**
 * Opens app settings to allow user to manually grant permissions
 * @returns {Promise<void>}
 */
export const openAppSettings = async () => {
  try {
    await openSettings();
  } catch (error) {
    console.warn('Error opening app settings:', error);
    // Fallback for iOS
    if (Platform.OS === 'ios') {
      try {
        Linking.openURL('app-settings:');
      } catch (linkError) {
        console.warn('Error opening app settings via Linking:', linkError);
      }
    }
  }
};

/**
 * Shows alert for blocked permissions
 * @private
 * @param {string} permissionName - Name of the blocked permission
 * @returns {void}
 */
const showPermissionBlockedAlert = (permissionName) => {
  Alert.alert(
    `${permissionName} Permission Blocked`,
    `You have permanently denied ${permissionName} permission. Please enable it in app settings.`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Open Settings',
        onPress: () => openAppSettings(),
      },
    ],
  );
};

/**
 * Requests multiple permissions at once
 * @param {Array<string>} permissions - Array of permission constants
 * @returns {Promise<object>} Object with permission statuses
 */
export const requestMultiplePermissions = async (permissions) => {
  try {
    const results = {};

    for (const permission of permissions) {
      const status = await check(permission);

      if (status === RESULTS.DENIED) {
        const result = await request(permission);
        results[permission] = result;
      } else {
        results[permission] = status;
      }
    }

    return results;
  } catch (error) {
    console.warn('Error requesting multiple permissions:', error);
    return {};
  }
};

/**
 * Checks if all required permissions are granted
 * @param {Array<string>} permissions - Array of permission constants to check
 * @returns {Promise<boolean>} True if all permissions are granted
 */
export const areAllPermissionsGranted = async (permissions) => {
  try {
    for (const permission of permissions) {
      const status = await checkPermissionStatus(permission);
      if (status !== RESULTS.GRANTED) {
        return false;
      }
    }
    return true;
  } catch (error) {
    console.warn('Error checking all permissions:', error);
    return false;
  }
};

export default {
  requestLocationPermission,
  requestCameraPermission,
  requestNotificationPermission,
  checkPermissionStatus,
  isLocationPermissionGranted,
  isCameraPermissionGranted,
  isNotificationPermissionGranted,
  openAppSettings,
  requestMultiplePermissions,
  areAllPermissionsGranted,
};
