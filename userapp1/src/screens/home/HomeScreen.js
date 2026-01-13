import React, {useEffect, useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  useWindowDimensions,
  Animated,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';

import {useTheme} from '../../context/ThemeContext';
import useAuth from '../../hooks/useAuth';
import useBookingStore from '../../store/bookingStore';
import {
  getServiceCategories,
  getTrackDetails,
} from '../../api/services/booking.service';

import GradientHeader from './components/GradientHeader';
import VibrantSearchBar from './components/VibrantSearchBar';
import QuickActionsSection from './components/QuickActionsSection';
import ServiceGrid from './components/ServiceGrid';
import SpecialOffersCarousel from './components/SpecialOffersCarousel';
import RecentBookings from './components/RecentBookings';
import FloatingActionButton from './components/FloatingActionButton';
import TrackingBanner from './components/TrackingBanner';
import FeedbackModal from './components/FeedbackModal';
import SkeletonLoader from './components/SkeletonLoader';
import EncryptedStorage from 'react-native-encrypted-storage';

const HomeScreen = ({navigation, route}) => {
  const {width, height} = useWindowDimensions();
  const {isDarkMode} = useTheme();
  const {t} = useTranslation();
  const {user, getToken} = useAuth();
  const styles = dynamicStyles(width, height, isDarkMode);
  const scrollY = useRef(new Animated.Value(0)).current;

  // State
  const [services, setServices] = useState([]);
  const [specialOffers, setSpecialOffers] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [trackingData, setTrackingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');
  const [userProfile, setUserProfile] = useState('');
  const [notificationCount, setNotificationCount] = useState(0);

  // Feedback modal (from route params)
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackId, setFeedbackId] = useState(null);

  // Greeting state
  const [greeting, setGreeting] = useState('');
  const [greetingIcon, setGreetingIcon] = useState(null);

  // Initial data fetch
  useEffect(() => {
    fetchInitialData();
    setGreetingBasedOnTime();
  }, []);

  // Handle feedback modal from route params
  useEffect(() => {
    const {encodedId} = route.params || {};
    if (encodedId) {
      try {
        const decoded = atob(encodedId);
        setFeedbackId(decoded);
        setFeedbackModalVisible(true);
      } catch (error) {
        console.error('Failed to decode encodedId:', error);
      }
    }
  }, [route.params]);

  // Refresh tracking data on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchTrackingData();
    }, []),
  );

  // Set greeting based on time of day
  const setGreetingBasedOnTime = () => {
    const currentHour = new Date().getHours();
    let greetingMessage = t('good_day') || 'Good Day';
    let icon = <Icon name="sunny-sharp" size={16} color="#F24E1E" />;

    if (currentHour < 12) {
      greetingMessage = t('good_morning') || 'Good Morning';
      icon = <Icon name="sunny-sharp" size={16} color="#F24E1E" />;
    } else if (currentHour < 17) {
      greetingMessage = t('good_afternoon') || 'Good Afternoon';
      icon = <Feather name="sunset" size={16} color="#F24E1E" />;
    } else {
      greetingMessage = t('good_evening') || 'Good Evening';
      icon = (
        <MaterialIcons
          name="nights-stay"
          size={16}
          color={isDarkMode ? '#fff' : '#000'}
        />
      );
    }

    setGreeting(greetingMessage);
    setGreetingIcon(icon);
  };

  // Fetch initial data
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchServices(),
        fetchSpecialOffers(),
        fetchTrackingData(),
        fetchRecentBookings(),
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch services
  const fetchServices = async () => {
    try {
      const response = await axios.get(
        'https://backend.clicksolver.com/api/servicecategories',
      );
      setServices(response.data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  // Fetch special offers
  const fetchSpecialOffers = async () => {
    try {
      const response = await axios.get(
        'https://backend.clicksolver.com/api/special/offers',
      );
      setSpecialOffers(response.data.offers || []);
    } catch (error) {
      console.error('Error fetching special offers:', error);
    }
  };

  // Fetch tracking data
  const fetchTrackingData = async () => {
    try {
      const response = await getTrackDetails();
      const {track = [], user: userName, profile} = response;

      setTrackingData(track);
      setUserName(userName || '');
      setUserProfile(profile || '');
      setNotificationCount(track.length);
    } catch (error) {
      console.error('Error fetching tracking data:', error);
    }
  };

  // Fetch recent bookings
  const fetchRecentBookings = async () => {
    try {
      const token = await EncryptedStorage.getItem('cs_token');
      if (!token) return;

      const response = await axios.get(
        'https://backend.clicksolver.com/api/user/recent/bookings',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setRecentBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Error fetching recent bookings:', error);
    }
  };

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInitialData();
    setRefreshing(false);
  }, []);

  // Navigation handlers
  const handleServicePress = (serviceId, serviceName) => {
    navigation.push('serviceCategory', {
      serviceObject: serviceName,
      id: serviceId,
    });
  };

  const handleSearchPress = () => {
    navigation.navigate('SearchItem');
  };

  const handleNotificationPress = () => {
    navigation.push('Notifications');
  };

  const handleProfilePress = () => {
    navigation.navigate('Tabs', {screen: 'Account'});
  };

  const handleTrackingPress = item => {
    navigation.push(item.screen, {
      encodedId: item.encodedId,
      area: item.area,
      city: item.city,
      pincode: item.pincode,
      alternateName: item.alternateName,
      alternatePhoneNumber: item.alternatePhoneNumber,
      serviceBooked: item.serviceBooked,
      location: item.location,
      offer: item.offer,
    });
  };

  const handleQuickBookPress = () => {
    // Open quick booking sheet or navigate to booking flow
    navigation.navigate('Services');
  };

  const closeFeedbackModal = () => {
    setFeedbackModalVisible(false);
    setFeedbackId(null);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {loading ? (
          // Show skeleton loader on initial load
          <SkeletonLoader isDarkMode={isDarkMode} />
        ) : (
          <>
            {/* Gradient Header */}
            <GradientHeader
              greeting={greeting}
              greetingIcon={greetingIcon}
              userName={userName}
              userProfile={userProfile}
              notificationCount={notificationCount}
              onNotificationPress={handleNotificationPress}
              onProfilePress={handleProfilePress}
              scrollY={scrollY}
              isDarkMode={isDarkMode}
            />

            {/* Vibrant Search Bar */}
            <VibrantSearchBar
              onPress={handleSearchPress}
              isDarkMode={isDarkMode}
              t={t}
            />

            {/* Main Scrollable Content */}
            <Animated.ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#F24E1E"
                  colors={['#F24E1E', '#FF6B35']}
                />
              }
              onScroll={Animated.event(
                [{nativeEvent: {contentOffset: {y: scrollY}}}],
                {useNativeDriver: false},
              )}
              scrollEventThrottle={16}>
          {/* Quick Actions Section */}
          <QuickActionsSection
            services={services.slice(0, 4)}
            onActionPress={handleServicePress}
            isDarkMode={isDarkMode}
            t={t}
          />

          {/* Special Offers Carousel */}
          {specialOffers.length > 0 && (
            <SpecialOffersCarousel
              offers={specialOffers}
              isDarkMode={isDarkMode}
              t={t}
            />
          )}

          {/* Service Categories Grid */}
          <ServiceGrid
            services={services}
            loading={loading}
            onServicePress={handleServicePress}
            isDarkMode={isDarkMode}
            t={t}
          />

          {/* Recent Bookings */}
          {recentBookings.length > 0 && (
            <RecentBookings
              bookings={recentBookings}
              onBookAgain={handleServicePress}
              isDarkMode={isDarkMode}
              t={t}
            />
          )}
        </Animated.ScrollView>

        {/* Tracking Banner */}
        {trackingData.length > 0 && (
          <TrackingBanner
            trackingData={trackingData}
            onPress={handleTrackingPress}
            isDarkMode={isDarkMode}
            t={t}
            width={width}
          />
        )}

        {/* Floating Action Button */}
        <FloatingActionButton
          onPress={handleQuickBookPress}
          isDarkMode={isDarkMode}
        />

        {/* Feedback Modal */}
        <FeedbackModal
          visible={feedbackModalVisible}
          feedbackId={feedbackId}
          onClose={closeFeedbackModal}
          isDarkMode={isDarkMode}
          t={t}
        />
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const dynamicStyles = (width, height, isDarkMode) => {
  const isTablet = width > 600;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#F8F9FA',
    },
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#F8F9FA',
    },
    scrollContent: {
      paddingBottom: 100,
    },
  });
};

export default HomeScreen;
