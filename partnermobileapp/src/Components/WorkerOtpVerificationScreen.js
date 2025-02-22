import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import { useNavigation, CommonActions, useRoute } from '@react-navigation/native';
import Entypo from 'react-native-vector-icons/Entypo';

const BG_IMAGE_URL = 'https://i.postimg.cc/zB1C8frj/Picsart-24-10-01-15-26-57-512-1.jpg';

const WorkerOtpVerificationScreen = () => {
  const [timer, setTimer] = useState(120);
  const [code, setCode] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigation = useNavigation();
  const route = useRoute();
  const inputRefs = useRef([]);

  // Receive phoneNumber and verificationId from previous screen
  const { phoneNumber, verificationId } = route.params;

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(countdown);
  }, []);

  // Hide error after 5 seconds
  useEffect(() => {
    if (errorMessage) {
      const timerErr = setTimeout(() => setErrorMessage(''), 5000);
      return () => clearTimeout(timerErr);
    }
  }, [errorMessage]);

  const handleCodeChange = (index, value) => {
    let newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
  };

  const formattedTime = () => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  };

  // Verify OTP using backend endpoint
  const verifyOtp = async () => {
    const otpCode = code.join('');
    if (otpCode.length < 4) {
      setErrorMessage('Please enter the complete 4-digit OTP');
      return;
    }
    setLoading(true);
    try {
      // Call WorkerValidateOtp endpoint
      const validateResponse = await axios.get(
        `http://192.168.55.101:5000/api/worker/validateOtp`,
        {
          params: {
            mobileNumber: phoneNumber,
            verificationId,
            otpCode,
          },
        }
      );

      if (validateResponse.data.message === 'OTP Verified') {
        // OTP is valid; now call Partnerlogin to complete login
        const loginResponse = await axios.post(
          `http://192.168.55.102:5000/api/worker/login`,
          { phone_number: phoneNumber }
        );
        const { status, data } = loginResponse;
        if (status === 200) {
          const { token, workerId } = data;
          if (token && workerId) {
            await EncryptedStorage.setItem('pcs_token', token);
            await EncryptedStorage.setItem('partnerSteps', 'completed');
            await EncryptedStorage.setItem('unique', String(workerId));
            await EncryptedStorage.setItem('verification', 'true');
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }],
              })
            );
          }
        } else if (status === 201) {
          const { token, workerId, stepsCompleted } = data;
          if (workerId && token) {
            await EncryptedStorage.setItem('pcs_token', token);
            await EncryptedStorage.setItem('unique', String(workerId));
            if (stepsCompleted) {
              await EncryptedStorage.setItem('partnerSteps', 'completed');
              navigation.replace('ApprovalScreen');
            } else {
              navigation.replace('PartnerSteps');
            }
          }
        } else if (status === 202) {
          navigation.replace('AdministratorDashboard');
        } else {
          const { phone_number } = data;
          if (phone_number) {
            navigation.push('SignupDetails', { phone_number });
          }
        }
      } else {
        setErrorMessage('Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying OTP or during login:', error);
      setErrorMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1 }}>
        <Image source={{ uri: BG_IMAGE_URL }} style={StyleSheet.absoluteFillObject} resizeMode="stretch" />

        {errorMessage !== '' && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity onPress={() => setErrorMessage('')}>
              <Entypo name="cross" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.container}>
          <Text style={styles.title}>Verification Code</Text>
          <Text style={styles.instruction}>Please enter the 4-digit code sent to</Text>
          <Text style={styles.number}>{phoneNumber}</Text>

          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={styles.codeInput}
                keyboardType="numeric"
                maxLength={1}
                value={digit}
                onChangeText={(value) => {
                  handleCodeChange(index, value);
                  if (value !== '' && index < code.length - 1) {
                    inputRefs.current[index + 1].focus();
                  }
                }}
                onKeyPress={({ nativeEvent }) => {
                  // If backspace is pressed and the current input is empty, move to the previous input.
                  if (nativeEvent.key === 'Backspace' && code[index] === '' && index > 0) {
                    inputRefs.current[index - 1].focus();
                  }
                }}
              />
            ))}
          </View>

          <Text style={styles.timer}>{formattedTime()}</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#FF5720" style={{ marginVertical: 20 }} />
          ) : (
            <TouchableOpacity style={styles.submitButton} onPress={verifyOtp}>
              <Text style={styles.submitButtonText}>Verify OTP</Text>
            </TouchableOpacity>
          )}

          <View style={styles.contactContainer}>
            <Text style={styles.contactText}>Contact us:</Text>
            <View style={styles.socialIcons}>
              <Entypo name="mail" size={15} color="#9e9e9e" />
              <Entypo name="facebook" size={15} color="#9e9e9e" />
              <Entypo name="instagram" size={15} color="#9e9e9e" />
            </View>
            <Text style={styles.email}>Clicksolver@yahoo.com</Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#212121' },
  instruction: { fontSize: 16, textAlign: 'center', color: '#9e9e9e' },
  number: { fontSize: 16, textAlign: 'center', marginBottom: 30, color: '#212121', fontWeight: 'bold' },
  codeContainer: { flexDirection: 'row', justifyContent: 'center', width: '80%', marginBottom: 20, gap: 10 },
  codeInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 10, width: 45, height: 45, textAlign: 'center', fontSize: 18, color: '#212121' },
  timer: { fontSize: 18, fontWeight: '800', marginBottom: 20, color: '#212121' },
  submitButton: { backgroundColor: '#FF5722', justifyContent: 'center', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 10, marginBottom: 40, width: 150 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  contactContainer: { alignItems: 'center' },
  contactText: { fontSize: 16, marginBottom: 10 },
  socialIcons: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginBottom: 10 },
  email: { fontSize: 12, color: '#9e9e9e', paddingBottom: 30 },
  errorContainer: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1000,
  },
  errorText: { color: '#fff', fontSize: 14, flex: 1 },
});

export default WorkerOtpVerificationScreen;
