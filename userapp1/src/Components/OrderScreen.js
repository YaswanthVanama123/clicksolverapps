/**
 * OrderScreen Component
 * Displays shopping cart with services, pricing, offers, and checkout functionality
 * Allows users to manage cart items, apply coupons, add tips, and proceed to checkout
 *
 * @component
 * @example
 * <OrderScreen route={{ params: { serviceName: [services] } }} />
 */

import React, {useEffect, useState, useCallback, useRef} from 'react';
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
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import EncryptedStorage from 'react-native-encrypted-storage';
import axios from 'axios';
import {useTranslation} from 'react-i18next';

// Theme and utilities
import {useTheme} from '../context/ThemeContext';
import {formatCurrency} from '../utils/formatters';
import {LoadingState, ErrorState} from '../Components/molecules';

// i18n
import '../i18n/i18n';

/**
 * OrderScreen Component
 * Cart management and checkout screen with offer application
 */
const OrderScreen = () => {
  const {width} = useWindowDimensions();
  const {theme, isDarkMode} = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const {serviceName} = route.params || [];
  const {t} = useTranslation();

  // Dynamic styles based on theme + device width
  const styles = dynamicStyles(width, isDarkMode, theme);

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
  const [errorModalContent, setErrorModalContent] = useState({
    title: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const didMountRef = useRef(false);

  /**
   * Show error modal with title and message
   * @param {string} title - Error title
   * @param {string} message - Error message
   */
  const showErrorModal = (title, message) => {
    setErrorModalContent({title, message});
    setErrorModalVisible(true);
  };

  /**
   * Load services from route params
   */
  useEffect(() => {
    if (serviceName && Array.isArray(serviceName)) {
      const updatedServices = serviceName.map(service => {
        const baseCost =
          service.quantity > 0 ? service.cost / service.quantity : service.cost;
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
   * Go back when services array becomes empty (after initial mount)
   */
  useEffect(() => {
    if (didMountRef.current) {
      if (services.length === 0) {
        navigation.goBack();
      }
    } else {
      didMountRef.current = true;
    }
  }, [services, navigation]);

  /**
   * Recalculate totals when services or offers change
   */
  useEffect(() => {
    let tempTotal = 0;
    services.forEach(s => {
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
   * Fetch offers from backend on screen focus
   */
  useFocusEffect(
    useCallback(() => {
      const fetchOffers = async () => {
        try {
          setLoading(true);
          setError(null);
          const token = await EncryptedStorage.getItem('cs_token');
          if (!token) return;

          const response = await axios.get(
            'https://backend.clicksolver.com/api/user/offers',
            {headers: {Authorization: `Bearer ${token}`}},
          );
          const {offers: fetchedOffers} = response.data;
          setOffers(fetchedOffers);
        } catch (error) {
          console.error('Error fetching offers:', error);
          setError(error);
        } finally {
          setLoading(false);
        }
      };
      fetchOffers();
    }, []),
  );

  /**
   * Increment service quantity
   * @param {number} index - Index of service in array
   */
  const incrementQuantity = index => {
    setServices(prev => {
      const updated = [...prev];
      updated[index].quantity += 1;
      updated[index].totalCost =
        updated[index].baseCost * updated[index].quantity;
      return updated;
    });
  };

  /**
   * Decrement service quantity
   * Remove service if quantity reaches zero
   * @param {number} index - Index of service in array
   */
  const decrementQuantity = index => {
    setServices(prev => {
      const updated = [...prev];
      updated[index].quantity = Math.max(0, updated[index].quantity - 1);
      updated[index].totalCost =
        updated[index].baseCost * updated[index].quantity;

      if (updated[index].quantity === 0) {
        updated.splice(index, 1);
      }

      return updated;
    });
  };

  /**
   * Validate and apply offer code
   * @param {string} offerCode - Offer code to validate
   * @param {number} currentTotal - Current cart total
   */
  const validateAndApplyOffer = async (offerCode, currentTotal) => {
    try {
      setLoading(true);
      const token = await EncryptedStorage.getItem('cs_token');
      if (!token) {
        showErrorModal(
          t('authentication_error') || 'Authentication Error',
          t('user_not_logged_in') || 'User not logged in.',
        );
        return;
      }

      const response = await axios.post(
        'https://backend.clicksolver.com/api/user/validate-offer',
        {offer_code: offerCode, totalAmount: currentTotal},
        {headers: {Authorization: `Bearer ${token}`}},
      );
      const {valid, discountAmount, newTotal, error} = response.data;

      if (!valid) {
        showErrorModal(
          t('offer_not_valid') || 'Offer Not Valid',
          error || t('offer_not_applicable') || 'This offer is not applicable.',
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
        t('offer_validation_error') || 'Unable to validate offer at this time.',
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle offer button click
   * Toggle offer application
   * @param {string} offerCode - Offer code to apply/remove
   */
  const handleApplyOffer = async offerCode => {
    if (appliedOffer === offerCode) {
      setAppliedOffer(null);
      setDiscountedPrice(totalPrice);
      setSavings(0);
      return;
    }
    await validateAndApplyOffer(offerCode, totalPrice);
  };

  // Calculate final price with tip
  const finalPrice = appliedOffer ? discountedPrice : totalPrice;
  const finalPriceWithTip = finalPrice + selectedTip;

  /**
   * Navigate to address selection screen
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

  /**
   * Navigate back to previous screen
   */
  const handleBackPress = () => {
    navigation.goBack();
  };

  // Show loading state while fetching offers initially
  if (loading && offers.length === 0) {
    return <LoadingState message={t('loading_offers') || 'Loading offers...'} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backArrow}>
          <Icon
            name="arrow-back"
            size={24}
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('my_cart') || 'My Cart'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Cart Items */}
        {services.map((service, index) => (
          <View key={service.main_service_id || index}>
            <View style={styles.itemRow}>
              <Image
                source={{uri: service.imageUrl}}
                style={styles.itemImage}
                resizeMode="cover"
              />
              <View style={styles.itemInfoContainer}>
                <Text style={styles.itemName}>
                  {t(`singleService_${service.main_service_id}`) ||
                    service.serviceName}
                </Text>
                <Text style={styles.itemPrice}>
                  {formatCurrency(service.totalCost)}
                </Text>
              </View>
              <View style={styles.quantityPriceContainer}>
                <View style={styles.quantityControls}>
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
          onPress={() => setShowCoupons(!showCoupons)}>
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
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>

        {showCoupons && (
          <View style={styles.couponListContainer}>
            {offers.length > 0 ? (
              offers.map(offer => (
                <View key={offer.offer_code} style={styles.couponRow}>
                  <View style={styles.couponTextContainer}>
                    <Text style={styles.couponLabel}>{offer.title}</Text>
                    <Text style={styles.couponDescription}>
                      {offer.description}
                    </Text>
                  </View>
                  {appliedOffer === offer.offer_code ? (
                    <TouchableOpacity
                      style={styles.appliedContainer}
                      onPress={() => handleApplyOffer(offer.offer_code)}>
                      <Entypo name="check" size={16} color="#ff4500" />
                      <Text style={styles.appliedText}>
                        {t('applied') || 'Applied'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.applyBtn}
                      onPress={() => handleApplyOffer(offer.offer_code)}>
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
            {[50, 75, 100, 150, 200].map(amount => (
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
                }}>
                <Text
                  style={[
                    styles.tipOptionText,
                    selectedTip === amount && styles.tipOptionTextSelected,
                  ]}>
                  {formatCurrency(amount)}
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
                <Text style={styles.strikeThrough}>
                  {formatCurrency(totalPrice)}
                </Text>{' '}
                {formatCurrency(finalPrice)}
              </Text>
            ) : (
              <Text style={styles.summaryValue}>
                {formatCurrency(totalPrice)}
              </Text>
            )}
          </View>

          {/* Taxes and Fee */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              {t('taxes_and_fee') || 'Taxes and Fee'}
            </Text>
            <Text style={styles.summaryValue}>{formatCurrency(0)}</Text>
          </View>

          {/* Tip */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('tip') || 'Tip'}</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(selectedTip)}
            </Text>
          </View>

          {/* Total Amount */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              {t('total_amount') || 'Total amount'}
            </Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(finalPriceWithTip)}
            </Text>
          </View>

          {/* Amount to Pay */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              {t('amount_to_pay') || 'Amount to pay'}
            </Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(finalPriceWithTip)}
            </Text>
          </View>

          {/* Savings */}
          {appliedOffer && savings > 0 && (
            <Text style={styles.savingsText}>
              {t('you_saved') || 'You saved'} {formatCurrency(savings)}{' '}
              {t('on_this_order') || 'on this order!'}
            </Text>
          )}
        </View>

        <View style={styles.sectionDivider} />

        {/* Address Section */}
        <View style={styles.addressSection}>
          <Text style={styles.addressQuestion}>
            {t('address_question') ||
              'Where would you like us to send your skilled worker?'}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <Text style={styles.bottomBarTotal}>
          {formatCurrency(finalPriceWithTip)}
        </Text>
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
        onRequestClose={() => setErrorModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{errorModalContent.title}</Text>
            <Text style={styles.modalMessage}>{errorModalContent.message}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setErrorModalVisible(false)}>
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
 * Dynamic styles based on screen width and theme
 * @param {number} width - Screen width
 * @param {boolean} isDarkMode - Whether dark mode is active
 * @param {object} theme - Theme object with colors
 * @returns {object} StyleSheet object
 */
const dynamicStyles = (width, isDarkMode, theme) => {
  const isTablet = width >= 600;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    contentContainer: {
      paddingBottom: 80,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: theme.colors.background.primary,
    },
    backArrow: {
      marginRight: 12,
    },
    headerTitle: {
      fontSize: isTablet ? 22 : 20,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
    sectionDivider: {
      height: 8,
      backgroundColor: theme.colors.background.secondary,
      width: '100%',
    },
    addMoreContainer: {
      backgroundColor: theme.colors.background.primary,
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
      backgroundColor: theme.colors.background.primary,
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
      color: theme.colors.text.primary,
      marginBottom: 4,
    },
    itemPrice: {
      fontSize: isTablet ? 16 : 14,
      fontWeight: '600',
      color: theme.colors.text.primary,
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
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    quantityBtnText: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: 'bold',
      color: theme.colors.text.primary,
    },
    quantityValue: {
      marginHorizontal: 8,
      fontSize: isTablet ? 16 : 14,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
    applyCouponHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.background.primary,
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
      color: theme.colors.text.primary,
    },
    couponListContainer: {
      backgroundColor: theme.colors.background.primary,
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
      color: theme.colors.text.primary,
    },
    couponDescription: {
      fontSize: isTablet ? 13 : 11,
      color: theme.colors.text.secondary,
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
      backgroundColor: theme.colors.background.primary,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    tipTitle: {
      fontSize: isTablet ? 16 : 14,
      fontWeight: '700',
      color: theme.colors.text.primary,
      marginBottom: 10,
    },
    tipOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    tipOption: {
      backgroundColor: theme.colors.background.secondary,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
      marginRight: 8,
      marginBottom: 8,
    },
    tipOptionText: {
      color: theme.colors.text.primary,
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
      backgroundColor: theme.colors.background.primary,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    paymentSummaryTitle: {
      fontSize: isTablet ? 17 : 15,
      fontWeight: '700',
      color: theme.colors.text.primary,
      marginBottom: 10,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    summaryLabel: {
      fontSize: isTablet ? 15 : 13,
      color: theme.colors.text.secondary,
    },
    summaryValue: {
      fontSize: isTablet ? 15 : 13,
      fontWeight: '700',
      color: theme.colors.text.primary,
    },
    strikeThrough: {
      textDecorationLine: 'line-through',
      color: theme.colors.text.disabled,
    },
    savingsText: {
      marginTop: 6,
      fontSize: isTablet ? 14 : 12,
      color: 'green',
      fontWeight: '600',
    },
    addressSection: {
      backgroundColor: theme.colors.background.primary,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    addressQuestion: {
      fontSize: isTablet ? 15 : 13,
      fontWeight: '600',
      color: theme.colors.text.primary,
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
      backgroundColor: theme.colors.background.primary,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border.light,
    },
    bottomBarTotal: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: '700',
      color: theme.colors.text.primary,
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
      backgroundColor: theme.colors.background.primary,
      padding: 20,
      borderRadius: 8,
      width: '80%',
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: 'bold',
      marginBottom: 10,
      color: theme.colors.text.primary,
    },
    modalMessage: {
      fontSize: isTablet ? 16 : 14,
      textAlign: 'center',
      marginBottom: 20,
      color: theme.colors.text.primary,
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
