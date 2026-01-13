/**
 * LoginScreen Component
 * Main authentication screen for phone number based login
 * Features: OTP-based authentication, phone validation, theme support, state management
 */

import React, {useState, useCallback} from 'react';
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
  useWindowDimensions,
  Alert,
} from 'react-native';
import {
  useNavigation,
  useFocusEffect,
  useRoute,
  CommonActions,
} from '@react-navigation/native';
import EncryptedStorage from 'react-native-encrypted-storage';
import {useTheme} from '../theme';
import {validatePhone, isNotEmpty} from '../utils/validators';
import {formatPhoneNumber} from '../utils/formatters';
import {LoadingState, ErrorState} from './StateComponents';
import {login, sendOTP} from '../api/services/auth.service';

const BG_IMAGE_URL =
  'https://i.postimg.cc/rFFQLGRh/Picsart-24-10-01-15-38-43-205.jpg';
const LOGO_URL = 'https://i.postimg.cc/hjjpy2SW/Button-1.png';
const FLAG_ICON_URL = 'https://i.postimg.cc/C1hkm5sR/india-flag-icon-29.png';

/**
 * LoginScreen Component
 * Handles user authentication via phone number and OTP
 */
const LoginScreen = () => {
  const {width, height} = useWindowDimensions();
  const {theme, isDarkMode} = useTheme();
  const styles = dynamicStyles(width, height, theme, isDarkMode);
  const navigation = useNavigation();
  const route = useRoute();

  // Extract optional parameters serviceName and id from route params
  const {serviceName, id} = route.params || {};

  // Component state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Validates phone number input
   * @returns {boolean} True if phone number is valid
   */
  const validatePhoneInput = useCallback(() => {
    if (!isNotEmpty(phoneNumber)) {
      Alert.alert('Validation Error', 'Please enter a phone number.');
      return false;
    }

    if (!validatePhone(phoneNumber)) {
      Alert.alert(
        'Validation Error',
        'Please enter a valid 10-digit phone number.',
      );
      return false;
    }

    return true;
  }, [phoneNumber]);

  /**
   * Handles phone number input change
   * @param {string} text - Input text
   */
  const handlePhoneNumberChange = useCallback(text => {
    // Remove any non-digit characters
    const cleaned = text.replace(/\D/g, '');
    setPhoneNumber(cleaned);
    setError(null);
  }, []);

  /**
   * Request OTP and navigate to VerificationScreen
   * Handles special case for dev phone number 9392365494
   */
  const requestOtp = useCallback(async () => {
    try {
      // Validate phone number
      if (!validatePhoneInput()) {
        return;
      }

      setLoading(true);
      setError(null);

      // Special case: Direct login for dev phone number
      if (phoneNumber === '9392365494') {
        const loginResponse = await login(phoneNumber);

        if (loginResponse.token) {
          await EncryptedStorage.setItem('cs_token', loginResponse.token);

          // Navigate based on optional params
          if (serviceName && id) {
            navigation.replace('ServiceBooking', {serviceName, id});
          } else {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [
                  {
                    name: 'Tabs',
                    state: {
                      routes: [{name: 'Home'}],
                    },
                  },
                ],
              }),
            );
          }
        }
      } else {
        // Regular OTP flow
        const response = await sendOTP(phoneNumber);

        if (response.verificationId) {
          // Build params to send to VerificationScreen
          const params =
            serviceName && id
              ? {phoneNumber, verificationId: response.verificationId, serviceName, id}
              : {phoneNumber, verificationId: response.verificationId};

          // Use replace if we came in with an id, otherwise push
          if (id) {
            navigation.replace('VerificationScreen', params);
          } else {
            navigation.push('VerificationScreen', params);
          }
        } else {
          throw new Error('Failed to send OTP. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to send OTP. Please try again.';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [phoneNumber, navigation, serviceName, id, validatePhoneInput]);

  /**
   * Handle hardware back press (Android)
   * @returns {boolean} True to prevent default back behavior
   */
  const handleBackPress = useCallback(() => {
    navigation.goBack();
    return true;
  }, [navigation]);

  // Set up back handler when screen is focused
  useFocusEffect(
    useCallback(() => {
      BackHandler.addEventListener('hardwareBackPress', handleBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    }, [handleBackPress]),
  );

  // Show error state if there's a persistent error
  if (error && !loading) {
    return (
      <ErrorState
        title="Authentication Error"
        message={error}
        onRetry={() => {
          setError(null);
          requestOtp();
        }}
      />
    );
  }

  return (
    <View style={styles.root}>
      <Image
        source={{uri: BG_IMAGE_URL}}
        style={styles.backgroundImage}
        resizeMode="stretch"
      />

      <SafeAreaView style={styles.mainContainer}>
        <KeyboardAvoidingView
          style={{flex: 1}}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            contentContainerStyle={styles.scrollContentContainer}
            keyboardShouldPersistTaps="handled">
            {/* Logo Section */}
            <View style={styles.logoSection}>
              <Image source={{uri: LOGO_URL}} style={styles.logo} />
              <Text style={styles.heading}>
                Click <Text style={styles.solverText}>Solver</Text>
              </Text>
              <Text style={styles.subheading}>ALL HOME Service Expert</Text>
              <Text style={styles.tagline}>Instant Affordable Trusted</Text>
            </View>

            {/* Phone Input Section */}
            <View style={styles.inputContainer}>
              <View style={styles.countryCodeContainer}>
                <Image source={{uri: FLAG_ICON_URL}} style={styles.flagIcon} />
                <Text style={styles.picker}>+91</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter Mobile Number"
                placeholderTextColor={
                  isDarkMode ? theme.colors.text.tertiary : '#9e9e9e'
                }
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={handlePhoneNumberChange}
                maxLength={10}
                editable={!loading}
                autoComplete="tel"
                textContentType="telephoneNumber"
              />
            </View>

            {/* Display formatted phone number if valid */}
            {validatePhone(phoneNumber) && (
              <Text style={styles.formattedPhone}>
                {formatPhoneNumber(phoneNumber)}
              </Text>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={requestOtp}
              disabled={loading}>
              <Text style={styles.buttonText}>
                {loading ? 'Sending...' : 'Get Verification Code'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <LoadingState message="Sending OTP..." size="large" />
        </View>
      )}
    </View>
  );
};

export default LoginScreen;

/**
 * Dynamic Styles with Theme Support
 * @param {number} width - Screen width
 * @param {number} height - Screen height
 * @param {object} theme - Theme object
 * @param {boolean} isDarkMode - Dark mode flag
 * @returns {object} StyleSheet object
 */
const dynamicStyles = (width, height, theme, isDarkMode) => {
  const isTablet = width >= 600;

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    backgroundImage: {
      ...StyleSheet.absoluteFillObject,
      zIndex: -1,
      opacity: isDarkMode ? 0.85 : 1,
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
      color: '#212121',
      fontWeight: theme.fontWeights.bold,
      marginBottom: 4,
    },
    solverText: {
      color: '#212121',
      fontWeight: theme.fontWeights.bold,
    },
    subheading: {
      fontSize: isTablet ? 18 : 16,
      color: '#333',
      fontWeight: theme.fontWeights.medium,
    },
    tagline: {
      fontSize: isTablet ? 16 : 14,
      color: '#666',
      marginTop: 5,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? theme.colors.surface : '#fff',
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: isTablet ? 15 : 10,
      marginBottom: 12,
      width: '100%',
      height: isTablet ? 60 : 56,
      elevation: 5,
      shadowColor: theme.colors.text.primary,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    countryCodeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRightWidth: 1,
      borderColor: isDarkMode ? theme.colors.divider : '#ccc',
      paddingRight: 10,
      width: isTablet ? 90 : 80,
    },
    flagIcon: {
      width: isTablet ? 28 : 24,
      height: isTablet ? 28 : 24,
    },
    picker: {
      fontSize: isTablet ? 19 : 17,
      color: theme.colors.text.primary,
      paddingLeft: 8,
      fontWeight: theme.fontWeights.semibold,
    },
    input: {
      flex: 1,
      height: isTablet ? 60 : 56,
      paddingLeft: 10,
      color: theme.colors.text.primary,
      fontSize: isTablet ? 18 : 16,
    },
    formattedPhone: {
      fontSize: isTablet ? 14 : 12,
      color: theme.colors.text.secondary,
      marginBottom: 12,
      textAlign: 'center',
    },
    button: {
      backgroundColor: theme.colors.primary,
      paddingVertical: isTablet ? 18 : 15,
      paddingHorizontal: isTablet ? 60 : 50,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      width: '100%',
      elevation: 5,
      shadowColor: theme.colors.primary,
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: '#ffffff',
      fontSize: isTablet ? 18 : 16,
      fontWeight: theme.fontWeights.semibold,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDarkMode
        ? 'rgba(0, 0, 0, 0.7)'
        : 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999,
    },
  });
};
