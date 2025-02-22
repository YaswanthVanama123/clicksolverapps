import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import EncryptedStorage from 'react-native-encrypted-storage';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [account, setAccount] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfileDetails = async () => {
    try {
      const jwtToken = await EncryptedStorage.getItem('cs_token');
      if (!jwtToken) {
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }
      setIsLoggedIn(true);

      const response = await axios.post(
        `http://192.168.55.101:5000/api/user/profile`,
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
            await axios.post('http://192.168.55.101:5000/api/userLogout', { fcm_token });
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
              onPress={() => navigation.push('Login')}>
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

  // Loading state UI
  if (isLoggedIn && loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5722" />
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
            onPress={() => console.log('Navigate to About CS')}
          />

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    paddingBottom: 20,
    backgroundColor: '#fff',
  }, 
  head: {

  },
  profileTitle: {
    fontSize: 20,
    color: '#212121',
    fontFamily: 'RobotoSlab-SemiBold',
    textAlign:'center'
  },
  detailsContainer: {
    padding: 20,
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    fontSize: 22,
    fontFamily: 'RobotoSlab-Medium',
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderColor: '#E0E0E0',
    height: 50,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'RobotoSlab-Regular',
    marginLeft: 10,
    color: '#333',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderColor: '#E0E0E0',
    height: 50,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginVertical: 8,
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
    width: 22,
    height: 17,
    marginRight: 8,
  },
  countryCode: {
    fontSize: 16,
    fontFamily: 'RobotoSlab-Regular',
    color: '#333',
  },
  phoneInput: {
    fontSize: 16,
    fontFamily: 'RobotoSlab-Regular',
    color: '#333',
    flex: 1,
    marginLeft: 10,
  },
  divider: {
    height: 3,
    backgroundColor: '#EDEDED',

  },
  optionsContainer: {
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomColor: '#EDEDED',
    borderBottomWidth: 1,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
    fontFamily: 'RobotoSlab-Regular',
  },
  logoutButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  logoutText: {
    color: '#212121',
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 16,
  },
  loginContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  loginInnerContainer: {
    marginTop: 40,
    width: '100%',
  },
  buttonContainer:{
    flexDirection:'row',
    justifyContent:'center'
  },
  loginButton: {
    backgroundColor: '#FF4500',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    width:180
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'RobotoSlab-Medium',
  },
  separator: {
    height: 12,
    backgroundColor: '#F0F0F0',
    marginVertical: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileScreen;
