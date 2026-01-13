/**
 * Example Usage - Molecule Components
 * Demonstrates how to use all molecule components together
 */

import React, {useState} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import {
  ServiceCard,
  QuickActionButton,
  AddressCard,
  OfferCard,
  WorkerCard,
  InputField,
  BottomSheet,
} from '../components/molecules';
import {SPACING} from '../theme/spacing';

const MoleculeExamplesScreen = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showBottomSheet, setShowBottomSheet] = useState(false);

  // Sample data
  const sampleService = {
    id: 1,
    image: 'https://via.placeholder.com/300',
    title: 'Professional Home Cleaning',
    price: 499,
    rating: 4.8,
    reviews: 256,
    category: 'Cleaning',
    discount: 20,
  };

  const sampleAddress = {
    id: 1,
    type: 'Home',
    title: 'My Home',
    street: '123 Main Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    landmark: 'Near Central Park',
  };

  const sampleOffer = {
    id: 1,
    code: 'SAVE20',
    title: 'New User Special',
    description: 'Get 20% off on your first service booking',
    discount: 20,
    discountType: 'percentage',
    minAmount: 500,
    maxDiscount: 200,
    expiresAt: '2026-02-01T00:00:00Z',
  };

  const sampleWorker = {
    id: 1,
    name: 'John Doe',
    avatar: 'https://via.placeholder.com/150',
    rating: 4.9,
    totalReviews: 342,
    servicesCompleted: 1234,
    specialization: 'Plumbing Expert',
    isVerified: true,
    isAvailable: true,
    experience: 5,
    phone: '+1234567890',
  };

  // Handlers
  const handleServicePress = service => {
    Alert.alert('Service Pressed', `Selected: ${service.title}`);
  };

  const handleQuickBook = service => {
    Alert.alert('Quick Book', `Booking: ${service.title}`);
  };

  const handleQuickAction = actionName => {
    Alert.alert('Quick Action', `Action: ${actionName}`);
  };

  const handleAddressSelect = address => {
    Alert.alert('Address Selected', `Type: ${address.type}`);
  };

  const handleAddressEdit = address => {
    Alert.alert('Edit Address', `Editing: ${address.type}`);
  };

  const handleAddressDelete = address => {
    Alert.alert('Delete Address', `Deleting: ${address.type}`);
  };

  const handleOfferApply = offer => {
    Alert.alert('Offer Applied', `Code: ${offer.code}`);
  };

  const handleWorkerPress = worker => {
    Alert.alert('Worker Profile', `Name: ${worker.name}`);
  };

  const handleWorkerCall = worker => {
    Alert.alert('Call Worker', `Calling: ${worker.name}`);
  };

  const handleWorkerChat = worker => {
    Alert.alert('Chat with Worker', `Chatting with: ${worker.name}`);
  };

  const handleEmailChange = text => {
    setEmail(text);
    // Simple email validation
    if (text && !text.includes('@')) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>

        {/* Service Card Example */}
        <View style={styles.section}>
          <ServiceCard
            service={sampleService}
            onPress={handleServicePress}
            onQuickBook={handleQuickBook}
            isDarkMode={isDarkMode}
          />
        </View>

        {/* Quick Action Buttons Example */}
        <View style={styles.section}>
          <View style={styles.quickActionsRow}>
            <QuickActionButton
              icon="calendar-clock"
              label="Book Now"
              onPress={() => handleQuickAction('Book Now')}
              gradient="primaryGradient"
              size="medium"
            />
            <QuickActionButton
              icon="heart"
              label="Favorites"
              onPress={() => handleQuickAction('Favorites')}
              gradient="secondaryGradient"
              size="medium"
            />
            <QuickActionButton
              icon="history"
              label="History"
              onPress={() => handleQuickAction('History')}
              gradient="accentGradient"
              size="medium"
            />
          </View>
        </View>

        {/* Address Card Example */}
        <View style={styles.section}>
          <AddressCard
            address={sampleAddress}
            onSelect={handleAddressSelect}
            onEdit={handleAddressEdit}
            onDelete={handleAddressDelete}
            isDefault={true}
            isDarkMode={isDarkMode}
          />
        </View>

        {/* Offer Card Example */}
        <View style={styles.section}>
          <OfferCard
            offer={sampleOffer}
            onApply={handleOfferApply}
            isDarkMode={isDarkMode}
          />
        </View>

        {/* Worker Card Example */}
        <View style={styles.section}>
          <WorkerCard
            worker={sampleWorker}
            showRating={true}
            showContact={true}
            onPress={handleWorkerPress}
            onCall={handleWorkerCall}
            onChat={handleWorkerChat}
            isDarkMode={isDarkMode}
          />
        </View>

        {/* Input Field Example */}
        <View style={styles.section}>
          <InputField
            label="Email Address"
            value={email}
            onChange={handleEmailChange}
            error={emailError}
            required={true}
            placeholder="Enter your email"
            keyboardType="email-address"
            leftIcon="email"
            helperText="We'll never share your email"
            isDarkMode={isDarkMode}
          />
        </View>

        {/* Bottom Sheet Trigger Example */}
        <View style={styles.section}>
          <QuickActionButton
            icon="view-list"
            label="Open Sheet"
            onPress={() => setShowBottomSheet(true)}
            gradient="infoGradient"
            size="large"
          />
        </View>
      </ScrollView>

      {/* Bottom Sheet Example */}
      <BottomSheet
        visible={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        title="Options Menu"
        height={400}
        showHandle={true}
        closeOnBackdropPress={true}
        closeOnSwipeDown={true}
        isDarkMode={isDarkMode}>
        <View style={styles.bottomSheetContent}>
          <QuickActionButton
            icon="check"
            label="Option 1"
            onPress={() => {
              Alert.alert('Option 1');
              setShowBottomSheet(false);
            }}
            gradient="successGradient"
            size="small"
          />
          <QuickActionButton
            icon="check"
            label="Option 2"
            onPress={() => {
              Alert.alert('Option 2');
              setShowBottomSheet(false);
            }}
            gradient="primaryGradient"
            size="small"
          />
          <QuickActionButton
            icon="check"
            label="Option 3"
            onPress={() => {
              Alert.alert('Option 3');
              setShowBottomSheet(false);
            }}
            gradient="secondaryGradient"
            size="small"
          />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.base,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  bottomSheetContent: {
    flex: 1,
    justifyContent: 'space-around',
  },
});

export default MoleculeExamplesScreen;
