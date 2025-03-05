import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
  useWindowDimensions,
  Image
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import EncryptedStorage from 'react-native-encrypted-storage';
import Entypo from 'react-native-vector-icons/Entypo';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

// 1) Define a sub-component that accepts `styles` as a prop.
const ServiceItem = ({ item, formatDate, styles }) => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => {
        navigation.push('serviceBookingItem', {
          tracking_id: item.notification_id,
        });
      }}
    >
      <View style={styles.itemMainContainer}>
        {/* <View style={styles.iconContainer}>
          {item.payment_type === 'cash' ? (
            <Entypo name="wallet" size={20} color="#ffffff" />
          ) : (
            <MaterialCommunityIcons name="bank" size={20} color="#ffffff" />
          )}
        </View> */}
        <View style={styles.imageContainer1}>
          <Image
            style={styles.imageContainer} 
            source={
              item.service_booked &&
              item.service_booked.length > 0 &&
              item.service_booked[0]?.imageUrl
                ? { uri: item.service_booked[0].imageUrl }
                : { uri: item.service_booked[0].url } // <-- Fallback image
            }
            resizeMode="cover"
          />
        </View>
        <View style={styles.itemDetails}>
          <Text style={styles.title}>
            {item.service_booked
              ? item.service_booked[0].serviceName
              : item.service}
          </Text>
          <Text style={styles.schedule}>{formatDate(item.created_at)}</Text>
        </View>
        <View>
          <Text style={styles.price}>₹{item.payment}</Text>
          <Text style={styles.paymentDetails}>
            {item.payment_type === 'cash'
              ? 'Paid to you'
              : 'Paid to click solver'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const RecentServices = () => {
  // 2) Use `useWindowDimensions` for dynamic styling
  const { width, height } = useWindowDimensions();
  const styles = dynamicStyles(width, height);

  const [bookingsData, setBookingsData] = useState([]);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);

  const filterOptions = ['Completed', 'Cancelled'];

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const token = await EncryptedStorage.getItem('pcs_token');
        if (!token) throw new Error('Token not found');

        const response = await axios.get(
          'https://backend.clicksolver.com/api/worker/bookings',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        console.log(response.data)
        setBookingsData(response.data);
        setFilteredData(response.data);
      } catch (error) {
        console.error('Error fetching bookings data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const formatDate = (created_at) => {
    const date = new Date(created_at);
    const monthNames = [
      'January','February','March','April','May','June',
      'July','August','September','October','November','December',
    ];
    return `${monthNames[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}, ${date.getFullYear()}`;
  };

  const toggleFilter = (status) => {
    const updatedFilters = selectedFilters.includes(status)
      ? selectedFilters.filter((s) => s !== status)
      : [...selectedFilters, status];

    setSelectedFilters(updatedFilters);

    // Apply filter
    const filtered =
      updatedFilters.length > 0
        ? bookingsData.filter((item) => {
            const itemStatus = item.payment !== null ? 'Completed' : 'Cancelled';
            return updatedFilters.includes(itemStatus);
          })
        : bookingsData;

    setFilteredData(filtered);
  };

  const handleOutsidePress = () => {
    if (isFilterVisible) {
      setIsFilterVisible(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handleOutsidePress}>
      <SafeAreaView style={styles.screenContainer}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.sortContainerLeft}>
            <Feather name="shopping-cart" size={18} color="#212121" />
            <Text style={styles.headerTitle}>My services</Text>
          </View>
          <TouchableOpacity
            onPress={() => setIsFilterVisible(!isFilterVisible)}
            style={styles.sortContainerRight}
          >
            <Text style={styles.sortText}>Sort by Status</Text>
            <Icon name="filter-list" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Dropdown */}
        {isFilterVisible && (
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownTitle}>SORT BY STATUS</Text>
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

        {/* List */}
        <View style={styles.serviceContainer}>
          {loading ? (
            <ActivityIndicator
              size="large"
              color="#FF5722"
              style={styles.loadingIndicator}
            />
          ) : filteredData.length === 0 ? (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No data available</Text>
            </View>
          ) : (
            <FlatList
              data={filteredData}
              renderItem={({ item }) => (
                <ServiceItem
                  item={item}
                  formatDate={formatDate}
                  styles={styles} // 3) Pass styles here
                />
              )}
              keyExtractor={(item, index) => index.toString()}
            />
          )}
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

/**
 * Returns a StyleSheet based on screen width/height.
 * If `width >= 600`, we treat it as a tablet and scale up certain styles.
 */
function dynamicStyles(width, height) {
  const isTablet = width >= 600;

  return StyleSheet.create({
    screenContainer: {
      flex: 1,
      backgroundColor: '#f3f3f3',
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: isTablet ? 24 : 16,
      paddingVertical: isTablet ? 18 : 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      backgroundColor: '#ffffff',
      zIndex: 1,
    },
    sortContainerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sortContainerRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: isTablet ? 20 : 18,
      fontWeight: 'bold',
      color: '#000',
      marginLeft: 7,
    },
    sortText: {
      fontSize: isTablet ? 18 : 16,
      marginRight: 8,
      fontWeight: 'bold',
      color: '#212121',
    },
    dropdownContainer: {
      position: 'absolute',
      top: isTablet ? 80 : 70,
      right: isTablet ? 24 : 16,
      width: isTablet ? 240 : 200,
      backgroundColor: '#ffffff',
      borderRadius: 8,
      padding: 10,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      zIndex: 10,
    },
    dropdownTitle: {
      fontSize: isTablet ? 16 : 14,
      fontWeight: 'bold',
      color: '#212121',
      marginBottom: 8,
    },
    dropdownOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
    },
    dropdownText: {
      marginLeft: 8,
      fontSize: isTablet ? 15 : 14,
      color: '#4a4a4a',
    },
    serviceContainer: {
      flex: 1,
      paddingHorizontal: isTablet ? 24 : 16,
      paddingTop: isTablet ? 14 : 10,
    },
    itemContainer: {
      backgroundColor: '#ffffff',
      marginHorizontal: isTablet ? 8 : 5,
      padding: isTablet ? 20 : 18,
      borderRadius: 10,
      marginBottom: isTablet ? 14 : 12,
      shadowColor: '#000',
      // elevation: 1,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    itemMainContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    iconContainer: {
      width: isTablet ? 50 : 45,
      height: isTablet ? 50 : 45,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#ff4500',
      borderRadius: isTablet ? 25 : 22.5,
      marginRight: 5,
    },
    imageContainer:{
      width: isTablet ? 65 : 55,
      height: isTablet ? 65 : 55,
      alignItems: 'center',
      justifyContent: 'center',
      // backgroundColor: '#ff4500',
      borderRadius: isTablet ? 10: 5,
      marginRight: 5,
    },
    itemDetails: {
      flex: 1,
      marginRight: 8,
    },
    title: {
      fontSize: isTablet ? 17 : 16,
      fontWeight: 'bold',
      color: '#212121',
      marginBottom: 3,
    },
    schedule: {
      fontSize: isTablet ? 14 : 13,
      color: '#9e9e9e',
    },
    price: {
      fontSize: isTablet ? 17 : 16,
      fontWeight: 'bold',
      color: '#212121',
      textAlign: 'right',
      marginBottom: 3,
    },
    paymentDetails: {
      fontSize: isTablet ? 14 : 12,
      color: '#9e9e9e',
      textAlign: 'right',
    },
    loadingIndicator: {
      marginTop: 20,
      alignSelf: 'center',
    },
    noDataContainer: {
      marginTop: 20,
      alignItems: 'center',
    },
    noDataText: {
      fontSize: isTablet ? 17 : 16,
      color: '#212121',
    },
  });
}

export default RecentServices;
