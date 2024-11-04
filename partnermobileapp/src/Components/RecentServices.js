import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView, Modal, TouchableWithoutFeedback } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons'; // for check, cross, sort icons
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'; // for wallet and bank icons
import Feather from 'react-native-vector-icons/Feather';
import EncryptedStorage from 'react-native-encrypted-storage';
import Entypo from 'react-native-vector-icons/Entypo';
import axios from 'axios'; 
import { useNavigation } from '@react-navigation/native';

const ServiceItem = ({ item, formatDate }) => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity style={styles.itemContainer} onPress={() =>{
      navigation.push("serviceBookingItem", { tracking_id: item.notification_id });
    }}>
      <View style={styles.itemMainContainer}>
        <View style={styles.iconContainer}>
          {item.payment_type === 'cash' ? (
            <Entypo name='wallet' size={20} color="white" />
          ) : (
            <MaterialCommunityIcons name='bank' size={20} color="white" />
          )}
        </View>
        <View style={styles.itemDetails}>
          <Text style={styles.title}>{item.service_booked ? item.service_booked[0].serviceName : item.service}</Text>
          <Text style={styles.schedule}>{formatDate(item.created_at)}</Text>
        </View>
        <View>
          <Text style={styles.price}>₹{item.payment}</Text>
          <Text style={styles.paymentDetails}>{item.payment_type === 'cash' ? 'Paid to you' : 'Paid to click solver'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}; 

const RecentServices = () => {
  const [bookingsData, setBookingsData] = useState([]);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([]); // No default filter to apply all initially
  const [filteredData, setFilteredData] = useState([]);

  const filterOptions = ['Completed', 'Cancelled'];

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = await EncryptedStorage.getItem('pcs_token');
        if (!token) throw new Error("Token not found");

        const response = await axios.get(`${process.env.BackendAPI5}/api/worker/bookings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setBookingsData(response.data);
        setFilteredData(response.data); // Initially display all data
      } catch (error) {
        console.error('Error fetching bookings data:', error);
      }
    };

    fetchBookings();
  }, []);

  const formatDate = (created_at) => {
    const date = new Date(created_at);
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return `${monthNames[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}, ${date.getFullYear()}`;
  };

  const toggleFilter = (status) => {
    const updatedFilters = selectedFilters.includes(status)
      ? selectedFilters.filter(s => s !== status)
      : [...selectedFilters, status];
    
    setSelectedFilters(updatedFilters);

    // Apply filter immediately
    const filtered = updatedFilters.length > 0
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
    <TouchableWithoutFeedback onPress={handleOutsidePress}>
      <SafeAreaView style={styles.screenContainer}>
        <View style={styles.headerContainer}>
          <View style={styles.sortContainerLeft}>
            <Feather name="shopping-cart" size={18} color="#212121" />
            <Text style={styles.headerTitle}>My services</Text>
          </View>
          <TouchableOpacity onPress={() => setIsFilterVisible(!isFilterVisible)} style={styles.sortContainerRight}>
            <Text style={styles.sortText}>Sort by Status</Text>
            <Icon name="filter-list" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Filter Dropdown */}
        {isFilterVisible && (
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownTitle}>SORT BY STATUS</Text>
            {filterOptions.map((option, index) => (
              <TouchableOpacity key={index} style={styles.dropdownOption} onPress={() => toggleFilter(option)}>
                <Icon
                  name={selectedFilters.includes(option) ? "check-box" : "check-box-outline-blank"}
                  size={20}
                  color="#4a4a4a"
                />
                <Text style={styles.dropdownText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.serviceContainer}>
          <FlatList
            data={filteredData}
            renderItem={({ item }) => <ServiceItem item={item} formatDate={formatDate} />}
            keyExtractor={(item, index) => index.toString()}
          />
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    backgroundColor: '#ffffff',
    zIndex: 1, // Ensure header is above other components
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 7,
  },
  sortText: {
    fontSize: 16,
    marginRight: 8,
    fontWeight: 'bold',
    color: '#212121',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 70, // Adjust based on header height
    right: 16,
    width: 200,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 10, // Ensure dropdown is above other items
  },
  dropdownTitle: {
    fontSize: 14,
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
    fontSize: 14,
    color: '#4a4a4a',
  },
  serviceContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  itemContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 5,
    padding: 18,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    elevation: 1,
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
    width: 45,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff4500',
    borderRadius: 22.5,
    marginRight: 5,
  },
  itemDetails: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  schedule: {
    fontSize: 13,
    color: '#9e9e9e',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    textAlign: 'right',
  },
});

export default RecentServices;
