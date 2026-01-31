import React from 'react';
import {StyleSheet, View, Dimensions, Text, TouchableOpacity} from 'react-native';
// import Mapbox from '@rnmapbox/maps';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

/**
 * LocationMap Component - Placeholder
 * Map functionality temporarily unavailable
 */
const LocationMap = ({
  location,
  onLocationPress,
  geofenceFeatures,
  height,
  isDarkMode,
}) => {
  const handlePress = () => {
    if (onLocationPress && location) {
      // Simulate a location press event
      onLocationPress({
        geometry: {coordinates: location},
      });
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          height: height || Dimensions.get('window').height * 0.75,
          backgroundColor: isDarkMode ? '#2c2c2c' : '#f5f5f5',
        },
      ]}>
      <TouchableOpacity
        style={styles.mapPlaceholder}
        onPress={handlePress}
        activeOpacity={0.7}>
        <MaterialIcons
          name="location-on"
          size={60}
          color={isDarkMode ? '#666' : '#ccc'}
        />
        <Text
          style={[
            styles.placeholderText,
            {color: isDarkMode ? '#ccc' : '#666'},
          ]}>
          Map view temporarily unavailable
        </Text>
        {location && (
          <View style={styles.locationInfo}>
            <Text
              style={[
                styles.locationText,
                {color: isDarkMode ? '#999' : '#666'},
              ]}>
              Current location: {location[1]?.toFixed(4)}, {location[0]?.toFixed(4)}
            </Text>
            <Text
              style={[
                styles.hintText,
                {color: isDarkMode ? '#777' : '#999'},
              ]}>
              Tap to select location
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    marginTop: 15,
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'RobotoSlab-Medium',
  },
  locationInfo: {
    marginTop: 20,
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    fontFamily: 'RobotoSlab-Regular',
    marginBottom: 5,
  },
  hintText: {
    fontSize: 11,
    fontFamily: 'RobotoSlab-Regular',
    fontStyle: 'italic',
  },
});

export default LocationMap;
