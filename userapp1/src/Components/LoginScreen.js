import React, { useState, useCallback } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

// Image URLs
const BG_IMAGE_URL =
  'https://i.postimg.cc/rFFQLGRh/Picsart-24-10-01-15-38-43-205.jpg';
const LOGO_URL = 'https://i.postimg.cc/hjjpy2SW/Button-1.png';
const FLAG_ICON_URL = 'https://i.postimg.cc/C1hkm5sR/india-flag-icon-29.png';

const LoginScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  // This function requests the OTP
  const requestOtp = useCallback(async () => {
    if (!phoneNumber) return;
    try {
      setLoading(true);
      // Call your backend sendOtp endpoint
      const response = await axios.post(
        'http://192.168.55.103:5000/api/otp/send',
        { mobileNumber: phoneNumber }
      );
      if (response.status === 200) {
        const { verificationId } = response.data;
        // Navigate to VerificationScreen, passing phoneNumber & verificationId
        navigation.navigate('VerificationScreen', { phoneNumber, verificationId });
      } else {
        console.error('Error sending OTP:', response.data);
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
    } finally {
      setLoading(false);
    }
  }, [phoneNumber, navigation]);

  const handleBackPress = useCallback(() => {
    navigation.goBack();
    return true;
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      BackHandler.addEventListener('hardwareBackPress', handleBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    }, [handleBackPress])
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Image */}
      <Image
        source={{ uri: BG_IMAGE_URL }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="stretch"
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.contentOverlay}>
          {/* Logo and Heading */}
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

          {/* Mobile Input */}
          <View style={styles.inputContainer}>
            <View style={styles.countryCodeContainer}>
              <Image source={{ uri: FLAG_ICON_URL }} style={styles.flagIcon} />
              <Text style={styles.picker}>+91</Text>
            </View>
            <TextInput
              style={[styles.input, { fontFamily: 'RobotoSlab-Medium' }]}
              placeholder="Enter Mobile Number"
              placeholderTextColor="#9e9e9e"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>

          {/* Request OTP Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={requestOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Get Verification Code</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
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
  heading: {
    fontSize: 26,
    lineHeight: 26,
    fontFamily: 'RobotoSlab-Bold',
    color: '#212121',
    width: 100,
  },
  subheading: { fontSize: 16, fontFamily: 'RobotoSlab-SemiBold', color: '#333' },
  tagline: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingBottom: 70,
    fontFamily: 'RobotoSlab-Regular',
  },
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
  picker: {
    fontSize: 17,
    color: '#212121',
    padding: 10,
    fontFamily: 'RobotoSlab-Medium',
  },
  input: {
    flex: 1,
    height: 56,
    paddingLeft: 10,
    color: '#212121',
    fontSize: 16,
    fontFamily:'RobotoSlab-Medium'
  },
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
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'RobotoSlab-SemiBold',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999, // Ensures the loader appears on top of everything
  },
});

export default LoginScreen;
 