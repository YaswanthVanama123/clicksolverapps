import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import { useRoute, useNavigation, CommonActions } from '@react-navigation/native';

const BG_IMAGE_URL = 'https://i.postimg.cc/rFFQLGRh/Picsart-24-10-01-15-38-43-205.jpg';

const SignUpScreen = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const route = useRoute();
  const navigation = useNavigation();

  // Extract optional parameters: phone_number, serviceName and id
  const { phone_number, serviceName, id } = route.params || {};

  useEffect(() => {
    if (phone_number) {
      setPhoneNumber(phone_number);
    }
  }, [phone_number]);

  const handleSignUp = async () => {
    try {
      const response = await axios.post(
        'https://backend.clicksolver.com/api/user/signup',
        {
          fullName,
          email,
          phoneNumber,
          referralCode,
        }
      );

      const { token, message } = response.data;
      if (token) {
        await EncryptedStorage.setItem('cs_token', token);
        Alert.alert(
          'Sign Up Successful',
          message || 'You have signed up successfully!'
        );

        // Check if serviceName and id exist to navigate to ServiceBooking screen with these params.
        if (serviceName && id) {
                      navigation.dispatch(
                        CommonActions.reset({
                          index: 0,
                          routes: [
                            {name: 'ServiceBooking', params: {serviceName,id}},
                          ],
                        }),
                      );
        } else {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {
                  name: 'Tabs',
                  state: { routes: [{ name: 'Home' }] },
                },
              ],
            })
          );
        }
      }
    } catch (error) {
      console.error('Sign up error:', error);
      Alert.alert(
        'Sign Up Failed',
        error.response?.data?.message ||
          'An error occurred during sign up. Please try again.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <ImageBackground
              source={{ uri: BG_IMAGE_URL }}
              style={styles.backgroundImage}
              resizeMode="stretch"
            >
              {/* Back button */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <FontAwesome6 name="arrow-left-long" size={24} color="#1D2951" />
              </TouchableOpacity>

              {/* Title */}
              <Text style={styles.title}>Sign Up</Text>

              {/* Form Fields */}
              <InputField
                placeholder="Full Name"
                value={fullName}
                onChangeText={setFullName}
              />

              <InputField
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                icon={<Icon name="envelope" size={20} color="#1D2951" />}
                keyboardType="email-address"
              />

              {/* Optional Referral Code Field */}
              <InputField
                placeholder="Referral Code (Optional)"
                value={referralCode}
                onChangeText={setReferralCode}
                icon={<FontAwesome6 name="gift" size={20} color="#1D2951" />}
              />

              {/* Sign Up Button */}
              <TouchableOpacity style={styles.button} onPress={handleSignUp}>
                <Text style={styles.buttonText}>Sign Up</Text>
              </TouchableOpacity>
            </ImageBackground>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

/* Reusable InputField component */
const InputField = ({ placeholder, value, onChangeText, icon, keyboardType }) => (
  <View style={styles.inputContainer}>
    {icon && <View style={styles.iconContainer}>{icon}</View>}
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      placeholderTextColor="#999"
      keyboardType={keyboardType}
    />
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  // Make content fill screen and center horizontally + vertically
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Background image covers the entire screen and also centers children
  backgroundImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center', // Center vertically
    alignItems: 'center',     // Center horizontally
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#1D2951',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    height: 50,
    paddingHorizontal: 10,
    marginBottom: 20,
    width: '75%', // doesn't stretch entire screen
  },
  iconContainer: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#FF5722',
    paddingVertical: 11,
    width: '50%',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    marginTop: 25,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SignUpScreen;
