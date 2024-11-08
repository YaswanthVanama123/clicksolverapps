import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const CashbackScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState('serviceCharge');

  const data = {
    serviceCharge: [
      { id: 1, type: 'Paid by Cash', name: 'Yaswanth', date: '30 Oct 2024', amount: -20 },
      { id: 2, type: 'Paid by Click Solver', name: 'Yaswanth', date: '30 Oct 2024', amount: 20 },
    ],
    payment: [
      { id: 1, type: 'Paid to Click Solver', date: '30 Oct 2024', detail: 'Debited from you', amount: 20 },
      { id: 2, type: 'Received from Click Solver', date: '30 Oct 2024', detail: 'Credited to you', amount: 100 },
    ],
    cashback: [
      { id: 1, type: 'Paid to Click Solver', date: '30 Oct 2024', detail: 'Debited from you', amount: 20 },
    ],
  };

  return (
    <View style={styles.container}>
      

      <View style={styles.headerContainer}>
        <Icon name="arrow-back" size={24} color="#000" onPress={() => {}} />
        <Text style={styles.headerText}>Pending </Text>
      </View>
      <Text style={styles.amountText}>₹200</Text>

      <View style={styles.dropdownContainer}>
        <TouchableOpacity 
          style={styles.dropdownButton} 
          onPress={() => setSelectedCategory('serviceCharge')}
        >
          <Icon name="wallet-outline" size={24} color="#4a4a4a" />
          <Text style={styles.dropdownText}>Service Charge History</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.dropdownButton} 
          onPress={() => setSelectedCategory('payment')}
        >
          <Icon name="cash-outline" size={24} color="#4a4a4a" />
          <Text style={styles.dropdownText}>Payment History</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.dropdownButton} 
          onPress={() => setSelectedCategory('cashback')}
        >
          <Icon name="pricetag-outline" size={24} color="#4a4a4a" />
          <Text style={styles.dropdownText}>Cashback History</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.cardContainer}>
        {data[selectedCategory].map((item) => (
          <View key={item.id} style={styles.card}>
            <Icon name={selectedCategory === 'serviceCharge' ? "cash-outline" : selectedCategory === 'payment' ? "arrow-down-outline" : "pricetag-outline"} size={28} color="#ff4500" />
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.type}</Text>
              {item.name && <Text style={styles.cardSubtitle}>{item.name}</Text>}
              <Text style={styles.cardDate}>{item.date}</Text>
              {item.detail && <Text style={styles.cardDetail}>{item.detail}</Text>}
            </View>
            <Text style={styles.cardAmount}>{item.amount < 0 ? '-' : '+'} ₹{Math.abs(item.amount)}</Text>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.payButton} onPress={() => {}}>
        <Icon name="arrow-forward" size={24} color="#fff" style={styles.payButtonIcon} />
        <Text style={styles.payButtonText}>Pay Cashback</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f7f7f7',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 16,
    color: '#212121',
  },
  amountText: {
    fontSize: 32,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    color: '#ff4500',
  },
  dropdownContainer: {
    marginBottom: 16,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  dropdownText: {
    fontSize: 16,
    marginLeft: 16,
    color: '#4a4a4a',
  },
  cardContainer: {
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4a4a4a',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#888',
  },
  cardDate: {
    fontSize: 12,
    color: '#888',
  },
  cardDetail: {
    fontSize: 12,
    color: '#888',
  },
  cardAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff4500',
  },
  payButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ff4500',
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: '#ff4500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  payButtonIcon: {
    marginRight: 8,
  },
});

export default CashbackScreen;
