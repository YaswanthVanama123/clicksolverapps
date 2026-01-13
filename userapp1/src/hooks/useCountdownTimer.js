import {useState, useEffect} from 'react';
import EncryptedStorage from 'react-native-encrypted-storage';

/**
 * Custom hook for countdown timer
 * Manages a countdown from initial time (default 10 minutes)
 */
const useCountdownTimer = (service, initialTime = 600) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedTime = await EncryptedStorage.getItem(
          `estimatedTime${service}`,
        );

        if (!storedTime) {
          // First time - store current time
          const currentTime = Date.now();
          await EncryptedStorage.setItem(
            `estimatedTime${service}`,
            currentTime.toString(),
          );
          setTimeLeft(initialTime);
        } else {
          // Calculate remaining time based on stored time
          const savedTime = parseInt(storedTime, 10);
          const currentTime = Date.now();
          const timeDifference = Math.floor((currentTime - savedTime) / 1000);
          const remainingTime = initialTime - timeDifference;
          setTimeLeft(remainingTime > 0 ? remainingTime : 0);
        }
      } catch (error) {
        console.error('Error loading timer data from EncryptedStorage:', error);
      }
    };

    loadData();

    // Countdown interval
    const interval = setInterval(() => {
      setTimeLeft(prevTime => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [service, initialTime]);

  /**
   * Format seconds to MM:SS
   */
  const formatTime = seconds => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(
      remainingSeconds,
    ).padStart(2, '0')}`;
  };

  return {
    timeLeft,
    formattedTime: formatTime(timeLeft),
  };
};

export default useCountdownTimer;
