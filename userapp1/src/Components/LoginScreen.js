import React, {useState, useCallback} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
} from 'react-native';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import {
  useNavigation,
  CommonActions,
  useFocusEffect,
} from '@react-navigation/native';
// import Config from 'react-native-config';

// Image URLs
const BG_IMAGE_URL =
  'https://i.postimg.cc/rFFQLGRh/Picsart-24-10-01-15-38-43-205.jpg';
const LOGO_URL = 'https://i.postimg.cc/hjjpy2SW/Button-1.png';
const FLAG_ICON_URL = 'https://i.postimg.cc/C1hkm5sR/india-flag-icon-29.png';

const LoginScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      // Attach the back handler
      BackHandler.addEventListener('hardwareBackPress', handleBackPress);

      // Cleanup the event listener on unfocus
      return () => {
        BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
      };
    }, [handleBackPress]),
  );

  // Function to call the backend API for login
  const loginBackend = useCallback(async phoneNumber => {
    try {
      const response = await axios.post(
        `https://backend.clicksolver.com/api/user/login`,
        {
          phone_number: phoneNumber,
        },
      );
      return response;
    } catch (error) {
      console.error('Error during backend login:', error);
      throw error;
    }
  }, []);

  const handleBackPress = useCallback(() => {
    navigation.goBack(); // Navigate back to the previous screen
    return true; // Prevent default behavior (exit the app)
  }, [navigation]);

  // Main login function
  const login = useCallback(async () => {
    if (!phoneNumber) return; // Early return if phone number is empty

    try {
      const response = await loginBackend(phoneNumber);
      const {status, data} = response;
      console.log('status', status);
      if (status === 200) {
        // Worker already signed up
        const {token} = data;
        await EncryptedStorage.setItem('cs_token', token);
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: 'Tabs', state: {routes: [{name: 'Home'}]}}],
          }),
        );
      } else if (status === 205) {
        // Worker not signed up, navigate to signup
        navigation.navigate('SignupDetails', {phone_number: phoneNumber});
      }
    } catch (error) {
      console.error('Error during login:', error);
    }
  }, [phoneNumber, loginBackend, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ImageBackground
          source={{uri: BG_IMAGE_URL}}
          style={styles.backgroundImage}
          resizeMode="stretch">
          <View style={styles.contentOverlay}>
            {/* Logo and Heading */}
            <View style={styles.description}>
              <View style={styles.logoContainer}>
                <Image source={{uri: LOGO_URL}} style={styles.logo} />
                <Text style={styles.heading}>
                  Click <Text style={styles.solverText}>Solver</Text>
                </Text>
              </View>
              <Text style={styles.subheading}>ALL HOME Service Expert</Text>
              <Text style={styles.tagline}>Instant Affordable Trusted</Text>
            </View>

            {/* Mobile Input */}
            <View style={styles.inputContainer}>
              <View style={styles.countryCodeContainer}>
                <Image source={{uri: FLAG_ICON_URL}} style={styles.flagIcon} />
                <Text style={styles.picker}>91</Text>
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

            {/* Get Verification Code Button */}
            <TouchableOpacity style={styles.button} onPress={login}>
              <Text style={styles.buttonText}>Get Verification Code</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  keyboardAvoidingView: {flex: 1},
  backgroundImage: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  solverText: {color: '#212121', fontWeight: 'bold'},
  description: {flexDirection: 'column', marginLeft: 10},
  contentOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {flexDirection: 'row', gap: 10, alignItems: 'center'},
  logo: {width: 60, height: 60, marginBottom: 10},
  heading: {
    fontSize: 26,
    lineHeight: 26,
    fontWeight: 'bold',
    color: '#212121',
    width: 100,
  },
  subheading: {fontSize: 16, fontWeight: 'bold', color: '#333'},
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
  flagIcon: {width: 24, height: 24},
  picker: {fontSize: 17, color: '#212121', padding: 10, fontWeight: 'bold'},
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
  buttonText: {color: '#ffffff', fontSize: 16, fontWeight: 'bold'},
});

export default LoginScreen;
