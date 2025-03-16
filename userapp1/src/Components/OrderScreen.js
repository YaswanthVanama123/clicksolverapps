import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome6';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import EncryptedStorage from 'react-native-encrypted-storage';
import axios from 'axios';
// Import the theme hook
import { useTheme } from '../context/ThemeContext';

const OrderScreen = () => {
  const { width } = useWindowDimensions();
  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(width, isDarkMode);
  const navigation = useNavigation();
  const route = useRoute();
  const { serviceName } = route.params || [];

  const [services, setServices] = useState([]);
  const [showCoupons, setShowCoupons] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [couponsAvailable, setCouponsAvailable] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [discountedPrice, setDiscountedPrice] = useState(0);
  const [savings, setSavings] = useState(0);
  const [selectedTip, setSelectedTip] = useState(0);
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
        return {
          ...service,
          baseCost,
          totalCost,
          imageUrl: service.url || 'https://via.placeholder.com/100',
        };
      });
      setServices(updatedServices);
    }
  }, [serviceName]);

  // 2) Recalculate totals when services or coupon changes
  useEffect(() => {
    let tempTotal = 0;
    services.forEach((s) => {
      tempTotal += s.totalCost;
    });
    setTotalPrice(tempTotal);
  
    // If a coupon is applied, check if the new total still meets the requirement
    if (appliedCoupon) {
      const couponData = COUPONS[appliedCoupon];
  
      if (tempTotal < couponData.minOrderValue) {
        // If the total is below the threshold, unapply the coupon
        setAppliedCoupon(null);
        setDiscountedPrice(tempTotal);
        setSavings(0);
      } else {
        // Otherwise, recalculate the discount
        applyCoupon(appliedCoupon, tempTotal);
      }
    } else {
      // If no coupon is applied, just set discountedPrice = tempTotal
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
            'https://backend.clicksolver.com/api/user/coupons',
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
      // Unapply if same coupon is tapped again
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

  // Final price after coupon and tip
  const finalPrice = appliedCoupon ? discountedPrice : totalPrice;
  const finalPriceWithTip = finalPrice + selectedTip;

  // 7) Address Handling
  const addAddress = async () => {
    try {
      const cs_token = await EncryptedStorage.getItem('cs_token');
      if (cs_token) {
        navigation.push('UserLocation', {
          serviceName: services,
          tipAmount: selectedTip,
          savings,
        });
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
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backArrow}>
          <Icon name="arrow-left-long" size={24} color={isDarkMode ? '#fff' : "#333"} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Divider */}
        <View style={styles.sectionDivider} />

        {/* Cart Items */}
        {services.map((service, index) => (
          <View key={service.main_service_id || index}>
            <View style={styles.itemRow}>
              <Image source={{ uri: service.imageUrl }} style={styles.itemImage} resizeMode="cover" />
              <View style={styles.itemInfoContainer}>
                <Text style={styles.itemName}>{service.serviceName}</Text>
                <Text style={styles.itemPrice}>₹{service.totalCost}</Text>
              </View>
              <View style={styles.quantityPriceContainer}>
                <View style={styles.quantityControls}>
                  <TouchableOpacity onPress={() => decrementQuantity(index)} style={styles.quantityBtn}>
                    <Text style={styles.quantityBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityValue}>{service.quantity}</Text>
                  <TouchableOpacity onPress={() => incrementQuantity(index)} style={styles.quantityBtn}>
                    <Text style={styles.quantityBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <View style={styles.sectionDivider} />
          </View>
        ))}

        {/* Add more items */}
        <View style={styles.addMoreContainer}>
          <TouchableOpacity onPress={handleBackPress}>
            <Text style={styles.addMoreText}>+ Add more items</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionDivider} />

        {/* Coupon Section */}
        <TouchableOpacity style={styles.applyCouponHeader} onPress={() => setShowCoupons(!showCoupons)}>
          <View style={styles.couponLeft}>
            <MaterialIcons name="local-offer" size={20} color="#fff" style={styles.couponIcon} />
            <Text style={styles.applyCouponText}>Apply Coupon</Text>
          </View>
          <Entypo name={showCoupons ? 'chevron-up' : 'chevron-down'} size={20} color={isDarkMode ? '#fff' : "#333"} />
        </TouchableOpacity>

        {showCoupons && (
          <View style={styles.couponListContainer}>
            <View style={styles.couponRow}>
              <Text style={styles.couponLabel}>{COUPONS[30].label}</Text>
              {appliedCoupon === '30' ? (
                <TouchableOpacity style={styles.appliedContainer} onPress={() => handleApplyCoupon('30')}>
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
              Earn rewards for every referral! (Requires &gt; 0 coupons)
            </Text>

            <View style={styles.couponRow}>
              <Text style={styles.couponLabel}>{COUPONS[40].label}</Text>
              {appliedCoupon === '40' ? (
                <TouchableOpacity style={styles.appliedContainer} onPress={() => handleApplyCoupon('40')}>
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
            <Text style={styles.couponDescription}>Valid only on your first service booking!</Text>

            <View style={styles.couponRow}>
              <Text style={styles.couponLabel}>{COUPONS[35].label}</Text>
              {appliedCoupon === '35' ? (
                <TouchableOpacity style={styles.appliedContainer} onPress={() => handleApplyCoupon('35')}>
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
            <Text style={styles.couponDescription}>Valid only on your first service booking!</Text>
          </View>
        )}

        <View style={styles.sectionDivider} />

        {/* Tip Section */}
        <View style={styles.tipContainer}>
          <Text style={styles.tipTitle}>Add a tip to thank the professional</Text>
          <View style={styles.tipOptions}>
            {[50, 75, 100, 150, 200].map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[styles.tipOption, selectedTip === amount && styles.tipOptionSelected]}
                onPress={() => {
                  if (selectedTip === amount) {
                    setSelectedTip(0);
                  } else {
                    setSelectedTip(amount);
                  }
                }}
              >
                <Text style={[styles.tipOptionText, selectedTip === amount && styles.tipOptionTextSelected]}>
                  ₹{amount}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.sectionDivider} />

        {/* Payment Summary */}
        <View style={styles.paymentSummaryContainer}>
          <Text style={styles.paymentSummaryTitle}>Payment summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Item total</Text>
            {appliedCoupon && savings > 0 ? (
              <Text style={styles.summaryValue}>
                <Text style={styles.strikeThrough}>₹{totalPrice}</Text> ₹{finalPrice}
              </Text>
            ) : (
              <Text style={styles.summaryValue}>₹{totalPrice}</Text>
            )}
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Taxes and Fee</Text>
            <Text style={styles.summaryValue}>₹0</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tip</Text>
            <Text style={styles.summaryValue}>₹{selectedTip}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total amount</Text>
            <Text style={styles.summaryValue}>₹{finalPriceWithTip}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount to pay</Text>
            <Text style={styles.summaryValue}>₹{finalPriceWithTip}</Text>
          </View>
          {appliedCoupon && savings > 0 && (
            <Text style={styles.savingsText}>You saved ₹{savings} on this order!</Text>
          )}
        </View>

        <View style={styles.sectionDivider} />

        {/* Address Section */}
        <View style={styles.addressSection}>
          <Text style={styles.addressQuestion}>
            Where would you like us to send your skilled worker?
          </Text>
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <Text style={styles.bottomBarTotal}>₹{finalPriceWithTip}</Text>
        <TouchableOpacity style={styles.bottomBarButton} onPress={addAddress}>
          <Text style={styles.bottomBarButtonText}>Add Address</Text>
        </TouchableOpacity>
      </View>

      {/* Error Modal */}
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
            <TouchableOpacity style={styles.modalButton} onPress={() => setErrorModalVisible(false)}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default OrderScreen;

const dynamicStyles = (width, isDarkMode) => {
  const isTablet = width >= 600;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: isDarkMode ? '#121212' : '#fff' },
    contentContainer: { paddingBottom: 80 },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: isDarkMode ? '#121212' : '#fff',
    },
    backArrow: { marginRight: 12 },
    headerTitle: { fontSize: isTablet ? 22 : 20, fontWeight: '600', color: isDarkMode ? '#fff' : '#212121' },
    sectionDivider: { height: 8, backgroundColor: isDarkMode ? '#333' : '#f5f5f5', width: '100%' },
    membershipBanner: { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff7f2', padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    membershipTextContainer: { flex: 1, alignItems: 'center' },
    membershipPlusText: { fontSize: isTablet ? 16 : 14, fontWeight: '800', textTransform: 'uppercase', color: '#ff6f00', marginBottom: 4 },
    membershipPlan: { fontSize: isTablet ? 15 : 13, fontWeight: '600', color: isDarkMode ? '#fff' : '#333', marginBottom: 2 },
    membershipBenefits: { fontSize: isTablet ? 14 : 12, color: isDarkMode ? '#ccc' : '#666', marginBottom: 4, textAlign: 'center' },
    membershipViewLink: { fontSize: isTablet ? 14 : 12, color: '#ff6f00', fontWeight: '600' },
    itemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: isDarkMode ? '#1e1e1e' : '#fff' },
    itemImage: { width: 60, height: 60, borderRadius: 8 },
    itemInfoContainer: { flex: 1, marginLeft: 12, justifyContent: 'center' },
    itemName: { fontSize: isTablet ? 18 : 16, fontWeight: '500', color: isDarkMode ? '#fff' : '#212121', marginBottom: 4 },
    itemSubtitle: { fontSize: isTablet ? 14 : 12, color: isDarkMode ? '#ccc' : '#777' },
    quantityPriceContainer: { alignItems: 'flex-end', justifyContent: 'center' },
    quantityControls: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    quantityBtn: { backgroundColor: isDarkMode ? '#444' : '#e0e0e0', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
    quantityBtnText: { fontSize: isTablet ? 18 : 16, fontWeight: 'bold', color: isDarkMode ? '#fff' : '#333' },
    quantityValue: { marginHorizontal: 8, fontSize: isTablet ? 16 : 14, fontWeight: '600', color: isDarkMode ? '#fff' : '#333' },
    itemPrice: { fontSize: isTablet ? 16 : 14, fontWeight: '600', color: isDarkMode ? '#fff' : '#000' },
    addMoreContainer: { backgroundColor: isDarkMode ? '#121212' : '#fff', paddingHorizontal: 16, paddingVertical: 12 },
    addMoreText: { fontSize: isTablet ? 16 : 14, color: '#ff6f00', fontWeight: '600' },
    frequentlyContainer: { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 },
    frequentlyTitle: { fontSize: isTablet ? 16 : 14, fontWeight: '700', color: isDarkMode ? '#fff' : '#333' },
    frequentlyItem: { width: 120, backgroundColor: isDarkMode ? '#333' : '#f9f9f9', borderRadius: 8, marginRight: 12, alignItems: 'center', padding: 8 },
    frequentlyItemImage: { width: 80, height: 80, borderRadius: 8, marginBottom: 6 },
    frequentlyItemName: { fontSize: isTablet ? 14 : 12, fontWeight: '600', color: isDarkMode ? '#fff' : '#333', marginBottom: 4, textAlign: 'center' },
    frequentlyItemPrice: { fontSize: isTablet ? 14 : 12, color: isDarkMode ? '#ccc' : '#777', marginBottom: 6 },
    frequentlyItemAddBtn: { backgroundColor: '#ff6f00', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6 },
    frequentlyItemAddBtnText: { color: '#fff', fontSize: isTablet ? 14 : 12, fontWeight: '600' },
    applyCouponHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isDarkMode ? '#121212' : '#fff', paddingHorizontal: 16, paddingVertical: 14 },
    couponLeft: { flexDirection: 'row', alignItems: 'center' },
    couponIcon: { backgroundColor: '#ff6f00', padding: 4, borderRadius: 4, marginRight: 8 },
    applyCouponText: { fontSize: isTablet ? 16 : 14, fontWeight: '700', color: isDarkMode ? '#fff' : '#333' },
    couponListContainer: { backgroundColor: isDarkMode ? '#121212' : '#fff', paddingHorizontal: 16, paddingBottom: 12 },
    couponRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    couponLabel: { flex: 1, fontSize: isTablet ? 15 : 13, fontWeight: '600', color: isDarkMode ? '#fff' : '#333', marginRight: 8 },
    couponDescription: { fontSize: isTablet ? 13 : 11, color: isDarkMode ? '#ccc' : '#777', marginBottom: 8, marginTop: 2 },
    applyBtn: { backgroundColor: '#f36c21', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 6 },
    applyBtnText: { color: '#fff', fontSize: isTablet ? 14 : 12, fontWeight: '600' },
    disabledBtn: { backgroundColor: '#ccc' },
    appliedContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 6, borderWidth: 1, borderColor: '#ff4500' },
    appliedText: { color: '#ff4500', marginLeft: 6, fontSize: isTablet ? 14 : 12, fontWeight: '600' },
    tipContainer: { backgroundColor: isDarkMode ? '#121212' : '#fff', paddingHorizontal: 16, paddingVertical: 14 },
    tipTitle: { fontSize: isTablet ? 16 : 14, fontWeight: '700', color: isDarkMode ? '#fff' : '#333', marginBottom: 10 },
    tipOptions: { flexDirection: 'row', flexWrap: 'wrap' },
    tipOption: { backgroundColor: isDarkMode ? '#444' : '#f1f1f1', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, marginRight: 8, marginBottom: 8 },
    tipOptionText: { color: isDarkMode ? '#fff' : '#333', fontSize: isTablet ? 14 : 12, fontWeight: '600' },
    tipOptionSelected: { backgroundColor: '#ff6f00' },
    tipOptionTextSelected: { color: '#fff' },
    paymentSummaryContainer: { backgroundColor: isDarkMode ? '#121212' : '#fff', paddingHorizontal: 16, paddingVertical: 14 },
    paymentSummaryTitle: { fontSize: isTablet ? 17 : 15, fontWeight: '700', color: isDarkMode ? '#fff' : '#333', marginBottom: 10 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    summaryLabel: { fontSize: isTablet ? 15 : 13, color: isDarkMode ? '#ccc' : '#555' },
    summaryValue: { fontSize: isTablet ? 15 : 13, fontWeight: '700', color: isDarkMode ? '#fff' : '#333' },
    strikeThrough: { textDecorationLine: 'line-through', color: isDarkMode ? '#aaa' : '#888' },
    savingsText: { marginTop: 6, fontSize: isTablet ? 14 : 12, color: 'green', fontWeight: '600' },
    addressSection: { backgroundColor: isDarkMode ? '#121212' : '#fff', paddingHorizontal: 16, paddingVertical: 14 },
    addressQuestion: { fontSize: isTablet ? 15 : 13, fontWeight: '600', color: isDarkMode ? '#fff' : '#333', marginBottom: 10 },
    addressBtn: { backgroundColor: '#ff6f00', paddingVertical: 12, borderRadius: 6, alignItems: 'center' },
    addressBtnText: { color: '#fff', fontSize: isTablet ? 15 : 13, fontWeight: '700' },
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDarkMode ? '#121212' : '#fff',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? '#333' : '#f5f5f5'
    },
    bottomBarTotal: { fontSize: isTablet ? 18 : 16, fontWeight: '700', color: isDarkMode ? '#fff' : '#333' },
    bottomBarButton: { backgroundColor: '#ff6f00', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6 },
    bottomBarButtonText: { color: '#fff', fontSize: isTablet ? 16 : 14, fontWeight: '700' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: isDarkMode ? '#333' : '#fff', padding: 20, borderRadius: 8, width: '80%', alignItems: 'center' },
    modalTitle: { fontSize: isTablet ? 18 : 16, fontWeight: 'bold', marginBottom: 10, color: isDarkMode ? '#fff' : '#000' },
    modalMessage: { fontSize: isTablet ? 16 : 14, textAlign: 'center', marginBottom: 20, color: isDarkMode ? '#ccc' : '#000' },
    modalButton: { backgroundColor: '#ff6f00', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 6 },
    modalButtonText: { color: '#fff', fontSize: isTablet ? 16 : 14, fontWeight: '600' },
  });
};
