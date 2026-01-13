import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import useUserStore from '../../../store/userStore';
import useBookingStore from '../../../store/bookingStore';
import {quickBook} from '../../../api/services/booking.service';
import {validateOffer} from '../../../api/services/offer.service';

/**
 * QuickBookButton Component
 * Enables instant one-tap booking with saved preferences
 *
 * @param {Object} props
 * @param {Object} props.service - Service object with id, name, price, icon
 * @param {Object} props.savedPreferences - Optional saved preferences for this service
 * @param {Function} props.onBookingComplete - Callback when booking is complete
 */
const QuickBookButton = ({
  service,
  savedPreferences = null,
  onBookingComplete = null,
}) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState(service.price || 0);
  const [bestOffer, setBestOffer] = useState(null);
  const [locationName, setLocationName] = useState('');

  const {
    profile,
    savedAddresses,
    preferences,
    addRecentService,
  } = useUserStore();

  const {setTip, applyOffer} = useBookingStore();

  // Get default address
  const defaultAddress = savedAddresses.find(addr => addr.isDefault) || savedAddresses[0];

  useEffect(() => {
    // Set location name from default address
    if (defaultAddress) {
      setLocationName(defaultAddress.label || defaultAddress.area || 'Default');
    }

    // Check for best available offer
    checkBestOffer();
  }, [defaultAddress, service]);

  /**
   * Check for best available offer for this service
   */
  const checkBestOffer = async () => {
    try {
      const response = await validateOffer({
        serviceId: service.id,
        servicePrice: service.price,
      });

      if (response.success && response.offer) {
        setBestOffer(response.offer);

        // Calculate discounted price
        let discount = 0;
        if (response.offer.type === 'percentage') {
          discount = (service.price * response.offer.value) / 100;
        } else if (response.offer.type === 'fixed') {
          discount = response.offer.value;
        }

        // Apply max discount limit
        if (response.offer.maxDiscount && discount > response.offer.maxDiscount) {
          discount = response.offer.maxDiscount;
        }

        setEstimatedPrice(service.price - discount);
      }
    } catch (error) {
      console.log('No offers available:', error);
      // Continue without offer
    }
  };

  /**
   * Handle quick book action
   * Instantly creates booking with saved preferences
   */
  const handleQuickBook = async () => {
    // Validate default address
    if (!defaultAddress) {
      Alert.alert(
        'Address Required',
        'Please set a default address in your profile to use Quick Book.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Add Address',
            onPress: () => navigation.navigate('Profile', {screen: 'Addresses'}),
          },
        ],
      );
      return;
    }

    // Prepare booking preferences
    const bookingPrefs = {
      serviceId: service.id,
      serviceName: service.name,
      serviceBooked: [{
        id: service.id,
        name: service.name,
        price: service.price,
        quantity: 1,
      }],
      area: defaultAddress.area,
      city: defaultAddress.city,
      pincode: defaultAddress.pincode,
      location: defaultAddress.coordinates || [0, 0],
      alternateName: defaultAddress.contactName || profile?.name || '',
      alternatePhoneNumber: defaultAddress.contactPhone || profile?.phone || '',
      tipAmount: preferences.defaultTip || 0,
      discount: bestOffer ? (service.price - estimatedPrice) : 0,
      offer: bestOffer || null,
    };

    setLoading(true);

    try {
      // Submit quick booking
      const response = await quickBook(bookingPrefs);

      if (response.success) {
        // Add to recent services
        addRecentService(service);

        // Update booking store
        if (bestOffer) {
          applyOffer(bestOffer);
        }
        if (preferences.defaultTip) {
          setTip(preferences.defaultTip);
        }

        // Show success message
        Alert.alert(
          'Booking Confirmed!',
          `Your ${service.name} service has been booked successfully.`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Call completion callback if provided
                if (onBookingComplete) {
                  onBookingComplete(response);
                }

                // Navigate to tracking screen
                navigation.navigate('Tracking', {
                  bookingId: response.bookingId,
                  encodedId: response.encodedId,
                });
              },
            },
          ],
        );
      } else {
        throw new Error(response.message || 'Booking failed');
      }
    } catch (error) {
      console.error('Quick book error:', error);

      Alert.alert(
        'Booking Failed',
        error.response?.data?.message || error.message || 'Unable to complete booking. Please try again.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Retry',
            onPress: () => handleQuickBook(),
          },
        ],
      );
    } finally {
      setLoading(false);
    }
  };

  // Get service icon component
  const getServiceIcon = () => {
    if (service.icon) {
      return (
        <MaterialCommunityIcons
          name={service.icon}
          size={32}
          color="#FFFFFF"
        />
      );
    }
    return <Icon name="flash" size={32} color="#FFFFFF" />;
  };

  // Gradient colors based on service category or default vibrant colors
  const gradientColors = service.gradientColors || ['#667eea', '#764ba2'];

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleQuickBook}
      disabled={loading}
      activeOpacity={0.8}>
      <LinearGradient
        colors={gradientColors}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.gradient}>
        {/* Icon and Service Name */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            {getServiceIcon()}
          </View>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName} numberOfLines={1}>
              {service.name}
            </Text>
            <Text style={styles.quickBookLabel}>Quick Book</Text>
          </View>
        </View>

        {/* Location and Price Info */}
        <View style={styles.details}>
          <View style={styles.locationRow}>
            <Icon name="location-outline" size={16} color="#FFFFFF" />
            <Text style={styles.locationText} numberOfLines={1}>
              {locationName || 'Set default address'}
            </Text>
          </View>

          <View style={styles.priceRow}>
            {bestOffer && service.price !== estimatedPrice ? (
              <View style={styles.priceWithDiscount}>
                <Text style={styles.originalPrice}>
                  Rs {service.price}
                </Text>
                <Text style={styles.discountedPrice}>
                  Rs {Math.round(estimatedPrice)}
                </Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>
                    {bestOffer.type === 'percentage'
                      ? `${bestOffer.value}% OFF`
                      : `Rs ${bestOffer.value} OFF`}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.price}>
                Rs {Math.round(estimatedPrice)}
              </Text>
            )}
          </View>
        </View>

        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Booking...</Text>
          </View>
        )}

        {/* Quick Book Icon */}
        {!loading && (
          <View style={styles.quickBookIcon}>
            <Icon name="flash" size={24} color="#FFFFFF" />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradient: {
    borderRadius: 16,
    padding: 16,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  quickBookLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  details: {
    marginTop: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 6,
    flex: 1,
    opacity: 0.95,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  priceWithDiscount: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
  },
  originalPrice: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountedPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  discountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  quickBookIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default QuickBookButton;
