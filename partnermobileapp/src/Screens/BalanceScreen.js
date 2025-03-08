import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import LottieView from 'lottie-react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { useNavigation, CommonActions } from '@react-navigation/native';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import RazorpayCheckout from 'react-native-razorpay';

/** 
 * Helper function to compute relative time (e.g. "Just now", "3 hours ago", "Yesterday", etc.).
 * You can adjust the thresholds and output format as desired.
 */
function getRelativeTime(dateString) {
  const now = new Date();
  const then = new Date(dateString);
  const diffMs = now - then; // milliseconds
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return 'Just now';
  if (diffHours < 1) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  return then.toDateString(); // fallback to full date if older than 1 day
}

const BalanceScreen = () => { 
  const { width } = useWindowDimensions();
  const styles = dynamicStyles(width);
  const navigation = useNavigation();

  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]); // Service Charge data
  const [dummyTransactions, setDummyTransactions] = useState([]); // Payment History data
  const [activeCard, setActiveCard] = useState('ServiceHistory');
  const [loading, setLoading] = useState(true);

  // Fetch the worker's balance and transaction history from the backend
  const fetchServiceBalanceHistory = useCallback(async () => {
    setLoading(true);
    try {
      const pcs_token = await EncryptedStorage.getItem('pcs_token');
      if (!pcs_token) throw new Error('User not authenticated');
  
      const response = await axios.post(
        'http://192.168.55.104:5000/api/balance/ammount',
        {},
        { headers: { Authorization: `Bearer ${pcs_token}` } }
      );
  
      // The first object in response.data is the main balance info
      const data = response.data[0];
      setDummyTransactions(data.balance_payment_history || []);
      setBalance(data.balance_amount);
  
      // Build Service Charge array from entire 'response.data'
      const serviceBalanceHistory = response.data.map((transaction, index) => {
        const paymentType = transaction.payment_type.toLowerCase();
        const paymentValue = Number(transaction.payment);
  
        // Example deduction logic
        const deduction =
          paymentType === 'cash'
            ? paymentValue * 0.12
            : paymentValue * 0.88;
  
        const amount = `${paymentType === 'cash' ? '-' : '+'} ₹${deduction.toFixed(2)}`;
        const dateObject = new Date(transaction.end_time);
        const formattedTime = dateObject.toLocaleDateString([], {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
  
        return {
          id: index.toString(),
          amount,
          time: formattedTime,         // Formatted display time
          timestamp: dateObject.getTime(), // Raw timestamp for sorting
          service: 'Electrician', // Example service type
          payment: paymentType === 'cash' ? 'Paid by Cash' : 'Paid to Click Solver',
          name: transaction.name,
        };
      });
  
      // Sort service charges by timestamp in descending order
      serviceBalanceHistory.sort((a, b) => b.timestamp - a.timestamp);
      setTransactions(serviceBalanceHistory);
    } catch (error) {
      console.error('Error fetching balance history:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  

  useEffect(() => {
    fetchServiceBalanceHistory();
  }, [fetchServiceBalanceHistory]);

  // Check if the balance is negative
  const isBalanceNegative = balance !== null && Number(balance) < 0;

  // Handle Pay Now: create order, open Razorpay, and verify payment
  const handlePayNow = async () => {
    try {
      const pcs_token = await EncryptedStorage.getItem('pcs_token');
      if (!pcs_token) {
        // navigation.navigate('PaymentConfirmationScreen', {
        //   status: 'failure',
        //   total: 0,
        //   message: 'User not authenticated.',
        //   transactionNumber: 'N/A',
        //   paymentMethod: 'Unknown',
        // });
        return;
      }

      const amountToPay = Math.abs(Number(balance));

      // 1. Create an order on the backend
      const createResponse = await axios.post(
        'http://192.168.55.104:5000/api/create-order',
        { amount: amountToPay, currency: 'INR' },
        { headers: { Authorization: `Bearer ${pcs_token}` } }
      );
      const data = createResponse.data;
      if (!data.success) throw new Error('Order creation failed');

      // 2. Open Razorpay Checkout
      const options = {
        description: 'Payment for clearing negative balance',
        currency: data.currency,
        key: 'rzp_test_vca9xUL1SxWrEM', // Replace with your actual key
        amount: data.amount, // in paise
        order_id: data.order_id,
        name: 'Click Solver',
        prefill: {
          email: 'customer@example.com',
          contact: '9876543210',
          name: 'Customer Name',
        },
        theme: { color: '#FF5722' },
      };

      RazorpayCheckout.open(options)
        .then(async (paymentData) => {
          // 3. Payment completed – verify on the backend
          const verifyResponse = await axios.post(
            'http://192.168.55.104:5000/api/verify-payment',
            paymentData,
            { headers: { Authorization: `Bearer ${pcs_token}` } }
          );
          const verifyData = verifyResponse.data;

          if (verifyData.success) {
            // navigation.navigate('PaymentConfirmationScreen', {
            //   status: 'success',
            //   total: amountToPay,
            //   message: verifyData.message,
            //   transactionNumber: paymentData.razorpay_payment_id,
            //   paymentMethod: 'Online',
            // });
            // Refresh local data
            fetchServiceBalanceHistory();
          } else {
            // navigation.navigate('PaymentConfirmationScreen', {
            //   status: 'failure',
            //   total: amountToPay,
            //   message: verifyData.message,
            //   transactionNumber: paymentData.razorpay_payment_id || 'N/A',
            //   paymentMethod: 'Online',
            // });
          }
        })
        .catch((error) => {
          // navigation.navigate('PaymentConfirmationScreen', {
          //   status: 'failure',
          //   total: amountToPay,
          //   message: error.description || error.message,
          //   transactionNumber: 'N/A',
          //   paymentMethod: 'Online',
          // });
        });
    } catch (error) {
      // navigation.navigate('PaymentConfirmationScreen', {
      //   status: 'failure',
      //   total: 0,
      //   message: error.message,
      //   transactionNumber: 'N/A',
      //   paymentMethod: 'Unknown',
      // });
    }
  };

  // Fallback "no data" UI
  const renderNoData = (message) => (
    <View style={styles.noDataContainer}>
      <Text style={styles.noDataText}>{message}</Text>
    </View>
  );

  // 1) Service History Card
  const renderServiceHistoryItem = ({ item }) => (
    <View style={styles.transactionContainer}>
      <View style={styles.paymentContainer}>
        <View style={styles.iconContainer}>
          {item.payment.toLowerCase().includes('cash') ? (
            <MaterialCommunityIcons name="wallet" size={20} color="white" />
          ) : (
            <MaterialCommunityIcons name="bank" size={20} color="white" />
          )}
        </View>
        <View style={styles.paymentDetails}>
          <Text style={styles.paymentText}>{item.payment}</Text>
          <Text style={styles.nameText}>{item.name}</Text>
        </View>
        <View style={styles.paymentDetails}>
          <Text
            style={
              item.amount.startsWith('-')
                ? styles.amountNegative
                : styles.amountPositive
            }
          >
            {item.amount}
          </Text>
          <Text style={styles.timeText}>{item.time}</Text>
        </View>
      </View>
    </View>
  );

  // 2) Payment History Card
  // Example item format:
  // {
  //   amount: 679.2,
  //   order_id: "order_Q2fM4LyHKV1qGd",
  //   paid: "paid by Click Solver",
  //   status: "success",
  //   time: "2025-03-04 09:36:37"
  // }
  const renderPaymentHistoryItem = ({ item }) => {
    // Determine if user "Received" or "Paid"
    const lowerPaid = item.paid.toLowerCase();
    const isReceived = lowerPaid.includes('paid by click solver') || lowerPaid.includes('received');
    const mainText = isReceived
      ? `Received from Click Solver`
      : `Paid to Click Solver`;

    // Icon logic
    const iconName = isReceived ? 'arrow-bottom-left' : 'arrow-top-right';
    const iconBg = isReceived ? '#4CAF50' : '#FF5722';
    const timeString = getRelativeTime(item.time);

    // We'll place the order_id on the bottom line (right side),
    // removing "Credited to you" or "Debited from you" lines.
    // We'll keep the alignment for a professional look.
    return (
      <View style={styles.historyItemContainer}>
        {/* Left Icon/Avatar */}
        <View style={[styles.historyIconWrapper, { backgroundColor: iconBg }]}>
          <MaterialCommunityIcons name={iconName} size={20} color="#fff" />
        </View>

        {/* Middle Section */}
        <View style={styles.historyMiddle}>
          <Text style={styles.historyMainText}>{mainText}</Text>
          <Text style={styles.historyTimeText}>{timeString}</Text>
        </View>

        {/* Right Section */}
        <View style={styles.historyRight}>
          <Text style={styles.historyAmount}>₹{item.amount.toFixed(2)}</Text>
          <Text style={styles.historyOrderId} numberOfLines={1}>
            {item.order_id}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
      <View style={styles.headContainer}>
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
            style={styles.leftIcon}
          >
            <FontAwesome6 name="arrow-left-long" size={24} color="#9e9e9e" />
          </TouchableOpacity>
        </View>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceTitle}>Balance</Text>
          <Text
            style={[
              styles.balanceAmount,
              balance !== null && Number(balance) < 0 && styles.negativeBalance,
            ]}
          >
            ₹{balance ?? 0}
          </Text>
        </View>
        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={[styles.card, activeCard === 'ServiceHistory' && styles.activeCard]}
            onPress={() => setActiveCard('ServiceHistory')}
          >
            <Text
              style={[
                styles.cardText,
                activeCard === 'ServiceHistory' && styles.activeCardText,
              ]}
            >
              Service Charge
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.card, activeCard === 'TransactionHistory' && styles.activeCard]}
            onPress={() => setActiveCard('TransactionHistory')}
          >
            <Text
              style={[
                styles.cardText,
                activeCard === 'TransactionHistory' && styles.activeCardText,
              ]}
            >
              Payment History
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Section */}
      <View style={styles.scrollContainer}>
        {loading ? (
          <LottieView
            source={require('../assets/success.json')}
            autoPlay
            loop
            style={styles.loadingAnimation}
          />
        ) : activeCard === 'ServiceHistory' ? (
          transactions.length === 0 ? (
            renderNoData('No service history data available.')
          ) : (
            <FlatList
              data={transactions}
              renderItem={renderServiceHistoryItem}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={styles.flatlistContainer}
            />
          )
        ) : dummyTransactions.length === 0 ? (
          renderNoData('No payment history data available.')
        ) : (
          <FlatList
            data={dummyTransactions}
            renderItem={renderPaymentHistoryItem}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.flatlistContainer}
          />
        )}
      </View>

      {/* Show Pay Now Button if Balance is Negative */}
      {isBalanceNegative && (
        <TouchableOpacity style={styles.payNowButton} onPress={handlePayNow}>
          <Text style={styles.payNowButtonText}>Pay Now</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

function dynamicStyles(width) {
  const isTablet = width >= 600;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f3f3f3',
    },
    headContainer: {
      backgroundColor: '#ffffff',
      paddingBottom: isTablet ? 20 : 10,
    },
    header: {
      alignItems: 'center',
      paddingVertical: isTablet ? 12 : 10,
      marginBottom: isTablet ? 15 : 10,
    },
    leftIcon: {
      position: 'absolute',
      left: isTablet ? 20 : 10,
      top: isTablet ? 10 : 5,
    },
    balanceContainer: {
      alignItems: 'center',
      marginBottom: isTablet ? 20 : 15,
    },
    balanceTitle: {
      fontSize: isTablet ? 20 : 17,
      color: '#212121',
    },
    balanceAmount: {
      fontSize: isTablet ? 26 : 22,
      fontWeight: 'bold',
      color: '#212121',
    },
    negativeBalance: {
      color: 'red',
    },
    cardContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginHorizontal: isTablet ? 30 : 20,
      marginBottom: isTablet ? 15 : 10,
    },
    card: {
      flex: 1,
      paddingVertical: isTablet ? 12 : 10,
      marginHorizontal: isTablet ? 10 : 5,
      backgroundColor: '#ffffff',
      alignItems: 'center',
      borderRadius: 10,
      elevation: 5,
    },
    activeCard: {
      borderWidth: 1,
      borderColor: '#FF5722',
    },
    cardText: {
      fontSize: isTablet ? 15 : 13,
      color: '#4a4a4a',
    },
    activeCardText: {
      color: '#212121',
      fontWeight: 'bold',
    },
    scrollContainer: {
      flex: 1,
      marginTop: isTablet ? 15 : 10,
    },
    loadingAnimation: {
      width: '100%',
      height: isTablet ? 250 : 200,
    },
    flatlistContainer: {
      paddingBottom: 20,
    },
    noDataContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    noDataText: {
      fontSize: isTablet ? 18 : 16,
      color: '#999',
      fontWeight: 'bold',
    },

    // Service History transaction styling
    transactionContainer: {
      backgroundColor: '#FFFFFF',
      borderRadius: 15,
      padding: isTablet ? 24 : 20,
      marginHorizontal: isTablet ? 30 : 20,
      marginBottom: 10,
      elevation: 1,
    },
    paymentContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    iconContainer: {
      width: isTablet ? 50 : 45,
      height: isTablet ? 50 : 45,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FF5722',
      borderRadius: isTablet ? 25 : 22.5,
    },
    paymentDetails: {
      flex: 1,
      marginLeft: isTablet ? 15 : 12,
    },
    paymentText: {
      fontSize: isTablet ? 16 : 14,
      fontWeight: 'bold',
      color: '#4a4a4a',
    },
    nameText: {
      fontSize: isTablet ? 17 : 16,
      color: '#212121',
    },
    amountPositive: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: 'bold',
      color: '#212121',
      textAlign: 'right',
    },
    amountNegative: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: 'bold',
      color: 'red',
      textAlign: 'right',
    },
    timeText: {
      fontSize: isTablet ? 15 : 14,
      color: '#4a4a4a',
      marginTop: 8,
      textAlign: 'right',
    },

    // Pay Now button
    payNowButton: {
      position: 'absolute',
      bottom: isTablet ? 30 : 20,
      left: isTablet ? 30 : 20,
      right: isTablet ? 30 : 20,
      backgroundColor: '#FF5722',
      borderRadius: 10,
      paddingVertical: isTablet ? 12 : 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: '20%',
    },
    payNowButtonText: {
      color: '#ffffff',
      fontSize: isTablet ? 18 : 16,
      fontWeight: 'bold',
    },

    // Payment History item styling (like reference image)
    historyItemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      marginHorizontal: isTablet ? 30 : 16,
      marginVertical: 8,
      borderRadius: 10,
      padding: isTablet ? 20 : 16,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    historyIconWrapper: {
      width: isTablet ? 50 : 45,
      height: isTablet ? 50 : 45,
      borderRadius: isTablet ? 25 : 22.5,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isTablet ? 18 : 14,
    },
    historyMiddle: {
      flex: 2,
      justifyContent: 'center',
    },
    historyMainText: {
      fontSize: isTablet ? 16 : 14,
      fontWeight: '600',
      color: '#333',
      marginBottom: 4,
    },
    historyTimeText: {
      fontSize: isTablet ? 14 : 12,
      color: '#999',
    },
    historyRight: {
      alignItems: 'flex-end',
      justifyContent: 'center',
      marginLeft: isTablet ? 12 : 8,
    },
    historyAmount: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: 'bold',
      color: '#333',
    },
    historyOrderId: {
      marginTop: 4,
      fontSize: isTablet ? 13 : 12,
      color: '#999',
      maxWidth: 120, // so it doesn't overflow
    },
  });
}

export default BalanceScreen;
