import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Linking,
  Animated, 
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome6';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import axios from 'axios';
import { useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Import the theme hook
import { useTheme } from '../context/ThemeContext';

const ServiceTrackingItemScreen = () => {
  // 1) Get screen width & height
  const { width, height } = useWindowDimensions();
  // 2) Get dark mode flag and generate dynamic styles
  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(width, height, isDarkMode);

  const [details, setDetails] = useState({});
  const [serviceArray, setServiceArray] = useState([]);
  const { tracking_id } = useRoute().params;
  const [pin, setPin] = useState('4567');
  const [paymentExpanded, setPaymentExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  const rotateAnimation = useMemo(() => new Animated.Value(0), []);

  // Toggle Payment Details
  const togglePaymentDetails = () => {
    setPaymentExpanded(!paymentExpanded);
  };

  const phoneCall = async () => {
    try {
      const response = await axios.post(
        'http://192.168.55.102:5000/api/worker/tracking/call',
        { tracking_id },
      );
      if (response.status === 200 && response.data.mobile) {
        const phoneNumber = response.data.mobile;
        const dialURL = `tel:${phoneNumber}`;
        Linking.openURL(dialURL).catch((err) =>
          console.error('Error opening dialer:', err),
        );
      } else {
        console.log('Failed to initiate call:', response.data);
      }
    } catch (error) {
      console.error(
        'Error initiating call:',
        error.response ? error.response.data : error.message,
      );
    }
  };

  // Build timeline data
  const getTimelineData = useMemo(() => {
    const statuses = ['Collected Item', 'Work started', 'Work Completed', 'Delivered'];
    const currentStatusIndex = statuses.indexOf(details.service_status);
    return statuses.map((status, index) => ({
      title: status,
      time: '', // You can update this if needed
      iconColor: index <= currentStatusIndex ? '#ff4500' : '#a1a1a1',
      lineColor: index <= currentStatusIndex ? '#ff4500' : '#a1a1a1',
    }));
  }, [details.service_status]);

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

  // Fetch data
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          `http://192.168.55.102:5000/api/service/tracking/user/item/details`,
          { tracking_id },
        );
        const { data } = response.data;
        console.log("dat", data);
        setPin(data.tracking_pin);
        setDetails(data);
        setServiceArray(data.service_booked);
      } catch (error) {
        console.error('Error fetching bookings data:', error);
      } finally {
        setLoading(false);
      }
    }; 
    fetchBookings();
  }, [tracking_id]);

  // Open PhonePe Scanner
  const openPhonePeScanner = useCallback(() => {
    const url = 'phonepe://scan';
    Linking.openURL(url).catch(() => {
      // If opening PhonePe fails, open Play Store link
      Linking.openURL('https://play.google.com/store/apps/details?id=com.phonepe.app');
    });
  }, []);

  // Show loader if still fetching
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5722" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Icon
            name="arrow-left-long"
            size={20}
            color={isDarkMode ? '#fff' : "#212121"}
            style={styles.backIcon}
          />
          <Text style={styles.headerText}>Service Trackings</Text>
        </View>

        <ScrollView>
          {/* User Profile */}
          <View style={styles.profileContainer}>
            <View style={styles.profileImage}>
              <Text style={styles.profileInitial}>
                {details.name ? details.name.charAt(0).toUpperCase() : ''}
              </Text>
            </View>
            <View style={styles.profileTextContainer}>
              <View>
                <Text style={styles.userName}>{details.name}</Text>
                <Text style={styles.userDesignation}>{details.service}</Text>
              </View>
              <TouchableOpacity style={styles.callIconContainer} onPress={phoneCall}>
                <MaterialIcons name="call" size={22} color="#FF5722" />
              </TouchableOpacity>
            </View>
          </View>

          {/* PIN */}
          <View style={styles.pinContainer}>
            <Text style={styles.pinText}>PIN</Text>
            {/* Display each pin digit in its own box */}
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
            <Text style={styles.sectionBookedTitle}>Service Details</Text>
            <View style={styles.innerContainer}>
              {serviceArray.map((service, index) => (
                <Text key={index} style={styles.serviceDetail}>
                  {service.serviceName}
                </Text>
              ))}
            </View>
          </View>

          <View style={styles.horizantalLine} />

          {/* Service Timeline */}
          <View style={styles.sectionContainer}>
            <View style={styles.serviceTimeLineContainer}>
              <Text style={styles.sectionTitle}>Service Timeline</Text>
            </View>
            <View style={styles.innerContainerLine}>
              {getTimelineData.map((item, index) => (
                <View key={index} style={styles.timelineItem}>
                  <View style={{ alignItems: 'center' }}>
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
                            backgroundColor: getTimelineData[index + 1].iconColor,
                          },
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.timelineTextContainer}>
                    <Text style={styles.timelineText}>{item.title}</Text>
                    <Text style={styles.timelineTime}>{item.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.horizantalLine} />

          {/* Address */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Address</Text>
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
              accessibilityLabel="Toggle Payment Details"
            >
              <Text style={styles.sectionPaymentTitle}>Payment Details</Text>
              <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
                <Entypo name="chevron-small-right" size={20} color="#ff4500" />
              </Animated.View>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionContainer}>
            {/* Payment Summary with Toggle */}
            {paymentExpanded && (
              <View style={styles.PaymentItemContainer}>
                {serviceArray.map((service, index) => (
                  <View key={index} style={styles.paymentRow}>
                    <Text style={styles.paymentLabelHead}>
                      {service.serviceName}
                    </Text>
                    <Text style={styles.paymentValue}>
                      ₹{service.cost.toFixed(2)}
                    </Text>
                  </View>
                ))}
                {details.discount > 0 && (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Discount</Text>
                    <Text style={styles.paymentValue}>
                      ₹{details.discount}
                    </Text>
                  </View>
                )}
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Grand Total</Text>
                  <Text style={styles.paymentValue}>
                    ₹{details.total_cost}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.payButton} onPress={openPhonePeScanner}>
            <Text style={styles.payButtonText}>PAY</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

/**
 * DYNAMIC STYLES with Dark Theme Support
 */
function dynamicStyles(width, height, isDarkMode) {
  const isTablet = width >= 600;
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
    },
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#ffffff',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: isTablet ? 20 : 16,
      paddingBottom: isTablet ? 16 : 12,
      elevation: 2,
      shadowColor: isDarkMode ? '#000' : '#1D2951',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      backgroundColor: isDarkMode ? '#121212' : '#ffffff',
    },
    backIcon: {
      marginRight: isTablet ? 15 : 10,
    },
    headerText: {
      fontSize: isTablet ? 20 : 16,
      fontFamily: 'RobotoSlab-Medium',
      color: isDarkMode ? '#fff' : '#212121',
    },
    profileContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: isTablet ? 20 : 15,
      paddingLeft: isTablet ? 20 : 16,
    },
    profileImage: {
      width: isTablet ? 70 : 60,
      height: isTablet ? 70 : 60,
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FF7A22',
      borderRadius: isTablet ? 35 : 30,
      marginRight: 5,
    },
    profileInitial: {
      color: '#FFFFFF',
      fontSize: isTablet ? 24 : 22,
      fontFamily: 'RobotoSlab-Medium',
      fontWeight: '800',
    },
    profileTextContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingRight: isTablet ? 20 : 16,
    },
    callIconContainer: {
      backgroundColor: isDarkMode ? '#121212' : '#fff',
      borderRadius: 50,
      padding: isTablet ? 10 : 8,
      // elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    pinContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: isTablet ? 12 : 10,
      paddingBottom: isTablet ? 12 : 10,
      paddingLeft: isTablet ? 20 : 16,
    },
    pinText: {
      color: isDarkMode ? '#fff' : '#1D2951',
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
      borderColor: isDarkMode ? '#fff' : '#212121',
      borderRadius: 5,
    },
    pinNumber: {
      color: isDarkMode ? '#fff' : '#212121',
      fontFamily: 'RobotoSlab-Regular',
      fontSize: isTablet ? 16 : 14,
    },
    horizantalLine: {
      height: 2,
      backgroundColor: isDarkMode ? '#333' : '#F5F5F5',
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
      color: isDarkMode ? '#fff' : '#212121',
      marginBottom: 8,
    },
    innerContainer: {
      paddingLeft: isTablet ? 20 : 16,
    },
    serviceDetail: {
      fontSize: isTablet ? 16 : 14,
      color: isDarkMode ? '#fff' : '#212121',
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
      color: isDarkMode ? '#fff' : '#212121',
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
      marginBottom: 5,
    },
    timelineTextContainer: {
      flex: 1,
      marginLeft: 10,
    },
    timelineText: {
      fontSize: isTablet ? 16 : 14,
      color: isDarkMode ? '#fff' : '#212121',
      fontFamily: 'RobotoSlab-Regular',
    },
    timelineTime: {
      fontSize: isTablet ? 12 : 10,
      color: isDarkMode ? '#ccc' : '#4a4a4a',
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
      color: isDarkMode ? '#fff' : '#212121',
      fontFamily: 'RobotoSlab-Regular',
    },
    paymentInnerContainer: {
      padding: isTablet ? 15 : 10,
      backgroundColor: isDarkMode ? '#121212' : '#f5f5f5',
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
      color: isDarkMode ? '#fff' : '#212121',
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
      color: isDarkMode ? '#fff' : '#212121',
    },
    paymentLabel: {
      fontSize: isTablet ? 14 : 12,
      color: isDarkMode ? '#fff' : '#212121',
      fontFamily: 'RobotoSlab-Regular',
    },
    paymentValue: {
      fontSize: isTablet ? 16 : 14,
      color: isDarkMode ? '#fff' : '#212121',
      fontFamily: 'RobotoSlab-Medium',
    },
    payButton: {
      backgroundColor: '#ff4500',
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
      color: isDarkMode ? '#fff' : '#4A4A4A',
      lineHeight: 21.09,
    },
    userDesignation: {
      fontSize: isTablet ? 18 : 15,
      color: isDarkMode ? '#ccc' : '#4a4a4a',
      fontFamily: 'RobotoSlab-Regular',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
}

export default ServiceTrackingItemScreen;
