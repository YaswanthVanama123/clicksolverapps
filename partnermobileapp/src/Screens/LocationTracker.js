// LocationTracker.js

import React, {useState, useEffect} from 'react';
import BackgroundGeolocation from 'react-native-background-geolocation';
import EncryptedStorage from 'react-native-encrypted-storage';
import haversine from 'haversine';
import firestore from '@react-native-firebase/firestore';
import moment from 'moment-timezone';

const LocationTracker = ({isEnabled, onLocationUpdate}) => {
  const [cumulativeDistance, setCumulativeDistance] = useState(0);

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
          console.log(
            `Firestore updated: Worker ID ${locationData.worker_id}, Latitude: ${latitude}, Longitude: ${longitude}`,
          );
        } else {
          await locationsCollection.add(locationData);
          console.log(
            `Firestore added: Worker ID ${locationData.worker_id}, Latitude: ${latitude}, Longitude: ${longitude}`,
          );
        }
        if (latitude === 0 && longitude === 0) {
          await EncryptedStorage.setItem('nullCoordinates', 'true');
        } else {
          await EncryptedStorage.setItem('nullCoordinates', 'false');
        }
      }
    } catch (error) {
      console.error('Error sending location data to Firestore:', error);
    }
  };

  const isLocationInGeofence = (latitude, longitude, geofences) => {
    return geofences.some(geofence => {
      const distance = haversine(
        {latitude, longitude},
        {latitude: geofence.latitude, longitude: geofence.longitude},
        {unit: 'km'},
      );
      return distance <= geofence.radius / 1000; // Radius is in meters, convert to km
    });
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
            radius: 10000, // in meters
            latitude: 16.998121,
            longitude: 80.5230137,
            notifyOnEntry: true,
            notifyOnExit: true,
            notifyOnDwell: false,
            loiteringDelay: 30000,
          },
          // Add more geofences if needed
        ];

        onLocationSubscription = BackgroundGeolocation.onLocation(
          async location => {
            const {latitude, longitude} = location.coords;

            // Call the callback function to update location in parent component
            onLocationUpdate(latitude, longitude);

            const previousLocation = await EncryptedStorage.getItem(
              'workerPreviousLocation',
            );

            let locationData = previousLocation
              ? JSON.parse(previousLocation)
              : null;

            if (!locationData) {
              // First time location is being set
              const insideGeofence = isLocationInGeofence(
                latitude,
                longitude,
                geofences,
              );
              if (insideGeofence) {
                console.log(
                  `First time setting previous location inside geofence: Latitude: ${latitude}, Longitude: ${longitude}`,
                );
                await updateFirestoreLocation(latitude, longitude);
                await EncryptedStorage.setItem(
                  'workerPreviousLocation',
                  JSON.stringify({latitude, longitude}),
                );
                await EncryptedStorage.setItem('nullCoordinates', 'false');
              } else {
                console.log(
                  `Worker is outside of any geofence. Sending (0, 0) to Firestore.`,
                );
                await updateFirestoreLocation(0, 0);
                await EncryptedStorage.setItem(
                  'workerPreviousLocation',
                  JSON.stringify({latitude, longitude}),
                );
                await EncryptedStorage.setItem('nullCoordinates', 'true');
              }
              return;
            }

            // LocationData is present - Check if within geofence
            const insideGeofence = isLocationInGeofence(
              latitude,
              longitude,
              geofences,
            );

            if (!insideGeofence) {
              const nullCoordinates = await EncryptedStorage.getItem(
                'nullCoordinates',
              );
              if (nullCoordinates === 'false') {
                console.log(
                  `Worker is outside of any geofence. Sending (0, 0) to Firestore.`,
                );
                await updateFirestoreLocation(0, 0);
                await EncryptedStorage.setItem('nullCoordinates', 'true');
              }
              return;
            }

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
              console.log(
                `Updating Firestore with new location after traveling 1 km: Latitude: ${latitude}, Longitude: ${longitude}`,
              );
              await updateFirestoreLocation(latitude, longitude);
              setCumulativeDistance(0); // Reset cumulative distance
              await EncryptedStorage.setItem(
                'workerPreviousLocation',
                JSON.stringify({latitude, longitude}),
              );
              await EncryptedStorage.setItem('nullCoordinates', 'false');
            } else {
              console.log(
                `Updating previous location without resetting cumulative distance: Latitude: ${latitude}, Longitude: ${longitude}`,
              );
              // Update previous location without resetting cumulative distance
              await EncryptedStorage.setItem(
                'workerPreviousLocation',
                JSON.stringify({latitude, longitude}),
              );
            }
          },
        );

        onGeofenceSubscription = BackgroundGeolocation.onGeofence(
          async geofence => {
            if (geofence.action === 'ENTER') {
              console.log(
                `Worker has entered the geofence: ${geofence.identifier}`,
              );
              setIsInsideGeofence(true); // Set flag indicating worker is inside a geofence
              await EncryptedStorage.setItem('nullCoordinates', 'false');
            } else if (geofence.action === 'EXIT') {
              console.log(
                `Worker has exited the geofence: ${geofence.identifier}`,
              );
              setIsInsideGeofence(false); // Set flag indicating worker is outside geofences

              const nullCoordinates = await EncryptedStorage.getItem(
                'nullCoordinates',
              );
              if (nullCoordinates === 'false') {
                console.log(
                  'Worker is now outside of any geofence. Sending (0, 0) to Firestore.',
                );
                await updateFirestoreLocation(0, 0); // Send (0, 0) coordinates
                await EncryptedStorage.setItem('nullCoordinates', 'true');
              }
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
            console.log(
              'Location services are disabled. Stopping location tracking.',
            );
            await updateFirestoreLocation(0, 0); // Send (0, 0) coordinates
            await EncryptedStorage.setItem('nullCoordinates', 'true');
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
    const geolocationCleanup = initializeGeolocation();

    return () => {
      geolocationCleanup();
    };
  }, []);

  useEffect(() => {
    if (isEnabled) {
      BackgroundGeolocation.start();
    } else {
      BackgroundGeolocation.stop();
      console.log(
        'Location tracking disabled. Sending coordinates (0, 0) to Firestore.',
      );
      updateFirestoreLocation(0, 0); // Send (0, 0) when tracking is turned off
      setCumulativeDistance(0); // Reset cumulative distance
      EncryptedStorage.setItem('nullCoordinates', 'true');
    }
  }, [isEnabled]);

  return null; // This component does not render anything
};

export default LocationTracker;
