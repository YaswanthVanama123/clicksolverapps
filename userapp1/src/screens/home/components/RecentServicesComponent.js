import React, {memo, useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import {useNavigation} from '@react-navigation/native';
import {useTheme} from '../../../context/ThemeContext';
import {GRADIENTS} from '../../../theme/gradients';
import {getColors} from '../../../theme/colors';

const formatDate = dateString => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const options = {month: 'short', day: 'numeric'};
  return date.toLocaleDateString('en-US', options);
};

const RecentServiceCard = memo(
  ({service, onBookAgain, onPress, isDarkMode, colors}) => {
    const serviceName =
      service.service_booked && service.service_booked.length > 0
        ? service.service_booked[0].serviceName
        : 'Service';

    const imageUrl =
      service.service_booked && service.service_booked.length > 0
        ? service.service_booked[0].imageUrl
        : null;

    const workerName = service.worker_name || 'Commander';
    const serviceDate = formatDate(service.created_at);

    return (
      <TouchableOpacity
        style={[
          styles.serviceCard,
          {backgroundColor: isDarkMode ? '#1A1A2E' : '#F8F9FA'},
        ]}
        onPress={() => onPress(service)}
        activeOpacity={0.8}>
        <View style={styles.cardContent}>
          {/* Service Image */}
          {imageUrl ? (
            <Image source={{uri: imageUrl}} style={styles.serviceImage} />
          ) : (
            <View
              style={[
                styles.serviceImage,
                styles.placeholderImage,
                {backgroundColor: isDarkMode ? '#333' : '#E5E7EB'},
              ]}>
              <Icon
                name="construct"
                size={24}
                color={isDarkMode ? '#666' : '#9CA3AF'}
              />
            </View>
          )}

          {/* Service Details */}
          <View style={styles.serviceDetails}>
            <Text
              style={[
                styles.serviceName,
                {color: isDarkMode ? '#FFFFFF' : '#1A1A1A'},
              ]}
              numberOfLines={1}>
              {serviceName}
            </Text>

            <View style={styles.detailRow}>
              <Icon
                name="calendar-outline"
                size={14}
                color={isDarkMode ? '#B4B4B4' : '#6B7280'}
              />
              <Text
                style={[
                  styles.detailText,
                  {color: isDarkMode ? '#B4B4B4' : '#6B7280'},
                ]}>
                {serviceDate}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Icon
                name="person-outline"
                size={14}
                color={isDarkMode ? '#B4B4B4' : '#6B7280'}
              />
              <Text
                style={[
                  styles.detailText,
                  {color: isDarkMode ? '#B4B4B4' : '#6B7280'},
                ]}
                numberOfLines={1}>
                {workerName}
              </Text>
            </View>
          </View>
        </View>

        {/* Book Again Button */}
        <TouchableOpacity
          style={styles.bookAgainButton}
          onPress={e => {
            e.stopPropagation();
            onBookAgain(service);
          }}
          activeOpacity={0.8}>
          <LinearGradient
            colors={GRADIENTS.primaryGradient.colors}
            start={GRADIENTS.primaryGradient.start}
            end={GRADIENTS.primaryGradient.end}
            style={styles.bookAgainGradient}>
            <MaterialCommunityIcons name="repeat" size={16} color="#FFFFFF" />
            <Text style={styles.bookAgainText}>Book Again</Text>
          </LinearGradient>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  },
);

const RecentServices = ({onBookAgain}) => {
  const {width} = useWindowDimensions();
  const {isDarkMode} = useTheme();
  const colors = getColors(isDarkMode);
  const navigation = useNavigation();
  const [recentServices, setRecentServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentServices();
  }, []);

  const fetchRecentServices = async () => {
    try {
      const token = await EncryptedStorage.getItem('cs_token');
      if (token) {
        const response = await axios.get(
          'https://backend.clicksolver.com/api/user/bookings',
          {
            headers: {Authorization: `Bearer ${token}`},
          },
        );

        if (response.data && Array.isArray(response.data)) {
          // Filter completed services and get most recent 5
          const completed = response.data
            .filter(
              service =>
                service.complete_status !== 'cancel' &&
                service.complete_status !== 'usercanceled' &&
                service.complete_status !== 'workercanceled',
            )
            .slice(0, 5);
          setRecentServices(completed);
        }
      }
    } catch (error) {
      console.log('Error fetching recent services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAgain = service => {
    if (onBookAgain) {
      onBookAgain(service);
    }
  };

  const handleServicePress = service => {
    navigation.navigate('serviceBookingItem', {
      tracking_id: service.notification_id,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (recentServices.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text
          style={[
            styles.sectionTitle,
            {color: isDarkMode ? '#FFFFFF' : '#1A1A1A'},
          ]}>
          Recent Services
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('RecentServices')}
          activeOpacity={0.7}>
          <Text style={[styles.seeAllText, {color: colors.primary}]}>
            See All
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {recentServices.map((service, index) => (
          <RecentServiceCard
            key={service.notification_id || index}
            service={service}
            onBookAgain={handleBookAgain}
            onPress={handleServicePress}
            isDarkMode={isDarkMode}
            colors={colors}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'RobotoSlab-Bold',
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: 'RobotoSlab-Medium',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  serviceCard: {
    width: 280,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  serviceImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  serviceName: {
    fontSize: 15,
    fontFamily: 'RobotoSlab-SemiBold',
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    fontFamily: 'RobotoSlab-Regular',
    flex: 1,
  },
  bookAgainButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  bookAgainGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  bookAgainText: {
    fontSize: 14,
    fontFamily: 'RobotoSlab-Bold',
    color: '#FFFFFF',
  },
  loadingContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default memo(RecentServices);
