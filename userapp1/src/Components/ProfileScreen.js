/**
 * ProfileScreen Component
 * Main user profile screen displaying user information, settings, and navigation options
 * Features: profile image upload, theme toggle, logout, and navigation to various profile-related screens
 *
 * @module ProfileScreen
 */

import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import Entypo from 'react-native-vector-icons/Entypo';
import {SafeAreaView} from 'react-native-safe-area-context';
import {launchImageLibrary} from 'react-native-image-picker';
import EncryptedStorage from 'react-native-encrypted-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';

// Theme and utilities
import {useTheme} from '../context/ThemeContext';
import {useTranslation} from 'react-i18next';
import '../i18n/i18n';

// State components
import LoadingState from '../Components/molecules/LoadingState';
import ErrorState from '../Components/molecules/ErrorState';

// API services
import {getUserProfile, updateProfileImage} from '../api/services/user.service';

// Store
import useUserStore from '../store/userStore';

// Validators and formatters
import {validateEmail, validatePhone} from '../utils/validators';
import {formatPhoneNumber} from '../utils/formatters';

/**
 * Helper function to upload an image to external service
 * @param {string} uri - Local image URI
 * @returns {Promise<string>} - Uploaded image URL
 * @throws {Error} - If upload fails
 */
const uploadImage = async uri => {
  const apiKey = '287b4ba48139a6a59e75b5a8266bbea2';
  const apiUrl = 'https://api.imgbb.com/1/upload';

  const formData = new FormData();
  formData.append('key', apiKey);
  formData.append('image', {
    uri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  });

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();

    if (response.ok && data.data) {
      return data.data.url;
    } else {
      throw new Error(`Upload failed with status ${response.status}`);
    }
  } catch (error) {
    console.error('Image upload failed:', error.message);
    throw error;
  }
};

/**
 * ProfileScreen Component
 * @returns {JSX.Element} Profile screen with user details and navigation options
 */
