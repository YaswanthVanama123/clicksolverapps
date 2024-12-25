import React, {useEffect, useState} from 'react';
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
import {useRoute, useNavigation} from '@react-navigation/native';

const SignUpScreen = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const route = useRoute();
  const navigation = useNavigation();

  useEffect(() => {
    const {phone_number} = route.params || {};
    if (phone_number) {
      setPhoneNumber(phone_number);
    }
  }, [route.params]);

  const handleSignUp = async () => {
    try {
      const response = await axios.post(
        `${process.env.BackendAPI17}/api/worker/signup`,
        {
          fullName,
          email,
          phoneNumber,
        },
      );

      const {token} = response.data;
      console.log(response.data);
      if (token) {
        await EncryptedStorage.setItem('sign_up', 'true');
        await EncryptedStorage.setItem('pcs_token', token);
        navigation.replace('PartnerSteps');
      }
    } catch (error) {
      console.error('Sign up error:', error);
      Alert.alert(
        'Sign Up Failed',
        'An error occurred during sign up. Please try again.',
      );
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton}>
        <FontAwesome6 name="arrow-left-long" size={24} color="#000080" />
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
        icon={<Icon name="envelope" size={20} color="#000080" />}
        keyboardType="email-address"
      />

      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
};

const InputField = ({placeholder, value, onChangeText, icon, keyboardType}) => (
  <View style={[styles.inputContainer, icon && styles.emailContainer]}>
    {icon}
    <TextInput
      style={icon ? styles.inputWithIcon : styles.input}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      placeholderTextColor="#999"
      keyboardType={keyboardType}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#000080',
  },
  inputContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    borderColor: '#ccc',
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
    fontSize: 16,
    color: '#333',
  },
  inputWithIcon: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
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
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SignUpScreen;
