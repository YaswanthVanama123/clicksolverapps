import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  ActivityIndicator
} from 'react-native';
import axios from 'axios';
import { useNavigation, CommonActions, useFocusEffect } from '@react-navigation/native';
import Entypo from 'react-native-vector-icons/Entypo';

const BG_IMAGE_URL = 'https://i.postimg.cc/rFFQLGRh/Picsart-24-10-01-15-38-43-205.jpg';
const LOGO_URL = 'https://i.postimg.cc/hjjpy2SW/Button-1.png';
const FLAG_ICON_URL = 'https://i.postimg.cc/C1hkm5sR/india-flag-icon-29.png';

const WorkerLoginScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Reset to home if back is pressed
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }],
          })
        );
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation])
  );

  // Automatically hide error message after 5 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Call backend to send OTP to worker's phone number
  const sendOtp = async () => {
    if (!phoneNumber) return;
    setLoading(true);
    try {
      const response = await axios.post(
        `http://192.168.55.101:5000/api/worker/sendOtp`,
        { mobileNumber: phoneNumber }
      );
      if (response.status === 200) {
        const { verificationId } = response.data;
        // Navigate to the OTP verification screen, passing phone number and verificationId
        navigation.navigate('WorkerOtpVerificationScreen', { phoneNumber, verificationId });
      } else {
        setErrorMessage('Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setErrorMessage('Error sending OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Image source={{ uri: BG_IMAGE_URL }} style={StyleSheet.absoluteFillObject} resizeMode="stretch" />

      {errorMessage !== '' && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity onPress={() => setErrorMessage('')}>
            <Entypo name="cross" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.contentOverlay}>
          <View style={styles.description}>
            <View style={styles.logoContainer}>
              <Image source={{ uri: LOGO_URL }} style={styles.logo} />
              <Text style={styles.heading}>
                Click <Text style={styles.solverText}>Solver</Text>
              </Text>
            </View>
            <Text style={styles.subheading}>ALL HOME Service Expert</Text>
            <Text style={styles.tagline}>Instant Affordable Trusted</Text>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.countryCodeContainer}>
              <Image source={{ uri: FLAG_ICON_URL }} style={styles.flagIcon} />
              <Text style={styles.picker}>+91</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter Mobile Number"
              placeholderTextColor="#9e9e9e"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={sendOtp} disabled={loading}>
            <Text style={styles.buttonText}>Send OTP</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#FF5720" />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoidingView: { flex: 1 },
  solverText: { color: '#212121', fontWeight: 'bold' },
  description: { flexDirection: 'column', marginLeft: 10 },
  contentOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  logo: { width: 60, height: 60, marginBottom: 10 },
  heading: { fontSize: 26, lineHeight: 26, fontWeight: 'bold', color: '#212121', width: 100 },
  subheading: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  tagline: { fontSize: 14, color: '#666', textAlign: 'center', paddingBottom: 70 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 20,
    width: '100%',
    height: 56,
    elevation: 5,
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: '#ccc',
    paddingRight: 10,
    width: 80,
  },
  flagIcon: { width: 24, height: 24 },
  picker: { fontSize: 17, color: '#212121', padding: 10, fontWeight: 'bold' },
  input: { flex: 1, height: 56, paddingLeft: 10, color: '#212121', fontSize: 16, fontWeight: 'bold' },
  button: {
    backgroundColor: '#FF5722',
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
    elevation: 5,
    marginTop: 25,
  },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)', // semi-transparent background (optional)
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
});

export default WorkerLoginScreen;
