import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import LottieView from 'lottie-react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import {useNavigation, CommonActions} from '@react-navigation/native';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

/* ------------------------------------
   Transaction Item (Service Charge)
------------------------------------ */
const TransactionItem = ({item}) => (
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
            item.amount.startsWith('-')
              ? styles.amountNegative
              : styles.amountPositive
          }>
          {item.amount}
        </Text>
        <Text style={styles.timeText}>{item.time}</Text>
      </View>
    </View>
  </View>
);

/* ------------------------------------
   Payment History Card
------------------------------------ */
const PaymentHistoryCard = ({item}) => (
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
        {item.type === 'Paid'
          ? 'Paid to click solver'
          : 'Received from click solver'}
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

const BalanceScreen = () => {
  const navigation = useNavigation();

  // ---- State ----
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]); // For "ServiceHistory"
  const [activeCard, setActiveCard] = useState('ServiceHistory');
  const [isMessageVisible, setIsMessageVisible] = useState(false);
  const [balanceHistory, setBalanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Payment history
  const [dummyTransactions, setDummyTransactions] = useState([]);

  // Go back to home
  const backToHome = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{name: 'Tabs', state: {routes: [{name: 'Home'}]}}],
      }),
    );
  };

  // Fetch Service & Payment info
  const fetchServiceBalanceHistory = useCallback(async () => {
    setLoading(true); // Start loader
    try {
      const pcs_token = await EncryptedStorage.getItem('pcs_token');
      if (!pcs_token) throw new Error('pcs_token not found');

      const response = await axios.post(
        `https://backend.clicksolver.com/api/balance/ammount`,
        {},
        {headers: {Authorization: `Bearer ${pcs_token}`}},
      );

      // Payment History (second card)
      setDummyTransactions(response.data[0].balance_payment_history || []);

      let totalBalance = 0;
      // Build array of service charges (transactions)
      const serviceBalanceHistory = response.data.map((transaction, index) => {
        let amount;
        const paymentType = transaction.payment_type.toLowerCase();
        const paymentValue = Number(transaction.payment);

        // If "cash" or "online" do different calculations
        const deduction =
          paymentType === 'cash' ? paymentValue * 0.12 : paymentValue * 0.88;
        amount = `${paymentType === 'cash' ? '-' : '+'} ₹${deduction.toFixed(2)}`;

        totalBalance += paymentType === 'cash' ? -deduction : deduction;

        // Parse & store actual Date object
        const dateObject = new Date(transaction.end_time);
        const formattedTime = dateObject.toLocaleDateString([], {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });

        return {
          id: index.toString(),
          rawDate: dateObject, // keep actual Date for sorting
          amount,
          time: formattedTime,
          service: 'Electrician',
          payment: paymentType === 'cash' ? 'Paid by Cash' : 'Paid to Click Solver',
          name: transaction.name,
        };
      });

      // ---- SORT by descending date ----
      serviceBalanceHistory.sort((a, b) => b.rawDate - a.rawDate);

      const currentBalance = response.data[0].balance_amount;
      const currentBalanceHistory = response.data[0].balance_payment_history;

      setBalance(currentBalance);
      setBalanceHistory(currentBalanceHistory);
      setTransactions(serviceBalanceHistory);
    } catch (error) {
      console.error('Error fetching service balance history:', error);
    } finally {
      setLoading(false); // Stop loader
    }
  }, []);

  useEffect(() => {
    fetchServiceBalanceHistory();
  }, [fetchServiceBalanceHistory]);

  // Check if negative
  const isBalanceNegative = balance && Number(balance) < 0;

  // Decide data array based on active card
  const currentData =
    activeCard === 'ServiceHistory' ? transactions : dummyTransactions;

  // Render
  return (
    <SafeAreaView style={styles.container}>
      {/* Header + Balance + Tabs */}
      <View style={styles.headContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={backToHome} style={styles.leftIcon}>
            <FontAwesome6 name="arrow-left-long" size={24} color="#9e9e9e" />
          </TouchableOpacity>
        </View>

        <View style={styles.balanceContainer}>
          <View style={styles.balanceTitleContainer}>
            <Text style={styles.balanceTitle}>Balance </Text>
            <TouchableOpacity onPress={() => setIsMessageVisible(!isMessageVisible)}>
              <Feather
                name={isMessageVisible ? 'eye-off' : 'eye'}
                size={20}
                color="#4a4a4a"
              />
            </TouchableOpacity>
          </View>

          <Text
            style={[
              styles.balanceAmount,
              isBalanceNegative && styles.negativeBalance,
            ]}
          >
            ₹{balance ?? 0}
          </Text>

          {isMessageVisible && (
            <View style={styles.messageBox}>
              <Text style={styles.messageText}>
                The total service charge and payment history
              </Text>
            </View>
          )}
        </View>

        {/* Tabs */}
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
              Payment history
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.scrollContainer}>
        {loading ? (
          // Display Lottie while loading
          <LottieView
            source={require('../assets/success.json')}
            autoPlay
            loop
            style={styles.loadingAnimation}
          />
        ) : currentData.length === 0 ? (
          // If there's no data for the active card
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No data</Text>
          </View>
        ) : (
          // Otherwise, display FlatList
          <FlatList
            data={currentData}
            renderItem={({item}) =>
              activeCard === 'ServiceHistory' ? (
                <TransactionItem item={item} />
              ) : (
                <PaymentHistoryCard item={item} />
              )
            }
            keyExtractor={item => item.id}
            contentContainerStyle={styles.flatlistContainer}
          />
        )}
      </View>

      {/* If negative balance, show Pay Now button */}
      {isBalanceNegative && (
        <TouchableOpacity
          style={styles.payNowButton}
          onPress={() => console.log('Pay Now pressed')}
        >
          <Text style={styles.payNowButtonText}>Pay Now</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

/* ----------------- Styles ----------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f3f3',
  },
  headContainer: {
    backgroundColor: '#ffffff',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 10,
  },
  leftIcon: {
    position: 'absolute',
    left: 10,
    top: 10,
  },
  balanceTitleContainer: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  messageBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f3f3f3',
    borderRadius: 5,
    alignItems: 'center',
  },
  messageText: {
    fontSize: 14,
    color: '#4a4a4a',
  },
  balanceContainer: {
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#ffffff',
  },
  balanceTitle: {
    fontSize: 17,
    color: '#212121',
  },
  balanceAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212121',
  },
  negativeBalance: {
    color: '#212121',
  },
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  card: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  activeCard: {
    borderWidth: 1,
    borderColor: '#FF5722',
  },
  cardText: {
    fontSize: 13,
    color: '#4a4a4a',
  },
  activeCardText: {
    color: '#212121',
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
    marginTop: 10,
  },
  loadingAnimation: {
    width: '100%',
    height: 200,
  },
  noDataContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#999',
  },
  flatlistContainer: {
    paddingBottom: 20,
  },
  transactionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 1,
  },
  paymentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 45,
    height: 45,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF5722',
    borderRadius: 22.5,
  },
  paymentDetails: {
    flex: 1,
    marginLeft: 12,
  },
  paymentText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4a4a4a',
  },
  nameText: {
    fontSize: 16,
    color: '#212121',
  },
  amountPositive: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    textAlign: 'right',
  },
  amountNegative: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    textAlign: 'right',
  },
  timeText: {
    fontSize: 14,
    color: '#4a4a4a',
    marginTop: 8,
    textAlign: 'right',
  },
  payNowButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FF5722',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: '20%',
  },
  payNowButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardPaymentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  iconWrapper: {
    backgroundColor: '#FF5722',
    borderRadius: 25,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsWrapper: {
    flex: 2,
    marginLeft: 15,
  },
  typeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  companyText: {
    fontSize: 14,
    color: '#4a4a4a',
  },
  dateText: {
    fontSize: 12,
    color: '#a9a9a9',
  },
  amountWrapper: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  statusText: {
    fontSize: 12,
    color: '#a9a9a9',
  },
});

export default BalanceScreen;
