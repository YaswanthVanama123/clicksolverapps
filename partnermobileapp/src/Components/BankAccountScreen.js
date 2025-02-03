import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  SafeAreaView,
} from 'react-native';

import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Ionicons from 'react-native-vector-icons/Ionicons';
import EncryptedStorage from 'react-native-encrypted-storage';
import axios from 'axios';
import {useNavigation} from '@react-navigation/native';

const BankAccountScreen = () => {
  const [bank, setBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const navigation = useNavigation();
  const [errors, setErrors] = useState({}); // Error state

  const validateFields = () => {
    const newErrors = {};

    if (!bank) newErrors.bank = 'Bank Name is required.';
    if (!accountNumber) newErrors.accountNumber = 'Account Number is required.';
    if (!confirmAccountNumber)
      newErrors.confirmAccountNumber = 'Confirm Account Number is required.';
    if (!ifscCode) newErrors.ifscCode = 'IFSC CODE is required.';
    if (!accountHolderName)
      newErrors.accountHolderName = "Account Holder's Name is required.";
    if (
      accountNumber &&
      confirmAccountNumber &&
      accountNumber !== confirmAccountNumber
    ) {
      newErrors.confirmAccountNumber = 'Account numbers do not match.';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0; // Return true if no errors
  };

  const handleAddBankAccount = async () => {
    if (validateFields()) {
      const bankAccountDetails = {
        bank,
        accountNumber,
        confirmAccountNumber,
        ifscCode,
        accountHolderName,
      };
      try {
        const pcsToken = await EncryptedStorage.getItem('pcs_token');
        if (!pcsToken) {
          console.error('No pcs_token found.');
          navigation.replace('Login');
        }
        const response = await axios.post(
          `${process.env.BackendAPI17}/api/account/submit`,
          bankAccountDetails,
          {
            headers: {
              Authorization: `Bearer ${pcsToken}`,
            },
          },
        );
        if (response.status === 200) {
          navigation.replace('PartnerSteps');
        }
      } catch (error) {
        console.error('Error fetching services:', error);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <FontAwesome6
              name="arrow-left-long"
              size={20}
              color="#9e9e9e"
              style={styles.leftIcon}
            />
          </View>
          <View>
            <Ionicons name="help-circle-outline" size={25} color="#9e9e9e" />
          </View>
        </View>
        <Text style={styles.bankAccountDetailsText}>Bank account details</Text>
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                errors.bank && {borderBottomColor: '#ff4500'},
              ]}
              placeholder="Bank Name"
              placeholderTextColor="#9e9e9e"
              fontWeight="bold"
              value={bank}
              onChangeText={text => {
                setBank(text);
                if (errors.bank) setErrors(prev => ({...prev, bank: null}));
              }}
            />
            {errors.bank && <Text style={styles.errorText}>{errors.bank}</Text>}
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                errors.accountNumber && {borderBottomColor: '#ff4500'},
              ]}
              placeholder="Account number"
              placeholderTextColor="#9e9e9e"
              fontWeight="bold"
              keyboardType="numeric"
              value={accountNumber}
              onChangeText={text => {
                setAccountNumber(text);
                if (errors.accountNumber)
                  setErrors(prev => ({...prev, accountNumber: null}));
              }}
            />
            {errors.accountNumber && (
              <Text style={styles.errorText}>{errors.accountNumber}</Text>
            )}
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                errors.confirmAccountNumber && {borderBottomColor: '#ff4500'},
              ]}
              placeholder="Confirm Account number"
              placeholderTextColor="#9e9e9e"
              fontWeight="bold"
              keyboardType="numeric"
              value={confirmAccountNumber}
              onChangeText={text => {
                setConfirmAccountNumber(text);
                if (accountNumber && text !== accountNumber) {
                  setErrors(prev => ({
                    ...prev,
                    confirmAccountNumber: 'Account numbers do not match.',
                  }));
                } else {
                  setErrors(prev => ({...prev, confirmAccountNumber: null}));
                }
              }}
            />
            {errors.confirmAccountNumber && (
              <Text style={styles.errorText}>
                {errors.confirmAccountNumber}
              </Text>
            )}
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                errors.ifscCode && {borderBottomColor: '#ff4500'},
              ]}
              placeholder="IFSC CODE"
              placeholderTextColor="#9e9e9e"
              fontWeight="bold"
              value={ifscCode}
              onChangeText={text => {
                setIfscCode(text);
                if (errors.ifscCode)
                  setErrors(prev => ({...prev, ifscCode: null}));
              }}
            />
            {errors.ifscCode && (
              <Text style={styles.errorText}>{errors.ifscCode}</Text>
            )}
          </View>
          <View style={styles.lastInputContainer}>
            <TextInput
              style={[
                styles.input,
                errors.accountHolderName && {borderBottomColor: '#ff4500'},
              ]}
              placeholder="Account holder's name"
              placeholderTextColor="#9e9e9e"
              fontWeight="bold"
              value={accountHolderName}
              onChangeText={text => {
                setAccountHolderName(text);
                if (errors.accountHolderName)
                  setErrors(prev => ({...prev, accountHolderName: null}));
              }}
            />
            {errors.accountHolderName && (
              <Text style={styles.errorText}>{errors.accountHolderName}</Text>
            )}
          </View>
          <Text style={styles.helpText}>
            Need help finding these numbers?{' '}
            <Text style={styles.learnMoreText}>Learn more</Text>
          </Text>
          <Text style={styles.acceptTerms}>
            By adding this bank account, I agree to PayMe T& Cs regarding
            topping up from bank account.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={handleAddBankAccount}>
            <Text style={styles.buttonText}>Add bank account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const screenHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  inputContainer: {
    marginBottom: 40,
  },
  lastInputContainer: {
    marginBottom: 20,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 3,
    fontSize: 15,
    color: '#747676',
  },
  errorText: {
    color: '#ff4500',
    fontSize: 14,
    marginBottom: 10,
  },
  learnMoreText: {
    color: '#212121',
    fontWeight: 'bold',
    paddingLeft: 5,
  },
  acceptTerms: {
    color: '#212121',
    paddingBottom: 20,
    fontWeight: '600',
  },
  container: {
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fafafa',
  },
  bankAccountDetailsText: {
    paddingTop: 15,
    paddingBottom: 40,
    fontWeight: 'bold',
    color: '#212121',
    fontSize: 23,
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  helpText: {
    color: '#9e9e9e',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#FF5722',
    paddingVertical: 12,
    borderRadius: 22,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BankAccountScreen;
