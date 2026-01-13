/**
 * AccountDelete Component
 * Allows users to permanently delete their account
 * Features: confirmation modal, logout on deletion, and proper error handling
 *
 * @module AccountDelete
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
import {useRoute, useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import EncryptedStorage from 'react-native-encrypted-storage';

// Theme and utilities
import {useTheme} from '../context/ThemeContext';
import {useTranslation} from 'react-i18next';

// State components
import LoadingState from '../Components/molecules/LoadingState';
import ErrorState from '../Components/molecules/ErrorState';

// API services
import {deleteUserAccount} from '../api/services/user.service';

// Store
import useUserStore from '../store/userStore';

// Validators and formatters
import {validateEmail, validatePhone} from '../utils/validators';
import {formatPhoneNumber} from '../utils/formatters';

/**
 * AccountDelete Component
 * @returns {JSX.Element} Account deletion screen with confirmation
 */
const AccountDelete = () => {
  const {width, height} = useWindowDimensions();
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

  // User store
  const {clearUserData} = useUserStore();

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
   * Delete user account
   * @async
   */
  const deleteAccount = async () => {
    try {
      setUpdateLoading(true);

      // Use API service
      await deleteUserAccount({
        name: fullName,
        email: email,
        phone: phone,
      });

      // On successful account deletion, perform logout
      await handleLogout();
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert(
        t('error') || 'Error',
        error.response?.data?.message || t('delete_failed') || 'Failed to delete account. Please try again.',
      );
    } finally {
      setUpdateLoading(false);
    }
  };

  /**
   * Logout: clear tokens and navigate to Login
   * @async
   */
  const handleLogout = async () => {
    try {
      const user_fcm_token = await EncryptedStorage.getItem('user_fcm_token');

      if (user_fcm_token) {
        try {
          await fetch('https://backend.clicksolver.com/api/userLogout', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({user_fcm_token}),
          });
        } catch (apiErr) {
          console.error('Logout API error:', apiErr);
        }
      }

      // Clear all storage keys
      const keysToClear = [
        'cs_token',
        'user_fcm_token',
        'notifications',
        'messageBox',
      ];

      for (const key of keysToClear) {
        const value = await EncryptedStorage.getItem(key);
        if (value != null) {
          await EncryptedStorage.removeItem(key);
        }
      }

      // Clear user store
      await clearUserData();

      // Navigate to Login
      navigation.reset({
        index: 0,
        routes: [{name: 'Login'}],
      });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  /**
   * Open the confirmation modal
   */
  const openConfirmationModal = () => {
    setModalVisible(true);
  };

  /**
   * Close modal and proceed with account deletion
   */
  const handleDelete = () => {
    setModalVisible(false);
    deleteAccount();
  };

  useEffect(() => {
    fetchProfileDetails();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Icon
            name="arrow-back"
            size={24}
            color={isDarkMode ? '#fff' : '#000'}
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.headerText}>
            {t('account_delete') || 'Account Delete'}
          </Text>
        </View>

        <View style={styles.form}>
          {/* Warning Message */}
          <View style={styles.warningContainer}>
            <Icon name="warning" size={24} color="#EF4444" />
            <Text style={styles.warningText}>
              {t('delete_account_warning') ||
                'Warning: This action cannot be undone. All your data will be permanently deleted.'}
            </Text>
          </View>

          {/* Full Name Field */}
          <View>
            <Text style={styles.label}>{t('full_name') || 'Full Name'}</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              editable={false}
              onChangeText={setFullName}
              testID="fullName-input"
            />
          </View>

          {/* Email Field */}
          <View>
            <Text style={styles.label}>
              {t('email_address') || 'Email Address'}
            </Text>
            <View style={styles.inputWithIcon}>
              <Icon name="email" size={20} color={isDarkMode ? '#fff' : 'gray'} />
              <TextInput
                style={styles.inputText}
                value={email}
                editable={false}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
            </View>
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
          </View>

          <TouchableOpacity
            style={[styles.button, updateLoading && styles.buttonDisabled]}
            onPress={openConfirmationModal}
            disabled={updateLoading}>
            {updateLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {t('delete_account') || 'Delete Account'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Icon name="warning" size={48} color="#EF4444" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>
              {t('confirm_delete') || 'Confirm Delete'}
            </Text>
            <Text style={styles.modalMessage}>
              {t('confirm_delete_message') ||
                'Are you absolutely sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.'}
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
                style={[styles.modalButton, {backgroundColor: '#EF4444'}]}
                onPress={handleDelete}>
                <Text style={styles.modalButtonText}>
                  {t('delete') || 'Delete'}
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
      marginVertical: isTablet ? 20 : 15,
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
      paddingHorizontal: 10,
      flexDirection: 'column',
      gap: isTablet ? 15 : 10,
    },
    warningContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#2D1B1B' : '#FEE2E2',
      borderRadius: 8,
      padding: isTablet ? 16 : 12,
      marginBottom: isTablet ? 20 : 15,
      borderLeftWidth: 4,
      borderLeftColor: '#EF4444',
    },
    warningText: {
      flex: 1,
      marginLeft: 12,
      fontSize: isTablet ? 14 : 13,
      fontFamily: 'RobotoSlab-Regular',
      color: isDarkMode ? '#FCA5A5' : '#991B1B',
      lineHeight: 20,
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
      color: isDarkMode ? '#666' : '#999',
      fontFamily: 'RobotoSlab-Regular',
      fontSize: isTablet ? 18 : 16,
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
      color: isDarkMode ? '#666' : '#999',
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
      color: isDarkMode ? '#666' : '#999',
      fontFamily: 'RobotoSlab-Regular',
    },
    phoneInput: {
      flex: 1,
      height: isTablet ? 55 : 50,
      color: isDarkMode ? '#666' : '#999',
      fontFamily: 'RobotoSlab-Regular',
      fontSize: isTablet ? 18 : 16,
    },
    button: {
      backgroundColor: '#EF4444',
      height: isTablet ? 55 : 50,
      borderRadius: isTablet ? 27.5 : 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: isTablet ? 50 : 40,
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
    modalIcon: {
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: isTablet ? 20 : 18,
      fontFamily: 'RobotoSlab-Medium',
      marginBottom: 10,
      color: isDarkMode ? '#FCA5A5' : '#DC2626',
    },
    modalMessage: {
      fontSize: isTablet ? 16 : 14,
      fontFamily: 'RobotoSlab-Regular',
      marginBottom: 20,
      textAlign: 'center',
      color: isDarkMode ? '#ccc' : '#212121',
      lineHeight: 22,
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

export default AccountDelete;
