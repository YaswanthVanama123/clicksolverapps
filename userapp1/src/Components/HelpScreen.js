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
import { CommonActions, useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
// Import the translation hook from react-i18next
import { useTranslation } from 'react-i18next';

const HelpScreen = () => {
  const { width } = useWindowDimensions();
  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(width, isDarkMode);
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [loadingCall, setLoadingCall] = useState(false);

  // Define steps array within the component to allow translation of texts
  const steps = [
    {
      number: '1',
      title: t('choose_category') || 'Choose Category',
      description: t('browse_service_categories') || 'Browse service categories',
    },
    {
      number: '2',
      title: t('select_service') || 'Select Service',
      description: t('choose_exactly_what_you_need') || 'Choose exactly what you need',
    },
    {
      number: '3',
      title: t('confirm_location') || 'Confirm Location',
      description: t('share_service_location') || 'Share your service location',
    },
    {
      number: '4',
      title: t('worker_assigned') || 'Worker Assigned',
      description: t('worker_assigned_desc') || 'A nearby worker will accept',
    },
    {
      number: '5',
      title: t('worker_arrives') || 'Worker Arrives',
      description: t('track_worker_arrival') || 'Track the worker’s arrival',
    },
    {
      number: '6',
      title: t('verify_and_begin') || 'Verify & Begin',
      description: t('start_service_verification') || 'Start service after verification',
    },
  ];

  const handleEmailPress = () => {
    Linking.openURL('mailto:customer.support@clicksolver.com').catch(() =>
      Alert.alert(t('error') || 'Error', t('unable_to_open_mail_app') || 'Unable to open mail app')
    );
  };

  const handleCallPress = async () => {
    setLoadingCall(true);
    try {
      // Uncomment and update the axios call if you want to fetch the phone number from the backend
      // const response = await axios.get('https://backend.clicksolver.com/customer/care');
      const phoneNumber = "7981793632";
      if (phoneNumber) {
        Linking.openURL(`tel:${phoneNumber}`).catch(() =>
          Alert.alert(t('error') || 'Error', t('unable_to_open_dialer') || 'Unable to open dialer')
        );
      } else {
        Alert.alert(t('error') || 'Error', t('no_phone_number_received') || 'No phone number received');
      }
    } catch {
      Alert.alert(t('error') || 'Error', t('failed_to_retrieve_phone_number') || 'Failed to retrieve phone number');
    } finally {
      setLoadingCall(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#212121'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('help_support') || 'Help & Support'}
        </Text>
        <TouchableOpacity onPress={handleEmailPress}>
          <Ionicons name="mail-outline" size={24} color="#ff4500" />
        </TouchableOpacity> 
      </View>

      {/* Steps Section */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.subheading}>
          {t('follow_steps') || 'Follow these simple steps to get started'}
        </Text>

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
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }],
              })
            );
          }}
        >
          <LinearGradient colors={['#ff5722', '#ff4500']} style={styles.gradientButton}>
            <Text style={styles.ctaButtonText}>
              {t('book_service_now') || 'Book a Service Now'}
            </Text>
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
      borderRadius: 50,
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
