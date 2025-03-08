import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import EncryptedStorage from 'react-native-encrypted-storage';

const PartnerSteps = () => {
  // Step 1 and Step 2 statuses come from your server or local state
  const [step1Status, setStep1Status] = useState(false);
  const [step2Status, setStep2Status] = useState(false);

  // Track each banking detail separately
  const [bankAccountAdded, setBankAccountAdded] = useState(false);
  const [upiIdAdded, setUpiIdAdded] = useState(false);

  // UI selections
  const [selectedStep, setSelectedStep] = useState(null);
  const [showLogout, setShowLogout] = useState(false);

  // We can also keep track of which option is currently selected
  // for the user to proceed with adding details.
  const [selectedBankOption, setSelectedBankOption] = useState(null);

  const navigation = useNavigation();

  // Example: fetching steps from server
  const fetchStepStatuses = useCallback(async () => {
    try {
      const pcs_token = await EncryptedStorage.getItem('pcs_token');
      if (!pcs_token) throw new Error('pcs_token not found');

      const response = await axios.post(
        `http://192.168.55.104:5000/api/onboarding/step-status`,
        {},
        {headers: {Authorization: `Bearer ${pcs_token}`}},
      );

      console.log(response.data)
 
      // Suppose your API returns something like:
      // steps: { step1: boolean, step2: boolean, bankAccount: boolean, upiId: boolean }
      setStep1Status(response.data.steps.step1);
      setStep2Status(response.data.steps.step2);
      setBankAccountAdded(response.data.steps.bankAccount);
      setUpiIdAdded(response.data.steps.upiId);
    } catch (error) {
      console.error('Error fetching step statuses:', error);
    } 
  }, []); 

  useEffect(() => {
    fetchStepStatuses();
  }, [fetchStepStatuses]); 

  // Toggle logout pop-up
  const toggleLogout = () => setShowLogout(prev => !prev);
  const handleLogout = async () => {
    await EncryptedStorage.removeItem('pcs_token');
    navigation.replace('Login');
  };

  // Step 3 is considered complete if the user has added either a bank account or a UPI ID
  const isStep3Complete = bankAccountAdded || upiIdAdded;

  // Only navigate when all steps are done (1, 2, and 3).
  const navigateToHome = async () => {
    if (step1Status && step2Status && isStep3Complete) {
      await EncryptedStorage.setItem('partnerSteps', 'completed');
      navigation.replace('ApprovalScreen');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar with Help & Logout */}
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

      {/* Header Section */}
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://i.postimg.cc/jSJS7rDH/1727646707169dp7gkvhw.png' }}
          style={styles.workerImage}
        />
        <Text style={styles.headerText}>
          Become a Click Solver partner in 3 easy steps!
        </Text>
      </View>

      {/* STEP 1 */}
      <TouchableOpacity
        style={[styles.stepBox, selectedStep === 1 && styles.selectedStepBox]}
        onPress={() => setSelectedStep(1)}
      >
        <View style={styles.stepRow}>
          <Icon
            name={step1Status ? 'check-circle' : 'radio-button-unchecked'}
            size={24}
            color={step1Status ? '#1DA472' : '#9e9e9e'}
          />
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>STEP 1</Text>
            <Text style={styles.stepName}>Signup</Text>
            <Text style={[styles.stepStatus, !step1Status && {color: '#ff4500'}]}>
              {step1Status ? 'Completed' : 'Incomplete'}
            </Text>
          </View>
          {step1Status && <Icon name="check" size={24} color="#1DA472" />}
        </View>
      </TouchableOpacity>

      {/* STEP 2 */}
      <TouchableOpacity
        style={[styles.stepBox, selectedStep === 2 && styles.selectedStepBox]}
        onPress={() => setSelectedStep(2)}
      >
        <View style={styles.stepRow}>
          <Icon
            name={step2Status ? 'check-circle' : 'radio-button-unchecked'}
            size={24}
            color={step2Status ? '#1DA472' : '#9e9e9e'}
          />
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>STEP 2</Text>
            <Text style={styles.stepName}>Profile</Text>
            <Text style={[styles.stepStatus, !step2Status && {color: '#ff4500'}]}>
              {step2Status ? 'Completed' : 'Incomplete'}
            </Text>
          </View>
          {step2Status && <Icon name="check" size={24} color="#1DA472" />}
        </View>

        {/* Show "Proceed" if Step 2 is selected but incomplete */}
        {selectedStep === 2 && !step2Status && (
          <TouchableOpacity
            style={styles.proceedButton}
            onPress={() => navigation.push('ServiceRegistration')}
          >
            <Text style={styles.proceedButtonText}>Proceed</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* STEP 3 */}
      <TouchableOpacity
        style={[styles.stepBox, selectedStep === 3 && styles.selectedStepBox]}
        onPress={() => setSelectedStep(3)}
      >
        <View style={styles.stepRow}>
          <Icon
            name={isStep3Complete ? 'check-circle' : 'radio-button-unchecked'}
            size={24}
            color={isStep3Complete ? '#1DA472' : '#9e9e9e'}
          />
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>STEP 3</Text>
            <Text style={styles.stepName}>Adding Banking Details</Text>
            <Text
              style={[
                styles.stepStatus,
                !isStep3Complete && {color: '#ff4500'},
              ]}
            >
              {isStep3Complete ? 'Completed' : 'Incomplete'}
            </Text>
          </View>
          {isStep3Complete && <Icon name="check" size={24} color="#1DA472" />}
        </View>

        {/* Bank details options (bank account + UPI) */}
        {selectedStep === 3 && (
          <View style={styles.bankDetailsContainer}>
            {/* Bank Account Option */}
            <View style={styles.optionContainer}>
              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => setSelectedBankOption('bankAccount')}
              >
                <Icon
                  name={
                    selectedBankOption === 'bankAccount'
                      ? 'radio-button-checked'
                      : 'radio-button-unchecked'
                  }
                  size={20}
                  color="#000"
                />
                <Text style={styles.optionText}>Add bank account</Text>
                {bankAccountAdded && (
                  <Icon
                    name="check"
                    size={20}
                    color="#1DA472"
                    style={{marginLeft: 8}}
                  />
                )}
              </TouchableOpacity>

              {/* Proceed button for bank account */}
              {selectedBankOption === 'bankAccount' && !bankAccountAdded && (
                <TouchableOpacity
                  style={styles.proceedButton}
                  onPress={() => {
                    // Navigate to Add Bank Account screen
                    navigation.push('BankAccountScreen');
                    // After a successful bank account addition, set bankAccountAdded(true).
                  }}
                >
                  <Text style={styles.proceedButtonText}>Proceed</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* UPI ID Option */}
            <View style={styles.optionContainer}>
              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => setSelectedBankOption('upiId')}
              >
                <Icon
                  name={
                    selectedBankOption === 'upiId'
                      ? 'radio-button-checked'
                      : 'radio-button-unchecked'
                  }
                  size={20}
                  color="#000"
                />
                <Text style={styles.optionText}>Add UPI Id</Text>
                {upiIdAdded && (
                  <Icon
                    name="check"
                    size={20}
                    color="#1DA472"
                    style={{marginLeft: 8}}
                  />
                )}
              </TouchableOpacity>

              {/* Proceed button for UPI ID */}
              {selectedBankOption === 'upiId' && !upiIdAdded && (
                <TouchableOpacity
                  style={styles.proceedButton}
                  onPress={() => {
                    // Navigate to Add UPI ID screen
                    navigation.push('UpiIDScreen');
                    // After a successful UPI addition, setUpiIdAdded(true).
                  }}
                >
                  <Text style={styles.proceedButtonText}>Proceed</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* If Step 1, Step 2, and Step 3 are all complete, show "Start now" */}
      {step1Status && step2Status && isStep3Complete && (
        <TouchableOpacity style={styles.startButton} onPress={navigateToHome}>
          <Text style={styles.startButtonText}>Start now</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

export default PartnerSteps;

/* ============ Styles ============ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f7f7f7',
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
    backgroundColor: '#fff',
    padding: 10,
    width: 70,
    borderRadius: 5,
    position: 'absolute',
    top: 40,
    right: 10,
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
    color: '#1DA472', // Green color if completed
  },
  bankDetailsContainer: {
    marginTop: 8,
  },
  optionContainer: {
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginTop: 8,
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
