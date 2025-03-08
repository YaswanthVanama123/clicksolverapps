import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TouchableWithoutFeedback,
  useWindowDimensions,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons'; 
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'; 
import Feather from 'react-native-vector-icons/Feather';
import EncryptedStorage from 'react-native-encrypted-storage';
import Entypo from 'react-native-vector-icons/Entypo';
import axios from 'axios';
import {useNavigation} from '@react-navigation/native';
import LottieView from 'lottie-react-native';

const ServiceItem = ({ item, formatDate, styles }) => {
  const navigation = useNavigation();

  // Determine if the service is canceled (assuming payment === null means canceled)
  const isCancelled = item.payment === null;

  return (
    <TouchableOpacity
      style={[
        styles.itemContainer,
        isCancelled && styles.cancelledItemContainer,
      ]}
      onPress={() => {
        navigation.push('serviceBookingItem', {
          tracking_id: item.notification_id,
        });
      }}
    >
      <View style={styles.itemMainContainer}>
        {/* Example icon usage if needed:
        <View style={styles.iconContainer}>
          {item.payment_type === 'cash' ? (
            <Entypo name="wallet" size={20} color="white" />
          ) : (
            <MaterialCommunityIcons name="bank" size={20} color="white" />
          )}
        </View>
        */}
        
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
          <Text
            style={[
              styles.title,
              isCancelled && styles.cancelledTitle,
            ]}
            numberOfLines={2}
          >
            {item.service_booked && item.service_booked.length > 0
              ? item.service_booked[0]?.serviceName
              : item.service}
          </Text>
          <Text
            style={[
              styles.schedule,
              isCancelled && styles.cancelledSchedule,
            ]}
          >
            {formatDate(item.created_at)}
          </Text>
        </View>

        <View>
          <Text
            style={[
              styles.price,
              isCancelled && styles.cancelledPrice,
            ]}
          >
            ₹{item.payment}
          </Text>
          <Text
            style={[
              styles.paymentDetails,
              isCancelled && styles.cancelledPaymentDetails,
            ]}
          >
            {item.payment_type === 'cash'
              ? 'Paid to you'
              : 'Paid to Click Solver'}
          </Text>
        </View>
      </View>

      {isCancelled && (
        <Text style={styles.cancelledMessage}>Service Cancelled</Text>
      )}
    </TouchableOpacity>
  );
};

