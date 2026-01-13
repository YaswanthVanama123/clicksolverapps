import {useState, useCallback, useEffect} from 'react';
import Geolocation from 'react-native-geolocation-service';
import {useTranslation} from 'react-i18next';
import useLocationPermissions from './useLocationPermissions';
import useReverseGeocode from './useReverseGeocode';

/**
 * Custom hook to manage user location state
 * @param {Object} suggestion - Optional suggestion object with latitude/longitude
 * @returns {Object} - Location utilities and state
 */
const useUserLocation = (suggestion = null) => {
  const {t} = useTranslation();
  const {hasPermission} = useLocationPermissions();
  const {reverseGeocode} = useReverseGeocode();

  const [location, setLocation] = useState(null); // [longitude, latitude]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Get current position from device
   */
  const getCurrentLocation = useCallback(() => {
    if (!hasPermission) {
      setLoading(false);
      return;
    }

    Geolocation.getCurrentPosition(
      async position => {
        const {latitude, longitude} = suggestion || position.coords;
        const newLocation = [longitude, latitude];
        setLocation(newLocation);

        // Fetch address details
        await reverseGeocode(latitude, longitude);
        setLoading(false);
      },
      err => {
        console.error(t('geolocation_error') || 'Geolocation error:', err);
        setError(err.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      },
    );
  }, [hasPermission, suggestion, reverseGeocode, t]);

  /**
   * Update location manually (e.g., from map press)
   */
  const updateLocation = useCallback(
    async (longitude, latitude) => {
      const newLocation = [longitude, latitude];
      setLocation(newLocation);
      await reverseGeocode(latitude, longitude);
    },
    [reverseGeocode],
  );

  /**
   * Refresh current location
   */
  const refreshLocation = useCallback(() => {
    setLoading(true);
    setError(null);
    getCurrentLocation();
  }, [getCurrentLocation]);

  // Get location on mount
  useEffect(() => {
    if (hasPermission) {
      getCurrentLocation();
    }
  }, [hasPermission]);

  return {
    location,
    loading,
    error,
    getCurrentLocation,
    updateLocation,
    refreshLocation,
  };
};

export default useUserLocation;
