import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { Places } from 'ola-maps';

const placesClient = new Places('iN1RT7PQ41Z0DVxin6jlf7xZbmbIZPtb9CyNwtlT');

/**
 * Custom hook for location services
 * Handles location permissions, getting current location, watching position, and geofence checks
 *
 * @returns {Object} Location state and methods
 * @property {Object|null} location - Current location {latitude, longitude, accuracy, etc.}
 * @property {boolean} loading - Loading state
 * @property {Error|null} error - Error object if operation failed
 * @property {string} permissionStatus - Permission status (granted, denied, blocked, etc.)
 * @property {Function} requestLocationPermission - Request location permission
 * @property {Function} getCurrentLocation - Get current location once
 * @property {Function} watchPosition - Start watching position changes
 * @property {Function} stopWatching - Stop watching position
 * @property {Function} checkGeofence - Check if location is within geofence polygon
 */
const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('unknown');

  const watchIdRef = useRef(null);
  const isMountedRef = useRef(true);

  /**
   * Request location permission
   * @returns {Promise<string>} Permission status
   */
  const requestLocationPermission = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let status;

      if (Platform.OS === 'android') {
        if (Platform.Version >= 23) {
          // Android 6.0+
          const permission = PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
          const result = await request(permission);
          status = result;
        } else {
          // Older Android versions
          status = RESULTS.GRANTED;
        }
      } else if (Platform.OS === 'ios') {
        const permission = PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
        const result = await request(permission);
        status = result;
      }

      setPermissionStatus(status);
      return status;
    } catch (err) {
      const errorMessage = `Failed to request location permission: ${err.message}`;
      console.error(errorMessage, err);
      setError({ message: errorMessage, originalError: err });
      return RESULTS.DENIED;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Check current location permission status
   * @returns {Promise<string>} Permission status
   */
  const checkLocationPermission = useCallback(async () => {
    try {
      let status;

      if (Platform.OS === 'android') {
        const permission = PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
        status = await check(permission);
      } else if (Platform.OS === 'ios') {
        const permission = PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
        status = await check(permission);
      }

      setPermissionStatus(status);
      return status;
    } catch (err) {
      console.error('Failed to check location permission:', err);
      return RESULTS.DENIED;
    }
  }, []);

  /**
   * Get current location once
   * @param {Object} options - Geolocation options
   * @returns {Promise<Object>} Location object
   */
  const getCurrentLocation = useCallback(async (options = {}) => {
    try {
      setLoading(true);
      setError(null);

      // Check permission first
      const status = await checkLocationPermission();
      if (status !== RESULTS.GRANTED) {
        throw new Error('Location permission not granted');
      }

      const defaultOptions = {
        accuracy: {
          android: 'high',
          ios: 'best',
        },
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
        distanceFilter: 0,
        forceRequestLocation: true,
        forceLocationManager: false,
        showLocationDialog: true,
        ...options,
      };

      return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (position) => {
            if (isMountedRef.current) {
              const locationData = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                altitude: position.coords.altitude,
                altitudeAccuracy: position.coords.altitudeAccuracy,
                heading: position.coords.heading,
                speed: position.coords.speed,
                timestamp: position.timestamp,
              };

              setLocation(locationData);
              setLoading(false);
              resolve(locationData);
            }
          },
          (err) => {
            if (isMountedRef.current) {
              const errorMessage = `Failed to get current location: ${err.message}`;
              console.error(errorMessage, err);
              const errorObject = { message: errorMessage, originalError: err };
              setError(errorObject);
              setLoading(false);
              reject(errorObject);
            }
          },
          defaultOptions
        );
      });
    } catch (err) {
      if (isMountedRef.current) {
        setError(err);
        setLoading(false);
      }
      throw err;
    }
  }, [checkLocationPermission]);

  /**
   * Watch position changes
   * @param {Function} onLocationChange - Callback for location updates
   * @param {Object} options - Geolocation options
   * @returns {number} Watch ID
   */
  const watchPosition = useCallback(
    async (onLocationChange, options = {}) => {
      try {
        setLoading(true);
        setError(null);

        // Check permission first
        const status = await checkLocationPermission();
        if (status !== RESULTS.GRANTED) {
          throw new Error('Location permission not granted');
        }

        // Stop existing watch if any
        if (watchIdRef.current !== null) {
          Geolocation.clearWatch(watchIdRef.current);
        }

        const defaultOptions = {
          accuracy: {
            android: 'high',
            ios: 'best',
          },
          enableHighAccuracy: true,
          distanceFilter: 10,
          interval: 5000,
          fastestInterval: 2000,
          forceRequestLocation: true,
          forceLocationManager: false,
          showLocationDialog: true,
          ...options,
        };

        const watchId = Geolocation.watchPosition(
          (position) => {
            if (isMountedRef.current) {
              const locationData = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                altitude: position.coords.altitude,
                altitudeAccuracy: position.coords.altitudeAccuracy,
                heading: position.coords.heading,
                speed: position.coords.speed,
                timestamp: position.timestamp,
              };

              setLocation(locationData);
              setLoading(false);

              if (onLocationChange && typeof onLocationChange === 'function') {
                onLocationChange(locationData);
              }
            }
          },
          (err) => {
            if (isMountedRef.current) {
              const errorMessage = `Failed to watch position: ${err.message}`;
              console.error(errorMessage, err);
              const errorObject = { message: errorMessage, originalError: err };
              setError(errorObject);
              setLoading(false);
            }
          },
          defaultOptions
        );

        watchIdRef.current = watchId;
        return watchId;
      } catch (err) {
        if (isMountedRef.current) {
          setError(err);
          setLoading(false);
        }
        throw err;
      }
    },
    [checkLocationPermission]
  );

  /**
   * Stop watching position
   */
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  /**
   * Check if a point is inside a polygon (geofence)
   * Uses ray-casting algorithm
   * @param {Object} point - Point to check {latitude, longitude}
   * @param {Array<Object>} polygon - Array of polygon vertices [{latitude, longitude}]
   * @returns {boolean} True if point is inside polygon
   */
  const checkGeofence = useCallback((point, polygon) => {
    if (!point || !polygon || polygon.length < 3) {
      return false;
    }

    const { latitude: x, longitude: y } = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].latitude;
      const yi = polygon[i].longitude;
      const xj = polygon[j].latitude;
      const yj = polygon[j].longitude;

      const intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

      if (intersect) {
        inside = !inside;
      }
    }

    return inside;
  }, []);

  /**
   * Check if current location is within geofence
   * @param {Array<Object>} polygon - Array of polygon vertices
   * @returns {boolean|null} True if inside, false if outside, null if no location
   */
  const isInGeofence = useCallback(
    (polygon) => {
      if (!location) {
        return null;
      }
      return checkGeofence(location, polygon);
    },
    [location, checkGeofence]
  );

  /**
   * Reverse geocode coordinates to address
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @returns {Promise<Object>} Address object
   */
  const reverseGeocode = useCallback(async (latitude, longitude) => {
    try {
      const response = await placesClient.reverse_geocode(latitude, longitude);

      if (response && response.body && response.body.results.length > 0) {
        const place = response.body.results[0];
        const addressComponents = place.address_components;

        const pincode =
          addressComponents.find(component =>
            component.types.includes('postal_code'),
          )?.long_name || '';

        let city =
          addressComponents.find(component =>
            component.types.includes('locality'),
          )?.long_name || '';

        if (!city) {
          city =
            addressComponents.find(component =>
              component.types.includes('administrative_area_level_3'),
            )?.long_name || '';
        }

        if (!city) {
          city =
            addressComponents.find(component =>
              component.types.includes('administrative_area_level_2'),
            )?.long_name || '';
        }

        const state =
          addressComponents.find(component =>
            component.types.includes('administrative_area_level_1'),
          )?.long_name || '';

        const country =
          addressComponents.find(component =>
            component.types.includes('country'),
          )?.long_name || '';

        const formattedAddress = place.formatted_address || '';

        return {
          formattedAddress,
          city,
          state,
          country,
          pincode,
          latitude,
          longitude,
        };
      }

      return null;
    } catch (err) {
      console.error('Error reverse geocoding:', err);
      throw new Error('Failed to fetch address details');
    }
  }, []);

  /**
   * Get current location with address details
   * @param {Object} options - Geolocation options
   * @returns {Promise<Object>} Location with address
   */
  const getCurrentLocationWithAddress = useCallback(async (options = {}) => {
    try {
      const coords = await getCurrentLocation(options);
      if (!coords) return null;

      const address = await reverseGeocode(coords.latitude, coords.longitude);
      return {
        ...coords,
        ...address,
      };
    } catch (err) {
      console.error('Error getting location with address:', err);
      throw err;
    }
  }, [getCurrentLocation, reverseGeocode]);

  // Check permission on mount
  useEffect(() => {
    checkLocationPermission();

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [checkLocationPermission]);

  return {
    location,
    loading,
    error,
    permissionStatus,
    requestLocationPermission,
    getCurrentLocation,
    watchPosition,
    stopWatching,
    checkGeofence,
    isInGeofence,
    reverseGeocode,
    getCurrentLocationWithAddress,
  };
};

export default useLocation;
