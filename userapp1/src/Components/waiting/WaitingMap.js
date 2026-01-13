import React from 'react';
import {StyleSheet, View, Image} from 'react-native';
import Mapbox from '@rnmapbox/maps';

Mapbox.setAccessToken(
  'pk.eyJ1IjoieWFzd2FudGh2YW5hbWEiLCJhIjoiY20ybTMxdGh3MGZ6YTJxc2Zyd2twaWp2ZCJ9.uG0mVTipkeGVwKR49iJTbw',
);

/**
 * WaitingMap Component
 * Displays map with user location marker during waiting
 */
const WaitingMap = ({location}) => {
  if (!location || location.length !== 2) {
    return null;
  }

  return (
    <Mapbox.MapView style={styles.map}>
      <Mapbox.Camera zoomLevel={16} centerCoordinate={location} />
      <Mapbox.MarkerView coordinate={location}>
        <Image
          source={{
            uri: 'https://i.postimg.cc/ZRdQkj5d/Screenshot-2024-11-13-164652-removebg-preview.png',
          }}
          style={styles.markerImage}
        />
      </Mapbox.MarkerView>
    </Mapbox.MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    height: '60%',
  },
  markerImage: {
    width: 25,
    height: 50,
    resizeMode: 'contain',
  },
});

export default WaitingMap;
