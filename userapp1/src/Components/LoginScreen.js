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
  useWindowDimensions,
} from 'react-native';
import axios from 'axios';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

// Example image URLs
const BG_IMAGE_URL = 'https://i.postimg.cc/rFFQLGRh/Picsart-24-10-01-15-38-43-205.jpg';
const LOGO_URL = 'https://i.postimg.cc/hjjpy2SW/Button-1.png';
const FLAG_ICON_URL = 'https://i.postimg.cc/C1hkm5sR/india-flag-icon-29.png';

const LoginScreen = () => {
  // Grab screen width & height for “media-query–like” logic
  const { width, height } = useWindowDimensions();
  const styles = dynamicStyles(width, height);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  // Request OTP
  const requestOtp = useCallback(async () => {
    if (!phoneNumber) return;
    try {
      setLoading(true);
      // Call your backend to send OTP
      const response = await axios.post(
        'https://backend.clicksolver.com/api/otp/send',
        { mobileNumber: phoneNumber }
      );
      if (response.status === 200) {
        const { verificationId } = response.data;
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

  // Handle hardware back press
  const handleBackPress = useCallback(() => {
    navigation.goBack();
    return true;
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      BackHandler.addEventListener('hardwareBackPress', handleBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    }, [handleBackPress])
  );

  return (
    <View style={styles.root}>
      {/* Full-bleed background image */}
      <Image
        source={{ uri: BG_IMAGE_URL }}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.contentOverlay}>
            {/* Logo & Heading */}
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
                style={styles.input}
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
    </View>
  );
};

// ------------------------------------------
// "Dynamic" styles with dimension-based logic
// ------------------------------------------
const dynamicStyles = (width, height) => {
  const isTablet = width >= 600;

  return StyleSheet.create({
    root: {
      flex: 1,
    },
    // This ensures the background fills the entire screen.
    backgroundImage: {
      ...StyleSheet.absoluteFillObject,
      zIndex: -1,
    },
    container: {
      flex: 1,
    },
    contentOverlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      // Increase side padding on bigger screens
      paddingHorizontal: isTablet ? 40 : 20,
    },
    solverText: {
      color: '#212121',
      fontWeight: 'bold',
    },
    description: {
      flexDirection: 'column',
      marginLeft: isTablet ? 20 : 10,
    },
    logoContainer: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'center',
      marginBottom: isTablet ? 15 : 10,
    },
    logo: {
      width: isTablet ? 80 : 60,
      height: isTablet ? 80 : 60,
      marginBottom: 10,
    },
    heading: {
      fontSize: isTablet ? 30 : 26,
      lineHeight: isTablet ? 32 : 26,
      fontFamily: 'RobotoSlab-Bold',
      color: '#212121',
      width: isTablet ? 120 : 100,
    },
    subheading: {
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'RobotoSlab-SemiBold',
      color: '#333',
    },
    tagline: {
      fontSize: isTablet ? 16 : 14,
      color: '#666',
      textAlign: 'center',
      paddingBottom: isTablet ? 80 : 70,
      fontFamily: 'RobotoSlab-Regular',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderRadius: 10,
      paddingHorizontal: isTablet ? 15 : 10,
      marginBottom: 20,
      width: '100%',
      height: isTablet ? 60 : 56,
      elevation: 5,
    },
    countryCodeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRightWidth: 1,
      borderColor: '#ccc',
      paddingRight: 10,
      width: isTablet ? 90 : 80,
    },
    flagIcon: {
      width: isTablet ? 28 : 24,
      height: isTablet ? 28 : 24,
    },
    picker: {
      fontSize: isTablet ? 19 : 17,
      color: '#212121',
      padding: 10,
      fontFamily: 'RobotoSlab-Medium',
    },
    input: {
      flex: 1,
      height: isTablet ? 60 : 56,
      paddingLeft: 10,
      color: '#212121',
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'RobotoSlab-Medium',
    },
    button: {
      backgroundColor: '#FF5722',
      paddingVertical: isTablet ? 18 : 15,
      paddingHorizontal: isTablet ? 60 : 50,
      borderRadius: 10,
      alignItems: 'center',
      width: '100%',
      elevation: 5,
      marginTop: isTablet ? 30 : 25,
    },
    buttonText: {
      color: '#ffffff',
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'RobotoSlab-SemiBold',
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999,
    },
  });
};

export default LoginScreen;
