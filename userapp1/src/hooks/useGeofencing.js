import {useState, useCallback} from 'react';
import {
  checkGeofenceStatus,
  polygonGeofences,
  getGeofenceFeatures,
} from '../utils/geofencing';

/**
 * Custom hook to handle geofencing logic
 * @returns {Object} - Geofencing utilities and state
 */
const useGeofencing = () => {
  const [isInServiceArea, setIsInServiceArea] = useState(true);
  const [currentZone, setCurrentZone] = useState(null);

  /**
   * Validate if a location is within service area
   * @param {Array} location - [longitude, latitude]
   * @returns {Object} - { isValid: boolean, zoneName: string|null }
   */
  const validateLocation = useCallback(location => {
    const {isInGeofence, zoneName} = checkGeofenceStatus(location);
    setIsInServiceArea(isInGeofence);
    setCurrentZone(zoneName);
    return {isValid: isInGeofence, zoneName};
  }, []);

  /**
   * Get geofence features for map rendering
   */
  const geofenceFeatures = getGeofenceFeatures();

  /**
   * Get all available zones
   */
  const availableZones = polygonGeofences;

  return {
    isInServiceArea,
    currentZone,
    validateLocation,
    geofenceFeatures,
    availableZones,
  };
};

export default useGeofencing;
