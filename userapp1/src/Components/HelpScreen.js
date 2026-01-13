/**
 * HelpScreen Component
 * Displays step-by-step guide for booking services and support contact options
 * Features: Multi-language support, contact via email/phone, dark mode
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  SafeAreaView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { CommonActions, useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../theme/colors';
import { useTranslation } from 'react-i18next';
import ErrorState from './molecules/ErrorState';

/**
 * HelpScreen - User guide and support contact screen
 * @returns {JSX.Element}
 */
const HelpScreen = () => {
  const { width } = useWindowDimensions();
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const styles = dynamicStyles(width, isDarkMode, colors);
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [loadingCall, setLoadingCall] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Step-by-step guide for booking services
   */
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
      description: t('track_worker_arrival') || 'Track the worker\'s arrival',
    },
    {
      number: '6',
      title: t('verify_and_begin') || 'Verify & Begin',
      description: t('start_service_verification') || 'Start service after verification',
    },
  ];

  /**
   * Opens email client with support email
   */
  const handleEmailPress = () => {
    setError(null);
    Linking.openURL('mailto:customer.support@clicksolver.com').catch((err) => {
      console.error('[HelpScreen] Failed to open email:', err);
      Alert.alert(
        t('error') || 'Error',
        t('unable_to_open_mail_app') || 'Unable to open mail app'
      );
    });
  };

  /**
   * Initiates phone call to support
   */
  const handleCallPress = async () => {
    setLoadingCall(true);
    setError(null);

    try {
      // Option: Fetch phone number from backend
      // const response = await axios.get(
      //   'https://backend.clicksolver.com/customer/care',
      //   { timeout: 5000 }
      // );
      // const phoneNumber = response.data?.phone;

      const phoneNumber = '7981793632';

      if (phoneNumber) {
        await Linking.openURL(`tel:${phoneNumber}`);
      } else {
        throw new Error(t('no_phone_number_received') || 'No phone number received');
      }
    } catch (err) {
      console.error('[HelpScreen] Failed to initiate call:', err);
      Alert.alert(
        t('error') || 'Error',
        err.message || t('failed_to_retrieve_phone_number') || 'Failed to retrieve phone number'
      );
      setError(err.message || 'Failed to initiate call');
    } finally {
      setLoadingCall(false);
    }
  };

  /**
   * Navigates to Home screen
   */
  const handleBookService = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }],
      })
    );
  };

  // Show error state if critical error occurs
  if (error && error.includes('critical')) {
    return (
      <ErrorState
        error={error}
        onRetry={() => {
          setError(null);
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t('help_support') || 'Help & Support'}
          </Text>
          <TouchableOpacity onPress={handleEmailPress}>
            <Ionicons name="mail-outline" size={24} color={colors.primary} />
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
            onPress={handleBookService}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary, '#ff4500']}
              style={styles.gradientButton}
            >
              <Text style={styles.ctaButtonText}>
                {t('book_service_now') || 'Book a Service Now'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Support Info */}
          <View style={styles.supportInfo}>
            <Text style={styles.supportTitle}>
              {t('need_more_help') || 'Need More Help?'}
            </Text>
            <Text style={styles.supportText}>
              {t('contact_support_text') ||
                'Our support team is available 24/7 to assist you with any questions or concerns.'}
            </Text>
          </View>
        </ScrollView>

        {/* Floating Call Button */}
        <TouchableOpacity
          style={styles.floatingCallButton}
          onPress={handleCallPress}
          disabled={loadingCall}
          activeOpacity={0.8}
        >
          {loadingCall ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="call" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

/**
 * Dynamic styles based on theme and screen size
 * @param {number} width - Screen width
 * @param {boolean} isDarkMode - Theme mode
 * @param {object} colors - Color palette
 * @returns {object} StyleSheet object
 */
function dynamicStyles(width, isDarkMode, colors) {
  const isTablet = width >= 600;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: isTablet ? 24 : 20,
      paddingVertical: isTablet ? 14 : 10,
      backgroundColor: colors.background,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    headerTitle: {
      fontSize: isTablet ? 20 : 18,
      fontWeight: '600',
      color: colors.text.primary,
      fontFamily: 'RobotoSlab-SemiBold',
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
      color: colors.text.secondary,
      marginBottom: isTablet ? 30 : 25,
      fontFamily: 'RobotoSlab-Medium',
    },
    stepContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
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
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isTablet ? 18 : 15,
    },
    stepNumber: {
      color: '#ffffff',
      fontSize: isTablet ? 20 : 18,
      fontWeight: '600',
      fontFamily: 'RobotoSlab-SemiBold',
    },
    stepContent: {
      flex: 1,
    },
    stepTitle: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: '500',
      color: colors.text.primary,
      fontFamily: 'RobotoSlab-Medium',
    },
    stepDescription: {
      fontSize: isTablet ? 16 : 14,
      color: colors.text.secondary,
      fontFamily: 'RobotoSlab-Regular',
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
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
    },
    ctaButtonText: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: '600',
      color: '#ffffff',
      fontFamily: 'RobotoSlab-SemiBold',
    },
    supportInfo: {
      marginTop: isTablet ? 30 : 25,
      padding: isTablet ? 20 : 16,
      backgroundColor: colors.background,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    supportTitle: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 8,
      fontFamily: 'RobotoSlab-SemiBold',
    },
    supportText: {
      fontSize: isTablet ? 15 : 14,
      color: colors.text.secondary,
      lineHeight: 22,
      fontFamily: 'RobotoSlab-Regular',
    },
    floatingCallButton: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      backgroundColor: colors.primary,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
    },
  });
}

export default HelpScreen;
