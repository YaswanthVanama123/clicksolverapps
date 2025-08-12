// src/Components/LoginScreen.js

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
  ActivityIndicator,
  useWindowDimensions,
  Alert,
} from 'react-native';
import axios from 'axios';
import {
  useNavigation,
  useFocusEffect,
  useRoute,
  CommonActions,
} from '@react-navigation/native';
import {useTheme} from '../context/ThemeContext';
import EncryptedStorage from 'react-native-encrypted-storage';

const BG_IMAGE_URL =
  'https://i.postimg.cc/rFFQLGRh/Picsart-24-10-01-15-38-43-205.jpg';
const LOGO_URL = 'https://i.postimg.cc/hjjpy2SW/Button-1.png';
const FLAG_ICON_URL = 'https://i.postimg.cc/C1hkm5sR/india-flag-icon-29.png';

const LoginScreen = () => {
  const {width, height} = useWindowDimensions();
  const {isDarkMode} = useTheme();
  const styles = dynamicStyles(width, height, isDarkMode);

  const navigation = useNavigation();
  const route = useRoute();
  const {serviceName, id} = route.params || {};

  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle Android hardware back button
  const handleBackPress = useCallback(() => {
    navigation.goBack();
    return true;
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      BackHandler.addEventListener('hardwareBackPress', handleBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    }, [handleBackPress]),
  );

  // Call backend, handle errors & navigation
  const loginBackend = async phone => {
    setLoading(true);
    try {
      const {data} = await axios.get(
        'https://backend.clicksolver.com/api/admin/login',
        {params: {phone_number: phone}},
      );

      if (data.success && data.token) {
        // Store token
        await EncryptedStorage.setItem('acs_token', data.token);

        // Navigate to Dashboard
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: 'DashboardScreen'}],
          }),
        );
      } else {
        Alert.alert('Login failed', data.message || 'Invalid credentials');
      }
    } catch (err) {
      // Unwrap AggregateError if present
      if (err instanceof AggregateError && Array.isArray(err.errors)) {
        err.errors.forEach((e, idx) =>
          console.error(`Login error #${idx}:`, e),
        );
      } else {
        console.error('Login error:', err);
      }
      Alert.alert(
        'Network Error',
        err.message ||
          'Unable to reach server. Check your connection and try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(() => {
    if (phoneNumber.trim().length !== 10) {
      Alert.alert('Validation', 'Please enter a valid 10-digit phone number.');
      return;
    }
    loginBackend(phoneNumber.trim());
  }, [phoneNumber]);

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
            <View style={styles.logoSection}>
              <Image source={{uri: LOGO_URL}} style={styles.logo} />
              <Text style={styles.heading}>
                Click <Text style={styles.solverText}>Solver</Text>
              </Text>
              <Text style={styles.subheading}>ALL HOME Service Expert</Text>
              <Text style={styles.tagline}>Instant Affordable Trusted</Text>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.countryCodeContainer}>
                <Image source={{uri: FLAG_ICON_URL}} style={styles.flagIcon} />
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
              style={[styles.button, loading && {opacity: 0.7}]}
              onPress={login}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Get Verification Code</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default LoginScreen;

/* ------------------------------------------
   Dynamic Styles for Light/Dark Mode
------------------------------------------- */
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
      opacity: isDarkMode ? 0.85 : 1,
    },
    mainContainer: {flex: 1},
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
      color: isDarkMode ? '#fff' : '#212121',
      fontWeight: 'bold',
      marginBottom: 4,
    },
    solverText: {
      color: isDarkMode ? '#FF5722' : '#FF5722',
      fontWeight: 'bold',
    },
    subheading: {
      fontSize: isTablet ? 18 : 16,
      color: isDarkMode ? '#ddd' : '#333',
    },
    tagline: {
      fontSize: isTablet ? 16 : 14,
      color: isDarkMode ? '#aaa' : '#666',
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
  });
};
