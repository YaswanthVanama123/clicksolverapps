import React, {useState} from 'react';
import {View, StyleSheet, Text, TouchableOpacity, ScrollView} from 'react-native';
import {useTranslation} from 'react-i18next';
import Entypo from 'react-native-vector-icons/Entypo';

/**
 * ServiceListCard Component
 * Displays service list, PIN, and cancel button
 */
const ServiceListCard = ({
  serviceArray,
  pin,
  onCancel,
  isDarkMode,
  isTablet,
}) => {
  const {t} = useTranslation();
  const [showUpArrow, setShowUpArrow] = useState(false);
  const [showDownArrow, setShowDownArrow] = useState(false);

  const handleScroll = event => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const containerHeight = event.nativeEvent.layoutMeasurement.height;
    const contentHeight = event.nativeEvent.contentSize.height;

    setShowUpArrow(offsetY > 0);
    setShowDownArrow(offsetY + containerHeight < contentHeight);
  };

  return (
    <View style={styles.leftSection}>
      <Text style={[styles.serviceType, {fontSize: isTablet ? 18 : 16, color: isDarkMode ? '#aaa' : '#9e9e9e'}]}>
        {t('service') || 'Service'}
      </Text>

      {/* Scrollable Services List */}
      <View style={styles.servicesListContainer}>
        {showUpArrow && (
          <View
            style={[
              styles.arrowUpContainer,
              {
                backgroundColor: isDarkMode
                  ? 'rgba(0, 0, 0, 0.8)'
                  : 'rgba(255, 255, 255, 0.8)',
              },
            ]}>
            <Entypo
              name="chevron-small-up"
              size={20}
              color={isDarkMode ? '#ccc' : '#9e9e9e'}
            />
          </View>
        )}
        <ScrollView
          style={[styles.servicesNamesContainer, {maxHeight: isTablet ? 80 : 60}]}
          contentContainerStyle={styles.servicesNamesContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}>
          {serviceArray.map((serviceItem, index) => (
            <View key={index} style={styles.serviceItem}>
              <Text style={[styles.serviceText, {color: isDarkMode ? '#fff' : '#212121', fontSize: isTablet ? 15 : 14}]}>
                {t(`singleService_${serviceItem.main_service_id}`) ||
                  serviceItem.serviceName}
              </Text>
            </View>
          ))}
        </ScrollView>
        {showDownArrow && (
          <View
            style={[
              styles.arrowDownContainer,
              {
                backgroundColor: isDarkMode
                  ? 'rgba(0, 0, 0, 0.8)'
                  : 'rgba(255, 255, 255, 0.8)',
              },
            ]}>
            <Entypo
              name="chevron-small-down"
              size={20}
              color={isDarkMode ? '#ccc' : '#9e9e9e'}
            />
          </View>
        )}
      </View>

      {/* PIN Section */}
      <View style={styles.pinContainer}>
        <Text style={[styles.pinText, {color: isDarkMode ? '#aaa' : '#9e9e9e', fontSize: isTablet ? 18 : 16}]}>
          {t('pin') || 'PIN'}
        </Text>
        <View style={styles.pinBoxesContainer}>
          {pin.split('').map((digit, index) => (
            <View key={index} style={[styles.pinBox, {backgroundColor: isDarkMode ? '#444' : '#f6f6f6'}]}>
              <Text style={[styles.pinNumber, {color: isDarkMode ? '#fff' : '#1D2951', fontSize: isTablet ? 20 : 18}]}>
                {digit}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Cancel Button */}
      <TouchableOpacity style={[styles.cancelButton, {backgroundColor: isDarkMode ? '#444' : '#f6f6f6'}]} onPress={onCancel}>
        <Text style={[styles.cancelText, {color: isDarkMode ? '#ccc' : '#9e9e9e', fontSize: isTablet ? 16 : 14}]}>
          {t('cancel') || 'Cancel'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  leftSection: {
    flex: 1,
    marginRight: 10,
  },
  serviceType: {
    fontFamily: 'RobotoSlab-Medium',
    marginTop: 10,
  },
  servicesListContainer: {
    position: 'relative',
    marginTop: 5,
  },
  servicesNamesContainer: {},
  servicesNamesContent: {
    flexDirection: 'column',
    paddingVertical: 10,
  },
  serviceItem: {
    marginBottom: 5,
  },
  serviceText: {
    fontFamily: 'RobotoSlab-Medium',
    marginTop: 5,
  },
  arrowUpContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  arrowDownContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  pinContainer: {
    marginTop: 10,
  },
  pinText: {
    fontFamily: 'RobotoSlab-Medium',
  },
  pinBoxesContainer: {
    flexDirection: 'row',
    marginTop: 5,
    gap: 5,
  },
  pinBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinNumber: {
    fontFamily: 'RobotoSlab-Bold',
  },
  cancelButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: 'RobotoSlab-Medium',
  },
});

export default ServiceListCard;
