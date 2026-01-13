import React, {useRef, useEffect} from 'react';
import {View, StyleSheet, Text, TouchableOpacity, Animated} from 'react-native';
import Mapbox from '@rnmapbox/maps';
import {useTranslation} from 'react-i18next';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {prepareMarkers} from '../../utils/mapUtils';

// Set Mapbox Access Token
Mapbox.setAccessToken(
  'pk.eyJ1IjoieWFzd2FudGh2YW5hbWEiLCJhIjoiY20ybTMxdGh3MGZ6YTJxc2Zyd2twaWp2ZCJ9.uG0mVTipkeGVwKR49iJTbw',
);

// Local images
const startMarker = require('../../assets/start-marker.png');
const endMarker = require('../../assets/end-marker.png');

/**
 * NavigationMap Component
 * Displays Mapbox map with route, markers, and controls
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
  const cameraRef = useRef(null);

  // Fit bounds when camera bounds change
  useEffect(() => {
    if (cameraBounds && cameraRef.current) {
      cameraRef.current.fitBounds(
        [cameraBounds.sw[0], cameraBounds.sw[1]],
        [cameraBounds.ne[0], cameraBounds.ne[1]],
        50,
      );
    }
  }, [cameraBounds]);

  const markers = locationDetails
    ? prepareMarkers(locationDetails.startPoint, locationDetails.endPoint)
    : null;

  return (
    <View style={styles.mapContainer}>
      {locationDetails ? (
        <Mapbox.MapView
          style={styles.map}
          styleURL={Mapbox.StyleURL.Street}
          onDidFinishRenderingMapFully={() => {
            if (cameraRef.current && cameraBounds) {
              cameraRef.current.fitBounds(
                [cameraBounds.sw[0], cameraBounds.sw[1]],
                [cameraBounds.ne[0], cameraBounds.ne[1]],
                50,
              );
            }
          }}>
          <Mapbox.Camera ref={cameraRef} />
          <Mapbox.Images
            images={{
              'start-point-icon': startMarker,
              'end-point-icon': endMarker,
            }}
          />
          {markers && (
            <Mapbox.ShapeSource id="markerSource" shape={markers}>
              <Mapbox.SymbolLayer
                id="markerLayer"
                style={{
                  iconImage: ['get', 'icon'],
                  iconSize: ['get', 'iconSize'],
                  iconAllowOverlap: true,
                  iconAnchor: 'bottom',
                  iconOffset: [0, -10],
                }}
              />
            </Mapbox.ShapeSource>
          )}
          {routeData && (
            <Mapbox.ShapeSource id="routeSource" shape={routeData}>
              <Mapbox.LineLayer
                id="routeLine"
                style={{
                  lineColor: 'red',
                  lineWidth: 6,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            </Mapbox.ShapeSource>
          )}
        </Mapbox.MapView>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={{color: isDarkMode ? '#fff' : '#000'}}>
            {t('loading_map') || 'Loading Map...'}
          </Text>
        </View>
      )}

      {/* Back Button */}
      <TouchableOpacity
        style={[
          styles.leftIcon,
          {
            top: isTablet ? 40 : 30,
            left: isTablet ? 30 : 20,
            backgroundColor: isDarkMode ? '#333' : '#ffffff',
          },
        ]}
        onPress={onBack}>
        <AntDesign
          name="arrowleft"
          size={20}
          color={isDarkMode ? '#fff' : '#000'}
        />
      </TouchableOpacity>

      {/* Refresh Button */}
      <TouchableOpacity
        style={[
          styles.refreshContainer,
          {
            top: isTablet ? 40 : 30,
            right: isTablet ? 30 : 20,
            backgroundColor: isDarkMode ? '#333' : '#ffffff',
            padding: isTablet ? 10 : 7,
          },
        ]}
        onPress={onRefresh}
        disabled={isLoading}
        activeOpacity={0.7}>
        <Animated.View style={{transform: [{rotate: spin}]}}>
          <MaterialIcons
            name="refresh"
            size={22}
            color={isDarkMode ? '#fff' : '#212121'}
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftIcon: {
    position: 'absolute',
    borderRadius: 25,
    zIndex: 999,
    elevation: 3,
  },
  refreshContainer: {
    position: 'absolute',
    borderRadius: 25,
    zIndex: 999,
    elevation: 3,
  },
});

export default NavigationMap;
