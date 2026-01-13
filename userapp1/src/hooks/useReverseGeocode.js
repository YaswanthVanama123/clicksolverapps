import {useState, useCallback} from 'react';
import {Places} from 'ola-maps';
import {useTranslation} from 'react-i18next';

const placesClient = new Places('iN1RT7PQ41Z0DVxin6jlf7xZbmbIZPtb9CyNwtlT');

/**
 * Custom hook for reverse geocoding using Ola Maps
 * @returns {Object} - Geocoding utilities and state
 */
const useReverseGeocode = () => {
  const {t} = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addressData, setAddressData] = useState({
    city: '',
    area: '',
    pincode: '',
  });

  /**
   * Fetch address details from coordinates
   * @param {number} latitude
   * @param {number} longitude
   * @returns {Object} - { city, area, pincode }
   */
  const reverseGeocode = useCallback(
    async (latitude, longitude) => {
      try {
        setLoading(true);
        setError(null);

        const response = await placesClient.reverse_geocode(
          latitude,
          longitude,
        );

        if (response && response.body && response.body.results.length > 0) {
          const place = response.body.results[0];
          const addressComponents = place.address_components;

          // Extract pincode
          const pincode =
            addressComponents.find(component =>
              component.types.includes('postal_code'),
            )?.long_name || '';

          // Extract city (try multiple fallbacks)
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

          // Extract area (formatted address)
          const area = place.formatted_address || '';

          const result = {city, area, pincode};
          setAddressData(result);
          setLoading(false);
          return result;
        } else {
          const errorMsg = t('no_address_found') || 'No address details found.';
          console.warn(errorMsg);
          setError(errorMsg);
          setLoading(false);
          return {city: '', area: '', pincode: ''};
        }
      } catch (err) {
        const errorMsg =
          t('failed_to_fetch_place_details') ||
          'Failed to fetch place details:';
        console.error(errorMsg, err);
        setError(errorMsg);
        setLoading(false);
        return {city: '', area: '', pincode: ''};
      }
    },
    [t],
  );

  /**
   * Clear address data
   */
  const clearAddressData = useCallback(() => {
    setAddressData({city: '', area: '', pincode: ''});
    setError(null);
  }, []);

  return {
    reverseGeocode,
    loading,
    error,
    addressData,
    clearAddressData,
  };
};

export default useReverseGeocode;
