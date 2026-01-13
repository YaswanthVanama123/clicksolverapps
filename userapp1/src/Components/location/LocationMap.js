import React, {useRef} from 'react';
import {StyleSheet, View, Dimensions} from 'react-native';
import Mapbox from '@rnmapbox/maps';

Mapbox.setAccessToken(
  'pk.eyJ1IjoieWFzd2FudGh2YW5hbWEiLCJhIjoiY20ybTMxdGh3MGZ6YTJxc2Zyd2twaWp2ZCJ9.uG0mVTipkeGVwKR49iJTbw',
);

/**
 * LocationMap Component
 * Renders a Mapbox map with user location marker and geofence polygons
 */
const LocationMap = ({
  location,
  onLocationPress,
  geofenceFeatures,
  height,
  isDarkMode,
}) => {
  const mapRef = useRef(null);

  const handlePress = e => {
    if (onLocationPress) {
      onLocationPress(e);
    }
  };

  return (
    <View style={[styles.container, {height: height || Dimensions.get('window').height * 0.75}]}>
      <Mapbox.MapView
        ref={mapRef}
        style={styles.map}
        zoomEnabled
        styleURL="mapbox://styles/mapbox/streets-v11"
        onPress={handlePress}>
        {location && (
          <>
            <Mapbox.Camera zoomLevel={18} centerCoordinate={location} />
            <Mapbox.PointAnnotation id="userLocation" coordinate={location}>
              <View style={styles.markerContainer}>
                <View style={styles.marker} />
              </View>
            </Mapbox.PointAnnotation>
          </>
        )}

        {/* Render geofence polygons */}
        {geofenceFeatures && (
          <Mapbox.ShapeSource id="polygonGeofence" shape={geofenceFeatures}>
            <Mapbox.FillLayer
              id="polygonGeofenceFill"
              style={{fillColor: 'rgba(255, 0, 0, 0.2)'}}
            />
          </Mapbox.ShapeSource>
        )}
      </Mapbox.MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    backgroundColor: 'transparent',
  },
  marker: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff0000',
  },
});

export default LocationMap;
