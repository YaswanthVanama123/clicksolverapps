// Payment.js

import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  TextInput,
  Image,
  BackHandler,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  useNavigation,
  CommonActions,
  useFocusEffect,
} from '@react-navigation/native';
import axios from 'axios';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Entypo from 'react-native-vector-icons/Entypo';
import { SafeAreaView } from 'react-native-safe-area-context';
// import Config from 'react-native-config';

const Payment = ({route}) => {
  const [paymentMethod, setPaymentMethod] = useState('');

  const [couponCode, setCouponCode] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [gstAmount, setGstAmount] = useState(0);
  const [cgstAmount, setCgstAmount] = useState(0);
  const [cashback, setCashback] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const navigation = useNavigation();
  const [serviceArray, setServiceArray] = useState([]);
  const {encodedId} = route.params;
  const [vocherModal, setVocherModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [discount, setDiscount] = useState(100);
  const [totalCost, setTotalCost] = useState(0);

  const [value, setValue] = useState('');
  const [paymentDetails, setPaymentDetails] = useState({});

  useEffect(() => {
    if (encodedId) {
      const decoded = atob(encodedId);
      fetchPaymentDetails(decoded);
    }
  }, [encodedId]);

  const fetchPaymentDetails = useCallback(async decodedId => {
    try {
      const response = await axios.post(
        `https://backend.clicksolver.com/api/payment/details`,
        {
          notification_id: decodedId,
        },
      );
      const {
        // start_time,
        // end_time,
        // time_worked,
        service_booked,
        name,
        area,
        city,
        pincode,
        discount,
        total_cost,
        // gstAmount,
        // cgstAmount,
        // discountAmount,
        // fetchedFinalTotalAmount,
        profile,
      } = response.data;
      console.log("total cost ",response.data.total_cost)

      // const startTime = formatTime(start_time);
      // const endTime = formatTime(end_time);
      // const timeWorked = convertTimeStringToReadableFormat(time_worked);
      // const completedTime = convertISODateToReadableFormat(end_time);



      setDiscount(discount);
      setTotalCost(total_cost);

      setPaymentDetails({
        // start_time: startTime,
        // end_time: endTime,
        // time_worked: timeWorked,
        // date: completedTime,
        city,
        area,
        pincode,
        name,
        profile,
      });

      // setGstAmount(gstAmount);
      // setCgstAmount(cgstAmount);
      // setCashback(discountAmount);
      // setGrandTotal(fetchedFinalTotalAmount);
      setServiceArray(service_booked);
    } catch (error) {
      console.error('Error fetching payment details:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: 'Tabs', state: {routes: [{name: 'Home'}]}}],
          }),
        );
        return true;
      };
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => backHandler.remove();
    }, [navigation]),
  );

  const formatTime = useCallback(dateTime => {
    return new Date(dateTime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const convertTimeStringToReadableFormat = useCallback(timeString => {
    const [hours, minutes] = timeString.split(':').map(Number);
    let result = '';
    if (hours > 0) {
      result += `${hours}h `;
    }
    if (minutes > 0) {
      result += `${minutes}m`;
    }
    return result.trim() || '0m';
  }, []);

  const convertISODateToReadableFormat = useCallback(isoDateString => {
    const date = new Date(isoDateString);
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }, []);

  const applyCoupon = () => {
    if (couponCode === 'DISCOUNT10') {
      setGrandTotal(prevTotal => Math.max(prevTotal - 10, 0));
    }
  };

  const handlePayment = useCallback(async () => {
    try {
      const cs_token = await EncryptedStorage.getItem('cs_token');
      await axios.post(
        `https://backend.clicksolver.com/api/user/payed`,
        {
          totalAmount: grandTotal,
          paymentMethod,
          notification_id: atob(encodedId),
        },
        {
          headers: {
            Authorization: `Bearer ${cs_token}`,
          },
        },
      );

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{name: 'Rating', params: {encodedId}}],
        }),
      );
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert('Error', 'Failed to process payment.');
    }
  }, [encodedId, grandTotal, paymentMethod, navigation]);

  const toggleVocher = () => {
    setVocherModal(!vocherModal);
  };

  const togglePayment = () => {
    setPaymentModal(!paymentModal);
  };

  const openPhonePeScanner = () => {
    const url = 'phonepe://scan';
    Linking.openURL(url).catch(() => {
      Linking.openURL(
        'https://play.google.com/store/apps/details?id=com.phonepe.app',
      );
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
    <View style={styles.mainContainer}>
      <ScrollView style={styles.container}>
        {/* Service Summary Section */}
        <View style={styles.header}>
          <FontAwesome6 name="arrow-left-long" size={20} color="#212121" />
          <Text style={styles.headerTitle}>Payment Screen</Text>
        </View>
        <View style={styles.serviceSummary}>
          <Text style={styles.summaryTitle}>Service Summary</Text>
          <View style={styles.profileContainer}>
            <Image
              source={{uri: paymentDetails.profile}}
              style={styles.profileImage}
            />
            <View>
              <Text style={styles.nameText}>{paymentDetails.name}</Text>
              <Text style={styles.dateText}>{paymentDetails.date}</Text>
            </View>
          </View>
          <View style={styles.detailsBox}>
            <View style={styles.rowContainer}>
              <View>
                <Text style={styles.detailsTitle}>Commander Name</Text>
                <Text style={styles.commanderName}>{paymentDetails.name}</Text>
              </View>
              <View>
                <Text style={styles.detailsTitle}>Services</Text>
                {serviceArray.map((service, index) => (
                  <Text
                    key={index}
                    style={styles.serviceName}
                    numberOfLines={2} // Limit to 2 lines
                    ellipsizeMode="tail" // Add ellipsis (...) if the text overflows
                  >
                    {service.serviceName}
                  </Text>
                ))}
              </View>
            </View>
            <Text style={styles.detailsTitle}>Location</Text>
            <Text style={styles.locationText}>{paymentDetails.area}</Text>
          </View>
        </View>

        {/* Payment Summary Section */}
        <View style={styles.paymentSummary}>
          <View style={styles.paymentSummaryContainer}>
            <Text style={styles.summaryTitle}>Payment Summary</Text>
            <TouchableOpacity onPress={togglePayment}>
              <Entypo name="chevron-small-right" size={20} color="#d5d5d5" />
            </TouchableOpacity>
          </View>
          {paymentModal ? (
            <>
              <View style={styles.breakdownColumnContainer}>
                {serviceArray.map((service, index) => (
                  <View key={index} style={styles.breakdownContainer}>
                    <Text style={styles.breakdownItem}>
                      {service.serviceName}
                    </Text>
                    <Text style={styles.breakdownPrice}>
                      ₹ {service.cost.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={styles.breakdownContainer}>
                <Text style={styles.breakdownItem}>GST </Text>
                <Text style={styles.breakdownPrice}>
                  {/* ₹ {gstAmount.toFixed(2)} */}
                  ₹0.00
                </Text>
              </View>
              <View style={styles.breakdownContainer}>
                <Text style={styles.breakdownItem}>CGST</Text>
                <Text style={styles.breakdownPrice}>
                  {/* ₹ {cgstAmount.toFixed(2)} */}
                  ₹0.00
                </Text>
              </View>
              {discount > 0 &&               
              <View style={styles.breakdownContainer}>
                <Text style={styles.breakdownItem}>Cashback</Text>
                <Text style={styles.breakdownPrice}>- ₹ {discount}</Text>
              </View>}

              <View style={styles.separatorLine} />
              <View style={styles.grandTotalContainer}>
                <Text style={styles.paidViaText}>Paid Via Scan</Text>
                <Text style={styles.grandTotalText}>
                  Grand Total ₹ {totalCost}
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.paymentSummaryContainer}>
                <View style={styles.HideContainer}>
                  <View style={styles.iconContainer}>
                    <FontAwesome6
                      name="indian-rupee-sign"
                      size={15}
                      color="#FFFFFF"
                    />
                  </View>
                  <View>
                    <Text style={styles.payText}>
                      To Pay ₹{' '}
                      <Text style={styles.payTextTotal}>{totalCost}</Text>
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Voucher Section */}
        <View style={styles.voucherContainer}>
          <View style={styles.backIconContainer}>
            <View style={styles.voucherIconContainer}>
              <Icon name="ticket-outline" size={24} color="#6E6E6E" />
              <Text style={styles.voucherText}>Add Coupon to get cashback</Text>
            </View>
            <TouchableOpacity onPress={toggleVocher}>
              <Entypo name="chevron-small-right" size={20} color="#d5d5d5" />
            </TouchableOpacity>
          </View>
          {vocherModal && (
            <View style={styles.vocherAddContainer}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    isFocused ? styles.inputFocused : styles.inputUnfocused,
                  ]}
                  value={value}
                  onChangeText={text => setValue(text)}
                  placeholder="Enter voucher code"
                  placeholderTextColor="#A0A0A0"
                  fontFamily="RobotoSlab-Regular"
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
                <TouchableOpacity
                  style={[
                    styles.applyButton,
                    value
                      ? styles.applyButtonActive
                      : styles.applyButtonInactive,
                  ]}
                  disabled={!value}
                  onPress={() => console.log('Apply Voucher')}>
                  <Text
                    style={[
                      styles.applyButtonText,
                      value
                        ? styles.applyButtonTextActive
                        : styles.applyButtonTextInactive,
                    ]}>
                    {value ? 'APPLY' : 'APPLY'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
        <View style={styles.noticeTextContainer}>
          <Icon name="alert-circle-outline" size={16} color="#212121" />
          <Text style={styles.noticeText}>
            Spare parts are not included in this payment
          </Text>
        </View>

        {/* Pay Button */}
      </ScrollView>
      {/* Notice Section */}
      <View style={styles.buttonAmmountContainer}>
        <View>
          <Text style={styles.serviceCostText}>Service cost</Text>
          <Text style={styles.cost}>₹ {totalCost}</Text>
        </View>
        <TouchableOpacity style={styles.payButton} onPress={openPhonePeScanner}>
          <Text style={styles.payButtonText}>Pay Now</Text>
        </TouchableOpacity>
      </View>
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  }, 
  mainContainer: {flex: 1},
  iconContainer: {
    backgroundColor: '#ff4500',
    width: 30,
    height: 30,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  container: {flex: 1, backgroundColor: '#F5F5F5'},
  header: {padding: 10, flexDirection: 'row', gap: 15, alignItems: 'center'},
  headerTitle: {
    color: '#212121',
    fontSize: 16,
    fontFamily: 'RobotoSlab-SemiBold',
    textAlign: 'center',
  },
  serviceSummary: {
    padding: 16,
    backgroundColor: '#FFF',
    margin: 16,

    borderRadius: 10,
  },
  nameText: {
    fontSize: 18,
    fontFamily: 'RobotoSlab-Medium',
    marginTop: 8,
    color: '#212121',
  },
  payTextTotal: {
    fontFamily: 'RobotoSlab-Medium',
  },
  dateText: {
    color: '#6E6E6E',
    marginBottom: 16,
    fontFamily: 'RobotoSlab-Regular',
  },
  detailsBox: {
    backgroundColor: '#F9F9F9',
    padding: 10,
    borderRadius: 8,
    width: '100%',
  },
  detailsTitle: {
    fontFamily: 'RobotoSlab-Medium',
    color: '#4a4a4a',
    marginTop: 10,
  },
  paymentSummary: {
    backgroundColor: '#FFF',
    margin: 16,
    padding: 16,
    borderRadius: 10,
    fontFamily: 'RobotoSlab-Medium',
  },
  summaryTitle: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 16,
    color: '#4a4a4a',
    marginBottom: 10,
  },
  breakdownColumnContainer: {flexDirection: 'column'},
  breakdownContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownItem: {
    color: '#6E6E6E',
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 12,
  },
  breakdownPrice: {
    fontWeight: 'bold',
    color: '#212121',
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 13,
  },
  separatorLine: {height: 1, backgroundColor: '#EEE', marginVertical: 10},
  grandTotalContainer: {flexDirection: 'row', justifyContent: 'space-between'},
  paidViaText: {
    color: '#4a4a4a',
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 14,
  },
  grandTotalText: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 14,
    color: '#212121',
  },
  voucherContainer: {
    backgroundColor: '#FFF',
    padding: 16,
    margin: 16,
    borderRadius: 10,
    marginBottom: 0,
  },
  backIconContainer: {flexDirection: 'row', justifyContent: 'space-between'},
  voucherIconContainer: {flexDirection: 'row', alignItems: 'center'},
  voucherText: {
    marginLeft: 8,
    color: '#6E6E6E',
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 14,
  },
  noticeContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#ff4500',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  noticeText: {
    marginLeft: 8,
    color: '#212121',
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 12,
  },
  payButton: {
    backgroundColor: '#ff4500',
    padding: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  payButtonText: {
    color: '#FFF',

    fontSize: 15,
    fontFamily: 'RobotoSlab-Medium',
  },
  commanderName: {
    color: '#212121',
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 13,
  },
  profileImage: {height: 50, width: 50, borderRadius: 25},
  serviceName: {
    color: '#212121',
    flexShrink: 1, // Allow text to shrink if it overflows
    flexWrap: 'wrap', // Wrap the text to the next line if needed
    fontSize: 13,
    maxWidth: 150, // Set a maximum width to limit text length
    overflow: 'hidden', // Prevent overflow
    textAlign: 'left', // Align text to the left
    fontFamily: 'RobotoSlab-Regular',
  },

  locationText: {
    color: '#212121',
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 13,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Ensures top alignment of both columns
    width: '100%',
    gap: 10, // Add some spacing between the two columns
  },

  profileContainer: {flexDirection: 'row', alignItems: 'center', gap: 10},
  applyContainer: {
    backgroundColor: '#212121',
    padding: 10,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  vocherAddContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  buttonAmmountContainer: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    flexDirection: 'row',
    padding: 16,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    justifyContent: 'space-between',
    elevation: 2,
  },
  vocherAddContainer: {
    margin: 16,
  },
  HideContainer: {flexDirection: 'row', gap: 5, alignItems: 'center'},
  payText: {color: '#212121', fontFamily: 'RobotoSlab-Regular'},

  paymentSummaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  input: {
    height: 40,
    flex: 1,
    paddingHorizontal: 10,
    color: '#212121',
  },
  applyButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#9e9e9e',
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 13,
  },
  applyButtonTextActive: {color: '#ff4500'},
  noticeTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    margin: 15,
  },
  serviceCostText: {
    color: '#212121',
    fontSize: 14,
    fontFamily: 'RobotoSlab-Regular',
  },
  cost: {color: '#212121', fontFamily: 'RobotoSlab-Medium', fontSize: 15},
});

export default Payment;
