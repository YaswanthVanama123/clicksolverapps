// LocationComponent.js

import React, {useState, useEffect} from 'react';
import {View, Text, Dimensions, StyleSheet} from 'react-native';
import Mapbox from '@rnmapbox/maps';
import BackgroundGeolocation from 'react-native-background-geolocation';
import EncryptedStorage from 'react-native-encrypted-storage';
import haversine from 'haversine';
import firestore from '@react-native-firebase/firestore';
import moment from 'moment-timezone';
import Octicons from 'react-native-vector-icons/Octicons';
import {useNavigation} from '@react-navigation/native';
import axios from 'axios';

Mapbox.setAccessToken = process.env.MAPBOX_API_KEY;

const LocationComponent = ({isEnabled, onWorkerLocationChange}) => {
  const [center, setCenter] = useState([0, 0]);
  const [workerLocation, setWorkerLocation] = useState([]);
  const [cumulativeDistance, setCumulativeDistance] = useState(0);
  const navigation = useNavigation();
  const screenHeight = Dimensions.get('window').height;
  const screenWidth = Dimensions.get('window').width;

  const updateFirestoreLocation = async (latitude, longitude) => {
    try {
      const Item = await EncryptedStorage.getItem('unique');
      if (Item) {
        const locationsCollection = firestore().collection('locations');
        const locationData = {
          location: new firestore.GeoPoint(latitude, longitude),
          timestamp: moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'),
          worker_id: parseInt(Item, 10),
        };
        const snapshot = await locationsCollection
          .where('worker_id', '==', locationData.worker_id)
          .limit(1)
          .get();
        if (!snapshot.empty) {
          const docId = snapshot.docs[0].id;
          await locationsCollection.doc(docId).update({
            location: locationData.location,
            timestamp: locationData.timestamp,
          });
        } else {
          await locationsCollection.add(locationData);
        }
      }
    } catch (error) {
      console.error('Error sending location data to Firestore:', error);
    }
  };

  const initializeGeolocation = () => {
    let onLocationSubscription;
    let onGeofenceSubscription;

    const setupGeolocation = async () => {
      const pcsToken = await EncryptedStorage.getItem('pcs_token');

      if (pcsToken) {
        const geofences = [
          {
            identifier: 'Gampalagudem',
            radius: 10000,
            latitude: 16.998121,
            longitude: 80.5230137,
            notifyOnEntry: true,
            notifyOnExit: true,
            notifyOnDwell: false,
            loiteringDelay: 30000,
          },
        ];

        onLocationSubscription = BackgroundGeolocation.onLocation(
          async location => {
            const {latitude, longitude} = location.coords;
            setCenter([longitude, latitude]);
            setWorkerLocation([latitude, longitude]);
            if (onWorkerLocationChange) {
              onWorkerLocationChange([latitude, longitude]);
            }

            const previousLocation = await EncryptedStorage.getItem(
              'workerPreviousLocation',
            );

            let locationData = previousLocation
              ? JSON.parse(previousLocation)
              : null;

            if (locationData) {
              const previousCoords = {
                latitude: locationData.latitude,
                longitude: locationData.longitude,
              };
              const currentCoords = {latitude, longitude};

              // Calculate distance using Haversine formula
              const distance = haversine(previousCoords, currentCoords, {
                unit: 'km',
              });

              // Update cumulative distance
              const newCumulativeDistance = cumulativeDistance + distance;
              setCumulativeDistance(newCumulativeDistance);

              // Check if cumulative distance is equal or exceeds 1 km
              if (newCumulativeDistance >= 1) {
                await updateFirestoreLocation(latitude, longitude);
                setCumulativeDistance(0); // Reset cumulative distance
                await EncryptedStorage.setItem(
                  'workerPreviousLocation',
                  JSON.stringify({latitude, longitude}),
                );
              } else {
                // Update previous location without resetting cumulative distance
                await EncryptedStorage.setItem(
                  'workerPreviousLocation',
                  JSON.stringify({latitude, longitude}),
                );
              }
            } else {
              // First time setting previous location
              await EncryptedStorage.setItem(
                'workerPreviousLocation',
                JSON.stringify({latitude, longitude}),
              );
              setCumulativeDistance(0); // Initialize cumulative distance
            }
          },
        );

        onGeofenceSubscription = BackgroundGeolocation.onGeofence(
          async geofence => {
            if (geofence.action === 'ENTER') {
              console.log(
                `Worker has entered the geofence: ${geofence.identifier}`,
              );
              // Get current location and send to Firebase
              BackgroundGeolocation.getCurrentPosition()
                .then(async location => {
                  const {latitude, longitude} = location.coords;
                  await updateFirestoreLocation(latitude, longitude);
                  setCumulativeDistance(0); // Reset cumulative distance
                  await EncryptedStorage.setItem(
                    'workerPreviousLocation',
                    JSON.stringify({latitude, longitude}),
                  );
                })
                .catch(error => {
                  console.error('Error getting current position:', error);
                });
              BackgroundGeolocation.start();
            } else if (geofence.action === 'EXIT') {
              console.log(
                `Worker has exited the geofence: ${geofence.identifier}`,
              );
              await updateFirestoreLocation(0, 0); // Send (0, 0) coordinates
              BackgroundGeolocation.stop();
              setCumulativeDistance(0); // Reset cumulative distance
              await EncryptedStorage.setItem(
                'workerPreviousLocation',
                JSON.stringify(null),
              );
            }
          },
        );

        // Listen for location provider changes
        BackgroundGeolocation.onProviderChange(async event => {
          if (!event.enabled) {
            // Location services are disabled
            await updateFirestoreLocation(0, 0); // Send (0, 0) coordinates
            BackgroundGeolocation.stop();
          }
        });

        BackgroundGeolocation.ready({
          desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
          distanceFilter: 1,
          stopTimeout: 5,
          debug: false,
          logLevel: BackgroundGeolocation.LOG_LEVEL_OFF,
          stopOnTerminate: false,
          startOnBoot: true,
          batchSync: false,
          autoSync: true,
        }).then(() => {
          geofences.forEach(geofence => {
            BackgroundGeolocation.addGeofence(geofence).catch(error => {
              console.error(
                `Failed to add geofence for ${geofence.identifier}: `,
                error,
              );
            });
          });
        });
      } else {
        console.log('pcs_token is not available, skipping location tracking.');
      }
    };

    setupGeolocation();

    return () => {
      if (onLocationSubscription) {
        onLocationSubscription.remove();
      }
      if (onGeofenceSubscription) {
        onGeofenceSubscription.remove();
      }
    };
  };

  useEffect(() => {
    let geolocationCleanup;
    if (isEnabled) {
      BackgroundGeolocation.start();
      geolocationCleanup = initializeGeolocation();
    } else {
      BackgroundGeolocation.stop();
      updateFirestoreLocation(0, 0); // Send (0, 0) when tracking is turned off
      setCumulativeDistance(0); // Reset cumulative distance
    }
    return () => {
      if (geolocationCleanup) {
        geolocationCleanup();
      }
    };
  }, [isEnabled]);

  return (
    <View style={{flex: 1}}>
      {isEnabled ? (
        <>
          <Mapbox.MapView
            style={{minHeight: screenHeight, minWidth: screenWidth}}>
            <Mapbox.Camera zoomLevel={17} centerCoordinate={center} />
            <Mapbox.PointAnnotation id="current-location" coordinate={center}>
              <View style={styles.markerContainer}>
                <Octicons name="dot-fill" size={25} color="#0E52FB" />
              </View>
            </Mapbox.PointAnnotation>
          </Mapbox.MapView>
        </>
      ) : (
        <Text style={styles.message}>Please click the switch on</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    textAlign: 'center',
    marginTop: 20,
  },
});

export default LocationComponent;
