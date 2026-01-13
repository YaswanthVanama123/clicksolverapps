import {useEffect} from 'react';
import {CommonActions} from '@react-navigation/native';
import {checkVerificationStatus} from '../api/navigationService';

/**
 * useVerificationStatus Hook
 * Checks worker verification status and navigates when verified
 * @param {string} decodedId - Decoded notification ID
 * @param {string} encodedData - Encoded notification ID
 * @param {object} navigation - React Navigation object
 */
const useVerificationStatus = (decodedId, encodedData, navigation) => {
  useEffect(() => {
    if (!decodedId) return;

    const checkStatus = async () => {
      try {
        const result = await checkVerificationStatus(decodedId);

        if (result.success && result.isVerified) {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{name: 'worktimescreen', params: {encodedId: encodedData}}],
            }),
          );
        }
      } catch (error) {
        console.error('Error in useVerificationStatus:', error);
      }
    };

    checkStatus();
  }, [decodedId, encodedData, navigation]);
};

export default useVerificationStatus;
