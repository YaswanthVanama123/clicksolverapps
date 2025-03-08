import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  ActivityIndicator,
  useWindowDimensions,
  Modal,
  ScrollView, // <-- Import Modal
} from 'react-native';
import {useRoute, useNavigation, CommonActions} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';

const AccountDelete = () => {
  const {width, height} = useWindowDimensions();
  const styles = dynamicStyles(width, height);

  const navigation = useNavigation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false); // <-- Modal visibility state

  const route = useRoute();

  const fetchProfileDetails = async () => {
    const {details} = route.params;
    setEmail(details.email);
    setPhone(details.phoneNumber);
    setFullName(details.name);
  };

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

      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Function that actually updates the profile
  const updateProfile = async () => {
    try {
      setUpdateLoading(true);
      const jwtToken = await EncryptedStorage.getItem('cs_token');

      if (!jwtToken) {
        console.error('No JWT token found');
        return;
      }

      const response = await axios.post(
        `http://192.168.55.102:5000/api/user/details/delete`,
        {name: fullName, email, phone},
        {
          headers: {Authorization: `Bearer ${jwtToken}`},
        },
      );

      if (response.status === 200) {

        handleLogout()

        
      } else {
        console.error('Failed to update profile. Status: ', response.status);
      }
    } catch (error) {
      console.error('Error response: ', error.response?.data || error.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Open the confirmation modal when Update Profile is pressed
  const openConfirmationModal = () => {
    setModalVisible(true);
  };

  // Close modal and then proceed with update
  const handleUpdate = () => {
    setModalVisible(false);
    updateProfile();
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
        <Text style={styles.headerText}>Account Delete</Text>
      </View>
      <ScrollView>
      <View style={styles.form}>
        <View>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            editable={false}
            onChangeText={setFullName}
            testID="fullName-input"
          />
        </View>

        <View>
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputWithIcon}>
            <Icon name="email" size={20} color="gray" />
            <TextInput
              style={styles.inputText}
              value={email}
              editable={false}
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
              editable={false}
              selectTextOnFocus={false}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={openConfirmationModal}
          disabled={updateLoading}>
          {updateLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Delete Account</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal for confirmation */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Delete</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete your profile?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, {backgroundColor: '#ccc'}]}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, {backgroundColor: '#FF4500'}]}
                onPress={handleUpdate}>
                <Text style={styles.modalButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const dynamicStyles = (width, height) => {
  const isTablet = width >= 600;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
      paddingHorizontal: isTablet ? 30 : 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: isTablet ? 20 : 15,
    },
    headerText: {
      fontSize: isTablet ? 24 : 20,
      fontFamily: 'RobotoSlab-SemiBold',
      marginLeft: isTablet ? 15 : 10,
      color: '#1D2951',
      textAlign: 'center',
    },
    form: {
      marginTop: isTablet ? 20 : 10,
      flexDirection: 'column',
      gap: isTablet ? 15 : 10,
    },
    label: {
      fontSize: isTablet ? 16 : 14,
      fontFamily: 'RobotoSlab-Medium',
      color: '#4a4a4a',
      marginBottom: 5,
      marginTop: isTablet ? 20 : 15,
    },
    input: {
      height: isTablet ? 55 : 50,
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      paddingHorizontal: 10,
      backgroundColor: '#f9f9f9',
      color: '#212121',
      fontFamily: 'RobotoSlab-Regular',
      fontSize: isTablet ? 18 : 16,
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
      marginLeft: isTablet ? 15 : 10,
      color: '#212121',
      fontFamily: 'RobotoSlab-Regular',
      fontSize: isTablet ? 18 : 16,
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
      width: isTablet ? 30 : 24,
      height: isTablet ? 20 : 16,
      marginRight: 8,
    },
    callingCode: {
      marginRight: 10,
      fontSize: isTablet ? 18 : 16,
      color: '#212121',
      fontFamily: 'RobotoSlab-Regular',
    },
    phoneInput: {
      flex: 1,
      color: '#212121',
      fontFamily: 'RobotoSlab-Regular',
      fontSize: isTablet ? 18 : 16,
    },
    button: {
      backgroundColor: '#FF4500',
      height: isTablet ? 55 : 50,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: isTablet ? 50 : 40,
    },
    buttonText: {
      color: '#fff',
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'RobotoSlab-Medium',
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      width: isTablet ? '40%' : '80%',
      backgroundColor: '#fff',
      padding: 20,
      borderRadius: 10,
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: isTablet ? 20 : 18,
      fontFamily: 'RobotoSlab-Medium',
      marginBottom: 10,
      color: '#1D2951',
    },
    modalMessage: {
      fontSize: isTablet ? 16 : 14,
      fontFamily: 'RobotoSlab-Regular',
      marginBottom: 20,
      textAlign: 'center',
      color: '#212121',
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
    },
    modalButton: {
      flex: 1,
      marginHorizontal: 5,
      paddingVertical: 10,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalButtonText: {
      color: '#fff',
      fontFamily: 'RobotoSlab-Medium',
      fontSize: isTablet ? 16 : 14,
    },
  });
};

export default AccountDelete;
