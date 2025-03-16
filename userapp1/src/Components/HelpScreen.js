import React, { useState } from 'react';
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
  useWindowDimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient'; // For better button styling
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

const steps = [
  { number: '1', title: 'Choose Category', description: 'Browse service categories' },
  { number: '2', title: 'Select Service', description: 'Choose exactly what you need' },
  { number: '3', title: 'Confirm Location', description: 'Share your service location' },
  { number: '4', title: 'Worker Assigned', description: 'A nearby worker will accept' },
  { number: '5', title: 'Worker Arrives', description: 'Track the worker’s arrival' },
  { number: '6', title: 'Verify & Begin', description: 'Start service after verification' },
];

const HelpScreen = () => {
  const { width } = useWindowDimensions();
  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(width, isDarkMode);

  const [loadingCall, setLoadingCall] = useState(false);

  const handleEmailPress = () => {
    Linking.openURL('mailto:customer.support@clicksolver.com').catch(() =>
      Alert.alert('Error', 'Unable to open mail app')
    );
  };

  const handleCallPress = async () => {
    setLoadingCall(true);
    try {
      const response = await axios.get('https://backend.clicksolver.com/customer/care');
      const phoneNumber = response.data.phone;
      if (phoneNumber) {
        Linking.openURL(`tel:${phoneNumber}`).catch(() =>
          Alert.alert('Error', 'Unable to open dialer')
        );
      } else {
        Alert.alert('Error', 'No phone number received');
      }
    } catch {
      Alert.alert('Error', 'Failed to retrieve phone number');
    } finally {
      setLoadingCall(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#212121'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <TouchableOpacity onPress={handleEmailPress}>
          <Ionicons name="mail-outline" size={24} color="#ff4500" />
        </TouchableOpacity>
      </View>

      {/* Steps Section */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.subheading}>Follow these simple steps to get started</Text>

        {steps.map((step, index) => (
          <View key={index} style={styles.stepContainer}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>{step.number}</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDescription}>{step.description}</Text>
            </View>
          </View>
        ))}

        {/* CTA Button */}
        <TouchableOpacity style={styles.ctaButton}>
          <LinearGradient colors={['#ff5722', '#ff4500']} style={styles.gradientButton}>
            <Text style={styles.ctaButtonText}>Book a Service Now</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Floating Call Button */}
      <TouchableOpacity style={styles.floatingCallButton} onPress={handleCallPress}>
        {loadingCall ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Ionicons name="call" size={24} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  );
};

/** 
 * DYNAMIC STYLES 
 */
function dynamicStyles(width, isDarkMode) {
  const isTablet = width >= 600;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#f5f5f5',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: isTablet ? 24 : 20,
      paddingVertical: isTablet ? 14 : 10,
      backgroundColor: isDarkMode ? '#121212' : '#ffffff',
      elevation: 1,
    },
    headerTitle: {
      fontSize: isTablet ? 20 : 18,
      fontWeight: '600',
      color: isDarkMode ? '#fff' : '#212121',
    },
    scrollContainer: {
      flexGrow: 1,
      paddingVertical: isTablet ? 25 : 20,
      paddingHorizontal: isTablet ? 20 : 15,
    },
    subheading: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: '500',
      textAlign: 'center',
      color: isDarkMode ? '#cccccc' : '#4a4a4a',
      marginBottom: isTablet ? 30 : 25,
    },
    stepContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#2c2c2c' : '#ffffff',
      padding: isTablet ? 16 : 14,
      borderRadius: 50, // Smooth circular edges
      marginBottom: isTablet ? 18 : 15,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 1,
    },
    stepCircle: {
      width: isTablet ? 40 : 36,
      height: isTablet ? 40 : 36,
      borderRadius: 20,
      backgroundColor: '#ff4500',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isTablet ? 18 : 15,
    },
    stepNumber: {
      color: '#ffffff',
      fontSize: isTablet ? 20 : 18,
      fontWeight: '600',
    },
    stepContent: {
      flex: 1,
    },
    stepTitle: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: '500',
      color: isDarkMode ? '#fff' : '#212121',
    },
    stepDescription: {
      fontSize: isTablet ? 16 : 14,
      color: isDarkMode ? '#cccccc' : '#4a4a4a',
    },
    ctaButton: {
      marginTop: isTablet ? 30 : 25,
      alignSelf: 'center',
      width: '100%',
      borderRadius: 50,
    },
    gradientButton: {
      paddingVertical: isTablet ? 16 : 14,
      alignItems: 'center',
      borderRadius: 50,
      elevation: 3,
    },
    ctaButtonText: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: '600',
      color: '#ffffff',
    },
    floatingCallButton: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      backgroundColor: '#ff4500',
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
    },
  });
}

export default HelpScreen;
