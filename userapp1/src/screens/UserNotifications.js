import axios from 'axios';
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator, // Import ActivityIndicator
} from 'react-native';
import EncryptedStorage from 'react-native-encrypted-storage';
import moment from 'moment';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

const UserNotifications = () => {
  const [notificationsArray, setNotificationsArray] = useState([]);
  const [loading, setLoading] = useState(true); // New loading state
  const navigation = useNavigation();
  const screenHeight = Dimensions.get('window').height;
  const screenWidth = Dimensions.get('window').width;

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

  const renderItem = ({item}) => {
    // Specify the format of receivedAt
    const receivedAtFormat = 'DD/MM/YYYY, HH:mm:ss';

    // Parse date using the specified format
    const isToday = moment(item.receivedAt, receivedAtFormat).isSame(
      moment(),
      'day',
    );
    const displayDate = isToday
      ? 'Today'
      : moment(item.receivedAt, receivedAtFormat).format('DD/MM/YYYY');
    const displayTime = moment(item.receivedAt, receivedAtFormat).format(
      'hh:mm A',
    );

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
    <View
      style={[
        styles.notificationMainContainer,
        {minHeight: screenHeight, minWidth: screenWidth},
      ]}>
      {/* Header with Back Button */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
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
          <Text style={styles.noNotificationsText}>
            No notifications available.
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  notificationMainContainer: {
    backgroundColor: 'white',
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    backgroundColor: '#ffffff',
    zIndex: 1,
  },
  notificationCards: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    position: 'absolute',
    left: 10,
  },
  header: {
    fontSize: 20,
    color: '#212121',
    fontFamily: 'NotoSerif-ExtraBold',
    textAlign: 'center',
  },
  notificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    borderRadius: 10,
  },
  notificationCardContainer: {
    flexDirection: 'column',
    paddingHorizontal: 10,
    marginBottom: 30,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffe4d4',
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
    color: '#212121',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationDate: {
    fontSize: 13,
    color: '#4a4a4a',
    fontFamily: 'RobotoSlab-Light',
    marginRight: 8,
  },
  notificationTime: {
    fontSize: 13,
    color: '#4a4a4a',
    fontFamily: 'RobotoSlab-Light',
    paddingVertical: 2,
    borderRadius: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: '#4a4a4a',
    fontFamily: 'RobotoSlab-Medium',
    marginTop: 5,
  },
  noNotificationsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#9e9e9e',
    marginTop: 20,
  },
  loader: {
    marginTop: 20,
    alignSelf: 'center',
  },
});

export default UserNotifications;
