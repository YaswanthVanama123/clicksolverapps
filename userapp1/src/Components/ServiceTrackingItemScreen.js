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
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome6';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
// import Config from 'react-native-config';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import {useRoute} from '@react-navigation/native';
import axios from 'axios';
import {SafeAreaView} from 'react-native-safe-area-context';

const ServiceTrackingItemScreen = () => {
  const [titleColor, setTitleColor] = useState('#FFFFFF');

  const [details, setDetails] = useState({});
  const [paymentDetails, setPaymentDetails] = useState({});
  const [serviceArray, setServiceArray] = useState([]);
  const {tracking_id} = useRoute().params;
  const [pin, setPin] = useState('4567');
  const [paymentExpanded, setPaymentExpanded] = useState(false);
  const togglePaymentDetails = () => {
    setPaymentExpanded(!paymentExpanded);
  };

  const getTimelineData = useMemo(() => {
    const statuses = [
      'Collected Item',
      'Work started',
      'Work Completed',
      'Delivered',
    ];
    const currentStatusIndex = statuses.indexOf(details.service_status);
    return statuses.map((status, index) => ({
      title: status,
      time: '',
      iconColor: index <= currentStatusIndex ? '#ff4500' : '#a1a1a1',
      lineColor: index <= currentStatusIndex ? '#ff4500' : '#a1a1a1',
    }));
  }, [details.service_status]);
  const rotateAnimation = useMemo(() => new Animated.Value(0), []);

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

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await axios.post(
          `https://backend.clicksolver.com/api/service/tracking/user/item/details`,
          {tracking_id},
        );
        const {data} = response.data;
     
        setPin(data.tracking_pin);
        setDetails(data);
      
        setServiceArray(data.service_booked);
      } catch (error) {
        console.error('Error fetching bookings data:', error);
      }
    };
    fetchBookings();
  }, [tracking_id]);

  const openPhonePeScanner = useCallback(() => {
    const url = 'phonepe://scan';
    Linking.openURL(url)
      .then(() => {
        console.log('PhonePe scanner opened successfully');
      })
      .catch(err => {
        console.error('Failed to open PhonePe scanner:', err);
        Linking.openURL(
          'https://play.google.com/store/apps/details?id=com.phonepe.app',
        );
      });
  }, []);

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
            {/* <Image
          source={{ uri: details.profile }}
          style={styles.profileImage}
          resizeMode="cover"
        /> */}
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

              <TouchableOpacity style={styles.callIconContainer}>
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
                    <Text style={styles.timelineTime}>{item.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.horizantalLine} />

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
            {/* Payment Summary with Toggle */}

            {/* Conditionally Render Payment Details */}
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
                  {/* <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>SGST (5%)</Text>
                    <Text style={styles.paymentValue}>
                      ₹{paymentDetails.cgstAmount.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>CGST (5%)</Text>
                    <Text style={styles.paymentValue}>
                      ₹{paymentDetails.gstAmount.toFixed(2)}
                    </Text>
                  </View> */}
                  {details.discount > 0 &&
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Discount</Text>
                    <Text style={styles.paymentValue}>
                      {/* ₹{paymentDetails.discountAmount.toFixed(2)} */}
                      ₹{details.discount}
                    </Text>
                  </View> }
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Grand Total</Text>
                    <Text style={styles.paymentValue}>
                      ₹{details.total_cost}
                      {/* {paymentDetails.fetchedFinalTotalAmount.toFixed(2)} */}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>

          <TouchableOpacity
            style={styles.payButton}
            onPress={openPhonePeScanner}>
            <Text style={styles.payButtonText}>PAY</Text>
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
  profileCallContainer: {
    flexDirection: 'row',

    justifyContent: 'space-between',
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
    fontSize: 22,
    fontFamily: 'RobotoSlab-Medium',
    fontWeight: '800',
  },
  profileTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 16,
  },
  lineSegment: {
    width: 2,
    height: 40, // Adjust the height as needed
  },
  callIconContainer: {
    backgroundColor: '#fff',
    borderRadius: 50,
    padding: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  swipeButton: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  locationPinImage: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  horizantalLine: {
    height: 2,
    backgroundColor: '#F5F5F5',
    marginBottom: 12,
  },
  innerContainer: {
    paddingLeft: 16,
  },
  paymentSummaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentInnerContainer: {
    padding: 10,
    backgroundColor: '#f5f5f5',
    marginTop: 10,
    marginBottom: 10,
  },
  PaymentItemContainer: {
    paddingLeft: 16,
    flexDirection: 'column',
    gap: 5,
  },
  sectionContainer: {
    marginBottom: 16,
    paddingLeft: 16,
    paddingRight: 16,
    width: '95%',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'RobotoSlab-Medium',
    color: '#212121',
    marginBottom: 8,
    paddingBottom: 15,
  },
  sectionBookedTitle: {
    fontSize: 16,
    fontFamily: 'RobotoSlab-Medium',
    color: '#212121',
    marginBottom: 8,
  },
  editText: {
    color: '#ff5700',
    fontSize: 15,
    fontWeight: '500',
  },
  serviceTimeLineContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionPaymentTitle: {
    fontSize: 16,
    fontFamily: 'RobotoSlab-Medium',
    color: '#212121',
    marginBottom: 8,
    paddingLeft: 10,
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
    fontFamily: 'RobotoSlab-Regular',
  },
  timelineTime: {
    fontSize: 10,
    color: '#4a4a4a',
    fontFamily: 'RobotoSlab-Regular',
  },
  backIcon: {
    marginRight: 10,
  },
  headerText: {
    fontSize: 16,
    fontFamily: 'RobotoSlab-SemiBold',
    color: '#212121',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
    paddingLeft: 16,
  },
  // profileImage: {
  //   width: 70,
  //   height: 70,
  //   backgroundColor:'#ccc',
  //   borderRadius: 35,
  //   marginRight: 16,
  // },
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

  pinContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingBottom: 10,
    paddingLeft: 16,
  },
  pinText: {
    color: '#1D2951',
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 16,
    paddingTop: 10,
  },
  pinBoxesContainer: {
    flexDirection: 'row',
    gap: 5,
  },
  pinBox: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#212121',
    borderRadius: 5,
  },
  pinNumber: {
    color: '#212121',
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 14,
  },
  innerContainerLine: {
    position: 'relative', // To contain the absolute positioned vertical line
    paddingLeft: 30, // Adjust to provide space for the line and icons
  },
  serviceDetail: {
    fontSize: 14,
    color: '#212121',
    fontFamily: 'RobotoSlab-Regular',
    marginBottom: 4,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
  },
  addressTextContainer: {
    marginLeft: 10,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  address: {
    fontSize: 12,
    color: '#212121',
    fontFamily: 'RobotoSlab-Regular',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  paymentLabelHead: {
    width: '80%',
    fontSize: 12,
    fontFamily: 'RobotoSlab-Regular',
    color: '#212121',
  },
  paymentLabel: {
    fontSize: 12,
    color: '#212121',
    fontFamily: 'RobotoSlab-Regular',
  },
  paymentValue: {
    fontSize: 14,
    color: '#212121',
    fontFamily: 'RobotoSlab-Medium',
  },
  paymentOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingLeft: 16,
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
    fontFamily: 'RobotoSlab-Medium',
    color: '#fff',
  },
});

export default ServiceTrackingItemScreen;
