import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions, // <-- 1) Import useWindowDimensions
} from 'react-native';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import moment from 'moment';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

const UserNotifications = () => {
  // 1) Grab width & height from useWindowDimensions
  const { width, height } = useWindowDimensions();
  // 2) Generate dynamic styles
  const styles = dynamicStyles(width, height);

  const [notificationsArray, setNotificationsArray] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const storedNotifications = await EncryptedStorage.getItem('notifications');
      const parsedNotifications = storedNotifications
        ? JSON.parse(storedNotifications)
        : [];

      // Reverse the parsedNotifications array
      const reversedNotifications = parsedNotifications.reverse();
      setNotificationsArray(reversedNotifications);
      console.log('User notifications:', reversedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotificationsArray([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const renderItem = ({ item }) => {
    // Specify the format of receivedAt
    const receivedAtFormat = 'DD/MM/YYYY, HH:mm:ss';

    // Parse date using the specified format
    const isToday = moment(item.receivedAt, receivedAtFormat).isSame(moment(), 'day');
    const displayDate = isToday
      ? 'Today'
      : moment(item.receivedAt, receivedAtFormat).format('DD/MM/YYYY');
    const displayTime = moment(item.receivedAt, receivedAtFormat).format('hh:mm A');

    return (
      <View style={styles.notificationCardContainer}>
        <View style={styles.notificationContainer}>
          <View style={styles.iconContainer}>
            <Icon name="notifications" size={24} color="#ff4500" />
          </View>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>
              {item.title || 'No Title'}
            </Text>
            <View style={styles.timeContainer}>
              <Text style={styles.notificationDate}>{displayDate}</Text>
              <Text style={styles.notificationTime}>{displayTime}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.notificationBody}>{item.body || 'No Body'}</Text>
      </View>
    );
  };

  return (
    <View style={styles.notificationMainContainer}>
      {/* Header with Back Button */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <FontAwesome6 name="arrow-left-long" size={24} color="#4a4a4a" />
        </TouchableOpacity>
        <Text style={styles.header}>Notifications</Text>
      </View>

      <View style={styles.notificationCards}>
        {loading ? (
          <ActivityIndicator size="large" color="#FF5722" style={styles.loader} />
        ) : notificationsArray.length > 0 ? (
          <FlatList
            data={notificationsArray}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.receivedAt}-${index}`}
          />
        ) : (
          <Text style={styles.noNotificationsText}>No notifications available.</Text>
        )}
      </View>
    </View>
  );
};

/**
 * A helper function that returns a StyleSheet based on screen width/height.
 * If `width >= 600`, we treat it as a tablet and scale up certain styles.
 */
function dynamicStyles(width, height) {
  const isTablet = width >= 600;

  return StyleSheet.create({
    notificationMainContainer: {
      backgroundColor: 'white',
      flex: 1,
      minHeight: height,
      minWidth: width,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: isTablet ? 20 : 16,
      paddingVertical: isTablet ? 12 : 10,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      backgroundColor: '#ffffff',
      zIndex: 1,
    },
    backButton: {
      position: 'absolute',
      left: isTablet ? 20 : 10,
    },
    header: {
      fontSize: isTablet ? 24 : 20,
      color: '#212121',
      fontFamily: 'NotoSerif-ExtraBold',
      textAlign: 'center',
    },
    notificationCards: {
      flex: 1,
      paddingHorizontal: isTablet ? 30 : 20,
      paddingTop: isTablet ? 12 : 10,
    },
    loader: {
      marginTop: isTablet ? 30 : 20,
      alignSelf: 'center',
    },
    noNotificationsText: {
      textAlign: 'center',
      fontSize: isTablet ? 18 : 16,
      color: '#9e9e9e',
      marginTop: isTablet ? 30 : 20,
    },
    notificationCardContainer: {
      flexDirection: 'column',
      paddingHorizontal: isTablet ? 15 : 10,
      marginBottom: isTablet ? 35 : 30,
    },
    notificationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      borderRadius: 10,
    },
    iconContainer: {
      width: isTablet ? 50 : 40,
      height: isTablet ? 50 : 40,
      borderRadius: isTablet ? 25 : 20,
      backgroundColor: '#ffe4d4',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: isTablet ? 20 : 15,
    },
    notificationContent: {
      flex: 1,
    },
    notificationTitle: {
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'RobotoSlab-Regular',
      color: '#212121',
    },
    timeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    notificationDate: {
      fontSize: isTablet ? 15 : 13,
      color: '#4a4a4a',
      fontFamily: 'RobotoSlab-Light',
      marginRight: isTablet ? 10 : 8,
    },
    notificationTime: {
      fontSize: isTablet ? 15 : 13,
      color: '#4a4a4a',
      fontFamily: 'RobotoSlab-Light',
      paddingVertical: 2,
      borderRadius: 4,
    },
    notificationBody: {
      fontSize: isTablet ? 16 : 14,
      color: '#4a4a4a',
      fontFamily: 'RobotoSlab-Medium',
      marginTop: 5,
    },
  });
}

export default UserNotifications;
