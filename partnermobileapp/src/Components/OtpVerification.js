import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {useNavigation, CommonActions} from '@react-navigation/native';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

const OTPVerification = ({route}) => {
  const [otp, setOtp] = useState(Array(4).fill(''));
  const inputRefs = useRef([]);
  const {encodedId} = route.params;
  const navigation = useNavigation();
  const [decodedId, setDecodedId] = useState(null);
  const [error, setError] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1); // To track the focused input

  useEffect(() => {
    if (encodedId) {
      setDecodedId(atob(encodedId));
    }
  }, [encodedId]);

  const handleChange = (text, index) => {
    if (/^\d?$/.test(text)) {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);
      if (text && index < otp.length - 1) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const checkCancellationStatus = async () => {
    try {
      const {data} = await axios.get(
        `http://192.168.55.102:5000/api/worker/cancelled/status`,
        {
          params: {notification_id: decodedId},
        },
      );

      if (data.notificationStatus === 'usercanceled') {
        const pcs_token = await EncryptedStorage.getItem('pcs_token');
        await axios.post(
          `http://192.168.55.102:5000/api/worker/action`,
          {encodedId: '', screen: ''},
          {headers: {Authorization: `Bearer ${pcs_token}`}},
        );

        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: 'Tabs', state: {routes: [{name: 'Home'}]}}],
          }),
        );
      }
    } catch (error) {
      console.error('Error checking cancellation status:', error);
    }
  };

  useEffect(() => {
    if (decodedId) {
      checkCancellationStatus();
    }
  }, [decodedId]);

  useEffect(() => {
    // Focus on the first input once the screen loads
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleSubmit = async () => {
    const enteredOtp = otp.join('');

    try {
      const jwtToken = await EncryptedStorage.getItem('pcs_token');
      const {data, status} = await axios.post(
        `http://192.168.55.102:5000/api/pin/verification`,
        {notification_id: decodedId, otp: enteredOtp},
        {headers: {Authorization: `Bearer ${jwtToken}`}},
      );

      if (status === 200) {
        const pcs_token = await EncryptedStorage.getItem('pcs_token');
        await EncryptedStorage.setItem('start_time', data.timeResult);

        await axios.post(
          `http://192.168.55.102:5000/api/worker/action`,
          {encodedId, screen: 'worktimescreen'},
          {headers: {Authorization: `Bearer ${pcs_token}`}},
        );

        // Alert.alert('Success', 'OTP is correct');
        await EncryptedStorage.removeItem('workerInAction');
        navigation.navigate('worktimescreen', {encodedId});
      } else if (status === 205) {
        // Alert.alert('User Cancelled the service');
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: 'Tabs', state: {routes: [{name: 'Home'}]}}],
          }),
        );
      } else {
        setError('OTP is incorrect');
        // Alert.alert('Error', 'OTP is incorrect');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setError('OTP is incorrect');
      // Alert.alert('Error', 'OTP is incorrect');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header at the top */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome6 name="arrow-left-long" size={20} color="#1D2951" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pin Verification</Text>
      </View>

      {/* Centered content */}
      <View style={styles.content}>
        {/* Screen explanation text */}
        {/* <Text style={styles.screenDescription}>
          This screen is for pin verification for the worker. The user has sent a pin, which is displayed on the navigation screen.
        </Text> */}

        {/* Updated text explaining where the pin is displayed */}
        <Text style={styles.sentText}>
          Your pin is displayed on user navigation screen.
        </Text>

        {/* OTP inputs */}
        <View style={styles.otpContainer}>
          {otp.map((value, index) => (
            <TextInput
              key={index}
              style={[
                styles.otpInput,
                focusedIndex === index && {borderColor: '#ff4500'},
              ]}
              value={value}
              onChangeText={text => handleChange(text, index)}
              onKeyPress={e => handleKeyDown(e, index)}
              maxLength={1}
              keyboardType="numeric"
              ref={el => (inputRefs.current[index] = el)}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(-1)}
            />
          ))}
        </View>

        {/* Optional error message */}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Resend timer text */}
        <Text style={styles.resendText}>Resend code in 53 s</Text>

        {/* Verify button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Verify</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OTPVerification;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    width: '100%', // full width for header
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    color: '#1D2951',
    textAlign: 'center',
    fontWeight: 'bold',
    marginRight: 20, // keeps title centered despite back arrow
  },
  content: {
    flex: 1,
    justifyContent: 'center', // centers vertically
    alignItems: 'center', // centers horizontally
    paddingHorizontal: 16,
  },
  screenDescription: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sentText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center', // center horizontally
    marginBottom: 10,
  },
  otpInput: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#1D2951',
    textAlign: 'center',
    fontSize: 20,
    color: '#000',
    marginHorizontal: 5, // space between boxes
  },
  error: {
    marginTop: 10,
    color: 'red',
    textAlign: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginVertical: 20,
  },
  submitButton: {
    backgroundColor: '#ff4500',
    borderRadius: 8,
    paddingVertical: 14,
    width: '60%',
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
