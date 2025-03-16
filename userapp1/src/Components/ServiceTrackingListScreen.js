import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  BackHandler,
  Modal,
  ActivityIndicator,
  useWindowDimensions,
  TouchableWithoutFeedback,
  Keyboard,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LottieView from 'lottie-react-native';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import EncryptedStorage from 'react-native-encrypted-storage';
import axios from 'axios';
import uuid from 'react-native-uuid';
import { useNavigation, useRoute, CommonActions, useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import messaging from '@react-native-firebase/messaging';
// Import theme hook
import { useTheme } from '../context/ThemeContext';

const ServiceTrackingListScreen = () => {
  const { width, height } = useWindowDimensions();
  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(width, height, isDarkMode);

  const [serviceData, setServiceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tokenFound, setTokenFound] = useState(true);
  const navigation = useNavigation();

  const filterOptions = ['Collected Item', 'Work started', 'Work Completed'];

  // Fetch Bookings
  const fetchBookings = async () => {
    setLoading(true);
    setError(false);
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
        }
      );
      setServiceData(response.data);
      setFilteredData(response.data); // Initially display all data
    } catch (err) {
      console.error('Error fetching bookings data:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchBookings();
  }, []);

  // Listen for FCM notifications. If notification.data has a "status" key, call fetchBookings.
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('FCM notification received in ServiceTrackingListScreen:', remoteMessage);
      if (remoteMessage.data && remoteMessage.data.status) {
        console.log('Notification has status data. Refreshing bookings...');
        fetchBookings();
      }
    });
    return () => unsubscribe();
  }, []);

  const formatDate = (created_at) => {
    const date = new Date(created_at);
    const monthNames = [
      'January','February','March','April','May','June',
      'July','August','September','October','November','December',
    ];
    return `${monthNames[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}, ${date.getFullYear()}`;
  };

  const handleCardPress = (trackingId) => {
    navigation.push('ServiceTrackingItem', { tracking_id: trackingId });
  };

  const toggleFilter = (status) => {
    const updatedFilters = selectedFilters.includes(status)
      ? selectedFilters.filter((s) => s !== status)
      : [...selectedFilters, status];

    setSelectedFilters(updatedFilters);

    const filtered =
      updatedFilters.length > 0
        ? serviceData.filter((item) => updatedFilters.includes(item.service_status))
        : serviceData;

    setFilteredData(filtered);
  };

  const handleOutsidePress = () => {
    if (isFilterVisible) {
      setIsFilterVisible(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => handleCardPress(item.tracking_id)}
    >
      <View style={styles.serviceIconContainer}>
        <MaterialCommunityIcons
          name={
            item.service_status === 'Work Completed'
              ? 'check-circle'
              : item.service_status === 'Work started'
              ? 'hammer'
              : 'truck'
          }
          size={24}
          color="#ffffff"
        />
      </View>
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemTitle}>{item.service_status}</Text>
        <Text style={styles.itemDate}>{formatDate(item.created_at)}</Text>
        <Text style={styles.itemDate}>{item.tracking_key}</Text>
      </View>
      <View
        style={[
          styles.statusLabel,
          item.service_status === 'Collected Item'
            ? styles.inProgress
            : item.service_status === 'Work Completed'
            ? styles.completed
            : styles.onTheWay,
        ]}
      >
        <Text style={styles.statusText}>
          {item.service_status === 'Work Completed'
            ? 'Completed'
            : item.service_status === 'Work started'
            ? 'In Progress'
            : item.service_status === 'Collected Item'
            ? 'Item Collected'
            : 'On the Way'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={handleOutsidePress}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <Icon name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#000'} />
            <Text style={styles.headerTitle}>Service Tracking</Text>
            <TouchableOpacity onPress={() => setIsFilterVisible(!isFilterVisible)}>
              <Icon name="filter-list" size={24} color={isDarkMode ? '#fff' : '#000'} />
            </TouchableOpacity>
          </View>

          {/* Filter Dropdown */}
          {isFilterVisible && (
            <View style={styles.dropdownContainer}>
              <Text style={styles.dropdownTitle}>PROJECT TYPE</Text>
              {filterOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dropdownOption}
                  onPress={() => toggleFilter(option)}
                >
                  <Icon
                    name={
                      selectedFilters.includes(option)
                        ? 'check-box'
                        : 'check-box-outline-blank'
                    }
                    size={20}
                    color="#4a4a4a"
                  />
                  <Text style={styles.dropdownText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Service List */}
          <View style={styles.trackingItems}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <LottieView
                  source={require('../assets/searchLoading.json')}
                  autoPlay
                  loop
                  style={styles.loadingAnimation}
                />
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                  Something went wrong. Please try again.
                </Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchBookings}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : !tokenFound || filteredData.length === 0 ? (
              <View style={styles.noDataContainer}>
                <Icon name="search-off" size={48} color="#888" />
                <Text style={styles.noDataText}>No trackings available</Text>
              </View>
            ) : (
              <FlatList
                data={filteredData}
                renderItem={renderItem}
                keyExtractor={() => uuid.v4()}
                contentContainerStyle={styles.listContainer}
              />
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const dynamicStyles = (width, height, isDarkMode) => {
  const isTablet = width >= 600;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
    },
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: isTablet ? 24 : 16,
      paddingVertical: isTablet ? 20 : 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      backgroundColor: isDarkMode ? '#333' : '#ffffff',
      zIndex: 1,
    },
    headerTitle: {
      fontSize: isTablet ? 20 : 18,
      fontFamily: 'RobotoSlab-Medium',
      color: isDarkMode ? '#fff' : '#000',
    },
    dropdownContainer: {
      position: 'absolute',
      top: isTablet ? 90 : 70,
      right: isTablet ? 24 : 16,
      width: isTablet ? 220 : 200,
      backgroundColor: isDarkMode ? '#333' : '#ffffff',
      borderRadius: 8,
      padding: isTablet ? 12 : 10,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      zIndex: 10,
    },
    dropdownTitle: {
      fontSize: isTablet ? 16 : 14,
      fontFamily: 'RobotoSlab-SemiBold',
      color: isDarkMode ? '#ccc' : '#212121',
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
      color: '#4a4a4a',
      fontFamily: 'RobotoSlab-Regular',
    },
    trackingItems: {
      flex: 1,
      paddingTop: isTablet ? 20 : 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingAnimation: {
      flex: 1,
      width: '100%',
      height: '100%',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    errorText: {
      fontSize: isTablet ? 18 : 16,
      color: isDarkMode ? '#fff' : '#000',
      marginBottom: 10,
      fontFamily: 'RobotoSlab-Medium',
      textAlign: 'center',
    },
    retryButton: {
      backgroundColor: '#ff5722',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 5,
    },
    retryButtonText: {
      color: '#fff',
      fontSize: isTablet ? 16 : 14,
      fontFamily: 'RobotoSlab-Medium',
    },
    listContainer: {
      paddingHorizontal: isTablet ? 24 : 16,
    },
    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDarkMode ? '#333' : '#fff',
      borderRadius: 10,
      padding: isTablet ? 20 : 16,
      marginBottom: isTablet ? 20 : 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    serviceIconContainer: {
      width: isTablet ? 50 : 40,
      height: isTablet ? 50 : 40,
      backgroundColor: '#ff5722',
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
      color: isDarkMode ? '#fff' : '#212121',
    },
    itemDate: {
      fontSize: isTablet ? 14 : 12,
      color: isDarkMode ? '#bbb' : '#4a4a4a',
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
    noDataContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 20,
    },
    noDataText: {
      fontSize: isTablet ? 18 : 16,
      color: isDarkMode ? '#fff' : '#212121',
      textAlign: 'center',
      marginTop: 10,
    },
  });
};

export default ServiceTrackingListScreen;
