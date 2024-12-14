import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
} from 'react-native';
import {useRoute, useNavigation, CommonActions} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';

const EditProfile = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const route = useRoute();
  const navigation = useNavigation();

  const fetchProfileDetails = async () => {
    const {details} = route.params;
    console.log('Fetched Details: ', details); // Debug log
    setEmail(details.email);
    setPhone(details.phoneNumber);
    setFullName(details.name);
  };

  const updateProfile = async () => {
    try {
      const jwtToken = await EncryptedStorage.getItem('cs_token');
      console.log('JWT Token: ', jwtToken); // Log the JWT token for debugging

      if (!jwtToken) {
        console.error('No JWT token found');
        return;
      }

      console.log(
        'Sending request to update profile with name:',
        fullName,
        email,
        phone,
      ); // Debug log
      const response = await axios.post(
        `${process.env.BACKENDAIPH}/api/user/details/update`,
        {name: fullName, email, phone},
        {
          headers: {Authorization: `Bearer ${jwtToken}`},
        },
      );

      console.log('Response from server: ', response.status);

      if (response.status === 200) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: 'Tabs', state: {routes: [{name: 'Account'}]}}],
          }),
        );
      } else {
        console.error('Failed to update profile. Status: ', response.status);
      }
    } catch (error) {
      console.error('Error response: ', error.response?.data || error.message);
    }
  };

  useEffect(() => {
    fetchProfileDetails();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Icon
          name="arrow-back"
          size={24}
          color="#000"
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerText}>Edit Profile</Text>
      </View>

      <View style={styles.form}>
        <View>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <View>
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputWithIcon}>
            <Icon name="email" size={20} color="gray" />
            <TextInput
              style={styles.inputText}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
          </View>
        </View>

        <View>
          <Text style={styles.label}>Phone Number</Text>
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
            />
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={updateProfile}>
          <Text style={styles.buttonText}>Update Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#1D2951',
    textAlign: 'center',
  },
  form: {
    marginTop: 10,
    flexDirection: 'column',
    gap: 10,
  },
  label: {
    fontSize: 14,
    color: '#4a4a4a',
    marginBottom: 5,
    marginTop: 15,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
    color: '#212121',
    fontSize: 16,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
  },
  inputText: {
    flex: 1,
    marginLeft: 10,
    color: '#212121',
    fontSize: 16,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
  },
  flagIcon: {
    width: 24,
    height: 16,
    marginRight: 8,
  },
  callingCode: {
    marginRight: 10,
    fontSize: 16,
    color: '#212121',
  },
  phoneInput: {
    flex: 1,
    color: '#212121',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FF4500',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditProfile;
