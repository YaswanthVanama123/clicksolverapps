import React, {useEffect, useState, useCallback} from 'react';
import {View, Text, StyleSheet, Image, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, CommonActions} from '@react-navigation/native';
import EncryptedStorage from 'react-native-encrypted-storage';

const PartnerSteps = () => {
  const [step1Status, setStep1Status] = useState(true);
  const [step2Status, setStep2Status] = useState(false);
  const [step3Status, setStep3Status] = useState(false);
  const [selectedStep, setSelectedStep] = useState(null);
  const [bankingOption, setBankingOption] = useState('');
  const [showLogout, setShowLogout] = useState(false);

  const navigation = useNavigation();

  const fetchStepStatuses = useCallback(async () => {
    try {
      const pcs_token = await EncryptedStorage.getItem('pcs_token');
      if (!pcs_token) throw new Error('pcs_token not found');

      const response = await axios.post(
        `${process.env.BackendAPI6}/api/onboarding/step-status`,
        {},
        {headers: {Authorization: `Bearer ${pcs_token}`}},
      );

      setStep1Status(response.data.steps.step1);
      setStep2Status(response.data.steps.step2);
      setStep3Status(response.data.steps.step3);
    } catch (error) {
      console.error('Error fetching step statuses:', error);
    }
  }, []);

  useEffect(() => {
    fetchStepStatuses();
  }, [fetchStepStatuses]);

  const toggleLogout = () => setShowLogout(prev => !prev);

  const handleLogout = async () => {
    await EncryptedStorage.removeItem('pcs_token');
    navigation.replace('Login');
  };

  const navigateToHome = async () => {
    if (step1Status && step2Status && step3Status) {
      await EncryptedStorage.setItem('partnerSteps', 'completed');
      navigation.replace('ApprovalScreen');
    }
  };

  // useEffect(() => {
  //   navigateToHome();
  // }, [step1Status, step2Status, step3Status]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <View style={{flex: 1}} />
        <Text style={styles.helpText}>Help</Text>
        <TouchableOpacity onPress={toggleLogout} style={styles.moreIcon}>
          <Icon name="more-vert" size={24} color="#333" />
        </TouchableOpacity>
        {showLogout && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.header}>
        <Image
          source={{
            uri: 'https://i.postimg.cc/jSJS7rDH/1727646707169dp7gkvhw.png',
          }}
          style={styles.workerImage}
        />
        <Text style={styles.headerText}>
          Become a Click Solver partner in 3 easy steps!
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.stepBox, selectedStep === 1 && styles.selectedStepBox]}
        onPress={() => setSelectedStep(1)}>
        <View style={styles.stepRow}>
          <Icon
            name={step1Status ? 'check-circle' : 'radio-button-unchecked'}
            size={24}
            color={step1Status ? '#1DA472' : '#9e9e9e'}
          />
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>STEP 1</Text>
            <Text style={styles.stepName}>Signup</Text>
            <Text
              style={[styles.stepStatus, !step1Status && {color: '#ff4500'}]}>
              {step1Status ? 'Completed' : 'Incomplete'}
            </Text>
          </View>
          {step1Status && <Icon name="check" size={24} color="#1DA472" />}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.stepBox, selectedStep === 2 && styles.selectedStepBox]}
        onPress={() => setSelectedStep(2)}>
        <View style={styles.stepRow}>
          <Icon
            name={step2Status ? 'check-circle' : 'radio-button-unchecked'}
            size={24}
            color={step2Status ? '#1DA472' : '#9e9e9e'}
          />
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>STEP 2</Text>
            <Text style={styles.stepName}>Profile</Text>
            <Text
              style={[styles.stepStatus, !step2Status && {color: '#ff4500'}]}>
              {step2Status ? 'Completed' : 'Incomplete'}
            </Text>
          </View>
          {step2Status && <Icon name="check" size={24} color="#1DA472" />}
        </View>
        {selectedStep === 2 && !step2Status && (
          <TouchableOpacity
            style={styles.proceedButton}
            onPress={() => navigation.push('SkillRegistration')}>
            <Text style={styles.proceedButtonText}>Proceed</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.stepBox, selectedStep === 3 && styles.selectedStepBox]}
        onPress={() => setSelectedStep(3)}>
        <View style={styles.stepRow}>
          <Icon
            name={step3Status ? 'check-circle' : 'radio-button-unchecked'}
            size={24}
            color={step3Status ? '#1DA472' : '#9e9e9e'}
          />
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>STEP 3</Text>
            <Text style={styles.stepName}>Adding Banking Details</Text>
            <Text
              style={[styles.stepStatus, !step3Status && {color: '#ff4500'}]}>
              {step3Status ? 'Completed' : 'Incomplete'}
            </Text>
          </View>
          {step3Status && <Icon name="check" size={24} color="#1DA472" />}
        </View>

        <View style={styles.bankDetailsContainer}>
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setBankingOption('bankAccount')}>
            <Icon
              name={
                bankingOption === 'bankAccount'
                  ? 'radio-button-checked'
                  : 'radio-button-unchecked'
              }
              size={20}
              color="#000"
            />
            <Text style={styles.optionText}>Add bank account</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setBankingOption('upiId')}>
            <Icon
              name={
                bankingOption === 'upiId'
                  ? 'radio-button-checked'
                  : 'radio-button-unchecked'
              }
              size={20}
              color="#000"
            />
            <Text style={styles.optionText}>Add UPI Id</Text>
          </TouchableOpacity>
        </View>
        {selectedStep === 3 && !step3Status && (
          <>
            <TouchableOpacity
              style={styles.proceedButton}
              onPress={() => {
                if (bankingOption === 'bankAccount') {
                  navigation.push('BankAccountScreen');
                } else if (bankingOption === 'upiId') {
                  navigation.push('UpiIDScreen');
                }
              }}>
              <Text style={styles.proceedButtonText}>Proceed</Text>
            </TouchableOpacity>
          </>
        )}
      </TouchableOpacity>

      {step1Status && step2Status && step3Status && (
        <TouchableOpacity style={styles.startButton} onPress={navigateToHome}>
          <Text style={styles.startButtonText}>Start now</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f7f7f7',
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12, // Half of the width and height for a perfect circle
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#212121',
    marginRight: 8,
    fontWeight: 'bold',
  },
  moreIcon: {
    marginRight: 8,
  },
  logoutButton: {
    backgroundColor: '#ffffff',
    padding: 10,
    width: 70,
    borderRadius: 5,
    position: 'absolute',
    top: 40, // Adjust as needed
    right: 10, // Adjust as needed
  },
  logoutText: {
    color: '#ff4500',
    fontWeight: 'bold',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  workerImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  headerText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 8,
    color: '#212121',
  },
  stepBox: {
    backgroundColor: '#fff',
    padding: 12,
    marginVertical: 8,
    borderRadius: 10,
    flexDirection: 'column',
    elevation: 1,
  },
  selectedStepBox: {
    borderWidth: 2,
    borderColor: '#FF5C00',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepContent: {
    marginLeft: 12,
    flex: 1,
  },
  stepTitle: {
    fontSize: 12,
    color: '#212121',
    paddingBottom: 5,
  },
  stepName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    paddingBottom: 5,
  },
  stepStatus: {
    fontSize: 14,
    color: '#1DA472', // Default color for completed steps
  },
  bankDetailsContainer: {
    marginTop: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  optionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#212121',
  },
  proceedButton: {
    backgroundColor: '#FF5C00',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 16,
  },
  proceedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  startButton: {
    backgroundColor: '#FF5722',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 20,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PartnerSteps;
