import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useWindowDimensions } from 'react-native';
// Import the theme hook from your context
import { useTheme } from '../context/ThemeContext';

const SignUpScreen = () => {
  const { width } = useWindowDimensions();
  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(width, isDarkMode); // styles is defined here

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const route = useRoute();
  const navigation = useNavigation();

  useEffect(() => {
    const { phone_number } = route.params || {};
    if (phone_number) {
      setPhoneNumber(phone_number);
    }
  }, [route.params]);

  const handleSignUp = async () => {
    try {
      const response = await axios.post(
        'https://backend.clicksolver.com/api/worker/signup',
        {
          fullName,
          email,
          phoneNumber,
          referralCode,
        }
      );

      const { token, message } = response.data;
      console.log(response.data);

      if (token) {
        await EncryptedStorage.setItem('sign_up', 'true');
        await EncryptedStorage.setItem('pcs_token', token);
        Alert.alert('Sign Up Successful', message || 'You have signed up successfully.');
        navigation.replace('PartnerSteps');
      }
    } catch (error) {
      console.error('Sign up error:', error);
      const errorMessage =
        error.response?.data?.message ||
        'An error occurred during sign up. Please try again.';
      Alert.alert('Sign Up Failed', errorMessage);
    }
  };

  // Moved InputField inside SignUpScreen so it can access `styles`
  const InputField = ({
    placeholder,
    value,
    onChangeText,
    icon,
    keyboardType,
  }) => (
    <View style={[styles.inputContainer, icon && styles.emailContainer]}>
      {icon}
      <TextInput
        style={icon ? styles.inputWithIcon : styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#9e9e9e"
        keyboardType={keyboardType}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <FontAwesome6
          name="arrow-left-long"
          size={24}
          color={isDarkMode ? '#ffffff' : '#000080'}
        />
      </TouchableOpacity>

      <Text style={styles.title}>Sign Up</Text>

      <InputField
        placeholder="Full Name"
        value={fullName}
        onChangeText={setFullName}
      />

      <InputField
        placeholder="Email Address"
        value={email}
        onChangeText={setEmail}
        icon={<Icon name="envelope" size={20} color={isDarkMode ? '#ffffff' : '#000080'} />}
        keyboardType="email-address"
      />

      <InputField
        placeholder="Phone Number"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
        editable={false}  // This makes the input non-editable
      />


      <TextInput
        placeholder="Enter referral code (optional)"
        value={referralCode}
        onChangeText={setReferralCode}
        style={styles.input}
        placeholderTextColor={isDarkMode ? '#cccccc' : '#9e9e9e'}
      />

      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
};

function dynamicStyles(width, isDarkMode) {
  const isTablet = width >= 600;
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: 20,
      backgroundColor: isDarkMode ? '#121212' : '#ffffff',
    },
    backButton: {
      position: 'absolute',
      top: 20,
      left: 10,
    },
    title: {
      fontSize: isTablet ? 28 : 24,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 30,
      color: isDarkMode ? '#ffffff' : '#000080',
    },
    inputContainer: {
      backgroundColor: isDarkMode ? '#333333' : '#F5F5F5',
      borderRadius: 10,
      borderColor: isDarkMode ? '#444444' : '#ccc',
      borderWidth: 1,
      marginBottom: 20,
      height: 50,
      justifyContent: 'center',
      paddingHorizontal: 10,
    },
    emailContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    input: {
      fontSize: isTablet ? 18 : 16,
      color: isDarkMode ? '#ffffff' : '#333333',
    },
    inputWithIcon: {
      flex: 1,
      fontSize: isTablet ? 18 : 16,
      marginLeft: 10,
      color: isDarkMode ? '#ffffff' : '#333333',
    },
    button: {
      backgroundColor: '#FF4500',
      borderRadius: 10,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 20,
    },
    buttonText: {
      color: '#ffffff',
      fontSize: isTablet ? 20 : 18,
      fontWeight: 'bold',
    },
  });
}

export default SignUpScreen;
