import React from 'react';
import {View, StyleSheet, Text, TouchableOpacity, Animated} from 'react-native';
// import Mapbox from '@rnmapbox/maps';
import {useTranslation} from 'react-i18next';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

/**
 * NavigationMap Component - Placeholder
 * Map functionality temporarily unavailable
 */
const NavigationMap = ({
  locationDetails,
  routeData,
  cameraBounds,
  onBack,
  onRefresh,
  isLoading,
  spin,
  isDarkMode,
  isTablet,
}) => {
  const {t} = useTranslation();

  return (
    <View style={styles.container}>
      {/* Header Controls */}
      <TouchableOpacity
        onPress={onBack}
        style={[
          styles.backButtonContainer,
          {backgroundColor: isDarkMode ? '#333' : 'white'},
        ]}>
        <AntDesign
          name="arrowleft"
          size={isTablet ? 28 : 20}
          color={isDarkMode ? '#fff' : 'black'}
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onRefresh}
        style={[
          styles.refreshButtonContainer,
          {backgroundColor: isDarkMode ? '#333' : 'white'},
        ]}>
        <Animated.View style={{transform: [{rotate: spin}]}}>
          <MaterialIcons
            name="refresh"
            size={isTablet ? 28 : 20}
            color={isDarkMode ? '#fff' : 'black'}
          />
        </Animated.View>
      </TouchableOpacity>

      {/* Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        <MaterialIcons name="map" size={60} color="#ccc" />
        <Text style={styles.placeholderText}>
          {t('map_unavailable', 'Map view temporarily unavailable')}
        </Text>
        <Text style={styles.placeholderSubtext}>
          Navigation functionality will be restored soon
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  backButtonContainer: {
    position: 'absolute',
    top: 20,
    left: 10,
    width: 40,
    height: 40,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 1,
  },
  refreshButtonContainer: {
    position: 'absolute',
    top: 20,
    right: 10,
    width: 40,
    height: 40,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'RobotoSlab-Medium',
  },
  placeholderSubtext: {
    marginTop: 10,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontFamily: 'RobotoSlab-Regular',
  },
});

export default NavigationMap;
