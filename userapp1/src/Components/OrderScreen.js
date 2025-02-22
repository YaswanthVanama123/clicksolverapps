import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import EncryptedStorage from 'react-native-encrypted-storage';
import axios from 'axios';
import Icon from 'react-native-vector-icons/FontAwesome6';

/**
 * OrderScreen 
 * -------------
 * Displays the cart with quantity controls, coupon application, and payment summary.
 */
const OrderScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
 
  // Expect an array of services from route.params
  const { serviceName } = route.params || [];

  const [services, setServices] = useState([]);
  const [showCoupons, setShowCoupons] = useState(true);

  // Coupon and discount states
  const [completed, setCompleted] = useState(0);
  const [couponsAvailable, setCouponsAvailable] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [discountedPrice, setDiscountedPrice] = useState(0);
  const [savings, setSavings] = useState(0);

  // Modal state for error messages
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalContent, setErrorModalContent] = useState({ title: '', message: '' });

  const showErrorModal = (title, message) => {
    setErrorModalContent({ title, message });
    setErrorModalVisible(true);
  };

  // 1) Load services from route
  useEffect(() => {
    if (serviceName && Array.isArray(serviceName)) {
      const updatedServices = serviceName.map((service) => {
        const baseCost = service.quantity > 0 ? service.cost / service.quantity : service.cost;
        const totalCost = baseCost * service.quantity;
        return { ...service, baseCost, totalCost };
      });
      setServices(updatedServices);
    }
  }, [serviceName]);

  // 2) Recalculate totals when services change
  useEffect(() => {
    let tempTotal = 0;
    services.forEach((s) => {
      tempTotal += s.totalCost;
    });
    setTotalPrice(tempTotal);

    if (appliedCoupon) {
      applyCoupon(appliedCoupon, tempTotal);
    } else {
      setDiscountedPrice(tempTotal);
      setSavings(0);
    }
  }, [services, appliedCoupon]);

  // 3) Fetch coupon data from API
  useFocusEffect(
    useCallback(() => {
      const fetchCoupons = async () => {
        try {
          const token = await EncryptedStorage.getItem('cs_token');
          if (!token) return;
          const response = await axios.post(
            'http://192.168.55.101:5000/api/user/coupons',
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const { service_completed, coupons } = response.data;
          setCompleted(service_completed);
          setCouponsAvailable(coupons);
        } catch (error) {
          console.log('Error fetching coupon data:', error);
        }
      };
      fetchCoupons();
    }, [])
  );

  // 4) Quantity Logic
  const incrementQuantity = (index) => {
    setServices((prev) => {
      const updated = [...prev];
      updated[index].quantity += 1;
      updated[index].totalCost = updated[index].baseCost * updated[index].quantity;
      return updated;
    });
  };

  const decrementQuantity = (index) => {
    setServices((prev) => {
      const updated = [...prev];
      if (updated[index].quantity > 1) {
        updated[index].quantity -= 1;
        updated[index].totalCost = updated[index].baseCost * updated[index].quantity;
      }
      return updated;
    });
  };

  // 5) Coupon Configuration
  const COUPONS = {
    30: {
      label: 'Get 30% OFF on orders above ₹149 – Save up to ₹35!',
      maxDiscount: 35,
      minOrderValue: 149,
      isAvailable: () => couponsAvailable > 0,
    },
    40: {
      label: 'Get 40% OFF on orders above ₹249 – Save up to ₹75!',
      maxDiscount: 75,
      minOrderValue: 249,
      isAvailable: () => completed === 0,
    },
    35: {
      label: 'Get 35% OFF on orders above ₹149 – Save up to ₹55!',
      maxDiscount: 55,
      minOrderValue: 149,
      isAvailable: () => completed === 0,
    },
  };

  // 6) Apply Coupon
  const applyCoupon = (couponCode, currentTotal = totalPrice) => {
    const couponData = COUPONS[couponCode];
    if (!couponData) return;

    if (currentTotal < couponData.minOrderValue) {
      showErrorModal(
        'Minimum order not met',
        `You need at least ₹${couponData.minOrderValue} to apply this coupon.`
      );
      return;
    }

    const discountRate = Number(couponCode);
    const discountAmount = Math.min((currentTotal * discountRate) / 100, couponData.maxDiscount);
    const newPrice = currentTotal - discountAmount;
    setDiscountedPrice(newPrice);
    setSavings(discountAmount);
    setAppliedCoupon(couponCode);
  };

  const handleApplyCoupon = (couponCode) => {
    if (appliedCoupon === couponCode) {
      setAppliedCoupon(null);
      setDiscountedPrice(totalPrice);
      setSavings(0);
      return;
    }
    if (COUPONS[couponCode].isAvailable()) {
      applyCoupon(couponCode, totalPrice);
    } else {
      showErrorModal('Not eligible', 'You do not meet the condition for this coupon.');
    }
  };

  const isCouponDisabled = (couponCode) => !COUPONS[couponCode].isAvailable();
  const finalPrice = appliedCoupon ? discountedPrice : totalPrice;

  // 7) Address Handling
  const addAddress = async () => {
    try {
      const cs_token = await EncryptedStorage.getItem('cs_token');
      if (cs_token) {
        navigation.push('UserLocation', { serviceName: services, savings });
      } else {
        console.error('No token found, user must login');
      }
    } catch (error) {
      console.error('Error accessing storage:', error);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.backArrow} onPress={handleBackPress}>
            <Icon name="arrow-left-long" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Cart</Text>
        </View>

        {/* Cart Items */}
        <View style={styles.itemCard}>
          {services.map((service, index) => (
            <View key={service.main_service_id} style={styles.itemRow}>
              <Text style={styles.itemName}>{service.serviceName}</Text>
              <View style={styles.quantityContainer}>
                <TouchableOpacity onPress={() => decrementQuantity(index)} style={styles.quantityBtn}>
                  <Text style={styles.quantityBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantityValue}>{service.quantity}</Text>
                <TouchableOpacity onPress={() => incrementQuantity(index)} style={styles.quantityBtn}>
                  <Text style={styles.quantityBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.itemPrice}>₹{service.totalCost}</Text>
            </View>
          ))}

          <View style={styles.horizontalButtons}>
            <TouchableOpacity style={styles.textBtn}>
              <Text style={styles.textBtnLabel}>Add any more</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.textBtn} onPress={handleBackPress}>
              <Text style={styles.textBtnLabel}>+ Add more items</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Coupons Section */}
        <View style={styles.couponsCard}>
          <TouchableOpacity
            style={styles.couponsHeader}
            onPress={() => setShowCoupons(!showCoupons)}
          >
            <View style={styles.couponTitleContainer}>
              <View style={styles.offerContainer}>
                <MaterialIcons name="local-offer" size={20} color="#fff" />
              </View>
              <Text style={styles.couponsHeaderText}>Apply Coupon</Text>
            </View>
            <Entypo name={showCoupons ? 'chevron-up' : 'chevron-down'} size={20} color="#333" />
          </TouchableOpacity>

          {showCoupons && (
            <View style={styles.couponsSection}>
              {/* Coupon 30% */}
              <View style={styles.couponRow}>
                <Text style={styles.couponLabel}>{COUPONS[30].label}</Text>
                {appliedCoupon === '30' ? (
                  <TouchableOpacity
                    style={styles.appliedContainer}
                    onPress={() => handleApplyCoupon('30')}
                  >
                    <Entypo name="check" size={16} color="#ff4500" />
                    <Text style={styles.appliedText}>Applied</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.applyBtn, isCouponDisabled(30) && styles.disabledBtn]}
                    disabled={isCouponDisabled(30)}
                    onPress={() => handleApplyCoupon('30')}
                  >
                    <Text style={styles.applyBtnText}>Apply</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.couponDescription}>
                Earn rewards for every referral! (Requires > 0 coupons)
              </Text>

              {/* Coupon 40% */}
              <View style={styles.couponRow}>
                <Text style={styles.couponLabel}>{COUPONS[40].label}</Text>
                {appliedCoupon === '40' ? (
                  <TouchableOpacity
                    style={styles.appliedContainer}
                    onPress={() => handleApplyCoupon('40')}
                  >
                    <Entypo name="check" size={16} color="#ff4500" />
                    <Text style={styles.appliedText}>Applied</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.applyBtn, isCouponDisabled(40) && styles.disabledBtn]}
                    disabled={isCouponDisabled(40)}
                    onPress={() => handleApplyCoupon('40')}
                  >
                    <Text style={styles.applyBtnText}>Apply</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.couponDescription}>
                Valid only on your first service booking!
              </Text>

              {/* Coupon 35% */}
              <View style={styles.couponRow}>
                <Text style={styles.couponLabel}>{COUPONS[35].label}</Text>
                {appliedCoupon === '35' ? (
                  <TouchableOpacity
                    style={styles.appliedContainer}
                    onPress={() => handleApplyCoupon('35')}
                  >
                    <Entypo name="check" size={16} color="#ff4500" />
                    <Text style={styles.appliedText}>Applied</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.applyBtn, isCouponDisabled(35) && styles.disabledBtn]}
                    disabled={isCouponDisabled(35)}
                    onPress={() => handleApplyCoupon('35')}
                  >
                    <Text style={styles.applyBtnText}>Apply</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.couponDescription}>
                Valid only on your first service booking!
              </Text>
            </View>
          )}
        </View>

        {/* Service Type Section */}
        <View style={styles.serviceTypeCard}>
          <Text style={styles.serviceTypeHeading}>Service Type</Text>
          <View style={styles.serviceOption}>
            <Text style={styles.serviceOptionTitle}>Instant Worker</Text>
            <Text style={styles.serviceOptionDesc}>
              A skilled worker will arrive at your location within 15 minutes,
              ready to assist you.
            </Text>
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.paymentCard}>
          {appliedCoupon && savings > 0 ? (
            <>
              <Text style={styles.paymentInfo}>
                To Pay{' '}
                <Text style={styles.strikeThrough}>₹{totalPrice}</Text>{' '}
                ₹{finalPrice}
              </Text>
              <Text style={styles.paymentSavings}>You saved ₹{savings} on this order!</Text>
            </>
          ) : (
            <Text style={styles.paymentInfo}>To Pay ₹{totalPrice}</Text>
          )}
        </View>

        {/* Address Section */}
        <View style={styles.addressCard}>
          <Text style={styles.addressQuestion}>
            Where would you like us to send your skilled worker?
          </Text>
          <TouchableOpacity style={styles.addressBtn} onPress={addAddress}>
            <Text style={styles.addressBtnText}>Add address</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Custom Modal for error messages */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={errorModalVisible}
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{errorModalContent.title}</Text>
            <Text style={styles.modalMessage}>{errorModalContent.message}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setErrorModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default OrderScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  /* Header */
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backArrow: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  /* Item Card */
  itemCard: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 16,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  quantityBtn: {
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  quantityBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  quantityValue: {
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
  },
  horizontalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  textBtn: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  textBtnLabel: {
    fontSize: 14,
    color: '#333',
  },
  /* Coupons */
  couponsCard: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 16,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  couponsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  couponTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offerContainer: {
    backgroundColor: '#ff4500',
    height: 30,
    width: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  couponsHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  couponsSection: {
    marginTop: 8,
  },
  couponRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  couponLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  couponDescription: {
    fontSize: 12,
    color: '#777',
    marginBottom: 8,
  },
  applyBtn: {
    backgroundColor: '#f36c21',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  disabledBtn: {
    backgroundColor: '#ccc',
  },
  appliedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff4500',
  },
  appliedText: {
    color: '#ff4500',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  /* Service Type */
  serviceTypeCard: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 16,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  serviceTypeHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  serviceOption: {
    marginVertical: 8,
  },
  serviceOptionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  serviceOptionDesc: {
    fontSize: 12,
    color: '#777',
  },
  /* Payment Summary */
  paymentCard: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 16,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  paymentInfo: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  strikeThrough: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  paymentSavings: {
    fontSize: 14,
    color: 'green',
  },
  /* Address Section */
  addressCard: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 16,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addressQuestion: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 16,
  },
  addressBtn: {
    backgroundColor: '#ff6f00',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  addressBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#ff6f00',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
