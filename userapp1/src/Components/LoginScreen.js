import React, { useState, useCallback } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  ActivityIndicator,
  useWindowDimensions,
  Alert,
} from 'react-native';
import axios from 'axios';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

const BG_IMAGE_URL = 'https://i.postimg.cc/rFFQLGRh/Picsart-24-10-01-15-38-43-205.jpg';
const LOGO_URL = 'https://i.postimg.cc/hjjpy2SW/Button-1.png';
const FLAG_ICON_URL = 'https://i.postimg.cc/C1hkm5sR/india-flag-icon-29.png';

const LoginScreen = () => {
  const { width, height } = useWindowDimensions();
  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(width, height, isDarkMode);
  const navigation = useNavigation();
  const route = useRoute();

  // Extract optional parameters serviceName and id from route params
  const { serviceName, id } = route.params || {};

  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  // Request OTP and navigate to VerificationScreen with optional params if available
  const requestOtp = useCallback(async () => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Please enter a valid phone number.');
      return;
    }
    try {
      setLoading(true);
      const response = await axios.post(
        'https://backend.clicksolver.com/api/otp/send',
        { mobileNumber: phoneNumber }
      );
      if (response.status === 200) {
        const { verificationId } = response.data; 
        // Build params to send to VerificationScreen
        const params = serviceName && id
          ? { phoneNumber, verificationId, serviceName, id }
          : { phoneNumber, verificationId };
  
        // Use replace if we came in with an id, otherwise push
        if (id) {
          navigation.replace('VerificationScreen', params);
        } else {
          navigation.push('VerificationScreen', params);
        }
      } else {
        console.error('Error sending OTP:', response.data);
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [phoneNumber, navigation, serviceName, id]);
  

  // Handle hardware back press (Android)
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
    <View style={styles.root}>
      <Image
        source={{ uri: BG_IMAGE_URL }}
        style={styles.backgroundImage}
        resizeMode="stretch"
      />

      <SafeAreaView style={styles.mainContainer}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContentContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.logoSection}>
              <Image source={{ uri: LOGO_URL }} style={styles.logo} />
              <Text style={styles.heading}>
                Click <Text style={styles.solverText}>Solver</Text>
              </Text>
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
                placeholderTextColor={isDarkMode ? '#ccc' : '#9e9e9e'}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                maxLength={10}
              />
            </View>

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
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF5722" />
        </View>
      )}
    </View>
  );
};

export default LoginScreen;

/* ------------------------------------------
   Dynamic Styles for Light/Dark Mode
   ------------------------------------------ */
const dynamicStyles = (width, height, isDarkMode) => {
  const isTablet = width >= 600;

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#F5F5F5',
    },
    backgroundImage: {
      ...StyleSheet.absoluteFillObject,
      zIndex: -1,
      opacity: isDarkMode ? 0.85 : 1, // optional
    },
    mainContainer: {
      flex: 1,
    },
    scrollContentContainer: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: isTablet ? 40 : 20,
    },
    logoSection: {
      alignItems: 'center',
      marginBottom: 30,
    },
    logo: {
      width: isTablet ? 80 : 60,
      height: isTablet ? 80 : 60,
      marginBottom: 10,
    },
    heading: {
      fontSize: isTablet ? 28 : 24,
      color: isDarkMode ? '#212121' : '#212121',
      fontWeight: 'bold',
      marginBottom: 4,
    },
    solverText: {
      color: isDarkMode ? '#212121' : '#212121',
      fontWeight: 'bold',
    },
    subheading: {
      fontSize: isTablet ? 18 : 16,
      color: isDarkMode ? '#333' : '#333',
    },
    tagline: {
      fontSize: isTablet ? 16 : 14,
      color: isDarkMode ? '#666' : '#666',
      marginTop: 5,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#333' : '#fff',
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
      borderColor: isDarkMode ? '#555' : '#ccc',
      paddingRight: 10,
      width: isTablet ? 90 : 80,
    },
    flagIcon: {
      width: isTablet ? 28 : 24,
      height: isTablet ? 28 : 24,
    },
    picker: {
      fontSize: isTablet ? 19 : 17,
      color: isDarkMode ? '#fff' : '#212121',
      paddingLeft: 8,
      fontWeight: '600',
    },
    input: {
      flex: 1,
      height: isTablet ? 60 : 56,
      paddingLeft: 10,
      color: isDarkMode ? '#fff' : '#212121',
      fontSize: isTablet ? 18 : 16,
    },
    button: {
      backgroundColor: '#FF5722',
      paddingVertical: isTablet ? 18 : 15,
      paddingHorizontal: isTablet ? 60 : 50,
      borderRadius: 10,
      alignItems: 'center',
      width: '100%',
      elevation: 5,
    },
    buttonText: {
      color: '#ffffff',
      fontSize: isTablet ? 18 : 16,
      fontWeight: '600',
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
