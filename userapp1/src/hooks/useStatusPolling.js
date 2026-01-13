import {useState, useEffect, useCallback, useRef} from 'react';
import axios from 'axios';
import {Buffer} from 'buffer';
import {CommonActions} from '@react-navigation/native';

/**
 * Custom hook for polling booking status
 * Checks if worker has accepted the booking
 */
const useStatusPolling = ({
  decodedId,
  encodedData,
  service,
  offer,
  navigation,
  pollInterval = 110000, // 110 seconds
}) => {
  const [status, setStatus] = useState('waiting');
  const [loading, setLoading] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!decodedId) return;

    setLoading(true);
    try {
      const response = await axios.get(
        'https://backend.clicksolver.com/api/checking/status',
        {
          params: {user_notification_id: decodedId},
        },
      );

      if (response.status === 201) {
        // Worker accepted
        setStatus('accepted');

        const {notification_id} = response.data;
        if (typeof notification_id !== 'number') {
          throw new TypeError(
            'Unexpected type for notification_id in API response',
          );
        }

        const encodedNotificationId = Buffer.from(
          notification_id.toString(),
          'utf-8',
        ).toString('base64');

        // Navigate to navigation screen
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'UserNavigation',
                params: {
                  encodedId: encodedNotificationId,
                  service: service,
                  offer,
                },
              },
            ],
          }),
        );
      } else if (response.status === 200) {
        setStatus('waiting');
      }
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setLoading(false);
    }
  }, [decodedId, encodedData, service, offer, navigation]);

  // Poll status on interval
  useEffect(() => {
    if (!decodedId) return;

    // Initial check
    checkStatus();

    // Set up polling interval
    const intervalId = setInterval(checkStatus, pollInterval);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [decodedId, checkStatus, pollInterval]);

  return {
    status,
    loading,
    checkStatus,
  };
};

export default useStatusPolling;
