// HelpScreen.js
import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';

const steps = [
  {
    number: '1',
    title: 'Choose Service Category',
    description: 'Browse through our various service categories',
  },
  {
    number: '2',
    title: 'Select Specific Service',
    description: 'Choose the exact service you need',
  },
  {
    number: '3',
    title: 'Confirm Location',
    description: 'Share your service location',
  },
  {
    number: '4',
    title: 'Worker Assignment',
    description: 'Wait for nearby worker to accept',
  },
  {
    number: '5',
    title: 'Worker Arrives',
    description: "Track worker's journey to you",
  },
  {
    number: '6',
    title: 'Verify & Begin',
    description: 'Verify worker with OTP and start service',
  },
];

const HelpScreen = () => {
  const [showSupportMenu, setShowSupportMenu] = useState(false);
  const [loadingCall, setLoadingCall] = useState(false);

  // Open mail app with predefined recipient.
  const handleEmailPress = () => {
    setShowSupportMenu(false);
    Linking.openURL('mailto:customer.support@clicksolver.com').catch(err =>
      Alert.alert('Error', 'Unable to open mail app'),
    );
  };

  // Call backend API to fetch customer care number then open dialer.
  const handleCallPress = async () => {
    setShowSupportMenu(false);
    setLoadingCall(true);
    try {
      // Replace the URL with your backend endpoint.
      const response = await axios.get('http://192.168.55.101:5000/customer/care');
      const phoneNumber = response.data.phone; // Expects { phone: '1234567890' }
      if (phoneNumber) {
        Linking.openURL(`tel:${phoneNumber}`).catch(err =>
          Alert.alert('Error', 'Unable to open dialer'),
        );
      } else {
        Alert.alert('Error', 'No phone number received');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to retrieve phone number');
    } finally {
      setLoadingCall(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* Top Header Container */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => { /* Implement back navigation if needed */ }}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>Help & Support</Text>
        <TouchableOpacity onPress={() => setShowSupportMenu(prev => !prev)}>
          <Ionicons name="headset-outline" size={24} color="#212121" />
        </TouchableOpacity>
      </View>

      {/* Enhanced Support Menu Overlay */}
      {showSupportMenu && (
        <View style={styles.supportMenu}>
          <TouchableOpacity style={styles.supportMenuItem} onPress={handleEmailPress}>
            <Ionicons name="mail-outline" size={20} color="#ff4500" style={styles.menuIcon} />
            <Text style={styles.supportMenuItemText}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.supportMenuItem} onPress={handleCallPress}>
            <Ionicons name="call-outline" size={20} color="#ff4500" style={styles.menuIcon} />
            {loadingCall ? (
              <ActivityIndicator color="#ff4500" />
            ) : (
              <Text style={styles.supportMenuItemText}>Call</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          {/* Internal Header */}
          <View style={styles.header}>
            <Text style={styles.headerSubtitle}>
              Follow these simple steps to get started
            </Text>
          </View>

          {/* Steps */}
          {steps.map((step, index) => (
            <View key={index} style={styles.step}>
              <View style={styles.stepNumberContainer}>
                <Text style={styles.stepNumber}>{step.number}</Text>
              </View>
              <View style={styles.stepContent}>
                <View style={styles.stepIcons}>
                  {step.icon && (
                    <Image source={step.icon} style={styles.icon} />
                  )}
                  <Text style={styles.stepTitle}>{step.title}</Text>
                </View>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            </View>
          ))}

          {/* Call-to-Action Button */}
          <TouchableOpacity style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Book a Service Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  topHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  supportMenu: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 150,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 1,
    zIndex: 10,
  },
  supportMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  menuIcon: {
    marginRight: 8,
  },
  supportMenuItemText: {
    fontSize: 16,
    color: '#ff4500',
    fontWeight: '500',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  container: {
    width: '90%',
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#4a4a4a',
    textAlign: 'center',
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  stepNumberContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ff4500',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  stepNumber: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '500',
  },
  stepContent: {
    flex: 1,
  },
  stepIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 10,
    resizeMode: 'contain',
  },
  stepTitle: {
    fontSize: 16,
    color: '#212121',
    fontWeight: '500',
  },
  stepDescription: {
    fontSize: 14,
    color: '#4a4a4a',
  },
  ctaButton: {
    backgroundColor: '#ff5722',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 1,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default HelpScreen;
