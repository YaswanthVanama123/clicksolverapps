import {useState, useEffect, useRef} from 'react';
import {CommonActions} from '@react-navigation/native';
import {cancelAndRetry} from '../api/bookingService';

/**
 * Custom hook for auto-retry logic in UserWaiting screen
 * Automatically retries booking after timeout if no worker accepts
 */
const useAutoRetry = ({
  decodedId,
  encodedData,
  offer,
  navigation,
  fetchData,
  maxAttempts = 3,
  retryInterval = 120000, // 2 minutes
}) => {
  const attemptCountRef = useRef(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleCancelAndRetry = async () => {
    setIsRetrying(true);
    try {
      attemptCountRef.current += 1;

      // If exceeded max attempts, cancel and go home
      if (attemptCountRef.current > maxAttempts) {
        await cancelAndRetry(decodedId, encodedData, offer);

        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: 'Tabs', state: {routes: [{name: 'Home'}]}}],
          }),
        );
        return;
      }

      // Cancel current request and retry
      await cancelAndRetry(decodedId, encodedData, offer);
      await fetchData();
    } catch (error) {
      console.error('Error in cancel and retry:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  // Set up auto-retry interval
  useEffect(() => {
    let intervalId;

    if (decodedId || encodedData) {
      intervalId = setInterval(handleCancelAndRetry, retryInterval);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [decodedId, encodedData]);

  return {
    isRetrying,
    attemptCount: attemptCountRef.current,
    handleCancelAndRetry,
  };
};

export default useAutoRetry;
