import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, ScrollView} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Foundation from 'react-native-vector-icons/Foundation';

const TrackingBanner = ({trackingData, onPress, isDarkMode, t, width}) => {
  const getIconForScreen = screenName => {
    const iconMap = {
      Paymentscreen: <Foundation name="paypal" size={24} color="#ffffff" />,
      UserNavigation: (
        <MaterialCommunityIcons name="truck" size={24} color="#ffffff" />
      ),
      userwaiting: <Feather name="search" size={24} color="#ffffff" />,
      OtpVerification: <Feather name="shield" size={24} color="#ffffff" />,
      worktimescreen: (
        <MaterialCommunityIcons name="hammer" size={24} color="#ffffff" />
      ),
    };
    return (
      iconMap[screenName] || (
        <Feather
          name="alert-circle"
          size={24}
          color={isDarkMode ? '#fff' : '#000'}
        />
      )
    );
  };

  const getStatusText = screenName => {
    const statusMap = {
      Paymentscreen: t('payment_in_progress', 'Payment in progress'),
      UserNavigation: t('commander_on_the_way', 'Commander is on the way'),
      OtpVerification: t('user_waiting_for_help', 'User is waiting for your help'),
      worktimescreen: t('work_in_progress', 'Work in progress'),
    };
    return statusMap[screenName] || t('nothing', 'Nothing');
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.scrollContent}>
      {trackingData.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.trackingCard,
            {
              width: trackingData.length > 1 ? width * 0.8 : width * 0.88,
              backgroundColor: isDarkMode ? '#1f1f1f' : '#ffffff',
            },
          ]}
          onPress={() => onPress(item)}
          activeOpacity={0.8}>
          <View style={styles.cardContent}>
            {/* Icon Container */}
            <View style={styles.iconContainer}>{getIconForScreen(item.screen)}</View>

            {/* Service Details */}
            <View style={styles.serviceInfo}>
              <Text
                style={[
                  styles.serviceName,
                  {color: isDarkMode ? '#fff' : '#9e9e9e'},
                ]}
                numberOfLines={1}>
                {item.serviceBooked && item.serviceBooked.length > 0
                  ? item.serviceBooked
                      .slice(0, 2)
                      .map(
                        service =>
                          t(`singleService_${service.main_service_id}`) ||
                          service.serviceName,
                      )
                      .join(', ') + (item.serviceBooked.length > 2 ? '...' : '')
                  : t('service_booked', 'Service Booked')}
              </Text>
              <Text
                style={[
                  styles.statusText,
                  {color: isDarkMode ? '#B0B0B0' : '#757575'},
                ]}>
                {getStatusText(item.screen)}
              </Text>
            </View>

            {/* Chevron Icon */}
            <Feather name="chevrons-right" size={18} color="#9e9e9e" />
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  trackingCard: {
    borderRadius: 15,
    padding: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#ff5722',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    fontFamily: 'RobotoSlab-SemiBold',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'RobotoSlab-Regular',
  },
});

export default TrackingBanner;
