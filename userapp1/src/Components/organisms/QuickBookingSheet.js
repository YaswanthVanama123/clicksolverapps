/**
 * QuickBookingSheet.js - Organism Component
 * Combined booking flow in bottom sheet with progressive disclosure
 * Steps: Service selection → Address → Confirmation
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
  ActivityIndicator,
} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import {getColors} from '../../theme/colors';
import {GradientBackground} from '../../theme/gradients';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LottieView from 'lottie-react-native';

/**
 * QuickBookingSheet Component
 * @param {Boolean} visible - Sheet visibility
 * @param {Function} onClose - Close callback
 * @param {Object} preSelectedService - Pre-selected service object
 * @param {Array} services - Available services for selection
 * @param {Array} savedAddresses - User's saved addresses
 * @param {Function} onConfirm - Booking confirmation callback
 */
const QuickBookingSheet = ({
  visible = false,
  onClose,
  preSelectedService = null,
  services = [],
  savedAddresses = [],
  onConfirm,
}) => {
  const {width, height} = useWindowDimensions();
  const {isDarkMode} = useTheme();
  const colors = getColors(isDarkMode);
  const styles = dynamicStyles(width, height, isDarkMode, colors);

  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState(preSelectedService);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isSearchingWorker, setIsSearchingWorker] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Animation refs
  const slideAnim = useRef(new Animated.Value(height)).current;
  const stepAnim = useRef(new Animated.Value(0)).current;

  // Reset state when sheet opens/closes
  useEffect(() => {
    if (visible) {
      setCurrentStep(preSelectedService ? 2 : 1);
      setSelectedService(preSelectedService);
      setSelectedAddress(null);
      setIsSearchingWorker(false);
      setShowSuccess(false);
      animateSlideIn();
    } else {
      animateSlideOut();
    }
  }, [visible]);

  // Animate step transitions
  useEffect(() => {
    Animated.spring(stepAnim, {
      toValue: currentStep - 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [currentStep]);

  const animateSlideIn = () => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const animateSlideOut = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleClose = () => {
    animateSlideOut();
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  const handleServiceSelect = service => {
    setSelectedService(service);
    setCurrentStep(2);
  };

  const handleAddressSelect = address => {
    setSelectedAddress(address);
  };

  const handleConfirm = async () => {
    setCurrentStep(3);
    setIsSearchingWorker(true);

    // Simulate worker matching (replace with actual API call)
    setTimeout(() => {
      setIsSearchingWorker(false);
      setShowSuccess(true);

      // Call confirmation callback
      onConfirm?.({
        service: selectedService,
        address: selectedAddress,
      });

      // Auto-close after success
      setTimeout(() => {
        handleClose();
      }, 2000);
    }, 3000);
  };

  const canProceedToAddress = selectedService !== null;
  const canConfirm = selectedService && selectedAddress;

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleClose}
      />

      <Animated.View
        style={[
          styles.sheetContainer,
          {
            transform: [{translateY: slideAnim}],
          },
        ]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.handleBar} />
          <Text style={styles.headerTitle}>Quick Booking</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <MaterialIcons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          {[1, 2, 3].map(step => (
            <View key={step} style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  currentStep >= step && styles.stepCircleActive,
                ]}>
                <Text
                  style={[
                    styles.stepNumber,
                    currentStep >= step && styles.stepNumberActive,
                  ]}>
                  {step}
                </Text>
              </View>
              {step < 3 && (
                <View
                  style={[
                    styles.stepLine,
                    currentStep > step && styles.stepLineActive,
                  ]}
                />
              )}
            </View>
          ))}
        </View>

        {/* Step Labels */}
        <View style={styles.stepLabels}>
          <Text style={styles.stepLabel}>Service</Text>
          <Text style={styles.stepLabel}>Address</Text>
          <Text style={styles.stepLabel}>Confirm</Text>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}>
          {/* Step 1: Service Selection */}
          {currentStep === 1 && (
            <ServiceSelection
              services={services}
              selectedService={selectedService}
              onSelect={handleServiceSelect}
              colors={colors}
              styles={styles}
            />
          )}

          {/* Step 2: Address Selection */}
          {currentStep === 2 && (
            <AddressSelection
              addresses={savedAddresses}
              selectedAddress={selectedAddress}
              onSelect={handleAddressSelect}
              colors={colors}
              styles={styles}
            />
          )}

          {/* Step 3: Confirmation & Worker Matching */}
          {currentStep === 3 && (
            <BookingConfirmation
              service={selectedService}
              address={selectedAddress}
              isSearching={isSearchingWorker}
              showSuccess={showSuccess}
              colors={colors}
              styles={styles}
            />
          )}
        </ScrollView>

        {/* Action Buttons */}
        {currentStep < 3 && (
          <View style={styles.actionContainer}>
            {currentStep === 2 && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentStep(1)}>
                <MaterialIcons
                  name="arrow-back"
                  size={20}
                  color={colors.text.primary}
                />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}

            <View style={{flex: 1}} />

            <GradientBackground
              gradientName="primaryGradient"
              style={[
                styles.nextButton,
                currentStep === 1 && !canProceedToAddress && styles.buttonDisabled,
                currentStep === 2 && !canConfirm && styles.buttonDisabled,
              ]}>
              <TouchableOpacity
                style={styles.nextButtonTouchable}
                onPress={() => {
                  if (currentStep === 1 && canProceedToAddress) {
                    setCurrentStep(2);
                  } else if (currentStep === 2 && canConfirm) {
                    handleConfirm();
                  }
                }}
                disabled={
                  (currentStep === 1 && !canProceedToAddress) ||
                  (currentStep === 2 && !canConfirm)
                }>
                <Text style={styles.nextButtonText}>
                  {currentStep === 2 ? 'Confirm Booking' : 'Next'}
                </Text>
                <MaterialIcons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </GradientBackground>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

/**
 * ServiceSelection - Step 1
 */
const ServiceSelection = ({services, selectedService, onSelect, colors, styles}) => (
  <View>
    <Text style={styles.sectionTitle}>Select a Service</Text>
    {services.map(service => (
      <TouchableOpacity
        key={service.id}
        style={[
          styles.selectionCard,
          selectedService?.id === service.id && styles.selectionCardActive,
        ]}
        onPress={() => onSelect(service)}>
        <View style={styles.selectionCardContent}>
          <MaterialIcons
            name="home-repair-service"
            size={32}
            color={
              selectedService?.id === service.id
                ? colors.primary
                : colors.text.secondary
            }
          />
          <View style={styles.selectionCardText}>
            <Text style={styles.selectionCardTitle}>{service.name}</Text>
            <Text style={styles.selectionCardSubtitle}>
              From ₹{service.price}
            </Text>
          </View>
          {selectedService?.id === service.id && (
            <MaterialIcons name="check-circle" size={24} color={colors.success} />
          )}
        </View>
      </TouchableOpacity>
    ))}
  </View>
);

/**
 * AddressSelection - Step 2
 */
const AddressSelection = ({addresses, selectedAddress, onSelect, colors, styles}) => (
  <View>
    <Text style={styles.sectionTitle}>Select Address</Text>

    {/* Current Location Option */}
    <TouchableOpacity
      style={[
        styles.selectionCard,
        selectedAddress?.type === 'current' && styles.selectionCardActive,
      ]}
      onPress={() => onSelect({type: 'current', label: 'Current Location'})}>
      <View style={styles.selectionCardContent}>
        <MaterialIcons
          name="my-location"
          size={28}
          color={
            selectedAddress?.type === 'current'
              ? colors.primary
              : colors.text.secondary
          }
        />
        <View style={styles.selectionCardText}>
          <Text style={styles.selectionCardTitle}>Use Current Location</Text>
          <Text style={styles.selectionCardSubtitle}>Auto-detect your location</Text>
        </View>
        {selectedAddress?.type === 'current' && (
          <MaterialIcons name="check-circle" size={24} color={colors.success} />
        )}
      </View>
    </TouchableOpacity>

    {/* Saved Addresses */}
    {addresses.map((address, index) => (
      <TouchableOpacity
        key={index}
        style={[
          styles.selectionCard,
          selectedAddress?.id === address.id && styles.selectionCardActive,
        ]}
        onPress={() => onSelect(address)}>
        <View style={styles.selectionCardContent}>
          <MaterialIcons
            name={address.type === 'home' ? 'home' : 'work'}
            size={28}
            color={
              selectedAddress?.id === address.id
                ? colors.primary
                : colors.text.secondary
            }
          />
          <View style={styles.selectionCardText}>
            <Text style={styles.selectionCardTitle}>{address.label}</Text>
            <Text style={styles.selectionCardSubtitle} numberOfLines={2}>
              {address.address}
            </Text>
          </View>
          {selectedAddress?.id === address.id && (
            <MaterialIcons name="check-circle" size={24} color={colors.success} />
          )}
        </View>
      </TouchableOpacity>
    ))}

    {/* Add New Address */}
    <TouchableOpacity style={styles.addNewButton}>
      <MaterialIcons name="add-circle-outline" size={24} color={colors.primary} />
      <Text style={styles.addNewButtonText}>Add New Address</Text>
    </TouchableOpacity>
  </View>
);

/**
 * BookingConfirmation - Step 3
 */
const BookingConfirmation = ({
  service,
  address,
  isSearching,
  showSuccess,
  colors,
  styles,
}) => {
  if (showSuccess) {
    return (
      <View style={styles.successContainer}>
        <LottieView
          source={require('../../assets/animations/success.json')}
          autoPlay
          loop={false}
          style={styles.successAnimation}
        />
        <Text style={styles.successTitle}>Booking Confirmed!</Text>
        <Text style={styles.successSubtitle}>
          We're matching you with the best worker nearby
        </Text>
      </View>
    );
  }

  if (isSearching) {
    return (
      <View style={styles.searchingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.searchingTitle}>Finding Available Workers</Text>
        <Text style={styles.searchingSubtitle}>
          This usually takes 15-30 seconds...
        </Text>
        <View style={styles.workerMatchingInfo}>
          <MaterialIcons name="verified-user" size={20} color={colors.success} />
          <Text style={styles.workerMatchingText}>
            We're searching for verified professionals near you
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.sectionTitle}>Review Your Booking</Text>

      {/* Service Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Service</Text>
        <Text style={styles.summaryValue}>{service?.name}</Text>
      </View>

      {/* Address Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Address</Text>
        <Text style={styles.summaryValue}>
          {address?.label || address?.type === 'current'
            ? 'Current Location'
            : 'No address selected'}
        </Text>
        {address?.address && (
          <Text style={styles.summarySubvalue}>{address.address}</Text>
        )}
      </View>

      {/* Price Estimate */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Estimated Price</Text>
        <Text style={styles.priceText}>₹{service?.price}</Text>
        <Text style={styles.priceNote}>Final price may vary based on service</Text>
      </View>
    </View>
  );
};

const dynamicStyles = (width, height, isDarkMode, colors) => {
  const isTablet = width >= 768;

  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'flex-end',
      zIndex: 1000,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    sheetContainer: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: height * 0.9,
      paddingBottom: 20,
    },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    handleBar: {
      position: 'absolute',
      top: 8,
      width: 40,
      height: 4,
      backgroundColor: colors.divider,
      borderRadius: 2,
    },
    headerTitle: {
      fontSize: isTablet ? 20 : 18,
      fontWeight: '700',
      color: colors.text.primary,
    },
    closeButton: {
      position: 'absolute',
      right: 20,
      padding: 4,
    },

    // Step Indicator
    stepIndicator: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      paddingTop: 20,
      paddingBottom: 8,
    },
    stepItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    stepCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.divider,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stepCircleActive: {
      backgroundColor: colors.primary,
    },
    stepNumber: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text.tertiary,
    },
    stepNumberActive: {
      color: '#fff',
    },
    stepLine: {
      width: 60,
      height: 2,
      backgroundColor: colors.divider,
      marginHorizontal: 8,
    },
    stepLineActive: {
      backgroundColor: colors.primary,
    },
    stepLabels: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    stepLabel: {
      fontSize: 12,
      color: colors.text.secondary,
      fontWeight: '600',
    },

    // Content
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: 20,
    },
    sectionTitle: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: '700',
      color: colors.text.primary,
      marginBottom: 16,
    },

    // Selection Cards
    selectionCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selectionCardActive: {
      borderColor: colors.primary,
      backgroundColor: colors.withOpacity(colors.primary, 0.05),
    },
    selectionCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    selectionCardText: {
      flex: 1,
      marginLeft: 16,
    },
    selectionCardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 4,
    },
    selectionCardSubtitle: {
      fontSize: 14,
      color: colors.text.secondary,
    },

    // Add New Button
    addNewButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.primary,
      borderStyle: 'dashed',
      marginTop: 8,
    },
    addNewButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
      marginLeft: 8,
    },

    // Summary Cards
    summaryCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    summaryLabel: {
      fontSize: 13,
      color: colors.text.secondary,
      marginBottom: 6,
      fontWeight: '600',
    },
    summaryValue: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.primary,
    },
    summarySubvalue: {
      fontSize: 14,
      color: colors.text.secondary,
      marginTop: 4,
    },
    priceText: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.primary,
    },
    priceNote: {
      fontSize: 12,
      color: colors.text.tertiary,
      marginTop: 4,
      fontStyle: 'italic',
    },

    // Searching State
    searchingContainer: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    searchingTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text.primary,
      marginTop: 20,
      marginBottom: 8,
    },
    searchingSubtitle: {
      fontSize: 14,
      color: colors.text.secondary,
      textAlign: 'center',
    },
    workerMatchingInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      marginTop: 24,
    },
    workerMatchingText: {
      fontSize: 14,
      color: colors.text.secondary,
      marginLeft: 12,
      flex: 1,
    },

    // Success State
    successContainer: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    successAnimation: {
      width: 150,
      height: 150,
    },
    successTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.success,
      marginTop: 16,
      marginBottom: 8,
    },
    successSubtitle: {
      fontSize: 14,
      color: colors.text.secondary,
      textAlign: 'center',
      paddingHorizontal: 40,
    },

    // Action Buttons
    actionContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    backButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.primary,
      marginLeft: 8,
    },
    nextButton: {
      borderRadius: 12,
      overflow: 'hidden',
      flex: 1,
    },
    nextButtonTouchable: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      paddingHorizontal: 24,
    },
    nextButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#fff',
      marginRight: 8,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
  });
};

export default QuickBookingSheet;