const ProfileScreen = () => {
  const navigation = useNavigation();
  const [account, setAccount] = useState({});
  const [image, setImage] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  // Global theme and translations
  const {isDarkMode, toggleTheme} = useTheme();
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();

  // User store
  const {setProfile, clearUserData} = useUserStore();

  /**
   * Fetch profile details from backend
   * @async
   */
  const fetchProfileDetails = async () => {
    try {
      setLoading(true);
      setError(false);

      const jwtToken = await EncryptedStorage.getItem('cs_token');
      if (!jwtToken) {
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }

      setIsLoggedIn(true);

      // Use API service
      const profileData = await getUserProfile();
      const {name, email, phone_number, profile} = profileData;

      // Validate data
      if (email && !validateEmail(email)) {
        console.warn('Invalid email format:', email);
      }

      if (phone_number && !validatePhone(phone_number)) {
        console.warn('Invalid phone format:', phone_number);
      }

      setImage(profile);
      const userData = {
        name,
        email,
        phoneNumber: phone_number,
        profile,
      };

      setAccount(userData);

      // Update store
      setProfile(userData);

    } catch (err) {
      console.error('Error fetching profile details:', err);
      if (err.response && err.response.status === 401) {
        await EncryptedStorage.removeItem('cs_token');
        setIsLoggedIn(false);
      } else {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch profile details whenever the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchProfileDetails();
    }, []),
  );

  /**
   * Handle image editing (uploading a new profile image)
   * @async
   */
  const handleEditImage = async () => {
    const options = {mediaType: 'photo', quality: 0.8};
    launchImageLibrary(options, async response => {
      if (response.didCancel) {
        return;
      } else if (response.errorMessage) {
        console.error('ImagePicker Error:', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const uri = response.assets[0].uri;
        try {
          const uploadedUrl = await uploadImage(uri);
          setImage(uploadedUrl);

          const jwtToken = await EncryptedStorage.getItem('cs_token');
          if (jwtToken) {
            // Use API service
            await updateProfileImage(uploadedUrl);
            setAccount(prev => ({...prev, profileImage: uploadedUrl}));
          }
        } catch (error) {
          console.error('Error uploading image:', error);
        }
      }
    });
  };

  /**
   * Handle user logout
   * Clears all user data and navigates to login screen
   * @async
   */
  const handleLogout = async () => {
    try {
      const userFcmToken = await EncryptedStorage.getItem('user_fcm_token');

      if (userFcmToken) {
        try {
          const response = await fetch(
            'https://backend.clicksolver.com/api/userLogout',
            {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({user_fcm_token: userFcmToken}),
            }
          );

          if (response.status !== 200) {
            console.warn('Logout API returned status', response.status);
          }
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
          console.log(`Removed ${key} from storage`);
        }
      }

      // Clear user store
      await clearUserData();

      // Update UI state & navigate
      setIsLoggedIn(false);
      setLogoutModalVisible(false);
      navigation.navigate('Login');
    } catch (err) {
      console.error('Error in logout flow:', err);
    }
  };

  /**
   * Show logout confirmation modal
   */
  const confirmLogout = () => setLogoutModalVisible(true);

  /**
   * Close logout modal
   */
  const closeModal = () => setLogoutModalVisible(false);

  // Not logged in state
  if (!isLoggedIn) {
    return (
      <View style={styles.loginContainer}>
        <Text style={styles.profileTitle}>{t('profile')}</Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.push('Login')}>
          <Text style={styles.loginButtonText}>{t('login_or_signup')}</Text>
        </TouchableOpacity>
        <View style={styles.optionsContainer}>
          <View style={styles.menuItem}>
            <Ionicons
              name={isDarkMode ? 'moon-outline' : 'sunny-outline'}
              size={22}
              color={styles.toggleIconColor}
            />
            <Text style={[styles.menuText, {marginLeft: 12}]}>
              {isDarkMode ? t('dark_theme') : t('light_theme')}
            </Text>
            <TouchableOpacity
              style={[
                styles.toggleTrack,
                isDarkMode
                  ? styles.toggleTrackEnabled
                  : styles.toggleTrackDisabled,
              ]}
              onPress={toggleTheme}>
              <View
                style={[
                  styles.toggleThumb,
                  isDarkMode
                    ? styles.toggleThumbEnabled
                    : styles.toggleThumbDisabled,
                ]}
              />
            </TouchableOpacity>
          </View>
          <HelpMenuItem
            styles={styles}
            text={t('help_and_support')}
            onPress={() => navigation.push('Help')}
          />
          <AboutCSMenuItem
            styles={styles}
            text={t('about_cs')}
            onPress={() => navigation.push('AboutCS')}
          />
          <LanguageChangeMenuItem
            styles={styles}
            text={t('change_language')}
            onPress={() => navigation.push('LanguageSelector')}
          />
        </View>
      </View>
    );
  }

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingState message={t('loading_profile') || 'Loading profile...'} />
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          error={t('something_went_wrong')}
          onRetry={fetchProfileDetails}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Profile Header */}
        <View style={styles.detailsContainer}>
          <View style={styles.profileContainer}>
            <View style={styles.profileImageContainer}>
              {image ? (
                <Image source={{uri: image}} style={styles.profileImage} />
              ) : (
                <View style={[styles.profileImage, styles.profilePlaceholder]}>
                  <MaterialIcons name="person" size={40} color="#FFFFFF" />
                </View>
              )}
              <TouchableOpacity
                style={styles.editIconContainer}
                onPress={handleEditImage}>
                <MaterialIcons name="edit" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.profileName}>{account.name}</Text>
          </View>

          {/* Email Field */}
          <View style={styles.inputContainer}>
            <MaterialIcons
              name="email"
              size={24}
              color={isDarkMode ? '#fff' : '#4a4a4a'}
            />
            <TextInput
              value={account.email}
              editable={false}
              style={styles.input}
            />
          </View>

          {/* Phone Field */}
          <View style={styles.phoneContainer}>
            <View style={styles.flagAndCode}>
              <Image
                source={{uri: 'https://flagcdn.com/w40/in.png'}}
                style={styles.flagIcon}
              />
              <Text style={styles.countryCode}>+91</Text>
            </View>
            <TextInput
              value={formatPhoneNumber(account.phoneNumber) || account.phoneNumber}
              editable={false}
              style={styles.phoneInput}
            />
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.optionsContainer}>
          {/* Dark/Light Theme Toggle */}
          <View style={styles.menuItem}>
            <Ionicons
              name={isDarkMode ? 'moon-outline' : 'sunny-outline'}
              size={22}
              color={styles.toggleIconColor}
            />
            <Text style={[styles.menuText, {marginLeft: 12}]}>
              {isDarkMode ? t('dark_theme') : t('light_theme')}
            </Text>
            <TouchableOpacity
              style={[
                styles.toggleTrack,
                isDarkMode
                  ? styles.toggleTrackEnabled
                  : styles.toggleTrackDisabled,
              ]}
              onPress={toggleTheme}>
              <View
                style={[
                  styles.toggleThumb,
                  isDarkMode
                    ? styles.toggleThumbEnabled
                    : styles.toggleThumbDisabled,
                ]}
              />
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <ProfileMenuItem
            styles={styles}
            text={t('my_services')}
            onPress={() => navigation.push('RecentServices')}
          />
          <HelpMenuItem
            styles={styles}
            text={t('help_and_support')}
            onPress={() => navigation.push('Help')}
          />
          <DeleteAccountMenuItem
            styles={styles}
            text={t('account_delete')}
            onPress={() => navigation.push('DeleteAccount', {details: account})}
          />
          <EditProfileMenuItem
            styles={styles}
            text={t('edit_profile')}
            onPress={() => navigation.push('EditProfile', {details: account})}
          />
          <ReferEarnMenuItem
            styles={styles}
            text={t('refer_and_earn')}
            onPress={() => navigation.push('ReferralScreen')}
          />
          <LanguageChangeMenuItem
            styles={styles}
            text={t('change_language')}
            onPress={() => navigation.push('LanguageSelector')}
          />
          <AboutCSMenuItem
            styles={styles}
            text={t('about_cs')}
            onPress={() => navigation.push('AboutCS')}
          />
          <LogoutMenuItem
            styles={styles}
            text={t('logout')}
            onPress={confirmLogout}
          />
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={logoutModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}>
        <TouchableOpacity
          style={styles.bottomSheetOverlay}
          activeOpacity={1}
          onPress={closeModal}>
          <View style={styles.bottomSheetContainer}>
            <View style={styles.bottomSheetCard}>
              <Text style={styles.bottomSheetTitle}>
                {t('logout_confirmation')}
              </Text>
              <Text style={styles.bottomSheetMessage}>
                {t('logout_confirmation_message')}
              </Text>
              <TouchableOpacity
                style={styles.logoutConfirmButton}
                onPress={handleLogout}>
                <Text style={styles.logoutConfirmButtonText}>
                  {t('yes_logout')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.logoutCancelButton}
                onPress={closeModal}>
                <Text style={styles.logoutCancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

/**
 * Menu Item Components
 */

const ProfileMenuItem = ({text, onPress, styles}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Ionicons name="bookmarks-outline" size={22} color={styles.iconColor} />
    <Text style={styles.menuText}>{text}</Text>
  </TouchableOpacity>
);

const HelpMenuItem = ({text, onPress, styles}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Ionicons name="help-circle-outline" size={22} color={styles.iconColor} />
    <Text style={styles.menuText}>{text}</Text>
  </TouchableOpacity>
);

const DeleteAccountMenuItem = ({text, onPress, styles}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <MaterialCommunityIcons
      name="delete-outline"
      size={22}
      color={styles.iconColor}
    />
    <Text style={styles.menuText}>{text}</Text>
  </TouchableOpacity>
);

const EditProfileMenuItem = ({text, onPress, styles}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <MaterialCommunityIcons
      name="account-outline"
      size={22}
      color={styles.iconColor}
    />
    <Text style={styles.menuText}>{text}</Text>
  </TouchableOpacity>
);

const ReferEarnMenuItem = ({text, onPress, styles}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <EvilIcons name="share-apple" size={22} color={styles.iconColor} />
    <Text style={styles.menuText}>{text}</Text>
  </TouchableOpacity>
);

const AboutCSMenuItem = ({text, onPress, styles}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <AntDesign name="info" size={22} color={styles.iconColor} />
    <Text style={styles.menuText}>{text}</Text>
  </TouchableOpacity>
);

const LogoutMenuItem = ({text, onPress, styles}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <MaterialIcons name="logout" size={22} color="#FF0000" />
    <Text style={styles.menuLogoutText}>{text}</Text>
  </TouchableOpacity>
);

const LanguageChangeMenuItem = ({text, onPress, styles}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Entypo name="language" size={22} color={styles.iconColor} />
    <Text style={styles.menuText}>{text}</Text>
  </TouchableOpacity>
);

/**
 * Dynamic styles based on theme
 * @param {boolean} isDarkMode - Whether dark mode is active
 * @returns {object} StyleSheet object
 */
const dynamicStyles = isDarkMode => {
  const backgroundColor = isDarkMode ? '#121212' : '#fff';
  const textColor = isDarkMode ? '#fff' : '#333';
  const inputBackground = isDarkMode ? '#333' : '#F7F7F7';
  const borderColor = isDarkMode ? '#444' : '#E0E0E0';
  const iconColor = isDarkMode ? '#fff' : '#4a4a4a';

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor,
    },
    container: {
      paddingBottom: 20,
      backgroundColor,
    },
    profileTitle: {
      fontSize: 20,
      textAlign: 'center',
      fontFamily: 'RobotoSlab-Medium',
      marginVertical: 20,
      color: textColor,
    },
    detailsContainer: {
      padding: 20,
    },
    profileContainer: {
      alignItems: 'center',
      marginBottom: 30,
    },
    profileImageContainer: {
      position: 'relative',
      width: 80,
      height: 80,
      marginBottom: 10,
    },
    profileImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
    },
    profilePlaceholder: {
      backgroundColor: '#FF7043',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 3},
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    editIconContainer: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: '#FF7043',
      borderRadius: 5,
      padding: 4,
    },
    profileName: {
      fontSize: 22,
      color: textColor,
      fontFamily: 'RobotoSlab-Medium',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: inputBackground,
      borderColor,
      height: 50,
      paddingHorizontal: 15,
      borderRadius: 12,
      marginVertical: 8,
      borderWidth: 1,
    },
    input: {
      flex: 1,
      fontSize: 16,
      fontFamily: 'RobotoSlab-Regular',
      marginLeft: 10,
      color: textColor,
    },
    phoneContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: inputBackground,
      borderColor,
      height: 50,
      paddingHorizontal: 15,
      borderRadius: 12,
      marginVertical: 8,
      borderWidth: 1,
    },
    flagAndCode: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    flagIcon: {
      width: 22,
      height: 17,
      marginRight: 8,
    },
    countryCode: {
      fontSize: 16,
      fontFamily: 'RobotoSlab-Regular',
      color: textColor,
    },
    phoneInput: {
      flex: 1,
      marginLeft: 10,
      fontSize: 16,
      fontFamily: 'RobotoSlab-Regular',
      color: textColor,
    },
    divider: {
      height: 3,
      backgroundColor: borderColor,
    },
    optionsContainer: {
      paddingHorizontal: 20,
      marginTop: 10,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
    },
    menuText: {
      flex: 1,
      marginLeft: 12,
      fontSize: 16,
      fontFamily: 'RobotoSlab-Regular',
      color: textColor,
    },
    menuLogoutText: {
      flex: 1,
      marginLeft: 12,
      fontSize: 16,
      fontFamily: 'RobotoSlab-Regular',
      color: '#FF0000',
    },
    loginContainer: {
      flex: 1,
      backgroundColor,
      paddingTop: 40,
      paddingHorizontal: 20,
    },
    loginButton: {
      backgroundColor: '#FF4500',
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      marginVertical: 20,
    },
    loginButtonText: {
      color: '#fff',
      fontSize: 16,
      fontFamily: 'RobotoSlab-Medium',
    },
    toggleTrack: {
      width: 50,
      height: 30,
      borderRadius: 15,
      padding: 2,
      justifyContent: 'center',
      marginLeft: 'auto',
    },
    toggleTrackEnabled: {
      backgroundColor: '#FF4500',
    },
    toggleTrackDisabled: {
      backgroundColor: '#E1DAD2',
    },
    toggleThumb: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: '#fff',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 3,
    },
    toggleThumbEnabled: {
      alignSelf: 'flex-end',
    },
    toggleThumbDisabled: {
      alignSelf: 'flex-start',
    },
    bottomSheetOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      justifyContent: 'flex-end',
    },
    bottomSheetContainer: {
      width: '100%',
      alignItems: 'center',
    },
    bottomSheetCard: {
      width: '100%',
      backgroundColor: isDarkMode ? '#333' : '#fff',
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 30,
      alignItems: 'center',
    },
    bottomSheetTitle: {
      fontSize: 18,
      fontFamily: 'RobotoSlab-SemiBold',
      color: isDarkMode ? '#FF7F7F' : '#D9534F',
      marginBottom: 10,
    },
    bottomSheetMessage: {
      fontSize: 16,
      fontFamily: 'RobotoSlab-Regular',
      color: isDarkMode ? '#ccc' : '#333',
      marginBottom: 25,
      textAlign: 'center',
    },
    logoutConfirmButton: {
      width: '100%',
      backgroundColor: isDarkMode ? '#FF4500' : '#ff4500',
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
      marginBottom: 10,
    },
    logoutConfirmButtonText: {
      color: '#fff',
      fontSize: 16,
      fontFamily: 'RobotoSlab-Medium',
    },
    logoutCancelButton: {
      width: '100%',
      backgroundColor: isDarkMode ? '#333' : '#fff',
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDarkMode ? '#444' : '#ccc',
    },
    logoutCancelButtonText: {
      color: isDarkMode ? '#fff' : '#333',
      fontSize: 16,
      fontFamily: 'RobotoSlab-Medium',
    },
    toggleIconColor: isDarkMode ? '#FFCC00' : '#FFA500',
    iconColor,
  });
};

export default ProfileScreen;
