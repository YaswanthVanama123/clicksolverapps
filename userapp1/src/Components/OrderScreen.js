import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import EncryptedStorage from 'react-native-encrypted-storage';
import axios from 'axios';

const OrderScreen = () => {
  const [services, setServices] = useState([]);
  const [showCoupons, setShowCoupons] = useState(true);

  // From API
  const [completed, setCompleted] = useState(0);
  const [couponsAvailable, setCouponsAvailable] = useState(0);

  // Coupon states
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [discountedPrice, setDiscountedPrice] = useState(0);
  const [savings, setSavings] = useState(0);

  const route = useRoute();
  const navigation = useNavigation();
  const {serviceName} = route.params;

  useEffect(() => {
    if (serviceName) {
      const updatedServices = serviceName.map(service => ({
        ...service,
        totalCost: service.cost * service.quantity,
      }));
      setServices(updatedServices);
    }
  }, [serviceName]);

  // Recalculate total whenever services change
  useEffect(() => {
    let tempTotal = 0;
    services.forEach(s => {
      tempTotal += s.totalCost;
    });
    setTotalPrice(tempTotal);

    // If a coupon was applied, re-apply it to update the discount
    if (appliedCoupon) {
      applyCoupon(appliedCoupon, tempTotal);
    } else {
      // If no coupon or we just removed it, reset discounted price
      setDiscountedPrice(tempTotal);
      setSavings(0);
    }
  }, [services]);

  // Fetch coupon data from API
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const token = await EncryptedStorage.getItem('cs_token');
        const response = await axios.post(
          'https://backend.clicksolver.com/api/user/coupons',
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const {service_completed, coupons} = response.data;
        setCompleted(service_completed);
        setCouponsAvailable(coupons);
      } catch (error) {
        console.log('Error in coupon fetch:', error);
      }
    };
    fetchCoupons();
  }, []);

  // --- QUANTITY LOGIC ---
  const incrementQuantity = index => {
    setServices(prevServices => {
      const updatedServices = prevServices.map((service, i) => {
        if (i === index) {
          const updatedQuantity = service.quantity + 1;
          return {
            ...service,
            quantity: updatedQuantity,
            cost: (service.cost / (updatedQuantity - 1)) * updatedQuantity, // Recalculate the total cost

            // Removed the incorrect cost update
          };
        }
        return service;
      });
      return updatedServices;
    });
  };

  const addAddress = async () => {
    try {
      const cs_token = await EncryptedStorage.getItem('cs_token');
      if (cs_token) {
        navigation.push('UserLocation', {
          serviceName: services,
          savings: savings,
        });
      }
    } catch (error) {
      console.error('Error accessing storage:', error);
    }
  };

  const decrementQuantity = index => {
    setServices(prevServices => {
      const updatedServices = prevServices.map((service, i) => {
        if (i === index) {
          if (service.quantity > 1) {
            const updatedQuantity = service.quantity - 1;
            const perUnitCost = service.cost / service.quantity; // Calculate per-unit cost based on current total cost
            const updatedCost = perUnitCost * updatedQuantity; // Recalculate total cost based on updated quantity

            return {
              ...service,
              quantity: updatedQuantity,
              cost: updatedCost, // Update cost only if quantity > 1
            };
          }
          // If quantity is 1, do not update cost
          return service;
        }
        return service;
      });
      return updatedServices;
    });
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  // --- COUPON CONFIG ---
  const COUPONS = {
    30: {
      label: 'Get 30% OFF on orders above ₹149 – Save up to ₹35!',
      maxDiscount: 35,
      minOrderValue: 149,
      // Condition: user must have couponsAvailable > 0
      isAvailable: () => couponsAvailable > 0,
    },
    40: {
      label: 'Get 40% OFF on orders above ₹249 – Save up to ₹75!',
      maxDiscount: 75,
      minOrderValue: 249,
      // Condition: completed === 0 => first-timer
      isAvailable: () => completed === false,
    },
    35: {
      label: 'Get 35% OFF on orders above ₹149 – Save up to ₹55!',
      maxDiscount: 55,
      minOrderValue: 149,
      // Condition: completed === 0 => first-timer
      isAvailable: () => completed === false,
    },
  };

  // --- COUPON LOGIC ---
  const applyCoupon = (couponCode, currentTotal = totalPrice) => {
    const couponData = COUPONS[couponCode];
    if (!couponData) return;

    // Check min order value
    if (currentTotal < couponData.minOrderValue) {
      alert(
        `Minimum order value is ₹${couponData.minOrderValue} to apply this coupon!`,
      );
      return;
    }

    const discountRate = Number(couponCode); // e.g. 40 => 40
    const discountAmount = Math.min(
      (currentTotal * discountRate) / 100,
      couponData.maxDiscount,
    );
    const newPrice = currentTotal - discountAmount;

    setDiscountedPrice(newPrice);
    setSavings(discountAmount);
    setAppliedCoupon(couponCode);
  };

  /**
   * Handle user pressing "Apply" or "Applied" on a coupon
   *
   * - If the same coupon is tapped again, unapply it (back to no coupon).
   * - If a different eligible coupon is tapped, apply that new one.
   */
  const handleApplyCoupon = couponCode => {
    // If the coupon is currently applied and user taps it again => unapply
    if (appliedCoupon === couponCode) {
      setAppliedCoupon(null);
      setDiscountedPrice(totalPrice);
      setSavings(0);
      return;
    }

    // If the coupon is not applied, but user meets conditions => apply
    if (COUPONS[couponCode].isAvailable()) {
      applyCoupon(couponCode);
    }
  };

  // Only disable if user does NOT meet the condition.
  const isCouponDisabled = couponCode => {
    // If user doesn't meet the coupon condition => disable
    return !COUPONS[couponCode].isAvailable();
  };

  // If no coupon is applied, final = total. Else final = discounted
  const finalPrice = appliedCoupon ? discountedPrice : totalPrice;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.backArrow} onPress={handleBackPress}>
            <Text style={{fontSize: 18}}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Cart</Text>
        </View>

        {/* Item Card */}
        <View style={styles.itemCard}>
          {services.map((service, index) => (
            <View key={service.main_service_id}>
              <View style={styles.itemCardTop}>
                <Text style={styles.itemName}>{service.serviceName}</Text>
                <View style={styles.quantityContainer}>
                  <TouchableOpacity
                    onPress={() => decrementQuantity(index)}
                    style={styles.quantityBtn}>
                    <Text style={styles.quantityBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityValue}>{service.quantity}</Text>
                  <TouchableOpacity
                    onPress={() => incrementQuantity(index)}
                    style={styles.quantityBtn}>
                    <Text style={styles.quantityBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.itemPrice}>₹{service.cost}</Text>
              </View>
            </View>
          ))}

          {/* Buttons below the items */}
          <View style={styles.horizontalButtons}>
            <TouchableOpacity style={styles.textBtn}>
              <Text style={styles.textBtnLabel}>Add any more</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.textBtn} onPress={handleBackPress}>
              <Text style={styles.textBtnLabel}>+ Add more items</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Savings Corner */}
        <View style={styles.savingsCorner}>
          <TouchableOpacity
            style={styles.savingsRowHead}
            onPress={() => setShowCoupons(!showCoupons)}>
            <View style={styles.couponContainer}>
              <View style={styles.offerContainer}>
                <Text>
                  <MaterialIcons name="local-offer" size={20} color="#ffffff" />
                </Text>
              </View>
              <Text style={styles.savingsTitleHead}>Apply Coupon</Text>
            </View>
            <Entypo
              name={showCoupons ? 'chevron-up' : 'chevron-down'}
              size={20}
            />
          </TouchableOpacity>

          {showCoupons && (
            <View style={styles.couponsSection}>
              {/* 30% COUPON */}
              <View style={styles.offersRow}>
                <View style={styles.savingsRow}>
                  <Text style={styles.savingsTitle}>{COUPONS[30].label}</Text>

                  {appliedCoupon === '30' ? (
                    /* The same coupon is applied => show "Applied" with an icon */
                    <TouchableOpacity
                      style={[styles.appliedContainer]}
                      onPress={() => handleApplyCoupon('30')}>
                      <Entypo name="check" size={16} color="#ff4500" />
                      <Text style={styles.appliedText}>Applied</Text>
                    </TouchableOpacity>
                  ) : (
                    /* Not applied => show "Apply" or disabled if not eligible */
                    <TouchableOpacity
                      style={[
                        styles.applyBtn,
                        isCouponDisabled(30) && styles.disabledBtn,
                      ]}
                      disabled={isCouponDisabled(30)}
                      onPress={() => handleApplyCoupon('30')}>
                      <Text style={styles.applyBtnText}>Apply</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <Text style={styles.description}>
                Earn rewards for every referral! (Requires > 0 coupons)
              </Text>

              {/* 40% COUPON */}
              <View style={styles.offersRow}>
                <View style={styles.savingsRow}>
                  <Text style={styles.savingsTitle}>{COUPONS[40].label}</Text>

                  {appliedCoupon === '40' ? (
                    <TouchableOpacity
                      style={[styles.appliedContainer]}
                      onPress={() => handleApplyCoupon('40')}>
                      <Entypo name="check" size={16} color="#ff4500" />
                      <Text style={styles.appliedText}>Applied</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.applyBtn,
                        isCouponDisabled(40) && styles.disabledBtn,
                      ]}
                      disabled={isCouponDisabled(40)}
                      onPress={() => handleApplyCoupon('40')}>
                      <Text style={styles.applyBtnText}>Apply</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <Text style={styles.description}>
                Valid only on your first service booking!
              </Text>

              {/* 35% COUPON */}
              <View style={styles.offersRow}>
                <View style={styles.savingsRow}>
                  <Text style={styles.savingsTitle}>{COUPONS[35].label}</Text>

                  {appliedCoupon === '35' ? (
                    <TouchableOpacity
                      style={[styles.appliedContainer]}
                      onPress={() => handleApplyCoupon('35')}>
                      <Entypo name="check" size={16} color="#ff4500" />
                      <Text style={styles.appliedText}>Applied</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.applyBtn,
                        isCouponDisabled(35) && styles.disabledBtn,
                      ]}
                      disabled={isCouponDisabled(35)}
                      onPress={() => handleApplyCoupon('35')}>
                      <Text style={styles.applyBtnText}>Apply</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <Text style={styles.description}>
                Valid only on your first service booking!
              </Text>
            </View>
          )}
        </View>

        {/* Service Type Section */}
        <View style={styles.deliveryTypeContainer}>
          <Text style={styles.deliveryTypeHeading}>Service Type</Text>
          <View style={styles.deliveryOption}>
            <Text style={styles.deliveryOptionText}>Instant Worker</Text>
            <Text style={styles.deliverySubText}>
              A skilled worker will arrive at your location within 15 minutes,
              ready to assist you with your service needs.
            </Text>
          </View>
        </View>

        {/* Payment summary */}
        <View style={styles.paymentSummary}>
          {appliedCoupon && savings > 0 ? (
            <>
              <Text style={styles.paymentInfo}>
                To Pay{' '}
                <Text style={{textDecorationLine: 'line-through'}}>
                  ₹{totalPrice}
                </Text>{' '}
                ₹{finalPrice}
              </Text>
              <Text style={styles.paymentSave}>
                You saved ₹{savings} on this order!
              </Text>
            </>
          ) : (
            <Text style={styles.paymentInfo}>To Pay ₹{totalPrice}</Text>
          )}
        </View>

        {/* Delivery address */}
        {/* Add Address Section (at the bottom) */}
        <View style={styles.bottomSection}>
          <Text style={styles.addressQuestion}>
            Where would you like us to send your skilled worker?
          </Text>
          <TouchableOpacity style={styles.addressBtn} onPress={addAddress}>
            <Text style={styles.addressBtnText}>Add address</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default OrderScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  percentage: {
    fontSize: 17,
    color: '#000',
  },
  description: {
    fontSize: 10,
    color: '#212121',
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    elevation: 1,
  },
  backArrow: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemCard: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 16,
    margin: 10,
    marginTop: 15,
    borderRadius: 5,
    elevation: 1,
  },
  itemCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  itemName: {
    fontSize: 16,
    width: '50%',
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  quantityBtn: {
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  quantityBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  quantityValue: {
    marginHorizontal: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  horizontalButtons: {
    flexDirection: 'row',
    marginTop: 10,
  },
  textBtn: {
    marginRight: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderColor: '#eee',
    borderWidth: 1,
    borderRadius: 10,
  },
  textBtnLabel: {
    fontSize: 14,
    color: '#333',
  },
  // Coupons
  savingsCorner: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 16,
    margin: 10,
    borderRadius: 10,
    elevation: 1,
  },
  savingsRowHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
  },
  savingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  couponContainer: {
    flexDirection: 'row',
    gap: 5,
  },
  offerContainer: {
    backgroundColor: '#ff4500',
    height: 30,
    width: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
  },
  savingsTitle: {
    fontSize: 14,
    width: '60%',
    fontWeight: '600',
  },
  savingsTitleHead: {
    fontSize: 16,
    fontWeight: '600',
  },
  offersRow: {
    paddingTop: 20,
  },
  applyBtn: {
    backgroundColor: '#f36c21',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 14,
  },
  disabledBtn: {
    backgroundColor: '#ccc',
  },
  appliedContainer: {
    flexDirection: 'row',
    alignItems: 'center',

    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  appliedText: {
    color: '#ff4500',
    marginLeft: 4,
    fontSize: 14,
  },
  deliveryTypeContainer: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 16,
    margin: 10,
    borderRadius: 10,
    elevation: 1,
  },
  deliveryTypeHeading: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  deliveryOption: {
    marginVertical: 8,
  },
  deliveryOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  deliverySubText: {
    fontSize: 12,
    color: '#777',
  },
  paymentSummary: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 16,
    flexDirection: 'column',
    elevation: 2,
    margin: 10,
    borderRadius: 10,
  },
  paymentInfo: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  paymentSave: {
    fontSize: 13,
    color: 'green',
  },
  addressQuestion: {
    marginTop: 16,
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  addressBtn: {
    backgroundColor: '#ff6f00',
    margin: 16,
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: 'center',
  },
  addressBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // bottomSection: {
  //   flex: 1,
  //   position: 'absolute',
  //   bottom: 0,
  //   width: '100%',
  //   backgroundColor: '#fff',
  //   padding: 16,
  //   borderTopLeftRadius: 10,
  //   borderTopRightRadius: 10,
  //   elevation: 3,
  // },
});
