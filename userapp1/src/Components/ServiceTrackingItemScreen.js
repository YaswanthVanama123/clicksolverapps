/**
 * ServiceTrackingItemScreen Component
 * Displays detailed tracking information for a single service booking
 * Shows worker profile, PIN, service details, timeline, address, and payment info
 */

import React, {useEffect, useState, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Linking,
  Animated,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import {useNavigation, useRoute, CommonActions} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import messaging from '@react-native-firebase/messaging';
import {useTranslation} from 'react-i18next';

// Theme and styling
import {useTheme} from '../context/ThemeContext';
import {getColors} from '../theme/colors';

// State components
import LoadingState from './molecules/LoadingState';
import ErrorState from './molecules/ErrorState';

// Utilities
import {formatCurrency, formatDate, formatPhoneNumber} from '../utils/formatters';

// API services
import axios from 'axios';

/**
 * ServiceTrackingItemScreen Component
 * @returns {JSX.Element} Tracking item screen
 */
const ServiceTrackingItemScreen = () => {
  // Screen dimensions and theme
  const {width, height} = useWindowDimensions();
  const isTablet = width >= 600;
  const {isDarkMode, theme} = useTheme();
  const colors = getColors(isDarkMode);
  const styles = dynamicStyles(width, height, isDarkMode, colors);

  // Translation hook
  const {t} = useTranslation();

  // Navigation
  const navigation = useNavigation();
  const {tracking_id} = useRoute().params;

  // State management
  const [details, setDetails] = useState({});
  const [serviceArray, setServiceArray] = useState([]);
  const [pin, setPin] = useState('4567');
  const [paymentExpanded, setPaymentExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Animation for payment dropdown
  const rotateAnimation = useMemo(() => new Animated.Value(0), []);

  /**
   * Toggle payment details visibility
   */
  const togglePaymentDetails = useCallback(() => {
    setPaymentExpanded(prev => !prev);
  }, []);

  /**
   * Initiate phone call to worker
   */
  const phoneCall = useCallback(async () => {
    try {
      const response = await axios.post(
        'https://backend.clicksolver.com/api/worker/tracking/call',
        {tracking_id},
      );

      if (response.status === 200 && response.data.mobile) {
        const phoneNumber = response.data.mobile;
        const dialURL = `tel:${phoneNumber}`;
        await Linking.openURL(dialURL);
      }
    } catch (error) {
      console.error('Error initiating call:', error.response?.data || error.message);
      setError({
        message: t('call_failed') || 'Failed to initiate call',
        originalError: error,
      });
    }
  }, [tracking_id, t]);

  /**
   * Build timeline data with translated status titles
   */
  const getTimelineData = useMemo(() => {
    const timelineKeys = [
      'collected_item',
      'work_started',
      'work_completed',
      'delivered',
    ];
    const fallbackStatuses = [
      'Collected Item',
      'Work Started',
      'Work Completed',
      'Delivered',
    ];

    // Create translated statuses
    const statuses = timelineKeys.map(
      (key, index) => t(key) || fallbackStatuses[index],
    );

    // Find current status index
    const currentStatusIndex = fallbackStatuses.indexOf(details.service_status);

    return statuses.map((status, index) => ({
      title: status,
      time: '',
      iconColor: index <= currentStatusIndex ? colors.primary : colors.textSecondary,
      lineColor: index <= currentStatusIndex ? colors.primary : colors.textSecondary,
    }));
  }, [details.service_status, t, colors]);

  /**
   * Animate payment dropdown icon
   */
  useEffect(() => {
    Animated.timing(rotateAnimation, {
      toValue: paymentExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [paymentExpanded, rotateAnimation]);

  const rotateInterpolate = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  /**
   * Fetch booking details from API
   */
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        'https://backend.clicksolver.com/api/service/tracking/user/item/details',
        {tracking_id},
      );

      const {data} = response.data;
      setPin(data.tracking_pin);
      setDetails(data);
      setServiceArray(data.service_booked || []);
    } catch (error) {
      console.error('Error fetching bookings data:', error);
      setError({
        message: t('fetch_error') || 'Failed to fetch booking details',
        originalError: error,
      });
    } finally {
      setLoading(false);
    }
  }, [tracking_id, t]);

  /**
   * Initial data fetch
   */
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  /**
   * Listen for FCM notifications and refresh data
   */
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      if (remoteMessage.data?.status) {
        fetchBookings();
      }
    });
    return () => unsubscribe();
  }, [fetchBookings]);

  /**
   * Open PhonePe scanner for payment
   */
  const openPhonePeScanner = useCallback(() => {
    const url = 'phonepe://scan';
    Linking.openURL(url).catch(() => {
      // If opening PhonePe fails, open Play Store link
      Linking.openURL(
        'https://play.google.com/store/apps/details?id=com.phonepe.app',
      );
    });
  }, []);

  /**
   * Navigate back to home
   */
  const navigateToHome = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{name: 'Tabs', state: {routes: [{name: 'Home'}]}}],
      }),
    );
  }, [navigation]);

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingState message={t('loading_details') || 'Loading details...'} />
      </SafeAreaView>
    );
  }

  // Show error state
  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={navigateToHome}
              style={styles.backButton}>
              <Icon
                name="arrow-back"
                size={20}
                color={colors.text}
              />
            </TouchableOpacity>
            <Text style={styles.headerText}>
              {t('service_trackings') || 'Service Trackings'}
            </Text>
          </View>
          <ErrorState
            error={error.message}
            onRetry={fetchBookings}
            title={t('error') || 'Error'}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={navigateToHome}
            style={styles.backButton}>
            <Icon
              name="arrow-back"
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>

          <Text style={styles.headerText}>
            {t('service_trackings') || 'Service Trackings'}
          </Text>
        </View>

        <ScrollView>
          {/* Worker Profile */}
          <View style={styles.profileContainer}>
            <View style={styles.profileImage}>
              <Image source={{uri: details.profile}} style={styles.image} />
            </View>
            <View style={styles.profileTextContainer}>
              <View>
                <Text style={styles.userName}>{details.name}</Text>
                <Text style={styles.userDesignation}>{details.service}</Text>
              </View>
              <TouchableOpacity
                style={styles.callIconContainer}
                onPress={phoneCall}
                accessibilityLabel={t('call_worker') || 'Call worker'}
                accessibilityRole="button">
                <Icon name="call" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* PIN Display */}
          <View style={styles.pinContainer}>
            <Text style={styles.pinText}>{t('pin') || 'PIN'}</Text>
            <View style={styles.pinBoxesContainer}>
              {pin.split('').map((digit, index) => (
                <View key={index} style={styles.pinBox}>
                  <Text style={styles.pinNumber}>{digit}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.horizantalLine} />

          {/* Service Details */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionBookedTitle}>
              {t('service_details') || 'Service Details'}
            </Text>
            <View style={styles.innerContainer}>
              {serviceArray.map((service, index) => (
                <Text key={index} style={styles.serviceDetail}>
                  {t(`singleService_${service.main_service_id}`) ||
                    service.serviceName}
                </Text>
              ))}
            </View>
          </View>

          <View style={styles.horizantalLine} />

          {/* Additional Info Section */}
          {(details.data?.estimatedDuration || details.data?.image) && (
            <>
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>
                  {t('additional_info') || 'Additional Info'}
                </Text>
                <View style={styles.additionalInfoContainer}>
                  {details.data?.estimatedDuration && (
                    <Text style={styles.infoText}>
                      {t('estimated_time') || 'Estimated Time:'}{' '}
                      {details.data.estimatedDuration}
                    </Text>
                  )}
                  {details.data?.image && (
                    <Image
                      source={{uri: details.data.image}}
                      style={styles.additionalImage}
                    />
                  )}
                </View>
              </View>
              <View style={styles.horizantalLine} />
            </>
          )}

          {/* Service Timeline */}
          <View style={styles.sectionContainer}>
            <View style={styles.serviceTimeLineContainer}>
              <Text style={styles.sectionTitle}>
                {t('service_timeline') || 'Service Timeline'}
              </Text>
            </View>
            <View style={styles.innerContainerLine}>
              {getTimelineData.map((item, index) => (
                <View key={index} style={styles.timelineItem}>
                  <View style={{alignItems: 'center'}}>
                    <MaterialCommunityIcons
                      name="circle"
                      size={14}
                      color={item.iconColor}
                      style={styles.timelineIcon}
                    />
                    {index !== getTimelineData.length - 1 && (
                      <View
                        style={[
                          styles.lineSegment,
                          {
                            backgroundColor:
                              getTimelineData[index + 1].iconColor,
                          },
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.timelineTextContainer}>
                    <Text style={styles.timelineText}>{item.title}</Text>
                    {item.time && (
                      <Text style={styles.timelineTime}>{item.time}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.horizantalLine} />

          {/* Address */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{t('address') || 'Address'}</Text>
            <View style={styles.addressContainer}>
              <Image
                source={{
                  uri: 'https://i.postimg.cc/rpb2czKR/1000051859-removebg-preview.png',
                }}
                style={styles.locationPinImage}
              />
              <View style={styles.addressTextContainer}>
                <Text style={styles.address}>{details.area}</Text>
              </View>
            </View>
          </View>

          {/* Payment Details */}
          <View style={styles.paymentInnerContainer}>
            <TouchableOpacity
              style={styles.paymentSummaryContainer}
              onPress={togglePaymentDetails}
              accessibilityRole="button"
              accessibilityLabel={
                t('toggle_payment_details') || 'Toggle Payment Details'
              }>
              <Text style={styles.sectionPaymentTitle}>
                {t('payment_details') || 'Payment Details'}
              </Text>
              <Animated.View style={{transform: [{rotate: rotateInterpolate}]}}>
                <Entypo name="chevron-small-right" size={20} color={colors.primary} />
              </Animated.View>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionContainer}>
            {paymentExpanded && (
              <View style={styles.PaymentItemContainer}>
                {serviceArray.map((service, index) => (
                  <View key={index} style={styles.paymentRow}>
                    <Text style={styles.paymentLabelHead}>
                      {t(`singleService_${service.main_service_id}`) ||
                        service.serviceName}
                    </Text>
                    <Text style={styles.paymentValue}>
                      {formatCurrency(service.cost)}
                    </Text>
                  </View>
                ))}
                {details.discount > 0 && (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>
                      {t('discount') || 'Discount'}
                    </Text>
                    <Text style={styles.paymentValue}>
                      {formatCurrency(details.discount)}
                    </Text>
                  </View>
                )}
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>
                    {t('grand_total') || 'Grand Total'}
                  </Text>
                  <Text style={styles.paymentValue}>
                    {formatCurrency(details.total_cost)}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.payButton}
            onPress={openPhonePeScanner}
            accessibilityLabel={t('pay') || 'PAY'}
            accessibilityRole="button">
            <Text style={styles.payButtonText}>{t('pay') || 'PAY'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

/**
 * Dynamic styles with Dark Theme Support
 * @param {number} width - Screen width
 * @param {number} height - Screen height
 * @param {boolean} isDarkMode - Dark mode flag
 * @param {object} colors - Theme colors
 * @returns {object} StyleSheet object
 */
function dynamicStyles(width, height, isDarkMode, colors) {
  const isTablet = width >= 600;
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isTablet ? 20 : 16,
      paddingBottom: isTablet ? 16 : 12,
      elevation: Platform.OS === 'ios' ? 0 : 2,
      backgroundColor: colors.background,
      position: 'relative',
    },
    backButton: {
      position: 'absolute',
      left: isTablet ? 20 : 16,
      zIndex: 2,
    },
    headerText: {
      fontSize: isTablet ? 20 : 18,
      fontFamily: 'RobotoSlab-Medium',
      color: colors.text,
      textAlign: 'center',
    },
    profileContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: isTablet ? 20 : 15,
      paddingLeft: isTablet ? 20 : 16,
    },
    profileImage: {},
    image: {
      width: isTablet ? 70 : 60,
      height: isTablet ? 70 : 60,
      borderRadius: isTablet ? 35 : 30,
      marginRight: 5,
    },
    profileTextContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingRight: isTablet ? 20 : 16,
    },
    callIconContainer: {
      backgroundColor: colors.background,
      borderRadius: 50,
      padding: isTablet ? 10 : 8,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    pinContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: isTablet ? 12 : 10,
      paddingBottom: isTablet ? 12 : 10,
      paddingLeft: isTablet ? 20 : 16,
    },
    pinText: {
      color: colors.text,
      fontFamily: 'RobotoSlab-Regular',
      fontSize: isTablet ? 18 : 16,
      paddingTop: isTablet ? 12 : 10,
    },
    pinBoxesContainer: {
      flexDirection: 'row',
      gap: 5,
    },
    pinBox: {
      width: isTablet ? 24 : 20,
      height: isTablet ? 24 : 20,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.text,
      borderRadius: 5,
    },
    pinNumber: {
      color: colors.text,
      fontFamily: 'RobotoSlab-Regular',
      fontSize: isTablet ? 16 : 14,
    },
    horizantalLine: {
      height: 2,
      backgroundColor: colors.border,
      marginBottom: isTablet ? 16 : 12,
    },
    sectionContainer: {
      marginBottom: isTablet ? 20 : 16,
      paddingLeft: isTablet ? 20 : 16,
      paddingRight: isTablet ? 20 : 16,
      width: '95%',
    },
    sectionBookedTitle: {
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'RobotoSlab-Medium',
      color: colors.text,
      marginBottom: 8,
    },
    innerContainer: {
      paddingLeft: isTablet ? 20 : 16,
    },
    serviceDetail: {
      fontSize: isTablet ? 16 : 14,
      color: colors.text,
      fontFamily: 'RobotoSlab-Regular',
      marginBottom: 4,
    },
    serviceTimeLineContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    sectionTitle: {
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'RobotoSlab-Medium',
      color: colors.text,
      marginBottom: 8,
      paddingBottom: isTablet ? 20 : 15,
    },
    innerContainerLine: {
      paddingLeft: isTablet ? 20 : 16,
    },
    timelineItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    timelineIcon: {
      marginBottom: 0,
    },
    timelineTextContainer: {
      flex: 1,
      marginLeft: 10,
    },
    timelineText: {
      fontSize: isTablet ? 16 : 14,
      color: colors.text,
      fontFamily: 'RobotoSlab-Regular',
    },
    timelineTime: {
      fontSize: isTablet ? 12 : 10,
      color: colors.textSecondary,
      fontFamily: 'RobotoSlab-Regular',
    },
    lineSegment: {
      width: 2,
      height: isTablet ? 50 : 40,
    },
    addressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: isTablet ? 12 : 10,
    },
    locationPinImage: {
      width: isTablet ? 24 : 20,
      height: isTablet ? 24 : 20,
      marginRight: isTablet ? 12 : 10,
    },
    addressTextContainer: {
      marginLeft: isTablet ? 12 : 10,
    },
    address: {
      fontSize: isTablet ? 14 : 12,
      color: colors.text,
      fontFamily: 'RobotoSlab-Regular',
    },
    paymentInnerContainer: {
      padding: isTablet ? 15 : 10,
      backgroundColor: colors.cardBackground,
      marginTop: isTablet ? 15 : 10,
      marginBottom: isTablet ? 15 : 10,
    },
    paymentSummaryContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionPaymentTitle: {
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'RobotoSlab-Medium',
      color: colors.text,
      marginBottom: 8,
      paddingLeft: isTablet ? 15 : 10,
    },
    PaymentItemContainer: {
      paddingLeft: isTablet ? 20 : 16,
      flexDirection: 'column',
    },
    paymentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    paymentLabelHead: {
      width: '80%',
      fontSize: isTablet ? 14 : 12,
      fontFamily: 'RobotoSlab-Regular',
      color: colors.text,
    },
    paymentLabel: {
      fontSize: isTablet ? 14 : 12,
      color: colors.text,
      fontFamily: 'RobotoSlab-Regular',
    },
    paymentValue: {
      fontSize: isTablet ? 16 : 14,
      color: colors.text,
      fontFamily: 'RobotoSlab-Medium',
    },
    payButton: {
      backgroundColor: colors.primary,
      paddingVertical: isTablet ? 14 : 12,
      borderRadius: 8,
      alignItems: 'center',
      marginVertical: isTablet ? 25 : 20,
      marginHorizontal: isTablet ? 25 : 20,
    },
    payButtonText: {
      fontSize: isTablet ? 18 : 16,
      textAlign: 'center',
      fontFamily: 'RobotoSlab-Medium',
      color: '#fff',
    },
    userName: {
      fontSize: isTablet ? 19 : 16,
      fontFamily: 'RobotoSlab-Bold',
      color: colors.text,
      lineHeight: 21.09,
    },
    userDesignation: {
      fontSize: isTablet ? 18 : 15,
      color: colors.textSecondary,
      fontFamily: 'RobotoSlab-Regular',
    },
    additionalInfoContainer: {
      marginVertical: isTablet ? 12 : 10,
      alignItems: 'center',
    },
    infoText: {
      fontSize: isTablet ? 16 : 14,
      color: colors.text,
      fontFamily: 'RobotoSlab-Regular',
      marginBottom: 8,
    },
    additionalImage: {
      width: isTablet ? 200 : 150,
      height: isTablet ? 200 : 150,
      resizeMode: 'cover',
      borderRadius: 10,
    },
  });
}

export default ServiceTrackingItemScreen;
