/**
 * QuickBookButton Integration Example
 *
 * This file demonstrates how to integrate QuickBookButton into your Home screen
 * and enable one-tap booking for frequent services.
 */

import React from 'react';
import {View, Text, ScrollView, StyleSheet} from 'react-native';
import QuickBookButton from './screens/home/components/QuickBookButton';
import useUserStore from './store/userStore';
import {useNavigation} from '@react-navigation/native';

/**
 * Example: Home Screen with Quick Book Buttons
 */
const HomeScreenWithQuickBook = () => {
  const navigation = useNavigation();
  const {recentServices} = useUserStore();

  // Sample services data with proper structure
  const sampleServices = [
    {
      id: '1',
      name: 'Plumbing',
      price: 299,
      icon: 'wrench',
      gradientColors: ['#667eea', '#764ba2'],
    },
    {
      id: '2',
      name: 'Electrician',
      price: 399,
      icon: 'flash',
      gradientColors: ['#f093fb', '#f5576c'],
    },
    {
      id: '3',
      name: 'Cleaning',
      price: 199,
      icon: 'broom',
      gradientColors: ['#4facfe', '#00f2fe'],
    },
    {
      id: '4',
      name: 'AC Repair',
      price: 499,
      icon: 'snowflake',
      gradientColors: ['#43e97b', '#38f9d7'],
    },
    {
      id: '5',
      name: 'Carpenter',
      price: 349,
      icon: 'hammer',
      gradientColors: ['#fa709a', '#fee140'],
    },
  ];

  const handleBookingComplete = booking => {
    console.log('Booking completed:', booking);
    // Handle post-booking actions here
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Quick Book</Text>
        <Text style={styles.subtitle}>
          Tap to instantly book your frequent services
        </Text>
      </View>

      {/* Recent Services - Show Quick Book Buttons */}
      {recentServices.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Recent Services</Text>
          {recentServices.map(service => (
            <QuickBookButton
              key={service.id}
              service={service}
              onBookingComplete={handleBookingComplete}
            />
          ))}
        </View>
      )}

      {/* All Services - Show Quick Book Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Services</Text>
        {sampleServices.map(service => (
          <QuickBookButton
            key={service.id}
            service={service}
            onBookingComplete={handleBookingComplete}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginHorizontal: 16,
    marginBottom: 12,
  },
});

export default HomeScreenWithQuickBook;

/**
 * INTEGRATION STEPS:
 *
 * 1. Import QuickBookButton in your Home screen:
 *    import QuickBookButton from './screens/home/components/QuickBookButton';
 *
 * 2. Get recent services from userStore:
 *    const {recentServices} = useUserStore();
 *
 * 3. Add QuickBookButton for each service:
 *    <QuickBookButton
 *      service={service}
 *      onBookingComplete={(booking) => {
 *        // Handle successful booking
 *        navigation.navigate('Tracking', {bookingId: booking.bookingId});
 *      }}
 *    />
 *
 * 4. Add navigation to QuickBookPreferences screen in your Profile:
 *    navigation.navigate('QuickBookPreferences');
 *
 * 5. Service object structure:
 *    {
 *      id: 'unique-id',
 *      name: 'Service Name',
 *      price: 299,
 *      icon: 'icon-name', // MaterialCommunityIcons icon name
 *      gradientColors: ['#color1', '#color2'] // Optional
 *    }
 *
 * 6. Make sure user has set a default address:
 *    - User can set default address in QuickBookPreferences screen
 *    - Or in Profile > Addresses section
 *
 * 7. Customize gradient colors per service category:
 *    const serviceGradients = {
 *      plumbing: ['#667eea', '#764ba2'],
 *      electrical: ['#f093fb', '#f5576c'],
 *      cleaning: ['#4facfe', '#00f2fe'],
 *      repair: ['#43e97b', '#38f9d7'],
 *    };
 */

/**
 * FEATURES:
 *
 * - One-tap instant booking
 * - Auto-apply best available offer
 * - Use default address and tip
 * - Show estimated price with discount
 * - Loading state during booking
 * - Error handling with retry option
 * - Navigate to tracking screen after booking
 * - Add service to recent services automatically
 * - Beautiful gradient UI with service icons
 * - Location name display
 * - Discount badge when offers available
 *
 * REQUIREMENTS:
 *
 * - User must have at least one saved address
 * - One address should be marked as default
 * - Optional: Set default tip in preferences
 * - Backend API endpoint: /api/booking/quick-book
 * - Offer validation endpoint: /api/user/validate-offer
 */

/**
 * NAVIGATION SETUP:
 *
 * Add QuickBookPreferences screen to your navigation stack:
 *
 * import QuickBookPreferences from './screens/profile/QuickBookPreferences';
 *
 * // In your navigation stack:
 * <Stack.Screen
 *   name="QuickBookPreferences"
 *   component={QuickBookPreferences}
 *   options={{
 *     title: 'Quick Book Settings',
 *     headerShown: true,
 *   }}
 * />
 */

/**
 * API ENDPOINTS REQUIRED:
 *
 * 1. POST /api/booking/quick-book
 *    - Creates instant booking with all details
 *    - Returns: {success, bookingId, encodedId, message}
 *
 * 2. POST /api/user/validate-offer
 *    - Validates and returns best offer for service
 *    - Body: {serviceId, servicePrice}
 *    - Returns: {success, offer: {type, value, maxDiscount}}
 *
 * 3. GET /api/user/addresses
 *    - Returns all saved addresses
 *
 * 4. PATCH /api/user/addresses/default
 *    - Sets default address
 *
 * 5. PATCH /api/user/quick-book/preferences
 *    - Updates quick book preferences
 *    - Body: {enabled, autoApplyOffers, confirmationRequired}
 *
 * 6. PATCH /api/user/preferences
 *    - Updates user preferences including defaultTip
 */
