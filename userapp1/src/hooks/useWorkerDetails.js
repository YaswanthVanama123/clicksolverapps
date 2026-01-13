import {useEffect, useState, useCallback} from 'react';
import {fetchWorkerDetails} from '../api/navigationService';

/**
 * useWorkerDetails Hook
 * Fetches and manages worker details for navigation screen
 * @param {string} decodedId - Decoded notification ID
 * @param {object} navigation - React Navigation object
 * @returns {object} Worker details, loading state, and refresh function
 */
const useWorkerDetails = (decodedId, navigation) => {
  const [workerDetails, setWorkerDetails] = useState({});
  const [pin, setPin] = useState('');
  const [serviceArray, setServiceArray] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDetails = useCallback(async () => {
    if (!decodedId) return;

    try {
      setLoading(true);
      const result = await fetchWorkerDetails(decodedId);

      if (result.status === 404) {
        navigation.navigate('SkillRegistration');
        return;
      }

      if (result.success && result.data) {
        const {
          name,
          phoneNumber,
          pin: workerPin,
          profile,
          pincode,
          area,
          city,
          serviceBooked,
          rating,
          serviceCounts,
        } = result.data;

        setPin(workerPin);
        setWorkerDetails({
          name,
          phoneNumber,
          profile,
          pincode,
          area,
          city,
          service: serviceBooked,
          rating,
          serviceCounts,
        });
        setServiceArray(serviceBooked);
      }
    } catch (error) {
      console.error('Error in useWorkerDetails:', error);
    } finally {
      setLoading(false);
    }
  }, [decodedId, navigation]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return {
    workerDetails,
    pin,
    serviceArray,
    loading,
    refreshWorkerDetails: fetchDetails,
  };
};

export default useWorkerDetails;
