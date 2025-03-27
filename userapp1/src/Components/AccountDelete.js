import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { useRoute, useNavigation, CommonActions } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import { useTheme } from '../context/ThemeContext';
// Import the translation hook from react-i18next
import { useTranslation } from 'react-i18next';

const AccountDelete = () => {
  const { width, height } = useWindowDimensions();
  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(width, height, isDarkMode);

  const navigation = useNavigation();
  const { t } = useTranslation();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const route = useRoute();

  const fetchProfileDetails = async () => {
    const { details } = route.params;
    setEmail(details.email);
    setPhone(details.phoneNumber);
    setFullName(details.name);
  };

  // Function to delete the account (update profile)
  const updateProfile = async () => {
    try {
      setUpdateLoading(true);
      const jwtToken = await EncryptedStorage.getItem('cs_token');

      if (!jwtToken) {
        console.error('No JWT token found');
        return;
      }

      const response = await axios.post(
        `https://backend.clicksolver.com/api/user/details/delete`,
        { name: fullName, email, phone },
        {
          headers: { Authorization: `Bearer ${jwtToken}` },
        }
      );

      if (response.status === 200) {
        // On successful account deletion, perform logout
        handleLogout();
      } else {
        console.error('Failed to update profile. Status: ', response.status);
      }
    } catch (error) {
      console.error('Error response: ', error.response?.data || error.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Logout: clear tokens and navigate to Login
  const handleLogout = async () => {
    try {
      const fcm_token = await EncryptedStorage.getItem('fcm_token');
      if (fcm_token) {
        await axios.post('https://backend.clicksolver.com/api/userLogout', { fcm_token });
      }
      await EncryptedStorage.removeItem('cs_token');
      await EncryptedStorage.removeItem('fcm_token');
      await EncryptedStorage.removeItem('notifications');
      await EncryptedStorage.removeItem('messageBox');

      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Open the confirmation modal
  const openConfirmationModal = () => {
    setModalVisible(true);
  };

  // Close modal and proceed with account deletion
  const handleUpdate = () => {
    setModalVisible(false);
    updateProfile();
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
          <View>
            <Text style={styles.label}>
              {t('full_name') || 'Full Name'}
            </Text>
            <TextInput
              style={styles.input}
              value={fullName}
              editable={false}
              onChangeText={setFullName}
              testID="fullName-input"
            />
          </View>

          <View>
            <Text style={styles.label}>
              {t('email_address') || 'Email Address'}
            </Text>
            <View style={styles.inputWithIcon}>
              <Icon name="email" size={20} color="gray" />
              <TextInput
                style={styles.inputText}
                value={email}
                editable={false}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
            </View>
          </View>

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
            style={styles.button}
            onPress={openConfirmationModal}
            disabled={updateLoading}
          >
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

      {/* Modal for confirmation */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {t('confirm_delete') || 'Confirm Delete'}
            </Text>
            <Text style={styles.modalMessage}>
              {t('confirm_delete_message') ||
                'Are you sure you want to delete your profile?'}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#ccc' }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>
                  {t('cancel') || 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#FF4500' }]}
                onPress={handleUpdate}
              >
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
      flexDirection: 'column',
      gap: isTablet ? 15 : 10,
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
      color: isDarkMode ? '#fff' : '#212121',
      fontFamily: 'RobotoSlab-Regular',
      fontSize: isTablet ? 18 : 16,
    },
    button: {
      backgroundColor: '#FF4500',
      height: isTablet ? 55 : 50,
      borderRadius: isTablet ? 27.5 : 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: isTablet ? 50 : 40,
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

export default AccountDelete;
