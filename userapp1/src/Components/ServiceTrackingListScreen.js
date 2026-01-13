/**
 * ServiceTrackingListScreen Component
 * Displays a list of all service tracking items with filtering capabilities
 * Shows ongoing and completed service bookings with status indicators
 */

import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  TouchableWithoutFeedback,
  FlatList,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import EncryptedStorage from 'react-native-encrypted-storage';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import messaging from '@react-native-firebase/messaging';

// Theme and styling
import {useTheme} from '../context/ThemeContext';
import {getColors} from '../theme/colors';

// State components
import LoadingState from './molecules/LoadingState';
import EmptyState from './molecules/EmptyState';
import ErrorState from './molecules/ErrorState';

// Utilities
import {formatDate, formatRelativeTime} from '../utils/formatters';

// API services
import axios from 'axios';

// i18n
import i18n from '../i18n/i18n';

/**
 * ServiceTrackingListScreen Component
 * @returns {JSX.Element} Service tracking list screen
 */
const ServiceTrackingListScreen = () => {
  // Screen dimensions and theme
  const {width, height} = useWindowDimensions();
  const {isDarkMode, theme} = useTheme();
  const colors = getColors(isDarkMode);
  const {t} = useTranslation();
  const styles = dynamicStyles(width, height, isDarkMode, colors);
  const navigation = useNavigation();

  // Define raw filter options (backend status values)
  const rawFilterOptions = ['Collected Item', 'Work started', 'Work Completed'];

  // Mapping from raw status key to translated text for display
  const statusTranslationMapping = {
    'Collected Item': t('collected_item') || 'Collected Item',
    'Work started': t('work_started') || 'Work Started',
    'Work Completed': t('work_completed') || 'Work Completed',
  };

  // State management
  const [serviceData, setServiceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tokenFound, setTokenFound] = useState(true);

  /**
   * Fetch bookings from API
   */
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await EncryptedStorage.getItem('cs_token');
      if (!token) {
        setTokenFound(false);
        setServiceData([]);
        setFilteredData([]);
        setLoading(false);
        return;
      }
      setTokenFound(true);

      const response = await axios.get(
        'https://backend.clicksolver.com/api/user/tracking/services',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // Sort data in descending order using the created_at date
      const sortedData = [...response.data].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );
      setServiceData(sortedData);
      setFilteredData(sortedData);
    } catch (err) {
      console.error('Error fetching bookings data:', err);
      setError({
        message: t('fetch_error') || 'Failed to fetch tracking services',
        originalError: err,
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  /**
   * Initial data fetch
   */
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  /**
   * Listen for FCM notifications and refresh data
   */
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      if (remoteMessage.data?.status) {
        fetchBookings();
      }
    });
    return () => unsubscribe();
  }, [fetchBookings]);

  /**
   * Format date string to localized format
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  const formatDateString = useCallback((dateString) => {
    if (!dateString) return t('pending') || 'Pending';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(date);
  }, [t]);

  /**
   * Handle card press to navigate to details
   * @param {string} trackingId - Tracking ID
   */
  const handleCardPress = useCallback((trackingId) => {
    navigation.push('ServiceTrackingItem', {tracking_id: trackingId});
  }, [navigation]);

  /**
   * Toggle filter selection
   * @param {string} statusKey - Status key to toggle
   */
  const toggleFilter = useCallback((statusKey) => {
    setSelectedFilters(prevFilters => {
      const updatedFilters = prevFilters.includes(statusKey)
        ? prevFilters.filter(s => s !== statusKey)
        : [...prevFilters, statusKey];

      // Apply filters
      const filtered =
        updatedFilters.length > 0
          ? serviceData.filter(item =>
              updatedFilters.includes(item.service_status),
            )
          : serviceData;

      // Maintain descending order after filtering
      const sortedFiltered = [...filtered].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );
      setFilteredData(sortedFiltered);

      return updatedFilters;
    });
  }, [serviceData]);

  /**
   * Close filter dropdown on outside press
   */
  const handleOutsidePress = useCallback(() => {
    if (isFilterVisible) {
      setIsFilterVisible(false);
    }
  }, [isFilterVisible]);

  /**
   * Get icon name based on service status
   * @param {string} status - Service status
   * @returns {string} Icon name
   */
  const getStatusIcon = useCallback((status) => {
    switch (status) {
      case 'Work Completed':
        return 'check-circle';
      case 'Work started':
        return 'hammer';
      case 'Collected Item':
      default:
        return 'truck';
    }
  }, []);

  /**
   * Get translated status text
   * @param {string} status - Service status
   * @returns {string} Translated status
   */
  const getStatusText = useCallback((status) => {
    switch (status) {
      case 'Work Completed':
        return t('work_completed') || 'Completed';
      case 'Work started':
        return t('in_progress') || 'In Progress';
      case 'Collected Item':
        return t('collected_item') || 'Item Collected';
      default:
        return t('on_the_way') || 'On the Way';
    }
  }, [t]);

  /**
   * Get status style based on service status
   * @param {string} status - Service status
   * @returns {object} Style object
   */
  const getStatusStyle = useCallback((status) => {
    switch (status) {
      case 'Work Completed':
        return styles.completed;
      case 'Work started':
        return styles.inProgress;
      case 'Collected Item':
      default:
        return styles.onTheWay;
    }
  }, [styles]);

  /**
   * Render individual tracking item
   * @param {object} item - Tracking item data
   * @returns {JSX.Element} Tracking item component
   */
  const renderItem = useCallback(({item}) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => handleCardPress(item.tracking_id)}
      accessibilityRole="button"
      accessibilityLabel={`View tracking details for ${item.tracking_key}`}>
      <View style={styles.serviceIconContainer}>
        <MaterialCommunityIcons
          name={getStatusIcon(item.service_status)}
          size={24}
          color="#ffffff"
        />
      </View>
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemTitle}>{getStatusText(item.service_status)}</Text>
        <Text style={styles.itemDate}>{formatDateString(item.created_at)}</Text>
        <Text style={styles.itemDate}>{item.tracking_key}</Text>
      </View>
      <View
        style={[
          styles.statusLabel,
          getStatusStyle(item.service_status),
        ]}>
        <Text style={styles.statusText}>
          {t('view') || 'View'}
        </Text>
      </View>
    </TouchableOpacity>
  ), [styles, handleCardPress, getStatusIcon, getStatusText, getStatusStyle, formatDateString, t]);

  /**
   * Navigate back
   */
  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <LoadingState message={t('loading_trackings') || 'Loading trackings...'} />
      </SafeAreaView>
    );
  }

  // Show error state
  if (error) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={handleBackPress}>
              <Icon
                name="arrow-back"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {t('service_tracking') || 'Service Tracking'}
            </Text>
            <View style={{width: 24}} />
          </View>
          <ErrorState
            error={error.message}
            onRetry={fetchBookings}
            title={t('error') || 'Error'}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <TouchableWithoutFeedback onPress={handleOutsidePress}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <TouchableOpacity
              onPress={handleBackPress}
              accessibilityRole="button"
              accessibilityLabel={t('go_back') || 'Go back'}>
              <Icon
                name="arrow-back"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {t('service_tracking') || 'Service Tracking'}
            </Text>
            <TouchableOpacity
              onPress={() => setIsFilterVisible(!isFilterVisible)}
              accessibilityRole="button"
              accessibilityLabel={t('toggle_filter') || 'Toggle filter'}>
              <Icon
                name="filter-list"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          {/* Filter Dropdown */}
          {isFilterVisible && (
            <View style={styles.dropdownContainer}>
              <Text style={styles.dropdownTitle}>
                {t('project_type') || 'PROJECT TYPE'}
              </Text>
              {rawFilterOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dropdownOption}
                  onPress={() => toggleFilter(option)}
                  accessibilityRole="checkbox"
                  accessibilityState={{checked: selectedFilters.includes(option)}}>
                  <Icon
                    name={
                      selectedFilters.includes(option)
                        ? 'check-box'
                        : 'check-box-outline-blank'
                    }
                    size={20}
                    color={colors.text}
                  />
                  <Text style={styles.dropdownText}>
                    {statusTranslationMapping[option]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Service List */}
          <View style={styles.trackingItems}>
            {!tokenFound || filteredData.length === 0 ? (
              <EmptyState
                icon="search-off"
                title={tokenFound
                  ? t('no_results_found') || 'No Results Found'
                  : t('no_trackings_available') || 'No Trackings Available'}
                message={tokenFound
                  ? t('try_adjusting_filters') || 'Try adjusting your filters'
                  : t('login_to_view_trackings') || 'Please login to view your trackings'}
                actionLabel={!tokenFound ? t('login') || 'Login' : null}
                onAction={!tokenFound ? () => navigation.navigate('Auth') : null}
              />
            ) : (
              <FlatList
                data={filteredData}
                renderItem={renderItem}
                keyExtractor={(item, index) =>
                  `${item.notification_id}_${index}`
                }
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

/**
 * Dynamic styles with dark theme support
 * @param {number} width - Screen width
 * @param {number} height - Screen height
 * @param {boolean} isDarkMode - Dark mode flag
 * @param {object} colors - Theme colors
 * @returns {object} StyleSheet object
 */
const dynamicStyles = (width, height, isDarkMode, colors) => {
  const isTablet = width >= 600;
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: isTablet ? 24 : 16,
      paddingVertical: isTablet ? 20 : 16,
      backgroundColor: colors.background,
      zIndex: 1,
    },
    headerTitle: {
      fontSize: isTablet ? 20 : 18,
      fontFamily: 'RobotoSlab-Medium',
      color: colors.text,
    },
    dropdownContainer: {
      position: 'absolute',
      top: isTablet ? 90 : 70,
      right: isTablet ? 24 : 16,
      width: isTablet ? 220 : 200,
      backgroundColor: colors.cardBackground,
      borderRadius: 8,
      padding: isTablet ? 12 : 10,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.15,
      shadowRadius: 4,
      zIndex: 10,
    },
    dropdownTitle: {
      fontSize: isTablet ? 16 : 14,
      fontFamily: 'RobotoSlab-SemiBold',
      color: colors.text,
      marginBottom: 8,
    },
    dropdownOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: isTablet ? 10 : 8,
    },
    dropdownText: {
      marginLeft: 8,
      fontSize: isTablet ? 16 : 14,
      color: colors.text,
      fontFamily: 'RobotoSlab-Regular',
    },
    trackingItems: {
      flex: 1,
      paddingTop: isTablet ? 20 : 16,
    },
    listContainer: {
      paddingHorizontal: isTablet ? 24 : 16,
      paddingBottom: isTablet ? 24 : 16,
    },
    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.cardBackground,
      borderRadius: 10,
      padding: isTablet ? 20 : 16,
      marginBottom: isTablet ? 20 : 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    serviceIconContainer: {
      width: isTablet ? 50 : 40,
      height: isTablet ? 50 : 40,
      backgroundColor: colors.primary,
      borderRadius: isTablet ? 25 : 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isTablet ? 12 : 8,
    },
    itemTextContainer: {
      flex: 2,
      marginRight: isTablet ? 12 : 8,
    },
    itemTitle: {
      fontSize: isTablet ? 16 : 14,
      fontFamily: 'RobotoSlab-Medium',
      color: colors.text,
    },
    itemDate: {
      fontSize: isTablet ? 14 : 12,
      color: colors.textSecondary,
      fontFamily: 'RobotoSlab-Regular',
    },
    statusLabel: {
      borderRadius: 10,
      paddingVertical: isTablet ? 10 : 8,
      paddingHorizontal: isTablet ? 14 : 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    inProgress: {
      backgroundColor: '#ffecb3',
    },
    completed: {
      backgroundColor: '#c8e6c9',
    },
    onTheWay: {
      backgroundColor: '#bbdefb',
    },
    statusText: {
      fontSize: isTablet ? 14 : 12,
      fontFamily: 'RobotoSlab-Medium',
      color: '#212121',
    },
  });
};

export default ServiceTrackingListScreen;
