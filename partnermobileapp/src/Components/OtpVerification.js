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
    if (encodedId) setDecodedId(atob(encodedId));
  }, [encodedId]);

  const handleChange = (text, index) => {
    if (/^\d?$/.test(text)) {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);
      if (text && index < otp.length - 1) inputRefs.current[index + 1].focus();
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
        `https://backend.clicksolver.com/api/worker/cancelled/status`,
        {
          params: {notification_id: decodedId},
        },
      );

      if (data.notificationStatus === 'usercanceled') {
        const pcs_token = await EncryptedStorage.getItem('pcs_token');
        await axios.post(
          `https://backend.clicksolver.com/api/worker/action`,
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
    if (decodedId) checkCancellationStatus();
  }, [decodedId]);

  useEffect(() => {
    inputRefs.current[0].focus();
  }, []);

  const handleSubmit = async () => {
    const enteredOtp = otp.join('');

    try {
      const jwtToken = await EncryptedStorage.getItem('pcs_token');
      const {data, status} = await axios.post(
        `https://backend.clicksolver.com/api/pin/verification`,
        {notification_id: decodedId, otp: enteredOtp},
        {headers: {Authorization: `Bearer ${jwtToken}`}},
      );

      if (status === 200) {
        const pcs_token = await EncryptedStorage.getItem('pcs_token');
        await EncryptedStorage.setItem('start_time', data.timeResult);

        await axios.post(
          `https://backend.clicksolver.com/api/worker/action`,
          {encodedId, screen: 'TimingScreen'},
          {headers: {Authorization: `Bearer ${pcs_token}`}},
        );

        Alert.alert('Success', 'OTP is correct');
        navigation.navigate('TimingScreen', {encodedId});
      } else if (status === 205) {
        Alert.alert('User Cancelled the service');
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: 'Tabs', state: {routes: [{name: 'Home'}]}}],
          }),
        );
      } else {
        setError('OTP is incorrect');
        Alert.alert('Error', 'OTP is incorrect');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setError('OTP is incorrect');
      Alert.alert('Error', 'OTP is incorrect');
    }
  };

  return (
    <View style={styles.container}>
      {/* Back arrow and title at the top */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome6 name="arrow-left-long" size={18} color="#1D2951" />
        </TouchableOpacity>
        <Text style={styles.title}>Pin Verification</Text>
      </View>

      {/* Centered OTP inputs and submit button */}
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

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
};

export default OTPVerification;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center the header content
  },
  title: {
    fontSize: 20,
    color: '#1D2951',
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1, // Ensures the text takes up available space and centers
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  otpInput: {
    width: 40,
    height: 40,
    textAlign: 'center',
    fontSize: 18,
    borderBottomWidth: 2,
    borderColor: '#1D2951', // Default color
    marginHorizontal: 5,
    color: '#212121',
  },
  error: {
    color: 'red',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#ff4500',
    flexDirection: 'row',
    width: 120,
    height: 43,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
});
