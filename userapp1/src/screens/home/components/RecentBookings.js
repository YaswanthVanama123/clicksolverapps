import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, FlatList} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

const RecentBookings = ({bookings, onBookAgain, isDarkMode, t}) => {
  const renderBookingItem = ({item}) => (
    <View
      style={[
        styles.bookingCard,
        {backgroundColor: isDarkMode ? '#1f1f1f' : '#ffffff'},
      ]}>
      <View style={styles.bookingContent}>
        {/* Service Icon */}
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={['#FF6B35', '#F24E1E']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.iconGradient}>
            <Icon name="checkmark-done" size={20} color="#FFFFFF" />
          </LinearGradient>
        </View>

        {/* Booking Details */}
        <View style={styles.bookingDetails}>
          <Text
            style={[styles.serviceName, {color: isDarkMode ? '#FFFFFF' : '#333333'}]}
            numberOfLines={1}>
            {item.serviceName || 'Service'}
          </Text>
          <Text
            style={[styles.bookingDate, {color: isDarkMode ? '#B0B0B0' : '#757575'}]}>
            {item.date || 'Recently completed'}
          </Text>
        </View>

        {/* Book Again Button */}
        <TouchableOpacity
          onPress={() => onBookAgain(item.serviceId, item.serviceName)}
          activeOpacity={0.8}>
          <LinearGradient
            colors={['#FF6B35', '#F24E1E']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.bookAgainButton}>
            <Icon name="refresh" size={16} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.title, {color: isDarkMode ? '#FFFFFF' : '#1D2951'}]}>
        {t('recent_bookings') || 'Recent Bookings'}
      </Text>
      <FlatList
        data={bookings}
        renderItem={renderBookingItem}
        keyExtractor={item => item.id?.toString() || Math.random().toString()}
        scrollEnabled={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  title: {
    fontSize: 18,
    fontFamily: 'RobotoSlab-Bold',
    marginBottom: 15,
  },
  listContent: {
    gap: 12,
  },
  bookingCard: {
    borderRadius: 15,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  bookingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  iconGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingDetails: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontFamily: 'RobotoSlab-SemiBold',
  },
  bookingDate: {
    fontSize: 13,
    fontFamily: 'RobotoSlab-Regular',
    marginTop: 2,
  },
  bookAgainButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RecentBookings;
