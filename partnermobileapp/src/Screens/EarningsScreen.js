import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  BackHandler,
  SafeAreaView,
} from 'react-native';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import {Calendar} from 'react-native-calendars';
import EncryptedStorage from 'react-native-encrypted-storage';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import axios from 'axios';
import DestinationCircles from '../Components/DestinationCircles';

const EarningsScreen = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState('Today');
  const [showCalendar, setShowCalendar] = useState(false);
  const [isMessageVisible, setIsMessageVisible] = useState(false);
  const [earnings, setEarnings] = useState({
    total_payment: 0,
    cash_payment: 0,
    payment_count: 0,
    life_earnings: 0,
    avgrating: 0,
    rejectedcount: 0,
    pendingcount: 0,
    minutes: 0,
    service_counts: 0,
    cashback_approved_times: 0,
    cashback_gain: 0,
    cashback: 0,
  });
  const navigation = useNavigation();

  // State variables for date range
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  useEffect(() => {
    partnerEarnings(new Date());
  }, []);

  const partnerEarnings = async (date, endDate = null) => {
    try {
      const pcs_token = await EncryptedStorage.getItem('pcs_token');
      if (!pcs_token) throw new Error('pcs_token not found');

      const payload = endDate ? {startDate: date, endDate: endDate} : {date};
      const response = await axios.post(
        `${process.env.BackendAPI6}/api/worker/earnings`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${pcs_token}`,
          },
        },
      );

      console.log(response.data);

      const {
        total_payment = 0,
        cash_payment = 0,
        payment_count = 0,
        life_earnings = 0,
        avgrating = 0,
        rejectedcount = 0,
        pendingcount = 0,
        total_time_worked_hours = 0,
        service_counts = 0,
        cashback_gain = 0,
        cashback_approved_times = 0,
        average_rating = 0,
      } = response.data;

      setEarnings({
        total_payment: Number(total_payment),
        cash_payment: Number(cash_payment),
        payment_count: Number(payment_count),
        life_earnings: Number(life_earnings),
        avgrating: Number(avgrating),
        rejectedcount: Number(rejectedcount),
        pendingcount: Number(pendingcount),
        minutes: Number(total_time_worked_hours) * 60,
        service_counts: Number(service_counts),
        cashback_gain: Number(cashback_gain) * 100,
        cashback_approved_times: Number(cashback_approved_times),
        cashback_pending:
          Number(cashback_approved_times) - Number(cashback_gain),
        cashback: Number(service_counts) % 6,
        average_rating: Number(average_rating),
      });
    } catch (error) {
      console.error('Error fetching payment details:', error);
      // Optionally, handle error state
    }
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('Home');
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation]),
  );

  const handleTabClick = period => {
    setSelectedPeriod(period);

    if (period === 'Today') {
      const today = new Date();
      setSelectedDate(today);
      setStartDate(null);
      setEndDate(null);
      partnerEarnings(today);
    } else if (period === 'This Week') {
      const startOfWeek = new Date();
      const day = startOfWeek.getDay(); // 0 (Sunday) to 6 (Saturday)
      startOfWeek.setDate(startOfWeek.getDate() - day); // Set to Sunday
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6); // Set to Saturday

      setSelectedDate(startOfWeek);
      setStartDate(startOfWeek);
      setEndDate(endOfWeek);
      partnerEarnings(startOfWeek, endOfWeek);
    } else if (period === 'Select Date') {
      setStartDate(null);
      setEndDate(null);
      setShowCalendar(true);
    }
  };

  const selectDate = day => {
    const selected = new Date(day.dateString);

    if (!startDate || (startDate && endDate)) {
      setStartDate(selected);
      setEndDate(null);
    } else if (startDate && !endDate) {
      if (selected >= startDate) {
        setEndDate(selected);
        setShowCalendar(false);
        partnerEarnings(startDate, selected);
      } else {
        setStartDate(selected);
      }
    }
  };

  const getMarkedDates = () => {
    if (startDate && endDate) {
      let range = {};
      let start = new Date(startDate);
      let end = new Date(endDate);
      let current = new Date(start);

      while (current <= end) {
        const dateString = current.toISOString().split('T')[0];
        if (dateString === startDate.toISOString().split('T')[0]) {
          range[dateString] = {
            startingDay: true,
            color: '#4CAF50',
            textColor: 'white',
          };
        } else if (dateString === endDate.toISOString().split('T')[0]) {
          range[dateString] = {
            endingDay: true,
            color: '#4CAF50',
            textColor: 'white',
          };
        } else {
          range[dateString] = {color: '#4CAF50', textColor: 'white'};
        }
        current.setDate(current.getDate() + 1);
      }
      return range;
    } else if (startDate) {
      return {
        [startDate.toISOString().split('T')[0]]: {
          selected: true,
          selectedColor: '#4CAF50',
        },
      };
    }
    return {};
  };

  const backToHome = () => {
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={backToHome} style={styles.leftIcon}>
          <FontAwesome6 name="arrow-left-long" size={24} color="#4a4a4a" />
        </TouchableOpacity>
        <View style={styles.earningsIconContainer}>
          <FontAwesome6
            name="coins"
            size={24}
            color="#FF5722"
            style={styles.EarningIcon}
          />
          <Text style={styles.screenName}>Earnings</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {['Today', 'This Week', 'Select Date'].map(period => (
          <TouchableOpacity
            key={period}
            style={[styles.tab, selectedPeriod === period && styles.tabActive]}
            onPress={() => handleTabClick(period)}>
            <Text
              style={[
                styles.tabText,
                selectedPeriod === period && styles.tabTextActive,
              ]}>
              {period}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Earnings Summary */}
      <View style={styles.earningsContainer}>
        <View style={styles.messageContainer}>
          <Text style={styles.totalEarningsText}>
            <Text style={styles.mainRupeeIcon}>₹ </Text>
            {earnings.total_payment}
          </Text>
          {/* Toggle Icon and Message */}
          <TouchableOpacity
            onPress={() => setIsMessageVisible(!isMessageVisible)}
            style={styles.eyeIconContainer}>
            <Feather
              name={isMessageVisible ? 'eye-off' : 'eye'}
              size={20}
              color="#4a4a4a"
            />
          </TouchableOpacity>
        </View>
        {isMessageVisible && (
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>
              You are viewing the earnings for {selectedPeriod}
              {selectedPeriod === 'Select Date' && startDate && endDate
                ? ` from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`
                : ''}
            </Text>
          </View>
        )}

        <View style={styles.horizontalLine} />
        <View style={styles.cashContainer}>
          <Text style={styles.cashCollectedText}>Cash collected</Text>
          <Text style={styles.cashCollectedAmount}>
            <Text style={styles.rupeeIcon}>₹ </Text>
            {earnings.cash_payment}
          </Text>
        </View>
      </View>
      <Text style={styles.cashBackAmount}>Cash back ₹100</Text>
      <View style={styles.completedCircle}>
        <DestinationCircles complete={earnings.cashback} />
      </View>

      {/* Statistics */}
      <ScrollView
        contentContainerStyle={styles.statsContainer}
        showsVerticalScrollIndicator={false}>
        {console.log('earn', earnings)}
        {[
          {value: earnings.payment_count, title: 'Services', color: '#4CAF50'},
          {
            value: `${earnings.life_earnings}`,
            title: 'Total Earnings',
            color: '#4CAF50',
          },
          {
            value: earnings.cashback_gain,
            title: 'Cashback',
            color: '#4CAF50',
          },
          {
            value: earnings.average_rating,
            title: 'Avg Rating',
            color: '#4CAF50',
          },
          {value: earnings.rejectedcount, title: 'Rejected', color: '#ff4436'},
          {
            value: earnings.cashback_pending,
            title: 'Cashback pending',
            color: '#ffa500',
          },
        ].map((stat, index) => (
          <View
            key={index}
            style={[styles.statBox, {borderLeftColor: stat.color}]}>
            <Text style={[styles.statValue, {color: stat.color}]}>
              {stat.value}
            </Text>
            <Text style={styles.statTitle}>{stat.title}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Calendar Modal */}
      <Modal visible={showCalendar} transparent={true} animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowCalendar(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback>
              <View style={styles.calendarContainer}>
                <Calendar
                  onDayPress={selectDate}
                  markedDates={getMarkedDates()}
                  markingType={'period'}
                  theme={{
                    selectedDayBackgroundColor: '#4CAF50',
                    todayTextColor: '#4CAF50',
                    arrowColor: '#4CAF50',
                    dotColor: '#4CAF50',
                    selectedDotColor: '#ffffff',
                    monthTextColor: '#4CAF50',
                  }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  cashBackAmount: {
    color: '#FF5722',
    textAlign: 'right',
    paddingRight: 16,
    paddingTop: 10,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  eyeIconContainer: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBox: {
    marginTop: 10,
    padding: 10,
    marginBottom: 5,
    backgroundColor: '#f3f3f3',
    borderRadius: 5,
    alignItems: 'center',
  },
  messageText: {
    fontSize: 14,
    color: '#4a4a4a',
  },
  cashCollectedAmount: {
    color: '#4a4a4a',
    fontWeight: '900',
    paddingHorizontal: 20,
    fontSize: 15,
  },
  rupeeIcon: {
    color: '#4a4a4a',
    fontWeight: '900',
    paddingHorizontal: 19,
    fontSize: 13,
  },
  mainRupeeIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    textAlign: 'center',
  },
  cashContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  earningsIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  horizontalLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#f0f0f0',
  },
  screenName: {
    color: '#212121',
    fontSize: 20,
    fontWeight: 'bold',
  },
  leftIcon: {
    position: 'absolute',
    left: 10,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f0f0f0',
    height: 52,
    borderRadius: 10,
    marginTop: 10,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabActive: {
    backgroundColor: '#FF5722',
    borderRadius: 8,
  },
  tabText: {
    color: '#4a4a4a',
    fontSize: 16,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  earningsContainer: {
    backgroundColor: '#fff',
    marginTop: 15,
    marginVertical: 10,
    marginHorizontal: 16,
    borderRadius: 10,
    padding: 16,
    elevation: 4,
  },
  totalEarningsText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212121',
    textAlign: 'center',
  },

  cashCollectedText: {
    fontSize: 15,
    color: '#4a4a4a',
    fontWeight: 'bold',
    marginTop: 5,
  },
  statsContainer: {
    marginTop: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statBox: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginHorizontal: 5,
    marginVertical: 8,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderRadius: 0,
    elevation: 4,
    width: '46%', // Approximately half width with some margin
    height: 100,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statTitle: {
    color: '#4a4a4a',
    fontWeight: '600',
    marginTop: 5,
    fontSize: 15,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  calendarContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 20,
    padding: 16,
  },
});

export default EarningsScreen;
