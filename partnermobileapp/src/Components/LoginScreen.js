import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  ActivityIndicator
} from 'react-native';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import {
  useNavigation,
  CommonActions,
  useFocusEffect,
} from '@react-navigation/native';

const BG_IMAGE_URL = 'https://i.postimg.cc/rFFQLGRh/Picsart-24-10-01-15-38-43-205.jpg';
const LOGO_URL = 'https://i.postimg.cc/hjjpy2SW/Button-1.png';
const FLAG_ICON_URL = 'https://i.postimg.cc/C1hkm5sR/india-flag-icon-29.png';

const LoginScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const loginBackend = async (phoneNumber) => {
    try {
      const response = await axios.post(
        `https://backend.clicksolver.com/api/worker/login`,
        { phone_number: phoneNumber }
      );
      return response;
    } catch (error) {
      console.error('Error during backend login:', error);
      throw error;
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }]
          })
        );
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation])
  );

  const login = async () => {
    if (!phoneNumber) return;

    setLoading(true); // Start loading indicator

    try {
      const response = await loginBackend(phoneNumber);

      if (!response) {
        console.error('No response received from backend');
        return;
      }

      const { status, data } = response;

      if (status === 200) {
        const { token, workerId } = data;
        if (token && workerId) {
          await EncryptedStorage.setItem('pcs_token', token);
          await EncryptedStorage.setItem('partnerSteps', 'completed');
          await EncryptedStorage.setItem('unique', String(workerId)); 
          await EncryptedStorage.setItem('verification', 'true');
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }]
            })
          );
        }
      } else if (status === 201) {
        const { token, workerId, stepsCompleted } = data;
        if (workerId && token) {
          await EncryptedStorage.setItem('pcs_token', token);
          await EncryptedStorage.setItem('unique', String(workerId));

          if (stepsCompleted) {
            await EncryptedStorage.setItem('partnerSteps', 'completed');
            navigation.replace('ApprovalScreen');
          } else {
            navigation.replace('PartnerSteps');
          }
        }
      } else if (status === 202) {
        navigation.replace('AdministratorDashboard');
      } else {
        const { phone_number } = data;
        if (phone_number) {
          navigation.push('SignupDetails', { phone_number });
        }
      }
    } catch (error) {
      console.error('Error during login:', error);
    } finally {
      setLoading(false); // Stop loading indicator
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Image source={{ uri: BG_IMAGE_URL }} style={StyleSheet.absoluteFillObject} resizeMode="stretch" />

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.contentOverlay}>
          <View style={styles.description}>
            <View style={styles.logoContainer}>
              <Image source={{ uri: LOGO_URL }} style={styles.logo} />
              <Text style={styles.heading}>
                Click <Text style={styles.solverText}>Solver</Text>
              </Text>
            </View>
            <Text style={styles.subheading}>ALL HOME Service Expert</Text>
            <Text style={styles.tagline}>Instant Affordable Trusted</Text>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.countryCodeContainer}>
              <Image source={{ uri: FLAG_ICON_URL }} style={styles.flagIcon} />
              <Text style={styles.picker}>+91</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter Mobile Number"
              placeholderTextColor="#9e9e9e"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#FF5720" style={styles.loader} />
          ) : (
            <TouchableOpacity style={styles.button} onPress={login}>
              <Text style={styles.buttonText}>Get Verification Code</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoidingView: { flex: 1 },
  solverText: { color: '#212121', fontWeight: 'bold' },
  description: { flexDirection: 'column', marginLeft: 10 },
  contentOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  logo: { width: 60, height: 60, marginBottom: 10 },
  heading: {
    fontSize: 26,
    lineHeight: 26,
    fontWeight: 'bold',
    color: '#212121',
    width: 100,
  },
  subheading: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  tagline: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingBottom: 70,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 20,
    width: '100%',
    height: 56,
    elevation: 5,
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: '#ccc',
    paddingRight: 10,
    width: 80,
  },
  flagIcon: { width: 24, height: 24 },
  picker: { fontSize: 17, color: '#212121', padding: 10, fontWeight: 'bold' },
  input: {
    flex: 1,
    height: 56,
    paddingLeft: 10,
    color: '#212121',
    fontSize: 16,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#FF5722',
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
    elevation: 5,
    marginTop: 25,
  },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  loader: { marginVertical: 20 },
});

export default LoginScreen;
