// HowItWorksScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const steps = [
  {
    number: '1',
    title: 'Choose Service Category',
    description: 'Browse through our various service categories',
    // Uncomment and adjust the path if you have an asset for the icon:
    // icon: require('./assets/icon-category.png'),
  },
  {
    number: '2',
    title: 'Select Specific Service',
    description: 'Choose the exact service you need',
    // icon: require('./assets/icon-service.png'),
  },
  {
    number: '3',
    title: 'Confirm Location',
    description: 'Share your service location',
    // icon: require('./assets/icon-location.png'),
  },
  {
    number: '4',
    title: 'Worker Assignment',
    description: 'Wait for nearby worker to accept',
    // icon: require('./assets/icon-worker.png'),
  },
  {
    number: '5',
    title: 'Worker Arrives',
    description: "Track worker's journey to you",
    // icon: require('./assets/icon-tracking.png'),
  },
  {
    number: '6',
    title: 'Verify & Begin',
    description: 'Verify worker with OTP and start service',
    // icon: require('./assets/icon-verify.png'),
  },
];

const HelpScreen = () => {
  return (
    <View style={styles.wrapper}>
      {/* Top Header Container */}
      <View style={styles.topHeader}>
        <TouchableOpacity>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>Help & Support</Text>
        <TouchableOpacity>
          <Ionicons name="headset-outline" size={24} color="#212121" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          {/* Internal Header */}
          <View style={styles.header}>
            {/* <Text style={styles.headerTitle}>How It Works</Text> */}
            <Text style={styles.headerSubtitle}>
              Follow these simple steps to get started
            </Text>
          </View>

          {/* Steps */}
          {steps.map((step, index) => (
            <View key={index} style={styles.step}>
              <View style={styles.stepNumberContainer}>
                <Text style={styles.stepNumber}>{step.number}</Text>
              </View>
              <View style={styles.stepContent}>
                <View style={styles.stepIcons}>
                  {step.icon && (
                    <Image source={step.icon} style={styles.icon} />
                  )}
                  <Text style={styles.stepTitle}>{step.title}</Text>
                </View>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            </View>
          ))}

          {/* Call-to-Action Button */}
          <TouchableOpacity style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Book a Service Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    // Android shadow
    elevation: 1,
  },
  topHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  container: {
    width: '90%',
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    // Android shadow
    // elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    color: '#212121',
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#4a4a4a',
    textAlign: 'center',
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    // iOS shadow for step
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    // Android shadow
    elevation: 1,
  },
  stepNumberContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ff4500',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  stepNumber: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '500',
  },
  stepContent: {
    flex: 1,
  },
  stepIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 10,
    resizeMode: 'contain',
  },
  stepTitle: {
    fontSize: 16,
    color: '#212121',
    fontWeight: '500',
  },
  stepDescription: {
    fontSize: 14,
    color: '#4a4a4a',
  },
  ctaButton: {
    backgroundColor: '#ff5722',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
    // iOS shadow for button
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    // Android shadow
    elevation: 1,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default HelpScreen;