const RecentServices = () => {
  // 1) Get screen dimensions
  const {width, height} = useWindowDimensions();
  // 2) Generate dynamic styles
  const styles = dynamicStyles(width, height);

  const [bookingsData, setBookingsData] = useState([]);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false); // <-- NEW: track network error

  const filterOptions = ['Completed', 'Cancelled'];

  // Extracted API call into a function so we can call it on Retry
  const fetchBookings = async () => {
    setLoading(true);
    setError(false);
    try {
      const token = await EncryptedStorage.getItem('cs_token');
      if (!token) throw new Error('Token not found');

      const response = await axios.get(
        `http://192.168.55.102:5000/api/user/bookings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      console.log(response.data[0])
      setBookingsData(response.data);
      setFilteredData(response.data); // Initially display all data
    } catch (err) {
      console.error('Error fetching bookings data:', err);
      setError(true); // <-- if there's an error, set error to true
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const formatDate = created_at => {
    const date = new Date(created_at);
    const monthNames = [
      'January','February','March','April','May','June',
      'July','August','September','October','November','December',
    ];
    return `${monthNames[date.getMonth()]} ${String(date.getDate()).padStart(
      2,
      '0',
    )}, ${date.getFullYear()}`;
  };

  const toggleFilter = status => {
    const updatedFilters = selectedFilters.includes(status)
      ? selectedFilters.filter(s => s !== status)
      : [...selectedFilters, status];

    setSelectedFilters(updatedFilters);

    // Apply filter immediately
    const filtered =
      updatedFilters.length > 0
        ? bookingsData.filter(item => {
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
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={handleOutsidePress}>
        <SafeAreaView style={styles.screenContainer}>
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

          {/* Filter Dropdown */}
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

          <View style={styles.serviceContainer}>
            {loading ? (
              // LOADING VIEW (unchanged)
              <View style={styles.loadingContainer}>
                <LottieView
                  source={require('../assets/searchLoading.json')}
                  autoPlay
                  loop
                  style={styles.loadingAnimation}
                />
              </View>
            ) : error ? (
              // ERROR VIEW with Retry button
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                  Something went wrong. Please try again.
                </Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={fetchBookings}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : filteredData.length === 0 ? (
              // NO-DATA VIEW (unchanged)
              <View style={styles.noResultsContainer}>
                <MaterialIcons name="search-off" size={45} color="#000" />
                <Text style={styles.noResultsText}>No results found</Text>
                <Text style={styles.noResultsSubText}>
                  We couldn't find what you were looking for. Please check your
                  keywords again!
                </Text>
              </View>
            ) : (
              // FLATLIST (unchanged)
              <FlatList
                data={filteredData}
                renderItem={({item}) => (
                  <ServiceItem
                    item={item}
                    formatDate={formatDate}
                    styles={styles} // Pass dynamic styles to child
                  />
                )}
                keyExtractor={(item, index) => index.toString()}
              />
            )}
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

/**
 * 3) DYNAMIC STYLES:
 *    This function returns a StyleSheet whose values depend on the device width/height.
 *    If `width >= 600`, we treat it as a tablet and scale up certain styles.
 */
const dynamicStyles = (width, height) => {
  const isTablet = width >= 600;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    screenContainer: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: isTablet ? 24 : 16,
      paddingVertical: isTablet ? 20 : 16,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
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
      fontFamily: 'RobotoSlab-SemiBold',
      color: '#000',
      marginLeft: 7,
    },
    sortText: {
      fontSize: isTablet ? 18 : 16,
      marginRight: 8,
      fontFamily: 'RobotoSlab-SemiBold',
      color: '#212121',
    },
    dropdownContainer: {
      position: 'absolute',
      top: isTablet ? 90 : 70,
      right: isTablet ? 24 : 16,
      width: isTablet ? 220 : 200,
      backgroundColor: '#ffffff',
      borderRadius: 8,
      padding: isTablet ? 12 : 10,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.3,
      shadowRadius: 4,
      zIndex: 10,
    },
    dropdownTitle: {
      fontSize: isTablet ? 16 : 14,
      fontFamily: 'RobotoSlab-SemiBold',
      color: '#212121',
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
      fontFamily: 'RobotoSlab-Medium',
    },
    serviceContainer: {
      flex: 1,
      paddingHorizontal: isTablet ? 24 : 16,
      paddingTop: isTablet ? 15 : 10,
    },
    // LOADING
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

    // ERROR
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    errorText: {
      fontSize: isTablet ? 18 : 16,
      color: '#000',
      marginBottom: 10,
      fontFamily: 'RobotoSlab-Medium',
      textAlign: 'center',
    },
    retryButton: {
      backgroundColor: '#ffffff',
      borderColor:'#f7f7f7',
      borderWidth:1,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 5,
    },
    retryButtonText: {
      color: '#ff4500',
      fontSize: isTablet ? 16 : 14,
      fontFamily: 'RobotoSlab-Medium',
    },

    // NO RESULTS
    noResultsContainer: {
      alignItems: 'center',
      marginTop: isTablet ? 40 : 30,
      paddingHorizontal: isTablet ? 30 : 20,
    },
    noResultsText: {
      fontSize: isTablet ? 22 : 20,
      color: '#555555',
      fontFamily: 'RobotoSlab-Medium',
    },
    noResultsSubText: {
      fontSize: isTablet ? 16 : 14,
      color: '#777777',
      textAlign: 'center',
      marginVertical: isTablet ? 24 : 20,
      padding: 6,
      fontFamily: 'RobotoSlab-Medium',
    },

    // Service Item Styles
    itemContainer: {
      backgroundColor: '#ffffff',
      marginHorizontal: 5,
      padding: isTablet ? 20 : 18,
      borderRadius: 10,
      marginBottom: isTablet ? 14 : 12,
      shadowColor: '#000',
      elevation: 1,
      shadowOffset: {width: 0, height: 2},
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
      width: isTablet ? 65 : 60,
      height: isTablet ? 65 : 60,
      alignItems: 'center',
      justifyContent: 'center',
      // backgroundColor: '#ff4500',
      borderRadius: isTablet ? 10: 5,
      marginRight: 5,
    },
    itemDetails: {
      flex: 1,
      marginLeft: 5,
    },
    title: {
      fontSize: isTablet ? 16 : 14,
      fontFamily: 'RobotoSlab-Medium',
      color: '#212121',
    },
    schedule: {
      fontSize: isTablet ? 14 : 13,
      color: '#9e9e9e',
      fontFamily: 'RobotoSlab-Regular',
    },
    price: {
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'RobotoSlab-Medium',
      color: '#212121',
      textAlign: 'right',
    },
    paymentDetails: {
      fontSize: isTablet ? 14 : 12,
      color: '#9e9e9e',
      fontFamily: 'RobotoSlab-Regular',
      textAlign: 'right',
    },
    // Cancelled service styles
    cancelledItemContainer: {
      backgroundColor: '#f8d7da',
    },
    cancelledTitle: {
      textDecorationLine: 'line-through',
      color: '#a94442',
    },
    cancelledSchedule: {
      color: '#a94442',
    },
    cancelledPrice: {
      textDecorationLine: 'line-through',
      color: '#a94442',
    },
    cancelledPaymentDetails: {
      color: '#a94442',
    },
    cancelledMessage: {
      marginTop: 8,
      color: '#a94442',
      fontSize: isTablet ? 13 : 12,
      textAlign: 'center',
    },
  });
};

export default RecentServices;
