/**
 * BookingSummary.js - Organism Component
 * Order summary with pricing breakdown and animated updates
 */

import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Animated,
  TextInput,
} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import {getColors} from '../../theme/colors';
import {GradientBackground} from '../../theme/gradients';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

/**
 * BookingSummary Component
 * @param {Array} services - Array of selected services
 * @param {Object} address - Selected address
 * @param {Object} offer - Applied offer/coupon
 * @param {Number} tip - Selected tip amount
 * @param {Function} onConfirm - Confirmation callback
 * @param {Function} onApplyOffer - Apply offer callback
 * @param {Function} onRemoveOffer - Remove offer callback
 * @param {Function} onChangeTip - Tip change callback
 * @param {Boolean} loading - Loading state
 */
const BookingSummary = ({
  services = [],
  address = null,
  offer = null,
  tip = 0,
  onConfirm,
  onApplyOffer,
  onRemoveOffer,
  onChangeTip,
  loading = false,
}) => {
  const {width} = useWindowDimensions();
  const {isDarkMode} = useTheme();
  const colors = getColors(isDarkMode);
  const styles = dynamicStyles(width, isDarkMode, colors);

  const [selectedTip, setSelectedTip] = useState(tip);
  const [customTip, setCustomTip] = useState('');
  const [showOfferInput, setShowOfferInput] = useState(false);
  const [offerCode, setOfferCode] = useState('');

  // Animation refs
  const priceAnim = useRef(new Animated.Value(1)).current;
  const offerAnim = useRef(new Animated.Value(0)).current;

  // Calculate pricing
  const subtotal = services.reduce((sum, service) => sum + (service.price || 0), 0);
  const tax = subtotal * 0.18; // 18% tax
  const discount = offer ? (subtotal * offer.discountPercent) / 100 : 0;
  const tipAmount = selectedTip || parseFloat(customTip) || 0;
  const total = subtotal + tax - discount + tipAmount;

  // Animate price changes
  useEffect(() => {
    Animated.sequence([
      Animated.timing(priceAnim, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(priceAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [subtotal, tax, discount, tipAmount]);

  // Animate offer application
  useEffect(() => {
    Animated.spring(offerAnim, {
      toValue: offer ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [offer]);

  const handleTipSelect = amount => {
    setSelectedTip(amount);
    setCustomTip('');
    onChangeTip?.(amount);
  };

  const handleCustomTipChange = value => {
    setCustomTip(value);
    setSelectedTip(0);
    const tipValue = parseFloat(value) || 0;
    onChangeTip?.(tipValue);
  };

  const handleApplyOffer = () => {
    if (offerCode.trim()) {
      onApplyOffer?.(offerCode);
      setShowOfferInput(false);
      setOfferCode('');
    }
  };

  const handleRemoveOffer = () => {
    onRemoveOffer?.();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Services List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          {services.map((service, index) => (
            <View key={index} style={styles.serviceItem}>
              <View style={styles.serviceIconContainer}>
                <MaterialIcons
                  name="home-repair-service"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                {service.description && (
                  <Text style={styles.serviceDescription}>
                    {service.description}
                  </Text>
                )}
              </View>
              <Text style={styles.servicePrice}>₹{service.price}</Text>
            </View>
          ))}
        </View>

        {/* Address Section */}
        {address && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Location</Text>
            <View style={styles.addressContainer}>
              <MaterialIcons
                name={
                  address.type === 'home'
                    ? 'home'
                    : address.type === 'work'
                    ? 'work'
                    : 'place'
                }
                size={24}
                color={colors.primary}
              />
              <View style={styles.addressContent}>
                <Text style={styles.addressLabel}>{address.label}</Text>
                <Text style={styles.addressText}>{address.address}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Offer Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Offers & Coupons</Text>
            {offer && (
              <TouchableOpacity onPress={handleRemoveOffer}>
                <Text style={styles.removeOfferText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>

          {offer ? (
            <Animated.View
              style={[
                styles.appliedOfferCard,
                {
                  opacity: offerAnim,
                  transform: [
                    {
                      translateY: offerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-20, 0],
                      }),
                    },
                  ],
                },
              ]}>
              <MaterialIcons
                name="local-offer"
                size={24}
                color={colors.success}
              />
              <View style={styles.offerContent}>
                <Text style={styles.offerCode}>{offer.code}</Text>
                <Text style={styles.offerDescription}>
                  {offer.description || `${offer.discountPercent}% off`}
                </Text>
              </View>
              <Text style={styles.offerSavings}>-₹{discount.toFixed(0)}</Text>
            </Animated.View>
          ) : (
            <>
              {showOfferInput ? (
                <View style={styles.offerInputContainer}>
                  <TextInput
                    style={styles.offerInput}
                    placeholder="Enter coupon code"
                    placeholderTextColor={colors.text.tertiary}
                    value={offerCode}
                    onChangeText={setOfferCode}
                    autoCapitalize="characters"
                  />
                  <TouchableOpacity
                    style={styles.applyButton}
                    onPress={handleApplyOffer}>
                    <Text style={styles.applyButtonText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addOfferButton}
                  onPress={() => setShowOfferInput(true)}>
                  <MaterialIcons
                    name="local-offer"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.addOfferText}>Apply Coupon Code</Text>
                  <MaterialIcons
                    name="chevron-right"
                    size={20}
                    color={colors.text.tertiary}
                  />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Tip Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Tip (Optional)</Text>
          <Text style={styles.sectionSubtitle}>
            Show your appreciation for great service
          </Text>

          <View style={styles.tipOptions}>
            {[20, 50, 100].map(amount => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.tipOption,
                  selectedTip === amount && styles.tipOptionActive,
                ]}
                onPress={() => handleTipSelect(amount)}>
                <Text
                  style={[
                    styles.tipOptionText,
                    selectedTip === amount && styles.tipOptionTextActive,
                  ]}>
                  ₹{amount}
                </Text>
              </TouchableOpacity>
            ))}
            <View
              style={[
                styles.tipOption,
                customTip && styles.tipOptionActive,
                styles.customTipOption,
              ]}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.customTipInput}
                placeholder="Other"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="numeric"
                value={customTip}
                onChangeText={handleCustomTipChange}
              />
            </View>
          </View>
        </View>

        {/* Pricing Breakdown */}
        <View style={styles.pricingSection}>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Subtotal</Text>
            <Text style={styles.pricingValue}>₹{subtotal.toFixed(0)}</Text>
          </View>

          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Tax (18%)</Text>
            <Text style={styles.pricingValue}>₹{tax.toFixed(0)}</Text>
          </View>

          {discount > 0 && (
            <Animated.View
              style={[
                styles.pricingRow,
                {
                  opacity: offerAnim,
                },
              ]}>
              <Text style={[styles.pricingLabel, styles.discountLabel]}>
                Discount
              </Text>
              <Text style={[styles.pricingValue, styles.discountValue]}>
                -₹{discount.toFixed(0)}
              </Text>
            </Animated.View>
          )}

          {tipAmount > 0 && (
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Tip</Text>
              <Text style={styles.pricingValue}>₹{tipAmount.toFixed(0)}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <Animated.View
            style={[
              styles.totalRow,
              {
                transform: [{scale: priceAnim}],
              },
            ]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{total.toFixed(0)}</Text>
          </Animated.View>
        </View>
      </ScrollView>

      {/* Confirm Button */}
      <View style={styles.footer}>
        <GradientBackground
          gradientName="primaryGradient"
          style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}>
          <TouchableOpacity
            style={styles.confirmButtonTouchable}
            onPress={onConfirm}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.confirmButtonText}>Confirm Booking</Text>
                <View style={styles.confirmButtonPrice}>
                  <Text style={styles.confirmButtonPriceText}>
                    ₹{total.toFixed(0)}
                  </Text>
                </View>
              </>
            )}
          </TouchableOpacity>
        </GradientBackground>
      </View>
    </View>
  );
};

// Import ActivityIndicator
import {ActivityIndicator} from 'react-native';

const dynamicStyles = (width, isDarkMode, colors) => {
  const isTablet = width >= 768;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 20,
    },

    // Section
    section: {
      marginBottom: 24,
      paddingHorizontal: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: '700',
      color: colors.text.primary,
      marginBottom: 12,
    },
    sectionSubtitle: {
      fontSize: 13,
      color: colors.text.secondary,
      marginBottom: 12,
      marginTop: -8,
    },

    // Service Item
    serviceItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
    },
    serviceIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.withOpacity(colors.primary, 0.1),
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    serviceInfo: {
      flex: 1,
    },
    serviceName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 2,
    },
    serviceDescription: {
      fontSize: 12,
      color: colors.text.secondary,
    },
    servicePrice: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text.primary,
    },

    // Address
    addressContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
    },
    addressContent: {
      flex: 1,
      marginLeft: 12,
    },
    addressLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 4,
    },
    addressText: {
      fontSize: 14,
      color: colors.text.secondary,
      lineHeight: 20,
    },

    // Offers
    appliedOfferCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.withOpacity(colors.success, 0.1),
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.success,
    },
    offerContent: {
      flex: 1,
      marginLeft: 12,
    },
    offerCode: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text.primary,
      marginBottom: 2,
    },
    offerDescription: {
      fontSize: 13,
      color: colors.text.secondary,
    },
    offerSavings: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.success,
    },
    removeOfferText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.error,
    },
    addOfferButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.divider,
    },
    addOfferText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
      marginLeft: 12,
    },
    offerInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    offerInput: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      fontSize: 15,
      color: colors.text.primary,
      borderWidth: 1,
      borderColor: colors.divider,
      marginRight: 8,
    },
    applyButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 24,
    },
    applyButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#fff',
    },

    // Tip Selector
    tipOptions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    tipOption: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 12,
      marginRight: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    tipOptionActive: {
      borderColor: colors.primary,
      backgroundColor: colors.withOpacity(colors.primary, 0.05),
    },
    tipOptionText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.primary,
    },
    tipOptionTextActive: {
      color: colors.primary,
    },
    customTipOption: {
      flexDirection: 'row',
      marginRight: 0,
    },
    currencySymbol: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.primary,
      marginRight: 4,
    },
    customTipInput: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.primary,
      padding: 0,
      textAlign: 'center',
    },

    // Pricing Breakdown
    pricingSection: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 16,
    },
    pricingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    pricingLabel: {
      fontSize: 15,
      color: colors.text.secondary,
    },
    pricingValue: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text.primary,
    },
    discountLabel: {
      color: colors.success,
    },
    discountValue: {
      color: colors.success,
    },
    divider: {
      height: 1,
      backgroundColor: colors.divider,
      marginVertical: 12,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    totalLabel: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text.primary,
    },
    totalValue: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.primary,
    },

    // Footer
    footer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
      backgroundColor: colors.background,
    },
    confirmButton: {
      borderRadius: 16,
      overflow: 'hidden',
    },
    confirmButtonDisabled: {
      opacity: 0.6,
    },
    confirmButtonTouchable: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 24,
    },
    confirmButtonText: {
      fontSize: 17,
      fontWeight: '700',
      color: '#fff',
      flex: 1,
      textAlign: 'center',
    },
    confirmButtonPrice: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    confirmButtonPriceText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#fff',
    },
  });
};

export default BookingSummary;
