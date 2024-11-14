import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';

const UPIIdDetailsScreen = () => {
  const [upiId, setUpiId] = useState('');
  const [error, setError] = useState('');

  const handleAddUPIId = async () => {
    if (!upiId || !upiId.includes('@')) {
      return setError('UPI ID cannot be empty and must include "@"');
    }

    setError('');
    try {
      const pcsToken = await EncryptedStorage.getItem('pcs_token');
      if (!pcsToken) {
        console.error('No pcs_token found.');
        return navigation.replace('Login');
      }

      const response = await axios.post(
        `${process.env.BackendAPI6}/api/upi/submit`,
        {upi_id: upiId},
        {headers: {Authorization: `Bearer ${pcsToken}`}},
      );

      if (response.status === 200) {
        navigation.replace('PartnerSteps');
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <FontAwesome6
          name="arrow-left-long"
          size={20}
          color="#9e9e9e"
          style={styles.leftIcon}
        />
        <Text style={styles.title}>UPI Id details</Text>
        <Ionicons name="help-circle-outline" size={25} color="#9e9e9e" />
      </View>

      <View style={styles.tabsContainer}>
        <Text style={[styles.tab, styles.activeTab]}>Payment Details</Text>
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>UPI</Text>
          <Text style={styles.linkText}>What is UPI</Text>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your UPI ID"
            value={upiId}
            onChangeText={setUpiId}
          />
          <TouchableOpacity style={styles.verifyButton}>
            <Text style={styles.verifyButtonText}>Verify UpI Id</Text>
          </TouchableOpacity>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}
        <Text style={styles.linkText}>How to find UPI ID?</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddUPIId}>
          <Text style={styles.addButtonText}>Add UPI ID</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.helpText}>How to add UPI?</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
  },
  verifyButton: {
    borderWidth: 1,
    borderColor: '#9e9e9e',
    padding: 10,
    marginLeft: 5,
    borderRadius: 5,
  },
  verifyButtonText: {
    color: '#9E9E9E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  tab: {
    fontSize: 16,
    color: '#A9A9A9',
    marginRight: 20,
  },
  activeTab: {
    color: '#212121',
    fontWeight: '400',
  },
  inputContainer: {
    marginTop: 30,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    color: '#212121',
  },
  linkText: {
    fontSize: 14,
    color: '#9e9e9e',
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D3D3D3',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: '#F9F9F9',
    color: '#212121',
    fontWeight: 'bold',
    fontSize: 18,
  },
  addButton: {
    backgroundColor: '#FF5722',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 30,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 16,
    color: '#9e9e9e',
    marginTop: 30,
  },
  errorText: {
    color: '#ff4500',
    fontSize: 14,
    marginTop: 5,
  },
});

export default UPIIdDetailsScreen;
