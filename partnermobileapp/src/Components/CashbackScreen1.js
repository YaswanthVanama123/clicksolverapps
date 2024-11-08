import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6'
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SwipeButton from 'rn-swipe-button';

const CashbackScreen1 = () => {
  const [showServiceChargeHistory, setShowServiceChargeHistory] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [showCashbackHistory, setShowCashbackHistory] = useState(false);
  const [showServiceChargeHistoryArray, setShowServiceChargeHistoryArray] = useState([
    { method: 'Paid by Cash', user: 'Yaswanth', amount: '- 20', date: '30 Oct 2024' },
    { method: 'Paid to Click Solver', user: 'Yaswanth', amount: '+ 20', date: '30 Oct 2024' },
  ]);
  const [showPaymentHistoryArray, setShowPaymentHistoryArray] = useState(            [
    { type: 'Paid to', amount: '20', date: '30 Oct 2024', debited: true },
    { type: 'Received from', amount: '100', date: '30 Oct 2024', debited: false },
  ]);
  const [showCashbackHistoryArray, setShowCashbackHistoryArray] = useState(            [
    { type: 'Paid to', amount: '20', date: '30 Oct 2024' },
  ]); 
  const [titleColor, setTitleColor] = useState('#FFFFFF');
  const [swiped, setSwiped] = useState(false);

  const ThumbIcon = () => {
    return (
      <View style={styles.thumbContainer}>
        <Text>
          {swiped ? (
            <Entypo name="check" size={20} color="#ff4500" style={styles.checkIcon} />
          ) : (
            <FontAwesome6 name="arrow-right-long" size={18} color="#ff4500" />
          )}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <FontAwesome6 name='arrow-left-long' size={20} color='#4a4a4a' />
        <View style={styles.headerContent}>
          <Text style={styles.headerText}>Pending Cash back</Text>
          <Text style={styles.amountText}>₹200</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Service Charge History Section */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowServiceChargeHistory(!showServiceChargeHistory)}
          >
            <Text style={styles.sectionHeaderText}>Service charge history</Text>
            <FontAwesome5 name={showServiceChargeHistory ? "chevron-up" : "chevron-down"} size={16} color="#4a4a4a" />
          </TouchableOpacity>

          {showServiceChargeHistory && (
            showServiceChargeHistoryArray.map((item, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={styles.iconContainer}>
                  {item.method === 'Paid by Cash' ? <Entypo name="wallet" size={20} color='#FFFFFF'/> : <MaterialCommunityIcons name='bank' size={20} color='white' />} 
                </View>
                <View style={styles.historyDetails}>
                  <Text style={styles.historyTitle}>{item.method}</Text>
                  <Text style={styles.historyUser}>{item.user}</Text>
                </View>
                <View>
                <Text style={styles.amount}>{item.amount}</Text>
                <Text style={styles.date}>{item.date}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Payment History Section */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowPaymentHistory(!showPaymentHistory)}
          >
            <Text style={styles.sectionHeaderText}>Payment History</Text>
            <FontAwesome5 name={showPaymentHistory ? "chevron-up" : "chevron-down"} size={16} color="#4a4a4a" />
          </TouchableOpacity>

          {showPaymentHistory && (
              showPaymentHistoryArray.map((item, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons name={item.debited ? "arrow-top-right" : "arrow-bottom-left"} size={20} color={item.debited ? "#ffffff" : "#ffffff"} />
                </View>
                <View style={styles.historyDetails}>
                  <Text style={styles.historyTitle}>{item.type}</Text>
                  <Text style={styles.historyTitle}>Click Solver</Text>
                </View>
                <View>
                  <Text style={styles.amount}>{item.amount}</Text>
                  <Text style={styles.date}>{item.date}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Cashback History Section */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowCashbackHistory(!showCashbackHistory)}
          >
            <Text style={styles.sectionHeaderText}>Cashback History</Text>
            <FontAwesome5 name={showCashbackHistory ? "chevron-up" : "chevron-down"} size={16} color="#4a4a4a" />
          </TouchableOpacity>

          {showCashbackHistory && (
              showCashbackHistoryArray.map((item, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons name="arrow-top-right" size={20} color="#ffffff" />
                </View>
                <View style={styles.historyDetails}>
                  <Text style={styles.historyTitle}>{item.type}</Text>
                  <Text style={styles.historyTitle}>Click Solver</Text>
                </View>
                <View>
                  <Text style={styles.amount}>{item.amount}</Text>
                  <Text style={styles.date}>{item.date}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <View style={{ paddingTop: 20 }}>
            <SwipeButton
              title="Payed"
              titleStyles={{ color: titleColor }}
              railBackgroundColor="#FF5722"
              railBorderColor="#FF5722"
              railStyles={{
                borderRadius: 25,
                height: 50,
                backgroundColor: '#FF572200',
                borderColor: '#FF572200',
              }}
              thumbIconComponent={ThumbIcon}
              thumbIconBackgroundColor="#FFFFFF"
              thumbIconBorderColor="#FFFFFF"
              thumbIconWidth={50}
              thumbIconHeight={50}
              onSwipeStart={() => setTitleColor('#B0B0B0')}
              onSwipeSuccess={() => {
                handleLocationReached();
                setTitleColor('#FFFFFF');
                setSwiped(true);
              }}
              onSwipeFail={() => setTitleColor('#FFFFFF')}
            />
          </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 10,
  },
  header: {
    flexDirection:'column'
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  amountText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff4500',
    textAlign:'center',
    paddingBottom:10
  },
  scrollView: {
    flex: 1,
  },
  sectionContainer: {
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent:{
    alignSelf:'center'
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  historyDetails: {
    flex: 1,
    marginLeft: 10,
  },
  historyTitle: {
    fontSize: 16,
    color: '#4a4a4a',
  },
  historyUser: {
    fontSize: 15,
    color: '#212121',
    fontWeight:'bold'
  },
  amount: {
    fontSize: 16,
    color: '#ff4500',
    textAlign:'right'
  },
  iconContainer:{
    width:45,
    height:45,
    backgroundColor:'#ff5722',
    borderRadius:22.5,
    alignItems:'center',
    justifyContent:'center'
  },
  date: {
    fontSize: 14,
    color: '#a9a9a9',
    marginLeft: 10,
    textAlign:'right'
  },
  button: {
    backgroundColor: '#ff4500',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

export default CashbackScreen1;
