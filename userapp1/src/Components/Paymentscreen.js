import React, { useState, useEffect, useCallback } from 'react';
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
  Alert,
  ActivityIndicator,
  useWindowDimensions, // for responsiveness
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
import EncryptedStorage from 'react-native-encrypted-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

const Payment = ({ route }) => {
  const { width } = useWindowDimensions();
  const styles = dynamicStyles(width);

  const [paymentMethod, setPaymentMethod] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [gstAmount, setGstAmount] = useState(0);
  const [cgstAmount, setCgstAmount] = useState(0);
  const [cashback, setCashback] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [serviceArray, setServiceArray] = useState([]);
  const [vocherModal, setVocherModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  const [value, setValue] = useState('');
  const [paymentDetails, setPaymentDetails] = useState({});
  const navigation = useNavigation();
  const { encodedId } = route.params || {};

  // Fetch Payment Details from server
  const fetchPaymentDetails = useCallback(async (decodedId) => {
    try {
      const response = await axios.post(
        'http://192.168.55.102:5000/api/payment/details',
        { notification_id: decodedId }
      );
      const {
        service_booked,
        name,
        area,
        city,
        pincode,
        discount,
        total_cost,
        profile,
      } = response.data;

      setDiscount(discount || 0);
      setTotalCost(total_cost || 0);

      setPaymentDetails({
        city,
        area,
        pincode,
        name,
        profile,
      });

      setServiceArray(service_booked || []);
    } catch (error) {
      console.error('Error fetching payment details:', error);
    }
  }, []);

  // Decode ID and fetch details
  useEffect(() => {
    if (encodedId) {
      const decoded = atob(encodedId);
      fetchPaymentDetails(decoded);
    }
  }, [encodedId, fetchPaymentDetails]);

  // Handle back press => go to home
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }],
          })
        );
        return true;
      };
      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, [navigation])
  );

  const toggleVocher = () => {
    setVocherModal(!vocherModal);
  };

  const togglePayment = () => {
    setPaymentModal(!paymentModal);
  };

  // Example if you want to do something with coupon
  const applyCoupon = () => {
    console.log('Apply coupon code: ', value);
    // Implement your logic
  };

  const openPhonePeScanner = () => {
    const url = 'phonepe://scan';
    Linking.openURL(url).catch(() => {
      Linking.openURL('https://play.google.com/store/apps/details?id=com.phonepe.app');
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <ScrollView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() =>
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }],
                  })
                )
              }
            >
              <FontAwesome6 name="arrow-left-long" size={20} color="#212121" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Payment Screen</Text>
          </View>

          {/* Service Summary Section */}
          <View style={styles.serviceSummary}>
            <Text style={styles.summaryTitle}>Service Summary</Text>
            <View style={styles.profileContainer}>
              <Image
                source={{ uri: paymentDetails.profile }}
                style={styles.profileImage}
              />
              <View>
                <Text style={styles.nameText}>{paymentDetails.name}</Text>
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
                      numberOfLines={2}
                      ellipsizeMode="tail"
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
                      <Text style={styles.breakdownItem}>{service.serviceName}</Text>
                      <Text style={styles.breakdownPrice}>
                        ₹ {service.cost?.toFixed(2) || '0.00'}
                      </Text>
                    </View>
                  ))}
                </View>
                {/* Example if you had GST/CGST */}
                <View style={styles.breakdownContainer}>
                  <Text style={styles.breakdownItem}>GST</Text>
                  <Text style={styles.breakdownPrice}>₹ 0.00</Text>
                </View>
                <View style={styles.breakdownContainer}>
                  <Text style={styles.breakdownItem}>CGST</Text>
                  <Text style={styles.breakdownPrice}>₹ 0.00</Text>
                </View>

                {/* If discount > 0, show it */}
                {discount > 0 && (
                  <View style={styles.breakdownContainer}>
                    <Text style={styles.breakdownItem}>Cashback</Text>
                    <Text style={styles.breakdownPrice}>- ₹ {discount}</Text>
                  </View>
                )}

                <View style={styles.separatorLine} />
                <View style={styles.grandTotalContainer}>
                  <Text style={styles.paidViaText}>Paid Via Scan</Text>
                  <Text style={styles.grandTotalText}>Grand Total ₹ {totalCost}</Text>
                </View>
              </>
            ) : (
              <View style={styles.paymentSummaryContainer}>
                <View style={styles.HideContainer}>
                  <View style={styles.iconContainer}>
                    <FontAwesome6 name="indian-rupee-sign" size={15} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.payText}>
                      To Pay ₹ <Text style={styles.payTextTotal}>{totalCost}</Text>
                    </Text>
                  </View>
                </View>
              </View>
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
                    onChangeText={(text) => setValue(text)}
                    placeholder="Enter voucher code"
                    placeholderTextColor="#A0A0A0"
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                  />
                  <TouchableOpacity
                    style={[
                      styles.applyButton,
                      value ? styles.applyButtonActive : styles.applyButtonInactive,
                    ]}
                    disabled={!value}
                    onPress={applyCoupon}
                  >
                    <Text
                      style={[
                        styles.applyButtonText,
                        value ? styles.applyButtonTextActive : styles.applyButtonTextInactive,
                      ]}
                    >
                      APPLY
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
        </ScrollView>

        {/* Bottom Bar for Payment */}
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

