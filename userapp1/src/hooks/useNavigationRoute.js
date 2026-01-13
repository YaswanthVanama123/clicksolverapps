import {useEffect, useState, useCallback} from 'react';
import polyline from '@mapbox/polyline';
import {fetchOlaRoute} from '../api/navigationService';
import {decodeRoutePolyline, computeBoundingBox} from '../utils/mapUtils';

/**
 * useNavigationRoute Hook
 * Fetches route from Ola Maps and computes camera bounds
 * @param {object} locationDetails - {startPoint, endPoint}
 * @returns {object} Route data, camera bounds, and loading state
 */
const useNavigationRoute = locationDetails => {
  const [routeData, setRouteData] = useState(null);
  const [cameraBounds, setCameraBounds] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchRoute = useCallback(
    async (startPoint, endPoint) => {
      try {
        setLoading(true);
        const result = await fetchOlaRoute(startPoint, endPoint);

        if (result.success && result.data) {
          const decodedRoute = decodeRoutePolyline(result.data, polyline);

          if (
            decodedRoute &&
            decodedRoute.geometry &&
            decodedRoute.geometry.coordinates.length > 0
          ) {
            setRouteData(decodedRoute);

            // Compute bounding box
            const allCoordinates = [
              startPoint,
              endPoint,
              ...decodedRoute.geometry.coordinates,
            ];
            const bounds = computeBoundingBox(allCoordinates);
            setCameraBounds(bounds);
          }
        }
      } catch (error) {
        console.error('Error in useNavigationRoute:', error);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (locationDetails && locationDetails.startPoint && locationDetails.endPoint) {
      fetchRoute(locationDetails.startPoint, locationDetails.endPoint);
    }
  }, [locationDetails, fetchRoute]);

  return {
    routeData,
    cameraBounds,
    loading,
    refreshRoute: () =>
      locationDetails &&
      fetchRoute(locationDetails.startPoint, locationDetails.endPoint),
  };
};

export default useNavigationRoute;
