/**
 * EditProfile Component
 * Allows users to edit their profile information including name, email, and phone
 * Features: validation, error handling, confirmation modal, and API integration
 *
 * @module EditProfile
 */

import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  ActivityIndicator,
  useWindowDimensions,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import {useRoute, useNavigation, CommonActions} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Theme and utilities
import {useTheme} from '../context/ThemeContext';
import {useTranslation} from 'react-i18next';

// State components
import LoadingState from '../Components/molecules/LoadingState';
import ErrorState from '../Components/molecules/ErrorState';

// API services
import {updateUserProfile} from '../api/services/user.service';

// Store
import useUserStore from '../store/userStore';

// Validators and formatters
import {validateEmail, validatePhone, validateName} from '../utils/validators';
import {formatPhoneNumber} from '../utils/formatters';

/**
 * EditProfile Component
 * @returns {JSX.Element} Edit profile form with validation
 */
const EditProfile = () => {
  const {width, height} = useWindowDimensions();
  const isTablet = width >= 600;
  const {isDarkMode} = useTheme();
  const styles = dynamicStyles(width, height, isDarkMode);

  const navigation = useNavigation();
  const {t} = useTranslation();
  const route = useRoute();

  // State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [errors, setErrors] = useState({});

  // User store
  const {setProfile} = useUserStore();

  /**
   * Fetch profile details from route params
   */
  const fetchProfileDetails = async () => {
    try {
      const {details} = route.params;
      if (details) {
        setEmail(details.email || '');
        setPhone(details.phoneNumber || '');
        setFullName(details.name || '');
      }
    } catch (error) {
      console.error('Error fetching profile details:', error);
    }
  };

  /**
   * Validate form fields
   * @returns {boolean} - Whether form is valid
   */
  const validateForm = () => {
    const newErrors = {};

    // Validate name
    if (!fullName.trim()) {
      newErrors.fullName = t('name_required') || 'Name is required';
    } else if (!validateName(fullName)) {
      newErrors.fullName = t('invalid_name') || 'Invalid name format';
    }

    // Validate email
    if (!email.trim()) {
      newErrors.email = t('email_required') || 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = t('invalid_email') || 'Invalid email format';
    }

    // Validate phone (optional since it's disabled)
    if (phone && !validatePhone(phone)) {
      newErrors.phone = t('invalid_phone') || 'Invalid phone format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Update user profile
   * @async
   */
  const updateProfile = async () => {
    try {
      setUpdateLoading(true);

      // Use API service
      await updateUserProfile({
        name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });

      // Update store
      setProfile({
        name: fullName.trim(),
        email: email.trim(),
        phoneNumber: phone.trim(),
      });

      // Navigate back to profile screen
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{name: 'Tabs', state: {routes: [{name: 'Account'}]}}],
        }),
      );
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(
        t('error') || 'Error',
        error.response?.data?.message || t('update_failed') || 'Failed to update profile. Please try again.',
      );
    } finally {
      setUpdateLoading(false);
    }
  };

  /**
   * Open confirmation modal
   */
  const openConfirmationModal = () => {
    if (validateForm()) {
      setModalVisible(true);
    }
  };

  /**
   * Handle update confirmation
   */
  const handleUpdate = () => {
    setModalVisible(false);
    updateProfile();
  };

  useEffect(() => {
    fetchProfileDetails();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            position: 'absolute',
            left: isTablet ? 20 : 16,
            zIndex: 2,
          }}>
          <Icon
            name="arrow-back"
            size={20}
            color={isDarkMode ? '#fff' : '#212121'}
          />
        </TouchableOpacity>

        <Text style={styles.headerText}>
          {t('edit_profile') || 'Edit Profile'}
        </Text>
      </View>

      <ScrollView>
        <View style={styles.form}>
          {/* Full Name Field */}
          <View>
            <Text style={styles.label}>{t('full_name') || 'Full Name'}</Text>
            <TextInput
              style={[styles.input, errors.fullName && styles.inputError]}
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (errors.fullName) {
                  setErrors({...errors, fullName: null});
                }
              }}
              placeholder={t('enter_full_name') || 'Enter full name'}
              placeholderTextColor={isDarkMode ? '#666' : '#999'}
              testID="fullName-input"
            />
            {errors.fullName && (
              <Text style={styles.errorText}>{errors.fullName}</Text>
            )}
          </View>

          {/* Email Field */}
          <View>
            <Text style={styles.label}>
              {t('email_address') || 'Email Address'}
            </Text>
            <View style={[styles.inputWithIcon, errors.email && styles.inputError]}>
              <Icon name="email" size={20} color={isDarkMode ? '#fff' : 'gray'} />
              <TextInput
                style={styles.inputText}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) {
                    setErrors({...errors, email: null});
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder={t('enter_email') || 'Enter email'}
                placeholderTextColor={isDarkMode ? '#666' : '#999'}
              />
            </View>
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          {/* Phone Field */}
          <View>
            <Text style={styles.label}>
              {t('phone_number') || 'Phone Number'}
            </Text>
            <View style={styles.phoneInputContainer}>
              <Image
                source={{
                  uri: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/41/Flag_of_India.svg/1200px-Flag_of_India.svg.png',
                }}
                style={styles.flagIcon}
              />
              <Text style={styles.callingCode}>+ 91</Text>
              <TextInput
                style={styles.phoneInput}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                editable={false}
                selectTextOnFocus={false}
              />
            </View>
            <Text style={styles.helperText}>
              {t('phone_not_editable') || 'Phone number cannot be changed'}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={[styles.button, updateLoading && styles.buttonDisabled]}
          onPress={openConfirmationModal}
          disabled={updateLoading}>
          {updateLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {t('update_profile') || 'Update Profile'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Confirmation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {t('confirm_update') || 'Confirm Update'}
            </Text>
            <Text style={styles.modalMessage}>
              {t('confirm_update_message') ||
                'Are you sure you want to update your profile?'}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, {backgroundColor: '#ccc'}]}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonText}>
                  {t('cancel') || 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, {backgroundColor: '#FF4500'}]}
                onPress={handleUpdate}>
                <Text style={styles.modalButtonText}>
                  {t('update') || 'Update'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

/**
 * Dynamic styles based on theme and screen dimensions
 * @param {number} width - Screen width
 * @param {number} height - Screen height
 * @param {boolean} isDarkMode - Whether dark mode is active
 * @returns {object} StyleSheet object
 */
const dynamicStyles = (width, height, isDarkMode) => {
  const isTablet = width >= 600;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#fff',
      paddingHorizontal: isTablet ? 30 : 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isTablet ? 20 : 16,
      paddingBottom: isTablet ? 16 : 12,
      elevation: 2,
      backgroundColor: isDarkMode ? '#121212' : '#ffffff',
      position: 'relative',
    },
    headerText: {
      fontSize: isTablet ? 24 : 20,
      fontFamily: 'RobotoSlab-SemiBold',
      marginLeft: isTablet ? 15 : 10,
      color: isDarkMode ? '#fff' : '#1D2951',
      textAlign: 'center',
    },
    form: {
      marginTop: isTablet ? 20 : 10,
      flexDirection: 'column',
      gap: isTablet ? 15 : 10,
      paddingHorizontal: 15,
    },
    label: {
      fontSize: isTablet ? 16 : 14,
      fontFamily: 'RobotoSlab-Medium',
      color: isDarkMode ? '#ccc' : '#4a4a4a',
      marginBottom: 5,
      marginTop: isTablet ? 20 : 15,
    },
    input: {
      height: isTablet ? 55 : 50,
      borderWidth: 1,
      borderColor: isDarkMode ? '#444' : '#ddd',
      borderRadius: 8,
      paddingHorizontal: 10,
      backgroundColor: isDarkMode ? '#1e1e1e' : '#f9f9f9',
      color: isDarkMode ? '#fff' : '#212121',
      fontFamily: 'RobotoSlab-Regular',
      fontSize: isTablet ? 18 : 16,
    },
    inputError: {
      borderColor: '#EF4444',
      borderWidth: 1.5,
    },
    inputWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDarkMode ? '#444' : '#ddd',
      borderRadius: 8,
      paddingHorizontal: 10,
      backgroundColor: isDarkMode ? '#1e1e1e' : '#f9f9f9',
    },
    inputText: {
      flex: 1,
      height: isTablet ? 55 : 50,
      marginLeft: isTablet ? 15 : 10,
      color: isDarkMode ? '#fff' : '#212121',
      fontFamily: 'RobotoSlab-Regular',
      fontSize: isTablet ? 18 : 16,
    },
    phoneInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDarkMode ? '#444' : '#ddd',
      borderRadius: 8,
      paddingHorizontal: 10,
      height: isTablet ? 55 : 50,
      backgroundColor: isDarkMode ? '#1e1e1e' : '#f9f9f9',
    },
    flagIcon: {
      width: isTablet ? 30 : 24,
      height: isTablet ? 20 : 16,
      marginRight: 8,
    },
    callingCode: {
      marginRight: 10,
      fontSize: isTablet ? 18 : 16,
      color: isDarkMode ? '#fff' : '#212121',
      fontFamily: 'RobotoSlab-Regular',
    },
    phoneInput: {
      flex: 1,
      color: isDarkMode ? '#666' : '#999',
      fontFamily: 'RobotoSlab-Regular',
      fontSize: isTablet ? 18 : 16,
    },
    errorText: {
      color: '#EF4444',
      fontSize: isTablet ? 13 : 12,
      fontFamily: 'RobotoSlab-Regular',
      marginTop: 4,
      marginLeft: 4,
    },
    helperText: {
      color: isDarkMode ? '#666' : '#999',
      fontSize: isTablet ? 13 : 12,
      fontFamily: 'RobotoSlab-Regular',
      marginTop: 4,
      marginLeft: 4,
    },
    bottomButtonContainer: {
      position: 'absolute',
      left: isTablet ? 30 : 20,
      right: isTablet ? 30 : 20,
      bottom: isTablet ? 30 : 20,
    },
    button: {
      backgroundColor: '#FF4500',
      height: isTablet ? 55 : 50,
      borderRadius: isTablet ? 27.5 : 25,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: '#fff',
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'RobotoSlab-Medium',
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
      padding: 20,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      alignItems: 'center',
      width: '100%',
    },
    modalTitle: {
      fontSize: isTablet ? 20 : 18,
      fontFamily: 'RobotoSlab-Medium',
      marginBottom: 10,
      color: isDarkMode ? '#fff' : '#1D2951',
    },
    modalMessage: {
      fontSize: isTablet ? 16 : 14,
      fontFamily: 'RobotoSlab-Regular',
      marginBottom: 20,
      textAlign: 'center',
      color: isDarkMode ? '#ccc' : '#212121',
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
    },
    modalButton: {
      flex: 1,
      marginHorizontal: 5,
      paddingVertical: 10,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalButtonText: {
      color: '#fff',
      fontFamily: 'RobotoSlab-Medium',
      fontSize: isTablet ? 16 : 14,
    },
  });
};

export default EditProfile;
