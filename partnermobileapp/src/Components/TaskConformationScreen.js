import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LottieView from 'lottie-react-native';

const TaskCompletionScreen = () => {
  return (
    <View style={styles.container}>
      {/* Back Arrow */}
      <TouchableOpacity style={styles.backArrow}>
        <Icon name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      {/* Checkmark Image */}
      <LottieView
        source={require('../assets/success.json')}
        autoPlay
        loop
        style={styles.loadingAnimation}
      />

      {/* Title and Subtitle */}
      <Text style={styles.title}>Work Completion request !</Text>
      <Text style={styles.subtitle}>
        Please confirm the completion of the service. Click confirm
      </Text>

      {/* Payment Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Payment Summary</Text>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}>
          <View style={styles.summaryItem}>
            <Text>AC Servicing</Text>
            <Text>₹ 500.00</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text>GST (5%)</Text>
            <Text>₹ 25.00</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text>CGST (5%)</Text>
            <Text>₹ 25.00</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text>Cashback</Text>
            <Text style={styles.negativeText}>- ₹ 25.00</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={styles.totalText}>Grand Total</Text>
            <Text style={styles.totalText}>₹ 525.00</Text>
          </View>
        </ScrollView>
      </View>

      {/* Confirm Button */}
      <TouchableOpacity style={styles.confirmButton}>
        <Text style={styles.buttonText}>Work completed</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    backgroundColor: '#fff',
  },
  backArrow: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 1,
  },
  checkmarkImage: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginTop: 50,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  summaryContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  loadingAnimation: {
    width: '100%',
    height: 200,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  scrollView: {
    maxHeight: 150,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  negativeText: {
    color: 'red',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginVertical: 8,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#ff4500',
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TaskCompletionScreen;