/**
 * DYNAMIC STYLES
 */
function dynamicStyles(width) {
  const isTablet = width >= 600;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    mainContainer: {
      flex: 1,
    },
    container: {
      flex: 1,
      backgroundColor: '#F5F5F5',
    },

    /* Header */
    header: {
      padding: isTablet ? 15 : 10,
      flexDirection: 'row',
      gap: 15,
      alignItems: 'center',
      backgroundColor: '#fff',
      elevation: 1,
      marginBottom: 4,
    },
    headerTitle: {
      color: '#212121',
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'RobotoSlab-SemiBold',
      textAlign: 'center',
    },

    /* Service Summary */
    serviceSummary: {
      padding: isTablet ? 20 : 16,
      backgroundColor: '#FFF',
      margin: isTablet ? 20 : 16,
      borderRadius: 10,
    },
    summaryTitle: {
      fontFamily: 'RobotoSlab-Medium',
      fontSize: isTablet ? 17 : 16,
      color: '#4a4a4a',
      marginBottom: 10,
    },
    profileContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    profileImage: {
      height: isTablet ? 60 : 50,
      width: isTablet ? 60 : 50,
      borderRadius: isTablet ? 30 : 25,
    },
    nameText: {
      fontSize: isTablet ? 19 : 18,
      fontFamily: 'RobotoSlab-Medium',
      marginTop: 8,
      color: '#212121',
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
      marginTop: 12,
    },
    rowContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      width: '100%',
      gap: 10,
    },
    detailsTitle: {
      fontFamily: 'RobotoSlab-Medium',
      color: '#4a4a4a',
      marginTop: 10,
      fontSize: isTablet ? 14 : 13,
    },
    commanderName: {
      color: '#212121',
      fontFamily: 'RobotoSlab-Regular',
      fontSize: isTablet ? 14 : 13,
    },
    serviceName: {
      color: '#212121',
      flexShrink: 1,
      flexWrap: 'wrap',
      fontSize: isTablet ? 14 : 13,
      maxWidth: 150,
      overflow: 'hidden',
      textAlign: 'left',
      fontFamily: 'RobotoSlab-Regular',
    },
    locationText: {
      color: '#212121',
      fontFamily: 'RobotoSlab-Regular',
      fontSize: isTablet ? 14 : 13,
      marginTop: 6,
    },

    /* Payment Summary */
    paymentSummary: {
      backgroundColor: '#FFF',
      margin: isTablet ? 20 : 16,
      padding: isTablet ? 20 : 16,
      borderRadius: 10,
      fontFamily: 'RobotoSlab-Medium',
    },
    paymentSummaryContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    breakdownColumnContainer: {
      flexDirection: 'column',
    },
    breakdownContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    breakdownItem: {
      color: '#6E6E6E',
      fontFamily: 'RobotoSlab-Regular',
      fontSize: isTablet ? 13 : 12,
    },
    breakdownPrice: {
      fontWeight: 'bold',
      color: '#212121',
      fontFamily: 'RobotoSlab-Medium',
      fontSize: isTablet ? 14 : 13,
    },
    separatorLine: {
      height: 1,
      backgroundColor: '#EEE',
      marginVertical: 10,
    },
    grandTotalContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    paidViaText: {
      color: '#4a4a4a',
      fontFamily: 'RobotoSlab-Medium',
      fontSize: isTablet ? 15 : 14,
    },
    grandTotalText: {
      fontFamily: 'RobotoSlab-Medium',
      fontSize: isTablet ? 15 : 14,
      color: '#212121',
    },
    HideContainer: {
      flexDirection: 'row',
      gap: 5,
      alignItems: 'center',
    },
    iconContainer: {
      backgroundColor: '#ff4500',
      width: isTablet ? 32 : 30,
      height: isTablet ? 32 : 30,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: isTablet ? 16 : 15,
    },
    payText: {
      color: '#212121',
      fontFamily: 'RobotoSlab-Regular',
    },
    payTextTotal: {
      fontFamily: 'RobotoSlab-Medium',
    },

    /* Voucher Section */
    voucherContainer: {
      backgroundColor: '#FFF',
      padding: isTablet ? 20 : 16,
      margin: isTablet ? 20 : 16,
      borderRadius: 10,
      marginBottom: 0,
    },
    backIconContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    voucherIconContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    voucherText: {
      marginLeft: 8,
      color: '#6E6E6E',
      fontFamily: 'RobotoSlab-Medium',
      fontSize: isTablet ? 15 : 14,
    },
    vocherAddContainer: {
      marginTop: 10,
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
      height: isTablet ? 45 : 40,
      flex: 1,
      paddingHorizontal: 10,
      color: '#212121',
    },
    inputFocused: {
      borderColor: '#ff4500',
    },
    inputUnfocused: {
      borderColor: '#E0E0E0',
    },
    applyButton: {
      paddingVertical: 8,
      paddingHorizontal: 15,
      borderTopRightRadius: 5,
      borderBottomRightRadius: 5,
      justifyContent: 'center',
      alignItems: 'center',
    },
    applyButtonActive: {
      backgroundColor: '#ff4500',
    },
    applyButtonInactive: {
      backgroundColor: '#f0f0f0',
    },
    applyButtonText: {
      fontFamily: 'RobotoSlab-Medium',
      fontSize: isTablet ? 14 : 13,
    },
    applyButtonTextActive: {
      color: '#ffffff',
    },
    applyButtonTextInactive: {
      color: '#9e9e9e',
    },

    /* Notice Section */
    noticeTextContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      margin: isTablet ? 20 : 15,
    },
    noticeText: {
      color: '#212121',
      fontFamily: 'RobotoSlab-Medium',
      fontSize: isTablet ? 14 : 12,
    },

    /* Bottom Payment Bar */
    buttonAmmountContainer: {
      backgroundColor: '#FFFFFF',
      width: '100%',
      flexDirection: 'row',
      padding: isTablet ? 20 : 16,
      borderTopLeftRadius: 15,
      borderTopRightRadius: 15,
      justifyContent: 'space-between',
      elevation: 2,
    },
    serviceCostText: {
      color: '#212121',
      fontSize: isTablet ? 15 : 14,
      fontFamily: 'RobotoSlab-Regular',
    },
    cost: {
      color: '#212121',
      fontFamily: 'RobotoSlab-Medium',
      fontSize: isTablet ? 16 : 15,
    },
    payButton: {
      backgroundColor: '#ff4500',
      padding: isTablet ? 18 : 16,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
    },
    payButtonText: {
      color: '#FFF',
      fontSize: isTablet ? 16 : 15,
      fontFamily: 'RobotoSlab-Medium',
    },
  });
}

export default Payment;
  