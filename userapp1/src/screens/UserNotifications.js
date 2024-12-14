import axios from 'axios';
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import EncryptedStorage from 'react-native-encrypted-storage';
import uuid from 'react-native-uuid';
import moment from 'moment';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Importing icon library
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

const UserNotifications = () => {
  const [notificationsArray, setNotificationsArray] = useState([]);
  const navigation = useNavigation();
  const screenHeight = Dimensions.get('window').height;
  const screenWidth = Dimensions.get('window').width;

  const fetchNotifications = async () => {
    const userId = await EncryptedStorage.getItem('cs_token');
    const fcmToken = await EncryptedStorage.getItem('fcm_token');
    const response = await axios.get(
      `${process.env.BACKENDAIPH}/api/user/notifications`,
      {
        headers: {
          Authorization: `Bearer ${userId}`,
        },
        params: {
          fcmToken: fcmToken,
        },
      },
    );

    const notifications = response.data;
    setNotificationsArray(notifications);
    console.log('User notifications:', notifications);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const renderItem = ({item}) => (
    <View style={styles.notificationCardContainer}>
      <View style={styles.notificationContainer}>
        <View style={styles.iconContainer}>
          <Text>
            <Icon name="notifications" size={24} color="#ff4500" />{' '}
            {/* Notification bell icon */}
          </Text>
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <View style={styles.timeContainer}>
            <Text style={styles.notificationDate}>Today</Text>
            <Text style={styles.notificationTime}>
              {moment(item.receivedat).format('hh:mm A')}
            </Text>
          </View>
        </View>
      </View>
      <Text style={styles.notificationBody}>
        Commander accepted your request he will be there with in 5 mins
      </Text>
    </View>
  );

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
        <FlatList
          data={notificationsArray}
          renderItem={renderItem}
          keyExtractor={item => uuid.v4()}
        />
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
    zIndex: 1, // Ensure header is above other components
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
    fontWeight: '500',
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
    gap: 0,
    paddingHorizontal: 10,
    marginBottom: 30,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffe4d4', // Light orange background for the icon container
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationDate: {
    fontSize: 13,
    color: '#4a4a4a',
    marginRight: 8,
  },
  notificationTime: {
    fontSize: 13,
    color: '#4a4a4a',
    paddingVertical: 2,
    borderRadius: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: '#4a4a4a',
    marginTop: 5,
  },
});

export default UserNotifications;
