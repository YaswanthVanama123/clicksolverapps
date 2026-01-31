import React from 'react';
import {StyleSheet, View, Text} from 'react-native';
// import Mapbox from '@rnmapbox/maps';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

/**
 * WaitingMap Component - Placeholder
 * Map functionality temporarily unavailable
 */
const WaitingMap = ({location}) => {
  if (!location || location.length !== 2) {
    return null;
  }

  return (
    <View style={styles.mapPlaceholder}>
      <MaterialIcons name="location-on" size={50} color="#ccc" />
      <Text style={styles.placeholderText}>Map view temporarily unavailable</Text>
      <Text style={styles.locationText}>
        Location: {location[1].toFixed(4)}, {location[0].toFixed(4)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  mapPlaceholder: {
    height: '60%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    marginTop: 15,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontFamily: 'RobotoSlab-Regular',
  },
  locationText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    fontFamily: 'RobotoSlab-Regular',
  },
});

export default WaitingMap;
