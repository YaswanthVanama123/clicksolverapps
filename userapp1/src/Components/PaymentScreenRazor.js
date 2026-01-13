/**
 * PaymentScreenRazor Component
 * Razorpay payment integration screen for processing payments
 * Features: Amount input validation, order creation, payment verification, error handling
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  useWindowDimensions,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../theme/colors';
import { formatCurrency } from '../utils/formatters';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import ErrorState from './molecules/ErrorState';

/**
 * PaymentScreenRazor - Razorpay payment interface
 * @returns {JSX.Element}
 */
const PaymentScreenRazor = () => {
  const { isDarkMode } = useTheme();
  const { width } = useWindowDimensions();
  const colors = getColors(isDarkMode);
  const navigation = useNavigation();
  const styles = dynamicStyles(width, isDarkMode, colors);

  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Validates the payment amount
   * @returns {boolean} True if amount is valid
   */
  const validateAmount = () => {
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount)) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return false;
    }
    if (numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Amount must be greater than zero.');
      return false;
    }
    if (numAmount > 100000) {
      Alert.alert('Invalid Amount', 'Amount cannot exceed ₹1,00,000.');
      return false;
    }
    return true;
  };

  /**
   * Initiates payment process with Razorpay
   * Creates order, opens checkout, and verifies payment
   */
  const startPayment = async () => {
    if (!validateAmount()) return;

    setLoading(true);
    setError(null);

    try {
      // Step 1: Create Order
      const response = await fetch('https://backend.clicksolver.com/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          currency: 'INR',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Order creation failed!');
      }

      // Step 2: Open Razorpay Checkout
      const options = {
        description: 'Click Solver Payment',
        image: 'https://i.postimg.cc/hjjpy2SW/Button-1.png',
        currency: data.currency,
        key: 'rzp_test_vca9xUL1SxWrEM', // Replace with your Razorpay Key
        amount: data.amount,
        name: 'Click Solver',
        order_id: data.order_id,
        prefill: {
          email: 'customer@example.com',
          contact: '9876543210',
          name: 'Customer Name',
        },
        theme: { color: colors.primary },
      };

      const paymentData = await RazorpayCheckout.open(options);

      // Step 3: Verify Payment
      const verifyResponse = await fetch(
        'https://backend.clicksolver.com/api/verify-payment',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paymentData),
        }
      );

      const verifyData = await verifyResponse.json();

      if (verifyData.success) {
        Alert.alert(
          'Payment Successful',
          verifyData.message || 'Your payment has been processed successfully.',
          [
            {
              text: 'OK',
              onPress: () => {
                setAmount('');
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        throw new Error(verifyData.message || 'Payment verification failed');
      }
    } catch (err) {
      console.error('[PaymentScreenRazor] Payment error:', err);
      const errorMessage = err.description || err.message || 'Payment failed. Please try again.';
      setError(errorMessage);
      Alert.alert('Payment Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles amount input change
   * @param {string} text - Input text
   */
  const handleAmountChange = (text) => {
    // Allow only numbers
    const numericValue = text.replace(/[^0-9]/g, '');
    setAmount(numericValue);
    setError(null);
  };

  // Show error state for critical errors
  if (error && error.includes('network')) {
    return (
      <ErrorState
        error={error}
        onRetry={() => {
          setError(null);
          startPayment();
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Icon name="credit-card-outline" size={60} color={colors.primary} />
          </View>

          <Text style={styles.title}>Enter Amount</Text>
          <Text style={styles.subtitle}>
            Enter the amount you want to pay using Razorpay
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Amount"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="numeric"
              value={amount}
              onChangeText={handleAmountChange}
              editable={!loading}
              maxLength={6}
            />
          </View>

          {amount && Number(amount) > 0 && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>Amount to Pay:</Text>
              <Text style={styles.previewAmount}>
                {formatCurrency(Number(amount))}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.payButton,
              (!amount || loading) && styles.payButtonDisabled,
            ]}
            onPress={startPayment}
            disabled={!amount || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon name="credit-card-check" size={20} color="#fff" />
                <Text style={styles.payButtonText}>Pay Now</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Info message */}
          <View style={styles.infoContainer}>
            <Icon name="information-outline" size={16} color={colors.info} />
            <Text style={styles.infoText}>
              Secure payment powered by Razorpay
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

/**
 * Dynamic styles based on theme and screen size
 * @param {number} width - Screen width
 * @param {boolean} isDarkMode - Theme mode
 * @param {object} colors - Color palette
 * @returns {object} StyleSheet object
 */
const dynamicStyles = (width, isDarkMode, colors) => {
  const isTablet = width >= 600;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: isTablet ? 24 : 20,
      paddingVertical: isTablet ? 14 : 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    headerTitle: {
      fontSize: isTablet ? 20 : 18,
      fontWeight: '600',
      color: colors.text.primary,
      fontFamily: 'RobotoSlab-SemiBold',
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: isTablet ? 40 : 20,
    },
    iconContainer: {
      width: isTablet ? 100 : 80,
      height: isTablet ? 100 : 80,
      borderRadius: isTablet ? 50 : 40,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: isTablet ? 30 : 24,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    title: {
      fontSize: isTablet ? 26 : 24,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginBottom: isTablet ? 12 : 10,
      fontFamily: 'RobotoSlab-Bold',
    },
    subtitle: {
      fontSize: isTablet ? 16 : 14,
      color: colors.text.secondary,
      textAlign: 'center',
      marginBottom: isTablet ? 30 : 24,
      fontFamily: 'RobotoSlab-Regular',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      maxWidth: 400,
      height: isTablet ? 60 : 50,
      borderWidth: 2,
      borderColor: colors.divider,
      borderRadius: 10,
      paddingHorizontal: isTablet ? 18 : 15,
      backgroundColor: colors.surface,
      marginBottom: isTablet ? 24 : 20,
    },
    currencySymbol: {
      fontSize: isTablet ? 22 : 20,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginRight: 8,
      fontFamily: 'RobotoSlab-Bold',
    },
    input: {
      flex: 1,
      fontSize: isTablet ? 20 : 18,
      color: colors.text.primary,
      fontFamily: 'RobotoSlab-Medium',
    },
    previewContainer: {
      width: '100%',
      maxWidth: 400,
      padding: isTablet ? 18 : 15,
      backgroundColor: colors.surface,
      borderRadius: 10,
      marginBottom: isTablet ? 24 : 20,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    previewLabel: {
      fontSize: isTablet ? 15 : 14,
      color: colors.text.secondary,
      marginBottom: 4,
      fontFamily: 'RobotoSlab-Regular',
    },
    previewAmount: {
      fontSize: isTablet ? 24 : 22,
      fontWeight: 'bold',
      color: colors.text.primary,
      fontFamily: 'RobotoSlab-Bold',
    },
    payButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      maxWidth: 400,
      backgroundColor: colors.primary,
      paddingVertical: isTablet ? 18 : 15,
      borderRadius: 10,
      elevation: 3,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      gap: 8,
    },
    payButtonDisabled: {
      backgroundColor: colors.text.tertiary,
      opacity: 0.6,
    },
    payButtonText: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: 'bold',
      color: '#ffffff',
      fontFamily: 'RobotoSlab-Bold',
    },
    infoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: isTablet ? 24 : 20,
      gap: 8,
    },
    infoText: {
      fontSize: isTablet ? 14 : 12,
      color: colors.text.tertiary,
      fontFamily: 'RobotoSlab-Regular',
    },
  });
};

export default PaymentScreenRazor;
