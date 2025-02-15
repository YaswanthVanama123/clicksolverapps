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
  ActivityIndicator, // Import ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome6';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation, CommonActions, useRoute} from '@react-navigation/native';
import axios from 'axios';
import Entypo from 'react-native-vector-icons/Entypo';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {SafeAreaView} from 'react-native-safe-area-context';

const ServiceBookingItem = () => {
  const [details, setDetails] = useState({});
  const [paymentDetails, setPaymentDetails] = useState({});
  const [serviceArray, setServiceArray] = useState([]);
  const {tracking_id} = useRoute().params;
  const [paymentExpanded, setPaymentExpanded] = useState(false);
  const [loading, setLoading] = useState(true); // New loading state
  const [status, setStatus] = useState({}); // Status object with timestamps

  const navigation = useNavigation();
  const rotateAnimation = useMemo(() => new Animated.Value(0), []);

  const togglePaymentDetails = () => {
    setPaymentExpanded(!paymentExpanded);
  };

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

  // Mapping for status display names
  const statusDisplayNames = {
    accept: 'Commander Accepted',
    arrived: 'Commander Arrived',
    workCompleted: 'Work Completed',
    paymentCompleted: 'Payment Completed',
  };

  // Timeline data generation based on status object
  const getTimelineData = useMemo(() => {
    const statusKeys = Object.keys(status);
    const currentStatusIndex = statusKeys.findIndex(
      key => status[key] === null,
    );

    return statusKeys.map((statusKey, index) => ({
      title: statusDisplayNames[statusKey],
      time: status[statusKey],
      iconColor:
        index <= currentStatusIndex || currentStatusIndex === -1
          ? '#ff4500'
          : '#a1a1a1',
      lineColor:
        index <= currentStatusIndex || currentStatusIndex === -1
          ? '#ff4500'
          : '#a1a1a1',
    }));
  }, [status]);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          `https://backend.clicksolver.com/api/service/booking/item/details`,
          {tracking_id},
        );
        console.log(response.data);
        const {data} = response.data;
        setStatus(data.time || {});
        setDetails(data);
        setServiceArray(data.service_booked);
      } catch (error) {
        console.error('Error fetching bookings data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookingDetails();
  }, [tracking_id]);

  // If loading, show a full screen ActivityIndicator
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
        <View style={styles.header}>
          <Icon
            name="arrow-left-long"
            size={20}
            color="#212121"
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
                    <Text style={styles.timelineTime}>
                      {item.time ? item.time : 'Pending'}
                    </Text>
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
              accessibilityLabel="Toggle Payment Details">
              <Text style={styles.sectionPaymentTitle}>Payment Details</Text>
              <Animated.View style={{transform: [{rotate: rotateInterpolate}]}}>
                <Entypo name="chevron-small-right" size={20} color="#ff4500" />
              </Animated.View>
            </TouchableOpacity>
          </View>
          <View style={styles.sectionContainer}>
            {paymentExpanded && (
              <>
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
                      <Text style={styles.paymentLabel}>Cashback (5%)</Text>
                      <Text style={styles.paymentValue}>
                        ₹{details.discount}
                      </Text>
                    </View>
                  )}
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentValue}> Grand Total</Text>
                    <Text style={styles.paymentValue}>
                      ₹ {details.total_cost}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Pay Button */}
          <TouchableOpacity style={styles.payButton} disabled>
            <Text style={styles.payButtonText}>PAYED</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
    elevation: 2,
    shadowColor: '#1D2951',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    backgroundColor: '#ffffff',
  },
  backIcon: {
    marginRight: 10,
  },
  headerText: {
    fontSize: 18,
    fontFamily: 'RobotoSlab-SemiBold',
    color: '#1D2951',
    paddingLeft: 30,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
    paddingLeft: 16,
  },
  profileImage: {
    width: 60,
    height: 60,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF7A22',
    borderRadius: 30,
    marginRight: 5,
  },
  profileInitial: {
    color: '#FFFFFF',
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 22,
  },
  profileTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 16,
  },
  userName: {
    fontSize: 20,
    fontFamily: 'RobotoSlab-Medium',
    color: '#1D2951',
  },
  userDesignation: {
    fontSize: 14,
    color: '#4a4a4a',
    fontFamily: 'RobotoSlab-Regular',
  },
  horizantalLine: {
    height: 2,
    backgroundColor: '#F5F5F5',
    marginBottom: 12,
  },
  sectionContainer: {
    marginBottom: 16,
    paddingLeft: 15,
    paddingRight: 16,
    paddingTop: 5,
    width: '95%',
  },
  sectionBookedTitle: {
    fontSize: 16,
    fontFamily: 'RobotoSlab-SemiBold',
    color: '#212121',
    marginBottom: 8,
  },
  innerContainer: {
    paddingLeft: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'RobotoSlab-SemiBold',
    color: '#212121',
    marginBottom: 8,
    paddingBottom: 15,
  },
  serviceDetail: {
    fontSize: 14,
    color: '#212121',
    fontFamily: 'RobotoSlab-Regular',
    marginBottom: 4,
  },
  serviceTimeLineContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  innerContainerLine: {
    paddingLeft: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  timelineText: {
    fontSize: 14,
    color: '#212121',
    fontFamily: 'RobotoSlab-Medium',
  },
  timelineTime: {
    fontSize: 10,
    color: '#4a4a4a',
    fontFamily: 'RobotoSlab-Regular',
  },
  lineSegment: {
    width: 2,
    height: 40,
  },
  PaymentItemContainer: {
    paddingLeft: 16,
    flexDirection: 'column',
    gap: 5,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  paymentLabel: {
    fontSize: 12,
    fontFamily: 'RobotoSlab-Regular',
    color: '#212121',
  },
  paymentLabelHead: {
    width: '80%',
    fontSize: 12,
    fontFamily: 'RobotoSlab-Regular',
    color: '#212121',
  },
  paymentValue: {
    fontSize: 14,
    fontFamily: 'RobotoSlab-SemiBold',
    color: '#212121',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
  },
  locationPinImage: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  addressTextContainer: {
    marginLeft: 10,
  },
  address: {
    fontSize: 12,
    fontFamily: 'RobotoSlab-Regular',
    color: '#212121',
  },
  paymentInnerContainer: {
    padding: 10,
    backgroundColor: '#f5f5f5',
    marginTop: 10,
    marginBottom: 10,
  },
  paymentSummaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionPaymentTitle: {
    fontSize: 16,
    fontFamily: 'RobotoSlab-SemiBold',
    color: '#212121',
    marginBottom: 8,
    paddingLeft: 10,
  },
  payButton: {
    backgroundColor: '#ff4500',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 20,
    marginHorizontal: 20,
  },
  payButtonText: {
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'RobotoSlab-Regular',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ServiceBookingItem;
