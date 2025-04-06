import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
// Import your theme hook
import { useTheme } from '../context/ThemeContext';

const UserNotifications = () => {
  const { width, height } = useWindowDimensions();
  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(width, height, isDarkMode);

  const [notificationsArray, setNotificationsArray] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  // Updated: Handle both ISO and custom date formats.
  const parseCustomDate = (dateString) => {
    // If date string contains 'T', assume it's ISO formatted.
    if (dateString.includes('T')) {
      return new Date(dateString);
    }
    try {
      const [datePart, timePart] = dateString.split(',');
      if (!datePart || !timePart) return null;
      const [day, month, year] = datePart.trim().split('/');
      const [hour, minute, second] = timePart.trim().split(':');
      const d = parseInt(day, 10);
      const m = parseInt(month, 10) - 1; // JavaScript months are 0-based.
      const y = parseInt(year, 10);
      const hh = parseInt(hour, 10);
      const mm = parseInt(minute, 10);
      const ss = parseInt(second, 10);
      return new Date(y, m, d, hh, mm, ss);
    } catch (error) {
      console.warn('Failed to parse date:', error);
      return null;
    }
  };

  // Helper: Check if two dates are on the same calendar day.
  const isSameDay = (date1, date2) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  // Helper: Format a date into a 12-hour time (e.g., "02:30 PM").
  const formatTime12Hour = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const paddedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${hours}:${paddedMinutes} ${ampm}`;
  };

  // Helper: Format a date as "DD/MM/YYYY".
  const formatDateDMY = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const storedNotifications = await EncryptedStorage.getItem('notifications');
      const parsedNotifications = storedNotifications ? JSON.parse(storedNotifications) : [];
      
      // Filter notifications:
      // - Remove if receivedAt is missing.
      // - Remove if title is empty or equals "No title" (case-insensitive).
      const filtered = parsedNotifications.filter((item) => {
        if (!item.receivedAt) return false;
        if (!item.title || item.title.trim() === '' || item.title.trim().toLowerCase() === 'no title') return false;
        return true;
      });
      
      // Reverse notifications for newest-first display.
      const reversedNotifications = filtered.reverse();
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
    const dateObj = parseCustomDate(item.receivedAt);
    // If the date fails to parse, skip rendering this item.
    if (!dateObj) return null;

    const now = new Date();
    const isToday = isSameDay(dateObj, now);
    const displayDate = isToday ? 'Today' : formatDateDMY(dateObj);
    const displayTime = formatTime12Hour(dateObj);

    return (
      <View style={styles.notificationCardContainer}>
        <View style={styles.notificationContainer}>
          <View style={styles.iconContainer}>
            <Icon name="notifications" size={24} color="#ff4500" />
          </View>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <FontAwesome6 name="arrow-left-long" size={24} color={isDarkMode ? '#fff' : "#4a4a4a"} />
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

function dynamicStyles(width, height, isDarkMode) {
  const isTablet = width >= 600;
  return StyleSheet.create({
    notificationMainContainer: {
      backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
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
      shadowColor: isDarkMode ? '#000' : '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      backgroundColor: isDarkMode ? '#121212' : '#ffffff',
      zIndex: 1,
    },
    backButton: {
      position: 'absolute',
      left: isTablet ? 20 : 10,
    },
    header: {
      fontSize: isTablet ? 24 : 20,
      color: isDarkMode ? '#fff' : '#212121',
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
      color: isDarkMode ? '#ccc' : '#9e9e9e',
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
      backgroundColor: isDarkMode ? '#333' : '#ffe4d4',
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
      color: isDarkMode ? '#fff' : '#212121',
    },
    timeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    notificationDate: {
      fontSize: isTablet ? 15 : 13,
      color: isDarkMode ? '#ccc' : '#4a4a4a',
      fontFamily: 'RobotoSlab-Light',
      marginRight: isTablet ? 10 : 8,
    },
    notificationTime: {
      fontSize: isTablet ? 15 : 13,
      color: isDarkMode ? '#ccc' : '#4a4a4a',
      fontFamily: 'RobotoSlab-Light',
      paddingVertical: 2,
      borderRadius: 4,
    },
    notificationBody: {
      fontSize: isTablet ? 16 : 14,
      color: isDarkMode ? '#fff' : '#4a4a4a',
      fontFamily: 'RobotoSlab-Medium',
      marginTop: 5,
    },
  });
}

export default UserNotifications;
