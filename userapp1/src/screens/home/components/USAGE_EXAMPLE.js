/**
 * Example: Home Screen Integration
 * This file demonstrates how to use the home screen components
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import {
  QuickActions,
  ServiceCategories,
  OffersCarousel,
  RecentServicesComponent,
  SearchBar,
} from './components';
import {useTheme} from '../../context/ThemeContext';
import {getColors} from '../../theme/colors';

const HomeScreenExample = ({navigation}) => {
  const {isDarkMode} = useTheme();
  const colors = getColors(isDarkMode);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sample data - replace with actual API calls
  const [quickActions] = useState([
    {id: 1, label: 'Electrician', key: 'electrician'},
    {id: 2, label: 'Plumber', key: 'plumber'},
    {id: 3, label: 'Cleaning', key: 'cleaning'},
    {id: 4, label: 'Painter', key: 'painter'},
    {id: 5, label: 'Mechanic', key: 'mechanic'},
    {id: 6, label: 'Carpenter', key: 'carpenter'},
  ]);

  const [categories] = useState([
    {
      id: 1,
      name: 'Electrical Services',
      imageUrl:
        'https://i.postimg.cc/HsGnL9F1/58d3ebe039b0649cfcabe95ae59f4328.png',
      startingPrice: 299,
    },
    {
      id: 2,
      name: 'Plumbing',
      imageUrl:
        'https://i.postimg.cc/rwtnJ3vB/b08a4579e19f4587bc9915bc0f7502ee.png',
      startingPrice: 349,
    },
    {
      id: 3,
      name: 'Home Cleaning',
      imageUrl:
        'https://i.postimg.cc/Kzwh9wZC/4c63fba81d3b7ef9ca889096ad629283.png',
      startingPrice: 499,
    },
    {
      id: 4,
      name: 'AC Repair',
      imageUrl:
        'https://i.postimg.cc/HsGnL9F1/58d3ebe039b0649cfcabe95ae59f4328.png',
      startingPrice: 399,
    },
  ]);

  const [offers] = useState([
    {
      id: 1,
      title: 'New User Special',
      description: 'Get 20% off on your first booking',
      discount: '20% OFF',
      badge: 'NEW USER',
      imageUrl:
        'https://i.postimg.cc/HsGnL9F1/58d3ebe039b0649cfcabe95ae59f4328.png',
    },
    {
      id: 2,
      title: 'Summer Sale',
      description: 'Enjoy 50% discount on all services',
      discount: '50% OFF',
      badge: 'LIMITED TIME',
      imageUrl:
        'https://i.postimg.cc/rwtnJ3vB/b08a4579e19f4587bc9915bc0f7502ee.png',
    },
    {
      id: 3,
      title: 'Refer & Earn',
      description: 'Get 30% off when you refer a friend',
      discount: '30% OFF',
      badge: 'REFERRAL',
      imageUrl:
        'https://i.postimg.cc/Kzwh9wZC/4c63fba81d3b7ef9ca889096ad629283.png',
    },
  ]);

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    // Fetch fresh data here
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  // Event Handlers
  const handleQuickActionPress = action => {
    console.log('Quick action pressed:', action);
    navigation.navigate('serviceCategory', {
      serviceObject: action.label,
      id: action.id,
    });
  };

  const handleSearchFocus = () => {
    console.log('Search focused');
    navigation.navigate('SearchItem');
  };

  const handleSearch = query => {
    console.log('Search query:', query);
  };

  const handleCategoryPress = category => {
    console.log('Category pressed:', category);
    navigation.navigate('serviceCategory', {
      serviceObject: category.name,
      id: category.id,
    });
  };

  const handleQuickBook = category => {
    console.log('Quick book:', category);
    navigation.navigate('serviceCategory', {
      serviceObject: category.name,
      id: category.id,
      quickBook: true,
    });
  };

  const handleOfferPress = offer => {
    console.log('Offer pressed:', offer);
    // Navigate to offer details or apply offer
  };

  const handleBookAgain = service => {
    console.log('Book again:', service);
    if (service.service_booked && service.service_booked.length > 0) {
      navigation.navigate('serviceCategory', {
        serviceObject: service.service_booked[0].serviceName,
        id: service.service_booked[0].main_service_id,
      });
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {backgroundColor: isDarkMode ? '#0F0F1E' : '#FFFFFF'},
      ]}>
      <View style={styles.container}>
        {/* Header could go here */}
        <View style={styles.header}>
          <Text
            style={[
              styles.headerTitle,
              {color: isDarkMode ? '#FFFFFF' : '#1A1A1A'},
            ]}>
            Home
          </Text>
        </View>

        {/* Search Bar */}
        <SearchBar
          onFocus={handleSearchFocus}
          onSearch={handleSearch}
          placeholder="Search for services..."
          showTrendingChips={true}
          showVoiceSearch={true}
        />

        {/* Scrollable Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.scrollContent}>
          {/* Quick Actions */}
          <QuickActions
            actions={quickActions}
            onActionPress={handleQuickActionPress}
          />

          {/* Offers Carousel */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                {color: isDarkMode ? '#FFFFFF' : '#1A1A1A'},
              ]}>
              Special Offers
            </Text>
            <OffersCarousel offers={offers} onOfferPress={handleOfferPress} />
          </View>

          {/* Service Categories */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                {color: isDarkMode ? '#FFFFFF' : '#1A1A1A'},
              ]}>
              Our Services
            </Text>
            <ServiceCategories
              categories={categories}
              onCategoryPress={handleCategoryPress}
              onQuickBook={handleQuickBook}
              loading={loading}
            />
          </View>

          {/* Recent Services */}
          <RecentServicesComponent onBookAgain={handleBookAgain} />

          {/* Bottom Spacing */}
          <View style={{height: 40}} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'RobotoSlab-Bold',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'RobotoSlab-Bold',
    marginBottom: 16,
  },
});

export default HomeScreenExample;
