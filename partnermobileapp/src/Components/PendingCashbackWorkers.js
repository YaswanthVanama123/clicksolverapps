import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TouchableWithoutFeedback, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import EncryptedStorage from 'react-native-encrypted-storage';
import axios from "axios";
import uuid from 'react-native-uuid';
import { useNavigation } from "@react-navigation/native";

const PendingCashbackWorkers = () => {
  const [serviceData, setServiceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = await EncryptedStorage.getItem('pcs_token'); 
        if (!token) throw new Error("Token not found");

        const response = await axios.get(`${process.env.BackendAPI6}/api/worker/tracking/services`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setServiceData(response.data);
        setFilteredData(response.data);
      } catch (error) {
        console.error('Error fetching bookings data:', error);
      }
    };

    fetchBookings(); 
  }, []);

  const formatDate = (created_at) => {
    const date = new Date(created_at);
    return `${String(date.getDate()).padStart(2, '0')} ${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.itemContainer}>
      <Image source={{ uri: "http://postimage.png" }} style={styles.profile} />
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemTitle}>Yaswanth</Text>
        <Text style={styles.itemSubtitle}>Electrician</Text>
      </View>
      <View style={styles.amountContainer}>
        <Text style={styles.amountText}>200</Text>
        <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <TouchableWithoutFeedback onPress={() => setIsFilterVisible(false)}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Icon name="arrow-back" size={24} color="#000" />
          <Text style={styles.headerTitle}>Pending Cashback</Text>
          <TouchableOpacity onPress={() => setIsFilterVisible(!isFilterVisible)}>
            <Icon name="filter-list" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {isFilterVisible && (
          <View style={styles.dropdownContainer}>
            {/* Filter options go here */}
          </View>
        )}

        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={() => uuid.v4()}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    textAlign: 'center',
    marginRight: 24, // Adjusts for center alignment with back icon
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profile: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#4a4a4a',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  dateText: {
    fontSize: 12,
    color: '#4a4a4a',
  },
});

export default PendingCashbackWorkers;
