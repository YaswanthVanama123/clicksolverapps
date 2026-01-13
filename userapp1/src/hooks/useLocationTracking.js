import {useEffect, useState, useCallback} from 'react';
import {fetchLocationDetails} from '../api/navigationService';

/**
 * useLocationTracking Hook
 * Fetches location details and auto-refreshes every 60 seconds
 * @param {string} decodedId - Decoded notification ID
 * @param {number} refreshInterval - Refresh interval in ms (default: 60000)
 * @returns {object} Location details, loading state, and refresh function
 */
const useLocationTracking = (decodedId, refreshInterval = 60000) => {
  const [locationDetails, setLocationDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchLocation = useCallback(async () => {
    if (!decodedId) return;

    try {
      setLoading(true);
      const result = await fetchLocationDetails(decodedId);

      if (result.success && result.data) {
        setLocationDetails(result.data);
      }
    } catch (error) {
      console.error('Error in useLocationTracking:', error);
    } finally {
      setLoading(false);
    }
  }, [decodedId]);

  useEffect(() => {
    if (!decodedId) return;

    // Fetch immediately
    fetchLocation();

    // Set up interval for auto-refresh
    const intervalId = setInterval(fetchLocation, refreshInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [decodedId, fetchLocation, refreshInterval]);

  return {
    locationDetails,
    loading,
    refreshLocation: fetchLocation,
  };
};

export default useLocationTracking;
