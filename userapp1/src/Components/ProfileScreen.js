import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator, // Import ActivityIndicator
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import EncryptedStorage from 'react-native-encrypted-storage';
import {useNavigation} from '@react-navigation/native';
import axios from 'axios';
import {SafeAreaView} from 'react-native-safe-area-context';
// import Config from 'react-native-config';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [account, setAccount] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true); // New loading state

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
        `https://backend.clicksolver.com/api/user/profile`,
        {},
        {
          headers: {Authorization: `Bearer ${jwtToken}`},
        },
      );

      const {name, email, phone_number} = response.data;
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
      await EncryptedStorage.removeItem('cs_token');
      await EncryptedStorage.removeItem('fcm_token');
      await EncryptedStorage.removeItem('notifications');
      await EncryptedStorage.removeItem('messageBox');
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const MenuItem = ({icon, text, onPress}) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <MaterialIcons name={icon} size={22} color="#4a4a4a" />
      <Text style={styles.menuText}>{text}</Text>
      <Entypo name="chevron-right" size={20} color="#4a4a4a" />
    </TouchableOpacity>
  );

  // If the user is not logged in, show the login container.
  if (!isLoggedIn) {
    return (
      <View
        style={[
          styles.loginContainer,
          {alignItems: 'flex-start', justifyContent: 'flex-start'},
        ]}>
        <View style={styles.head}>
          <Text style={styles.profileTitle}>Profile</Text>
        </View>
        <View>
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => navigation.push('Login')}>
              <Text style={styles.loginButtonText}>Login or Sign up</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.horizontalLine} />
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

  // If the user is logged in but profile details are still loading, show an ActivityIndicator.
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
                source={{uri: 'https://flagcdn.com/w40/in.png'}}
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
            onPress={() => navigation.push('DeleteAccount', {details: account})}
          />
          <MenuItem
            icon="mode-edit-outline"
            text="Edit Profile"
            onPress={() => navigation.push('EditProfile', {details: account})}
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
    backgroundColor: '#FFFFFF',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  profileTitle: {
    fontSize: 18,
    color: '#212121',
    fontFamily: 'RobotoSlab-SemiBold',
    paddingVertical: 10,
    paddingLeft: 15,
  },
  detailsContainer: {
    padding: 20,
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 25,
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
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  profileName: {
    fontSize: 22,
    fontFamily: 'RobotoSlab-Medium',
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderColor: '#EDEDF0',
    height: 45,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'RobotoSlab-Regular',
    marginLeft: 10,
    color: '#333',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderColor: '#EDEDF0',
    height: 45,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 2,
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
    fontSize: 15,
    fontFamily: 'RobotoSlab-Regular',
    color: '#333',
  },
  phoneInput: {
    fontSize: 15,
    fontFamily: 'RobotoSlab-Regular',
    color: '#333',
    width: '100%',
  },
  divider: {
    height: 3,
    backgroundColor: '#E0E0E0',
    marginVertical: 15,
  },
  optionsContainer: {
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomColor: '#E0E0E0',
    borderBottomWidth: 1,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    marginLeft: 10,
    color: '#333',
    fontFamily: 'RobotoSlab-Regular',
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#9e9e9e',
  },
  logoutText: {
    color: '#212121',
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 16,
  },
  headerContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  loginContainer: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  loginPrompt: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#ff4500',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  horizontalLine: {
    height: 10,
    width: screenWidth,
    backgroundColor: '#E6E6E6',
    marginVertical: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileScreen;
