import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import EncryptedStorage from 'react-native-encrypted-storage';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';

const ProfileScreen = () => {
  // 1) Get screen width & height
  const { width, height } = useWindowDimensions();
  // 2) Generate dynamic styles
  const styles = dynamicStyles(width, height);

  const navigation = useNavigation();
  const [account, setAccount] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false); // error state

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

      const response = await axios.post(
        `http://192.168.55.102:5000/api/user/profile`,
        {},
        {
          headers: { Authorization: `Bearer ${jwtToken}` },
        },
      );

      const { name, email, phone_number } = response.data;
      setAccount({
        name,
        email,
        phoneNumber: phone_number,
      });
    } catch (error) {
      console.error('Error fetching profile details:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileDetails();
  }, []);

  const handleLogout = async () => {
    try {
      const fcm_token = await EncryptedStorage.getItem('fcm_token');

      if (fcm_token) {
        await axios.post('http://192.168.55.102:5000/api/userLogout', {
          fcm_token,
        });
      }

      await EncryptedStorage.removeItem('cs_token');
      await EncryptedStorage.removeItem('fcm_token');
      await EncryptedStorage.removeItem('notifications');
      await EncryptedStorage.removeItem('messageBox');
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const MenuItem = ({ icon, text, onPress }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <MaterialIcons name={icon} size={22} color="#4a4a4a" />
      <Text style={styles.menuText}>{text}</Text>
      <Entypo name="chevron-right" size={20} color="#4a4a4a" />
    </TouchableOpacity>
  );

  // Not logged in UI
  if (!isLoggedIn) {
    return (
      <View style={styles.loginContainer}>
        <View style={styles.head}>
          <Text style={styles.profileTitle}>Profile</Text>
        </View>
        <View style={styles.loginInnerContainer}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => navigation.push('Login')}
            >
              <Text style={styles.loginButtonText}>Login or Sign up</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.separator} />
          <View style={styles.optionsContainer}>
            <MenuItem
              icon="help"
              text="Help & Support"
              onPress={() => navigation.push('Help')}
            />
            <MenuItem
              icon="info"
              text="About CS"
              onPress={() => console.log('Navigate to About CS')}
            />
          </View>
        </View>
      </View>
    );
  }

  // Loading state UI with Lottie animation at the top, full width, fixed height
  if (isLoggedIn && loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <LottieView
            source={require('../assets/profileAnimation.json')}
            autoPlay
            loop
            style={styles.loadingAnimation}
          />
        </View>
        {/* If you want a scrollable area or other content below the animation,
            you could place more Views or ScrollViews here. */}
      </SafeAreaView>
    );
  }

  // Error state UI with Retry button
  if (isLoggedIn && error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Something went wrong. Please try again.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchProfileDetails}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.detailsContainer}>
          <View style={styles.profileContainer}>
            <View style={styles.profileImage}>
              <MaterialIcons name="person" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.profileName}>{account.name}</Text>
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={24} color="#4a4a4a" />
            <TextInput
              value={account.email}
              editable={false}
              style={styles.input}
            />
          </View>

          <View style={styles.phoneContainer}>
            <View style={styles.flagAndCode}>
              <Image
                source={{ uri: 'https://flagcdn.com/w40/in.png' }}
                style={styles.flagIcon}
              />
              <Text style={styles.countryCode}>+91</Text>
            </View>
            <TextInput
              value={account.phoneNumber}
              editable={false}
              style={styles.phoneInput}
            />
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.optionsContainer}>
          <MenuItem
            icon="book"
            text="My Services"
            onPress={() => navigation.push('RecentServices')}
          />
          <MenuItem
            icon="help"
            text="Help & Support"
            onPress={() => navigation.push('Help')}
          />
          <MenuItem
            icon="star"
            text="Account Delete"
            onPress={() => navigation.push('DeleteAccount', { details: account })}
          />
          <MenuItem
            icon="mode-edit-outline"
            text="Edit Profile"
            onPress={() => navigation.push('EditProfile', { details: account })}
          />
          <MenuItem
            icon="mode-edit-outline"
            text="Refer & Earn"
            onPress={() => navigation.push('ReferralScreen')}
          />
          <MenuItem
            icon="info"
            text="About CS"
            onPress={() => navigation.push('AboutCS')}
          />

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const dynamicStyles = (width, height) => {
  const isTablet = width >= 600;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#fff',
    },
    container: {
      paddingBottom: 20,
      backgroundColor: '#fff',
    },
    head: {},
    profileTitle: {
      fontSize: isTablet ? 22 : 20,
      color: '#212121',
      fontFamily: 'RobotoSlab-SemiBold',
      textAlign: 'center',
    },
    detailsContainer: {
      padding: isTablet ? 30 : 20,
    },
    profileContainer: {
      alignItems: 'center',
      marginBottom: isTablet ? 40 : 30,
    },
    profileImage: {
      width: isTablet ? 100 : 80,
      height: isTablet ? 100 : 80,
      borderRadius: isTablet ? 50 : 40,
      backgroundColor: '#FF7043',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    profileName: {
      fontSize: isTablet ? 24 : 22,
      fontFamily: 'RobotoSlab-Medium',
      color: '#333',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F7F7F7',
      borderColor: '#E0E0E0',
      height: isTablet ? 60 : 50,
      paddingHorizontal: isTablet ? 20 : 15,
      borderRadius: isTablet ? 14 : 12,
      marginVertical: isTablet ? 10 : 8,
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 1,
    },
    input: {
      flex: 1,
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'RobotoSlab-Regular',
      marginLeft: 10,
      color: '#333',
    },
    phoneContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F7F7F7',
      borderColor: '#E0E0E0',
      height: isTablet ? 60 : 50,
      paddingHorizontal: isTablet ? 20 : 15,
      borderRadius: isTablet ? 14 : 12,
      marginVertical: isTablet ? 10 : 8,
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 1,
    },
    flagAndCode: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    flagIcon: {
      width: isTablet ? 28 : 22,
      height: isTablet ? 22 : 17,
      marginRight: 8,
    },
    countryCode: {
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'RobotoSlab-Regular',
      color: '#333',
    },
    phoneInput: {
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'RobotoSlab-Regular',
      color: '#333',
      flex: 1,
      marginLeft: 10,
    },
    divider: {
      height: isTablet ? 4 : 3,
      backgroundColor: '#EDEDED',
    },
    optionsContainer: {
      paddingHorizontal: isTablet ? 30 : 20,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: isTablet ? 16 : 14,
      borderBottomColor: '#EDEDED',
      borderBottomWidth: 1,
    },
    menuText: {
      flex: 1,
      fontSize: isTablet ? 18 : 16,
      marginLeft: 12,
      color: '#333',
      fontFamily: 'RobotoSlab-Regular',
    },
    logoutButton: {
      backgroundColor: '#fff',
      paddingVertical: isTablet ? 14 : 12,
      borderRadius: isTablet ? 14 : 12,
      alignItems: 'center',
      marginTop: isTablet ? 40 : 30,
      borderWidth: 1,
      borderColor: '#ccc',
    },
    logoutText: {
      color: '#212121',
      fontFamily: 'RobotoSlab-Medium',
      fontSize: isTablet ? 18 : 16,
    },
    loginContainer: {
      flex: 1,
      backgroundColor: '#fff',
      paddingTop: isTablet ? 60 : 40,
      paddingHorizontal: isTablet ? 30 : 20,
    },
    loginInnerContainer: {
      marginTop: isTablet ? 60 : 40,
      width: '100%',
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
    },
    loginButton: {
      backgroundColor: '#FF4500',
      paddingVertical: isTablet ? 14 : 12,
      borderRadius: isTablet ? 14 : 12,
      alignItems: 'center',
      width: isTablet ? 220 : 180,
    },
    loginButtonText: {
      color: '#fff',
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'RobotoSlab-Medium',
    },
    separator: {
      height: 12,
      backgroundColor: '#F0F0F0',
      marginVertical: isTablet ? 30 : 20,
    },
    // LOADING & ERROR
    loadingContainer: {
      // remove flex: 1 to avoid filling entire screen
      width: '100%',
      height: 300,        // fixed height for the top portion
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    loadingAnimation: {
      width: '100%',
      height: '100%',
      // optional: 'cover' so the animation scales properly
      // resizeMode: 'cover',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    errorText: {
      fontSize: isTablet ? 18 : 16,
      color: '#000',
      marginBottom: 10,
      fontFamily: 'RobotoSlab-Medium',
      textAlign: 'center',
    },
    retryButton: {
      backgroundColor: '#FF4500',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 5,
    },
    retryButtonText: {
      color: '#fff',
      fontSize: isTablet ? 16 : 14,
      fontFamily: 'RobotoSlab-Medium',
    },
  });
};

export default ProfileScreen;
