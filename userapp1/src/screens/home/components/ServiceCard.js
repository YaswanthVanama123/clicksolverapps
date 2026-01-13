import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Image} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const ServiceCard = ({service, onPress, isDarkMode, t}) => {
  const gradientColors = isDarkMode
    ? ['#2a2a2a', '#1f1f1f']
    : ['#ffffff', '#f8f9fa'];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}>
      <LinearGradient
        colors={gradientColors}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.cardGradient}>
        {/* Service Image */}
        <Image
          source={{
            uri: service.service_urls || 'https://via.placeholder.com/165x105',
          }}
          style={styles.serviceImage}
          resizeMode="cover"
        />

        {/* Service Details */}
        <View style={styles.serviceDetails}>
          <Text
            style={[styles.serviceName, {color: isDarkMode ? '#FFFFFF' : '#333333'}]}
            numberOfLines={2}>
            {t(`service_${service.service_id}`) || service.service_name}
          </Text>

          {/* Book Now Button */}
          <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
            <LinearGradient
              colors={['#FF6B35', '#F24E1E']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.bookButton}>
              <Text style={styles.bookButtonText}>
                {t('book_now') || 'Book Now'} →
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardGradient: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  serviceImage: {
    width: 120,
    height: 100,
    borderRadius: 12,
  },
  serviceDetails: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  serviceName: {
    fontSize: 16,
    fontFamily: 'RobotoSlab-Bold',
    lineHeight: 22,
  },
  bookButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'RobotoSlab-SemiBold',
  },
});

export default ServiceCard;
