import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  useWindowDimensions, // <-- for responsiveness
} from 'react-native';
import LottieView from 'lottie-react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { useNavigation, CommonActions } from '@react-navigation/native';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import RazorpayCheckout from 'react-native-razorpay';

const BalanceScreen = () => {
  // 1) Grab screen width for dynamic styles
  const { width } = useWindowDimensions();
  const styles = dynamicStyles(width);

  const navigation = useNavigation();
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]); // For service charge history
  const [dummyTransactions, setDummyTransactions] = useState([]); // For payment history
  const [activeCard, setActiveCard] = useState('ServiceHistory');
  const [loading, setLoading] = useState(true);

  // Fetch the worker's balance and transaction history from the backend
  const fetchServiceBalanceHistory = useCallback(async () => {
    setLoading(true);
    try {
      const pcs_token = await EncryptedStorage.getItem('pcs_token');
      console.log(await EncryptedStorage.getItem('pcs_token'))
      if (!pcs_token) throw new Error('User not authenticated');

      // 2) Call your backend API to fetch balance and history
      const response = await axios.post(
        'https://backend.clicksolver.com/api/balance/ammount',
        {},
        { headers: { Authorization: `Bearer ${pcs_token}` } }
      );

      // Assuming response.data is an array with the first element having balance info
      const data = response.data[0];
      setDummyTransactions(data.balance_payment_history || []);
      setBalance(data.balance_amount);

      // Map the service charge transactions for display
      const serviceBalanceHistory = response.data.map((transaction, index) => {
        const paymentType = transaction.payment_type.toLowerCase();
        const paymentValue = Number(transaction.payment);
        // Calculation logic: adjust as needed
        const deduction = paymentType === 'cash' ? paymentValue * 0.12 : paymentValue * 0.88;
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
          time: formattedTime,
          service: 'Electrician',
          payment: paymentType === 'cash' ? 'Paid by Cash' : 'Paid to Click Solver',
          name: transaction.name,
        };
      });

      // Sort transactions by date descending (if needed)
      serviceBalanceHistory.sort((a, b) => new Date(b.time) - new Date(a.time));
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

  // Handle Pay Now: Create order, open Razorpay, and verify payment
  const handlePayNow = async () => {
    try {
      const pcs_token = await EncryptedStorage.getItem('pcs_token');
      if (!pcs_token) {
        Alert.alert('Error', 'User not authenticated.');
        return;
      }
      // Amount to pay is the absolute value of the negative balance (in rupees)
      const amountToPay = Math.abs(Number(balance));

      // 1. Create an order on the backend (amount returned in paise)
      const createResponse = await axios.post(
        'https://backend.clicksolver.com/api/create-order',
        { amount: amountToPay, currency: 'INR' },
        { headers: { Authorization: `Bearer ${pcs_token}` } }
      );
      const data = createResponse.data;
      if (!data.success) throw new Error('Order creation failed');

      // 2. Open Razorpay Checkout using the returned order details
      const options = {
        description: 'Payment for clearing negative balance',
        currency: data.currency,
        key: 'rzp_test_vca9xUL1SxWrEM', // Replace with your Razorpay key
        amount: data.amount, // Amount in paise
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
          // 3. Payment completed – verify payment on the backend
          const verifyResponse = await axios.post(
            'https://backend.clicksolver.com/api/verify-payment',
            paymentData,
            { headers: { Authorization: `Bearer ${pcs_token}` } }
          );
          const verifyData = verifyResponse.data;
          if (verifyData.success) {
            Alert.alert('Payment Success', verifyData.message);
            // Refresh the balance and transaction history
            fetchServiceBalanceHistory();
          } else {
            Alert.alert('Payment Verification Failed', verifyData.message);
          }
        })
        .catch((error) => {
          Alert.alert('Payment Failed', error.description || error.message);
        });
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Render no data message
  const renderNoData = (message) => (
    <View style={styles.noDataContainer}>
      <Text style={styles.noDataText}>{message}</Text>
    </View>
  );

  // Render transaction item for Service Charge
  const renderServiceHistoryItem = ({ item }) => (
    <View style={styles.transactionContainer}>
      <View style={styles.paymentContainer}>
        <View style={styles.iconContainer}>
          {item.payment.toLowerCase() === 'paid by cash' ? (
            <Entypo name="wallet" size={20} color="white" />
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
              item.amount.startsWith('-') ? styles.amountNegative : styles.amountPositive
            }
          >
            {item.amount}
          </Text>
          <Text style={styles.timeText}>{item.time}</Text>
        </View>
      </View>
    </View>
  );

  // Render transaction item for Payment History
  const renderPaymentHistoryItem = ({ item }) => (
    <View style={styles.cardPaymentContainer}>
      <View style={styles.iconWrapper}>
        <MaterialCommunityIcons
          name={
            item.type === 'Paid'
              ? 'arrow-top-right'
              : item.type === 'Received'
              ? 'arrow-bottom-left'
              : 'wrench'
          }
          size={20}
          color="white"
        />
      </View>
      <View style={styles.detailsWrapper}>
        <Text style={styles.typeText}>
          {item.type === 'Paid' ? 'Paid to Click Solver' : 'Received from Click Solver'}
        </Text>
        <Text style={styles.companyText}>{item.name}</Text>
        <Text style={styles.dateText}>{item.date}</Text>
      </View>
      <View style={styles.amountWrapper}>
        <Text style={styles.amountText}>{item.amount}</Text>
        <Text style={styles.statusText}>
          {item.type === 'Paid' ? 'Debited from you' : 'Credited to you'}
        </Text>
      </View>
    </View>
  );

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
      {balance !== null && Number(balance) < 0 && (
        <TouchableOpacity style={styles.payNowButton} onPress={handlePayNow}>
          <Text style={styles.payNowButtonText}>Pay Now</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

/**
 * A helper function that returns a StyleSheet based on screen width.
 * If `width >= 600`, we treat it as a tablet and scale up certain styles.
 */
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

    // Payment history transaction styling
    cardPaymentContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: 'white',
      borderRadius: 10,
      padding: isTablet ? 20 : 15,
      marginVertical: 8,
      marginHorizontal: isTablet ? 30 : 16,
      elevation: 2,
    },
    iconWrapper: {
      backgroundColor: '#FF5722',
      borderRadius: 25,
      width: isTablet ? 45 : 40,
      height: isTablet ? 45 : 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    detailsWrapper: {
      flex: 2,
      marginLeft: isTablet ? 18 : 15,
    },
    typeText: {
      fontSize: isTablet ? 17 : 16,
      fontWeight: 'bold',
      color: '#000',
    },
    companyText: {
      fontSize: isTablet ? 15 : 14,
      color: '#4a4a4a',
    },
    dateText: {
      fontSize: isTablet ? 13 : 12,
      color: '#a9a9a9',
    },
    amountWrapper: {
      alignItems: 'flex-end',
    },
    amountText: {
      fontSize: isTablet ? 20 : 18,
      fontWeight: 'bold',
      color: '#000',
    },
    statusText: {
      fontSize: isTablet ? 14 : 12,
      color: '#a9a9a9',
    },
  });
}

export default BalanceScreen;
