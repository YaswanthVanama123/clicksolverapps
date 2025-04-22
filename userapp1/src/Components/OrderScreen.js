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
import { useTheme } from '../context/ThemeContext';

// 1) Import i18n so translations are loaded
import '../i18n/i18n';
// 2) Import the useTranslation hook
import { useTranslation } from 'react-i18next';

const OrderScreen = () => {
  const { width } = useWindowDimensions();
  const { isDarkMode } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  // 3) Destructure serviceName from route params
  const { serviceName } = route.params || [];

  // 4) Use the useTranslation hook
  const { t } = useTranslation();

  // 5) Dynamic styles based on theme + device width
  const styles = dynamicStyles(width, isDarkMode);

  // States
  const [services, setServices] = useState([]);
  const [showCoupons, setShowCoupons] = useState(false);
  const [offers, setOffers] = useState([]);
  const [appliedOffer, setAppliedOffer] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [discountedPrice, setDiscountedPrice] = useState(0);
  const [savings, setSavings] = useState(0);
  const [selectedTip, setSelectedTip] = useState(0);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalContent, setErrorModalContent] = useState({ title: '', message: '' });

  // Show error modal with title + message
  const showErrorModal = (title, message) => {
    setErrorModalContent({ title, message });
    setErrorModalVisible(true);
  };

  /**
   * 1) Load services from route params
   */
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

  /**
   * 2) Recalculate totals when services or offers change
   */
  useEffect(() => {
    let tempTotal = 0;
    services.forEach((s) => {
      tempTotal += s.totalCost;
    });
    setTotalPrice(tempTotal);

    if (appliedOffer) {
      validateAndApplyOffer(appliedOffer, tempTotal);
    } else {
      setDiscountedPrice(tempTotal);
      setSavings(0);
    }
  }, [services]);

  /**
   * 3) Fetch offers from backend on screen focus
   */
  useFocusEffect(
    useCallback(() => {
      const fetchOffers = async () => {
        try {
          const token = await EncryptedStorage.getItem('cs_token');
          if (!token) return;

          // Example endpoint to fetch offers
          const response = await axios.get(
            'https://backend.clicksolver.com/api/user/offers',
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const { offers: fetchedOffers } = response.data;
          setOffers(fetchedOffers);
        } catch (error) {
          // console.log('Error fetching offers:', error);
        }
      };
      fetchOffers();
    }, [])
  );

  /**
   * 4) Adjust quantity logic
   */
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

  /**
   * 5) Validate & Apply Offer
   */
  const validateAndApplyOffer = async (offerCode, currentTotal) => {
    try {
      const token = await EncryptedStorage.getItem('cs_token');
      if (!token) {
        showErrorModal(
          t('authentication_error') || 'Authentication Error',
          t('user_not_logged_in') || 'User not logged in.'
        );
        return;
      }

      // Example endpoint to validate the offer
      const response = await axios.post(
        'https://backend.clicksolver.com/api/user/validate-offer',
        { offer_code: offerCode, totalAmount: currentTotal },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { valid, discountAmount, newTotal, error } = response.data;

      if (!valid) {
        showErrorModal(
          t('offer_not_valid') || 'Offer Not Valid',
          error || t('offer_not_applicable') || 'This offer is not applicable.'
        );
        setAppliedOffer(null);
        setDiscountedPrice(currentTotal);
        setSavings(0);
        return;
      }

      setDiscountedPrice(newTotal);
      setSavings(discountAmount);
      setAppliedOffer(offerCode);
    } catch (error) {
      console.error('Error validating offer:', error);
      showErrorModal(
        t('error') || 'Error',
        t('offer_validation_error') || 'Unable to validate offer at this time.'
      );
    }
  };

  /**
   * 6) Handle Offer Button Click
   */
  const handleApplyOffer = async (offerCode) => {
    // If the same offer is tapped, unapply it
    if (appliedOffer === offerCode) {
      setAppliedOffer(null);
      setDiscountedPrice(totalPrice);
      setSavings(0);
      return;
    }
    // Otherwise, validate & apply
    await validateAndApplyOffer(offerCode, totalPrice);
  };

  // Calculate final price with tip
  const finalPrice = appliedOffer ? discountedPrice : totalPrice;
  const finalPriceWithTip = finalPrice + selectedTip;

  /**
   * 7) Address Handling
   */
  const addAddress = async () => {
    try {
      const token = await EncryptedStorage.getItem('cs_token');
      if (token) {
        const params = {
          serviceName: services,
          tipAmount: selectedTip,
          savings,
          ...(appliedOffer && {
            offer: {
              offer_code: appliedOffer,
              discountAmount: savings,
            },
          }),
        };
        navigation.push('UserLocation', params);
      } else {
        console.error('No token found, user must login');
      }
    } catch (error) {
      console.error('Error accessing storage:', error);
    }
  };

  // Navigation: Back button
  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backArrow}>
          <Icon name="arrow-left-long" size={24} color={isDarkMode ? '#fff' : '#333'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('my_cart') || 'My Cart'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Cart Items */}
        {services.map((service, index) => (
          <View key={service.main_service_id || index}>
            <View style={styles.itemRow}>
              <Image
                source={{ uri: service.imageUrl }}
                style={styles.itemImage}
                resizeMode="cover"
              />
              <View style={styles.itemInfoContainer}>
                <Text style={styles.itemName}> { t(`singleService_${service.main_service_id}`) || service.serviceName }</Text>
                <Text style={styles.itemPrice}>₹{service.totalCost}</Text>
              </View>
              <View style={styles.quantityPriceContainer}>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    onPress={() => decrementQuantity(index)}
                    style={styles.quantityBtn}
                  >
                    <Text style={styles.quantityBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityValue}>{service.quantity}</Text>
                  <TouchableOpacity
                    onPress={() => incrementQuantity(index)}
                    style={styles.quantityBtn}
                  >
                    <Text style={styles.quantityBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ))}

        {/* Add More Items */}
        <View style={styles.addMoreContainer}>
          <TouchableOpacity onPress={handleBackPress}>
            <Text style={styles.addMoreText}>
              + {t('add_more_items') || 'Add more items'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionDivider} />

        {/* Coupon/Offer Section */}
        <TouchableOpacity
          style={styles.applyCouponHeader}
          onPress={() => setShowCoupons(!showCoupons)}
        >
          <View style={styles.couponLeft}>
            <MaterialIcons
              name="local-offer"
              size={20}
              color="#fff"
              style={styles.couponIcon}
            />
            <Text style={styles.applyCouponText}>
              {t('apply_coupon') || 'Apply Coupon'}
            </Text>
          </View>
          <Entypo
            name={showCoupons ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={isDarkMode ? '#fff' : '#333'}
          />
        </TouchableOpacity>

        {showCoupons && (
          <View style={styles.couponListContainer}>
            {offers.length > 0 ? (
              offers.map((offer) => (
                <View key={offer.offer_code} style={styles.couponRow}>
                  {/* Coupon Text Container */}
                  <View style={styles.couponTextContainer}>
                    <Text style={styles.couponLabel}>{offer.title}</Text>
                    <Text style={styles.couponDescription}>{offer.description}</Text>
                  </View>
                  {appliedOffer === offer.offer_code ? (
                    <TouchableOpacity
                      style={styles.appliedContainer}
                      onPress={() => handleApplyOffer(offer.offer_code)}
                    >
                      <Entypo name="check" size={16} color="#ff4500" />
                      <Text style={styles.appliedText}>
                        {t('applied') || 'Applied'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.applyBtn}
                      onPress={() => handleApplyOffer(offer.offer_code)}
                    >
                      <Text style={styles.applyBtnText}>
                        {t('apply') || 'Apply'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.couponDescription}>
                {t('no_offers') || 'No offers available at the moment.'}
              </Text>
            )}
          </View>
        )}

        <View style={styles.sectionDivider} />

        {/* Tip Section */}
        <View style={styles.tipContainer}>
          <Text style={styles.tipTitle}>
            {t('add_tip') || 'Add a tip to thank the professional'}
          </Text>
          <View style={styles.tipOptions}>
            {[50, 75, 100, 150, 200].map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.tipOption,
                  selectedTip === amount && styles.tipOptionSelected,
                ]}
                onPress={() => {
                  if (selectedTip === amount) {
                    setSelectedTip(0);
                  } else {
                    setSelectedTip(amount);
                  }
                }}
              >
                <Text
                  style={[
                    styles.tipOptionText,
                    selectedTip === amount && styles.tipOptionTextSelected,
                  ]}
                >
                  ₹{amount}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.sectionDivider} />

        {/* Payment Summary */}
        <View style={styles.paymentSummaryContainer}>
          <Text style={styles.paymentSummaryTitle}>
            {t('payment_summary') || 'Payment summary'}
          </Text>

          {/* Item Total */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              {t('item_total') || 'Item total'}
            </Text>
            {appliedOffer && savings > 0 ? (
              <Text style={styles.summaryValue}>
                <Text style={styles.strikeThrough}>₹{totalPrice}</Text> ₹
                {finalPrice}
              </Text>
            ) : (
              <Text style={styles.summaryValue}>₹{totalPrice}</Text>
            )}
          </View>

          {/* Taxes and Fee */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              {t('taxes_and_fee') || 'Taxes and Fee'}
            </Text>
            <Text style={styles.summaryValue}>₹0</Text>
          </View>

          {/* Tip */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('tip') || 'Tip'}</Text>
            <Text style={styles.summaryValue}>₹{selectedTip}</Text>
          </View>

          {/* Total Amount */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              {t('total_amount') || 'Total amount'}
            </Text>
            <Text style={styles.summaryValue}>₹{finalPriceWithTip}</Text>
          </View>

          {/* Amount to Pay */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              {t('amount_to_pay') || 'Amount to pay'}
            </Text>
            <Text style={styles.summaryValue}>₹{finalPriceWithTip}</Text>
          </View>

          {/* Savings */}
          {appliedOffer && savings > 0 && (
            <Text style={styles.savingsText}>
              {t('you_saved') || 'You saved'} ₹{savings}{' '}
              {t('on_this_order') || 'on this order!'}
            </Text>
          )}
        </View>

        <View style={styles.sectionDivider} />

        {/* Address Section */}
        <View style={styles.addressSection}>
          <Text style={styles.addressQuestion}>
            {t('address_question') || 'Where would you like us to send your skilled worker?'}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <Text style={styles.bottomBarTotal}>₹{finalPriceWithTip}</Text>
        <TouchableOpacity style={styles.bottomBarButton} onPress={addAddress}>
          <Text style={styles.bottomBarButtonText}>
            {t('add_address') || 'Add Address'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Error Modal */}
      <Modal
        animationType="fade"
        transparent
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
              <Text style={styles.modalButtonText}>{t('ok') || 'OK'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Export
export default OrderScreen;

/**
 * Dynamic styles
 */
const dynamicStyles = (width, isDarkMode) => {
  const isTablet = width >= 600;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#fff',
    },
    contentContainer: {
      paddingBottom: 80,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: isDarkMode ? '#121212' : '#fff',
    },
    backArrow: {
      marginRight: 12,
    },
    headerTitle: {
      fontSize: isTablet ? 22 : 20,
      fontWeight: '600',
      color: isDarkMode ? '#fff' : '#212121',
    },
    sectionDivider: {
      height: 8,
      backgroundColor: isDarkMode ? '#333' : '#f5f5f5',
      width: '100%',
    },
    addMoreContainer: {
      backgroundColor: isDarkMode ? '#121212' : '#fff',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    addMoreText: {
      fontSize: isTablet ? 16 : 14,
      color: '#ff6f00',
      fontWeight: '600',
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: isDarkMode ? '#121212' : '#fff',
    },
    itemImage: {
      width: 60,
      height: 60,
      borderRadius: 8,
    },
    itemInfoContainer: {
      flex: 1,
      marginLeft: 12,
      justifyContent: 'center',
    },
    itemName: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: '500',
      color: isDarkMode ? '#fff' : '#212121',
      marginBottom: 4,
    },
    itemPrice: {
      fontSize: isTablet ? 16 : 14,
      fontWeight: '600',
      color: isDarkMode ? '#fff' : '#000',
    },
    quantityPriceContainer: {
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
    quantityControls: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    quantityBtn: {
      backgroundColor: isDarkMode ? '#444' : '#e0e0e0',
      borderRadius: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    quantityBtnText: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: 'bold',
      color: isDarkMode ? '#fff' : '#333',
    },
    quantityValue: {
      marginHorizontal: 8,
      fontSize: isTablet ? 16 : 14,
      fontWeight: '600',
      color: isDarkMode ? '#fff' : '#333',
    },
    applyCouponHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#121212' : '#fff',
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    couponLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    couponIcon: {
      backgroundColor: '#ff6f00',
      padding: 4,
      borderRadius: 4,
      marginRight: 8,
    },
    applyCouponText: {
      fontSize: isTablet ? 16 : 14,
      fontWeight: '700',
      color: isDarkMode ? '#fff' : '#333',
    },
    couponListContainer: {
      backgroundColor: isDarkMode ? '#121212' : '#fff',
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    couponRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    couponTextContainer: {
      flex: 1,
      marginRight: 80,
    },
    couponLabel: {
      fontSize: isTablet ? 15 : 13,
      fontWeight: '600',
      color: isDarkMode ? '#fff' : '#333',
    },
    couponDescription: {
      fontSize: isTablet ? 13 : 11,
      color: isDarkMode ? '#ccc' : '#777',
      marginBottom: 8,
      marginTop: 2,
    },
    applyBtn: {
      backgroundColor: '#f36c21',
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 6,
    },
    applyBtnText: {
      color: '#fff',
      fontSize: isTablet ? 14 : 12,
      fontWeight: '600',
    },
    appliedContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#ff4500',
    },
    appliedText: {
      color: '#ff4500',
      marginLeft: 6,
      fontSize: isTablet ? 14 : 12,
      fontWeight: '600',
    },
    tipContainer: {
      backgroundColor: isDarkMode ? '#121212' : '#fff',
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    tipTitle: {
      fontSize: isTablet ? 16 : 14,
      fontWeight: '700',
      color: isDarkMode ? '#fff' : '#333',
      marginBottom: 10,
    },
    tipOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    tipOption: {
      backgroundColor: isDarkMode ? '#444' : '#f1f1f1',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
      marginRight: 8,
      marginBottom: 8,
    },
    tipOptionText: {
      color: isDarkMode ? '#fff' : '#333',
      fontSize: isTablet ? 14 : 12,
      fontWeight: '600',
    },
    tipOptionSelected: {
      backgroundColor: '#ff6f00',
    },
    tipOptionTextSelected: {
      color: '#fff',
    },
    paymentSummaryContainer: {
      backgroundColor: isDarkMode ? '#121212' : '#fff',
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    paymentSummaryTitle: {
      fontSize: isTablet ? 17 : 15,
      fontWeight: '700',
      color: isDarkMode ? '#fff' : '#333',
      marginBottom: 10,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    summaryLabel: {
      fontSize: isTablet ? 15 : 13,
      color: isDarkMode ? '#ccc' : '#555',
    },
    summaryValue: {
      fontSize: isTablet ? 15 : 13,
      fontWeight: '700',
      color: isDarkMode ? '#fff' : '#333',
    },
    strikeThrough: {
      textDecorationLine: 'line-through',
      color: isDarkMode ? '#aaa' : '#888',
    },
    savingsText: {
      marginTop: 6,
      fontSize: isTablet ? 14 : 12,
      color: 'green',
      fontWeight: '600',
    },
    addressSection: {
      backgroundColor: isDarkMode ? '#121212' : '#fff',
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    addressQuestion: {
      fontSize: isTablet ? 15 : 13,
      fontWeight: '600',
      color: isDarkMode ? '#fff' : '#333',
      marginBottom: 10,
    },
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
      borderTopColor: isDarkMode ? '#333' : '#f5f5f5',
    },
    bottomBarTotal: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: '700',
      color: isDarkMode ? '#fff' : '#333',
    },
    bottomBarButton: {
      backgroundColor: '#ff6f00',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 6,
    },
    bottomBarButtonText: {
      color: '#fff',
      fontSize: isTablet ? 16 : 14,
      fontWeight: '700',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: isDarkMode ? '#333' : '#fff',
      padding: 20,
      borderRadius: 8,
      width: '80%',
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: 'bold',
      marginBottom: 10,
      color: isDarkMode ? '#fff' : '#000',
    },
    modalMessage: {
      fontSize: isTablet ? 16 : 14,
      textAlign: 'center',
      marginBottom: 20,
      color: isDarkMode ? '#ccc' : '#000',
    },
    modalButton: {
      backgroundColor: '#ff6f00',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 6,
    },
    modalButtonText: {
      color: '#fff',
      fontSize: isTablet ? 16 : 14,
      fontWeight: '600',
    },
  });
};
