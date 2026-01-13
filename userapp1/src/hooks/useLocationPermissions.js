import {useEffect, useState} from 'react';
import {Platform, PermissionsAndroid, Alert, Linking} from 'react-native';
import {
  request,
  check,
  openSettings,
  PERMISSIONS,
  RESULTS,
} from 'react-native-permissions';
import {useTranslation} from 'react-i18next';

/**
 * Custom hook to handle location permissions for both iOS and Android
 * @returns {Object} { hasPermission, requestPermission, permissionLoading }
 */
const useLocationPermissions = () => {
  const {t} = useTranslation();
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(true);

  const requestPermission = async () => {
    try {
      setPermissionLoading(true);
      let status;

      if (Platform.OS === 'android') {
        // Android permission handling
        const alreadyGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );

        if (alreadyGranted) {
          status = RESULTS.GRANTED;
        } else {
          status = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: t('location_permission_title') || 'Location Permission',
              message:
                t('location_permission_message') ||
                'This app needs access to your location',
              buttonNeutral: t('ask_me_later') || 'Ask Me Later',
              buttonNegative: t('cancel') || 'Cancel',
              buttonPositive: t('ok') || 'OK',
            },
          );
        }
      } else {
        // iOS permission handling
        status = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);

        if (status === RESULTS.DENIED) {
          status = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        }
      }

      // Handle blocked/permanently denied permissions
      if (status === RESULTS.BLOCKED) {
        Alert.alert(
          t('location_permission_blocked_title') || 'Location Disabled',
          t('location_permission_blocked_message') ||
            'Please enable location access in Settings to use this feature.',
          [
            {text: t('cancel') || 'Cancel', style: 'cancel'},
            {
              text: t('open_settings') || 'Open Settings',
              onPress: () => {
                openSettings().catch(() => {
                  Linking.openURL('app-settings:');
                });
              },
            },
          ],
        );
        setHasPermission(false);
        setPermissionLoading(false);
        return false;
      }

      const granted = status === RESULTS.GRANTED;
      setHasPermission(granted);
      setPermissionLoading(false);
      return granted;
    } catch (err) {
      console.warn('Error requesting location permission:', err);
      setHasPermission(false);
      setPermissionLoading(false);
      return false;
    }
  };

  // Request permission on mount
  useEffect(() => {
    requestPermission();
  }, []);

  return {
    hasPermission,
    requestPermission,
    permissionLoading,
  };
};

export default useLocationPermissions;
