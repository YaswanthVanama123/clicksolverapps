import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  SafeAreaView,
} from 'react-native';
import axios from 'axios';
import Ionicons from 'react-native-vector-icons/Ionicons';
import EncryptedStorage from 'react-native-encrypted-storage';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../context/ThemeContext';

const UserNotifications = () => {
  const {width, height} = useWindowDimensions();
  const {isDarkMode} = useTheme();
  const styles = dynamicStyles(width, height, isDarkMode);
  const [notificationsArray, setNotificationsArray] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const parseCustomDate = dateString => {
    if (dateString.includes('T')) return new Date(dateString);
    try {
      const [datePart, timePart] = dateString.split(',');
      if (!datePart || !timePart) return null;
      const [day, month, year] = datePart.trim().split('/');
      const [hour, minute, second] = timePart.trim().split(':');
      return new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute),
        parseInt(second),
      );
    } catch (error) {
      console.warn('Failed to parse date:', error);
      return null;
    }
  };

  const isSameDay = (d1, d2) =>
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();

  const formatTime12Hour = date => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const paddedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${hours}:${paddedMinutes} ${ampm}`;
  };

  const formatDateDMY = date => {
    return `${String(date.getDate()).padStart(2, '0')}/${String(
      date.getMonth() + 1,
    ).padStart(2, '0')}/${date.getFullYear()}`;
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const stored = await EncryptedStorage.getItem('notifications');
      const parsed = stored ? JSON.parse(stored) : [];
      const filtered = parsed.filter(
        n =>
          n.receivedAt &&
          n.title &&
          n.title.trim().toLowerCase() !== 'no title',
      );
      setNotificationsArray(filtered.reverse());
    } catch (err) {
      console.error('Fetch error:', err);
      setNotificationsArray([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const renderItem = ({item}) => {
    const dateObj = parseCustomDate(item.receivedAt);
    if (!dateObj) return null;
    const displayDate = isSameDay(dateObj, new Date())
      ? 'Today'
      : formatDateDMY(dateObj);
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.notificationMainContainer}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={isDarkMode ? '#fff' : '#212121'}
            />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.header}>Notifications</Text>
          </View>
          <View style={styles.headerSide}></View>
        </View>

        <View style={styles.notificationCards}>
          {loading ? (
            <ActivityIndicator
              size="large"
              color="#FF5722"
              style={styles.loader}
            />
          ) : notificationsArray.length > 0 ? (
            <FlatList
              data={notificationsArray}
              renderItem={renderItem}
              keyExtractor={(item, index) => `${item.receivedAt}-${index}`}
            />
          ) : (
            <Text style={styles.noNotificationsText}>
              No notifications available.
            </Text>
          )}
        </View>
      </View>
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
    notificationMainContainer: {
      flex: 1,
      minHeight: height,
      minWidth: width,
      backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      // shadowColor: '#000',
      // shadowOffset: {width: 0, height: 2},
      // shadowOpacity: 0.2,
      // shadowRadius: 4,
      backgroundColor: isDarkMode ? '#121212' : '#fff',
    },
    backButton: {
      paddingHorizontal: 10,
    },
    headerCenter: {
      flex: 1,
      alignItems: 'center',
    },
    headerSide: {
      width: 32, // matching the back button icon size
    },
    header: {
      fontSize: isTablet ? 24 : 20,
      fontFamily: 'RobotoSlab-Bold',
      color: isDarkMode ? '#fff' : '#212121',
      fontFamily: 'NotoSerif-ExtraBold',
    },
    notificationCards: {
      flex: 1,
      paddingHorizontal: isTablet ? 30 : 20,
      paddingTop: 10,
    },
    loader: {
      marginTop: 30,
      alignSelf: 'center',
    },
    noNotificationsText: {
      textAlign: 'center',
      fontSize: 16,
      color: isDarkMode ? '#ccc' : '#9e9e9e',
      marginTop: 30,
    },
    notificationCardContainer: {
      flexDirection: 'column',
      marginBottom: 30,
    },
    notificationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDarkMode ? '#333' : '#ffe4d4',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 15,
    },
    notificationContent: {
      flex: 1,
    },
    notificationTitle: {
      fontSize: 16,
      fontFamily: 'RobotoSlab-Regular',
      color: isDarkMode ? '#fff' : '#212121',
    },
    timeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    notificationDate: {
      fontSize: 13,
      color: isDarkMode ? '#ccc' : '#4a4a4a',
      fontFamily: 'RobotoSlab-Light',
      marginRight: 8,
    },
    notificationTime: {
      fontSize: 13,
      color: isDarkMode ? '#ccc' : '#4a4a4a',
      fontFamily: 'RobotoSlab-Light',
    },
    notificationBody: {
      fontSize: 14,
      color: isDarkMode ? '#fff' : '#4a4a4a',
      fontFamily: 'RobotoSlab-Medium',
      marginTop: 5,
    },
  });
};

export default UserNotifications;
