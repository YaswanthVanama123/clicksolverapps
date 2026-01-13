/**
 * SignUpScreen Component
 * User registration screen for new users
 * Features: Form validation, theme support, state management, optional referral code
 */

import React, {useState, useEffect, useCallback} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import EncryptedStorage from 'react-native-encrypted-storage';
import {useRoute, useNavigation, CommonActions} from '@react-navigation/native';
import {useTheme} from '../theme';
import {
  validateEmail,
  validatePhone,
  validateName,
  isNotEmpty,
} from '../utils/validators';
import {formatPhoneNumber, capitalize} from '../utils/formatters';
import {LoadingState, ErrorState} from './StateComponents';
import {signup} from '../api/services/auth.service';

const BG_IMAGE_URL =
  'https://i.postimg.cc/rFFQLGRh/Picsart-24-10-01-15-38-43-205.jpg';

/**
 * SignUpScreen Component
 * Handles new user registration with validation and error handling
 */
const SignUpScreen = () => {
  const {width} = useWindowDimensions();
  const {theme, isDarkMode} = useTheme();
  const styles = getStyles(theme, isDarkMode, width);
  const route = useRoute();
  const navigation = useNavigation();

  // Extract optional parameters: phone_number, serviceName and id
  const {phone_number, serviceName, id} = route.params || {};

  // Component state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Pre-fill phone number if passed from previous screen
  useEffect(() => {
    if (phone_number) {
      setPhoneNumber(phone_number);
    }
  }, [phone_number]);

  /**
   * Validates all form fields
   * @returns {boolean} True if all fields are valid
   */
  const validateForm = useCallback(() => {
    const errors = {};

    if (!isNotEmpty(fullName)) {
      errors.fullName = 'Full name is required';
    } else if (!validateName(fullName)) {
      errors.fullName = 'Please enter a valid name';
    }

    if (!isNotEmpty(email)) {
      errors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!isNotEmpty(phoneNumber)) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!validatePhone(phoneNumber)) {
      errors.phoneNumber = 'Please enter a valid 10-digit phone number';
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      const errorMessage = Object.values(errors).join('\n');
      Alert.alert('Validation Error', errorMessage);
      return false;
    }

    return true;
  }, [fullName, email, phoneNumber]);

  /**
   * Handles user signup
   * Submits form data to API and navigates to appropriate screen
   */
  const handleSignUp = useCallback(async () => {
    try {
      // Validate form
      if (!validateForm()) {
        return;
      }

      setLoading(true);
      setError(null);

      // Call signup API
      const response = await signup({
        fullName: capitalize(fullName.trim()),
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim(),
        referralCode: referralCode.trim() || undefined,
      });

      const {token, message} = response;

      if (token) {
        // Store token
        await EncryptedStorage.setItem('cs_token', token);

        // Show success message
        Alert.alert(
          'Sign Up Successful',
          message || 'You have signed up successfully!',
        );

        // Navigate based on optional params
        if (serviceName && id) {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{name: 'ServiceBooking', params: {serviceName, id}}],
            }),
          );
        } else {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {
                  name: 'Tabs',
                  state: {routes: [{name: 'Home'}]},
                },
              ],
            }),
          );
        }
      }
    } catch (error) {
      console.error('Sign up error:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'An error occurred during sign up. Please try again.';
      setError(errorMessage);
      Alert.alert('Sign Up Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fullName, email, phoneNumber, referralCode, serviceName, id, navigation, validateForm]);

  /**
   * Handles input change with validation
   * @param {string} field - Field name
   * @param {string} value - Input value
   */
  const handleInputChange = useCallback(
    (field, value) => {
      // Clear validation error for this field
      if (validationErrors[field]) {
        setValidationErrors(prev => ({
          ...prev,
          [field]: undefined,
        }));
      }

      // Update field value
      switch (field) {
        case 'fullName':
          setFullName(value);
          break;
        case 'email':
          setEmail(value);
          break;
        case 'phoneNumber':
          // Only allow digits
          const cleaned = value.replace(/\D/g, '');
          setPhoneNumber(cleaned);
          break;
        case 'referralCode':
          setReferralCode(value);
          break;
      }
    },
    [validationErrors],
  );

  // Show error state if there's a persistent error
  if (error && !loading) {
    return (
      <ErrorState
        title="Sign Up Error"
        message={error}
        onRetry={() => {
          setError(null);
          handleSignUp();
        }}
      />
    );
  }

  // Show loading state
  if (loading) {
    return <LoadingState message="Creating your account..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            <ImageBackground
              source={{uri: BG_IMAGE_URL}}
              style={styles.backgroundImage}
              resizeMode="stretch">
              {/* Back button */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}>
                <FontAwesome6
                  name="arrow-left-long"
                  size={24}
                  color={theme.colors.text.primary}
                />
              </TouchableOpacity>

              {/* Title */}
              <Text style={styles.title}>Sign Up</Text>

              {/* Full Name Input */}
              <InputField
                placeholder="Full Name"
                value={fullName}
                onChangeText={text => handleInputChange('fullName', text)}
                hasError={!!validationErrors.fullName}
                editable={!loading}
                autoComplete="name"
                textContentType="name"
              />

              {/* Email Input */}
              <InputField
                placeholder="Email Address"
                value={email}
                onChangeText={text => handleInputChange('email', text)}
                icon={
                  <Icon
                    name="envelope"
                    size={20}
                    color={theme.colors.text.primary}
                  />
                }
                keyboardType="email-address"
                hasError={!!validationErrors.email}
                editable={!loading}
                autoComplete="email"
                textContentType="emailAddress"
                autoCapitalize="none"
              />

              {/* Display formatted email hint if valid */}
              {validateEmail(email) && (
                <Text style={styles.validationHint}>Valid email format</Text>
              )}

              {/* Phone Number Input (Read-only if pre-filled) */}
              <InputField
                placeholder="Phone Number"
                value={phoneNumber}
                onChangeText={text => handleInputChange('phoneNumber', text)}
                icon={
                  <Icon name="phone" size={20} color={theme.colors.text.primary} />
                }
                keyboardType="phone-pad"
                hasError={!!validationErrors.phoneNumber}
                editable={!loading && !phone_number}
                maxLength={10}
                autoComplete="tel"
                textContentType="telephoneNumber"
              />

              {/* Display formatted phone number if valid */}
              {validatePhone(phoneNumber) && (
                <Text style={styles.validationHint}>
                  {formatPhoneNumber(phoneNumber)}
                </Text>
              )}

              {/* Referral Code Input */}
              <InputField
                placeholder="Referral Code (Optional)"
                value={referralCode}
                onChangeText={text => handleInputChange('referralCode', text)}
                icon={
                  <FontAwesome6
                    name="gift"
                    size={20}
                    color={theme.colors.text.primary}
                  />
                }
                editable={!loading}
                autoCapitalize="characters"
              />

              {/* Sign Up Button */}
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSignUp}
                disabled={loading}>
                <Text style={styles.buttonText}>
                  {loading ? 'Signing Up...' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            </ImageBackground>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

/**
 * Reusable InputField Component
 * @param {Object} props - Component props
 */
const InputField = ({
  placeholder,
  value,
  onChangeText,
  icon,
  keyboardType = 'default',
  hasError = false,
  editable = true,
  maxLength,
  autoComplete,
  textContentType,
  autoCapitalize = 'words',
}) => {
  const {theme} = useTheme();
  const styles = getInputFieldStyles(theme, hasError, !editable);

  return (
    <View style={styles.inputContainer}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={theme.colors.text.tertiary}
        keyboardType={keyboardType}
        editable={editable}
        maxLength={maxLength}
        autoComplete={autoComplete}
        textContentType={textContentType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
};

/**
 * Main component styles
 */
const getStyles = (theme, isDarkMode, width) => {
  const isTablet = width >= 600;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backgroundImage: {
      width: '100%',
      minHeight: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: theme.spacing.xl,
    },
    backButton: {
      position: 'absolute',
      top: theme.spacing.lg,
      left: theme.spacing.md,
      padding: theme.spacing.sm,
      zIndex: 10,
    },
    title: {
      fontSize: isTablet ? theme.fontSizes['3xl'] : theme.fontSizes['2xl'],
      fontWeight: theme.fontWeights.bold,
      marginBottom: theme.spacing.xl,
      color: theme.colors.text.primary,
    },
    validationHint: {
      fontSize: theme.fontSizes.sm,
      color: theme.colors.success,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
      width: '75%',
    },
    button: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.md,
      width: '50%',
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 5,
      marginTop: theme.spacing.xl,
      shadowColor: theme.colors.primary,
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: '#fff',
      fontSize: isTablet ? theme.fontSizes.lg : theme.fontSizes.md,
      fontWeight: theme.fontWeights.bold,
    },
  });
};

/**
 * InputField component styles
 */
const getInputFieldStyles = (theme, hasError, isDisabled) =>
  StyleSheet.create({
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDisabled
        ? theme.colors.divider
        : theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      borderColor: hasError ? theme.colors.error : theme.colors.divider,
      borderWidth: hasError ? 2 : 1,
      height: 50,
      paddingHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.md,
      width: '75%',
    },
    iconContainer: {
      marginRight: theme.spacing.sm,
    },
    input: {
      flex: 1,
      fontSize: theme.fontSizes.md,
      color: theme.colors.text.primary,
    },
  });

export default SignUpScreen;
