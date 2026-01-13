/**
 * VerificationScreen Component
 * OTP verification screen for user authentication
 * Features: 4-digit OTP input, auto-focus, countdown timer, theme support
 */

import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  useWindowDimensions,
  Alert,
} from 'react-native';
import EncryptedStorage from 'react-native-encrypted-storage';
import {useNavigation, CommonActions, useRoute} from '@react-navigation/native';
import Entypo from 'react-native-vector-icons/Entypo';
import {useTheme} from '../theme';
import {formatPhoneNumber, formatTime} from '../utils/formatters';
import {isNotEmpty, hasMinLength} from '../utils/validators';
import {LoadingState, ErrorState} from './StateComponents';
import {verifyOTP, login} from '../api/services/auth.service';

const BG_IMAGE_URL =
  'https://i.postimg.cc/zB1C8frj/Picsart-24-10-01-15-26-57-512-1.jpg';

/**
 * VerificationScreen Component
 * Handles OTP verification and user authentication flow
 */
const VerificationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {width, height} = useWindowDimensions();
  const {theme, isDarkMode} = useTheme();
  const styles = dynamicStyles(width, height, theme, isDarkMode);

  // Extract phoneNumber, verificationId and optional serviceName, id from route params
  const {phoneNumber, verificationId, serviceName, id} = route.params;

  // Component state
  const [timer, setTimer] = useState(120); // 2 minutes timer
  const [code, setCode] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create refs for each OTP TextInput
  const inputs = useRef([]);

  /**
   * Countdown timer effect
   * Decrements timer every second
   */
  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer(prevTimer => (prevTimer > 0 ? prevTimer - 1 : 0));
    }, 1000);
    return () => clearInterval(countdown);
  }, []);

  /**
   * Format timer display
   * @returns {string} Formatted time string (MM:SS)
   */
  const formattedTime = useCallback(() => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  }, [timer]);

  /**
   * Validates OTP code
   * @returns {boolean} True if OTP is valid
   */
  const validateOTP = useCallback(() => {
    const otpCode = code.join('');

    if (!isNotEmpty(otpCode)) {
      Alert.alert('Validation Error', 'Please enter the OTP code.');
      return false;
    }

    if (!hasMinLength(otpCode, 4)) {
      Alert.alert('Validation Error', 'Please enter the complete 4-digit OTP.');
      return false;
    }

    return true;
  }, [code]);

  /**
   * Submit OTP for verification
   * Handles authentication flow based on verification result
   */
  const submitOtp = useCallback(async () => {
    try {
      // Validate OTP
      if (!validateOTP()) {
        return;
      }

      const otpCode = code.join('');
      setLoading(true);
      setError(null);

      // Verify OTP
      const validateResponse = await verifyOTP(
        phoneNumber,
        verificationId,
        otpCode,
      );

      if (validateResponse.message === 'OTP Verified') {
        // Login after OTP verification
        const loginResponse = await login(phoneNumber);

        if (loginResponse.status === 200 || loginResponse.token) {
          const {token} = loginResponse;
          await EncryptedStorage.setItem('cs_token', token);

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
        } else if (loginResponse.status === 205) {
          // User not found - navigate to SignUpScreen
          navigation.navigate('SignUpScreen', {
            phone_number: phoneNumber,
            ...(serviceName && id ? {serviceName, id} : {}),
          });
        }
      } else {
        throw new Error('Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error during OTP validation or login:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'An error occurred. Please try again.';
      setError(errorMessage);
      Alert.alert('Verification Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [code, phoneNumber, verificationId, serviceName, id, navigation, validateOTP]);

  /**
   * Handle text change for each OTP input
   * @param {string} value - Input value
   * @param {number} index - Input index
   */
  const handleChangeText = useCallback(
    (value, index) => {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
      setError(null);

      // Auto-focus next input
      if (value && index < newCode.length - 1) {
        inputs.current[index + 1]?.focus();
      }

      // Auto-submit when all 4 digits are entered
      if (value && index === newCode.length - 1 && newCode.every(digit => digit)) {
        // Small delay to ensure UI updates
        setTimeout(() => submitOtp(), 100);
      }
    },
    [code, submitOtp],
  );

  /**
   * Handle key press for backspace navigation
   * @param {object} event - Key press event
   * @param {number} index - Input index
   */
  const handleKeyPress = useCallback(
    ({nativeEvent}, index) => {
      if (nativeEvent.key === 'Backspace' && code[index] === '' && index > 0) {
        inputs.current[index - 1]?.focus();
        const newCode = [...code];
        newCode[index - 1] = '';
        setCode(newCode);
      }
    },
    [code],
  );

  /**
   * Clear OTP input
   */
  const clearOTP = useCallback(() => {
    setCode(['', '', '', '']);
    setError(null);
    inputs.current[0]?.focus();
  }, []);

  // Show error state if there's a persistent error
  if (error && !loading) {
    return (
      <ErrorState
        title="Verification Error"
        message={error}
        onRetry={() => {
          setError(null);
          clearOTP();
        }}
      />
    );
  }

  // Show loading state
  if (loading) {
    return <LoadingState message="Verifying OTP..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.mainContainer}>
        {/* Background Image */}
        <Image
          source={{uri: BG_IMAGE_URL}}
          style={StyleSheet.absoluteFillObject}
          resizeMode="stretch"
        />

        {/* Foreground Content */}
        <View style={styles.container}>
          <Text style={styles.title}>Verification Code</Text>
          <Text style={styles.instruction}>
            Please enter the 4-digit code sent on
          </Text>
          <Text style={styles.number}>{formatPhoneNumber(phoneNumber)}</Text>

          {/* OTP Input Container */}
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                style={[
                  styles.codeInput,
                  error && styles.codeInputError,
                  digit && styles.codeInputFilled,
                ]}
                keyboardType="numeric"
                maxLength={1}
                value={digit}
                autoFocus={index === 0}
                ref={ref => (inputs.current[index] = ref)}
                onChangeText={value => handleChangeText(value, index)}
                onKeyPress={e => handleKeyPress(e, index)}
                editable={!loading && timer > 0}
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Timer Display */}
          <View style={styles.timerContainer}>
            <Text style={[styles.timer, timer === 0 && styles.timerExpired]}>
              {formattedTime()}
            </Text>
            {timer === 0 && (
              <Text style={styles.timerExpiredText}>OTP Expired</Text>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (loading || timer === 0) && styles.submitButtonDisabled,
            ]}
            onPress={submitOtp}
            disabled={loading || timer === 0}>
            <Text style={styles.submitButtonText}>
              {loading ? 'Verifying...' : 'Submit'}
            </Text>
          </TouchableOpacity>

          {/* Resend OTP */}
          {timer === 0 && (
            <TouchableOpacity
              style={styles.resendButton}
              onPress={() => {
                // Navigate back to login screen
                navigation.goBack();
              }}>
              <Text style={styles.resendButtonText}>Resend OTP</Text>
            </TouchableOpacity>
          )}

          {/* Contact Information */}
          <View style={styles.contactContainer}>
            <Text style={styles.contactText}>Contact us:</Text>
            <View style={styles.socialIcons}>
              <Entypo
                name="mail"
                size={15}
                color={theme.colors.text.secondary}
                style={styles.socialIcon}
              />
              <Entypo
                name="facebook"
                size={15}
                color={theme.colors.text.secondary}
                style={styles.socialIcon}
              />
              <Entypo
                name="instagram"
                size={15}
                color={theme.colors.text.secondary}
                style={styles.socialIcon}
              />
            </View>
            <Text style={styles.email}>customer.support@clicksolver.com</Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

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
    keyboardAvoidingView: {
      flex: 1,
    },
    mainContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: isTablet ? 30 : 20,
    },
    title: {
      fontSize: isTablet ? theme.fontSizes['3xl'] : theme.fontSizes['2xl'],
      fontWeight: theme.fontWeights.bold,
      marginBottom: isTablet ? 25 : 20,
      color: theme.colors.text.primary,
    },
    instruction: {
      fontSize: isTablet ? theme.fontSizes.lg : theme.fontSizes.md,
      textAlign: 'center',
      color: theme.colors.text.secondary,
    },
    number: {
      fontSize: isTablet ? theme.fontSizes.lg : theme.fontSizes.md,
      textAlign: 'center',
      marginBottom: isTablet ? 35 : 30,
      color: theme.colors.text.primary,
      fontWeight: theme.fontWeights.bold,
    },
    codeContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      width: '80%',
      marginBottom: isTablet ? 25 : 20,
      gap: isTablet ? 15 : 10,
    },
    codeInput: {
      borderWidth: 1,
      borderColor: theme.colors.divider,
      borderRadius: theme.borderRadius.md,
      width: isTablet ? 55 : 45,
      height: isTablet ? 55 : 45,
      textAlign: 'center',
      fontSize: isTablet ? theme.fontSizes['2xl'] : theme.fontSizes.xl,
      color: theme.colors.text.primary,
      backgroundColor: theme.colors.surface,
    },
    codeInputFilled: {
      borderColor: theme.colors.primary,
      borderWidth: 2,
    },
    codeInputError: {
      borderColor: theme.colors.error,
      borderWidth: 2,
    },
    timerContainer: {
      alignItems: 'center',
      marginBottom: isTablet ? 25 : 20,
    },
    timer: {
      fontSize: isTablet ? theme.fontSizes.xl : theme.fontSizes.lg,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text.primary,
    },
    timerExpired: {
      color: theme.colors.error,
    },
    timerExpiredText: {
      fontSize: theme.fontSizes.sm,
      color: theme.colors.error,
      marginTop: theme.spacing.xs,
    },
    submitButton: {
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: isTablet ? 18 : 15,
      paddingHorizontal: isTablet ? 50 : 40,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.md,
      width: isTablet ? 180 : 150,
      elevation: 5,
      shadowColor: theme.colors.primary,
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    submitButtonDisabled: {
      opacity: 0.5,
      backgroundColor: theme.colors.text.tertiary,
    },
    submitButtonText: {
      color: '#fff',
      fontSize: isTablet ? theme.fontSizes.lg : theme.fontSizes.md,
      fontWeight: theme.fontWeights.bold,
    },
    resendButton: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      marginBottom: isTablet ? 50 : 40,
    },
    resendButtonText: {
      color: theme.colors.primary,
      fontSize: theme.fontSizes.md,
      fontWeight: theme.fontWeights.semibold,
      textDecorationLine: 'underline',
    },
    contactContainer: {
      alignItems: 'center',
    },
    contactText: {
      fontSize: isTablet ? theme.fontSizes.lg : theme.fontSizes.md,
      marginBottom: isTablet ? 15 : 10,
      color: theme.colors.text.primary,
    },
    socialIcons: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: isTablet ? 15 : 10,
    },
    socialIcon: {
      marginHorizontal: theme.spacing.xs,
    },
    email: {
      fontSize: isTablet ? theme.fontSizes.sm : theme.fontSizes.xs,
      color: theme.colors.text.secondary,
      paddingBottom: isTablet ? 40 : 30,
    },
  });
};

export default VerificationScreen;
