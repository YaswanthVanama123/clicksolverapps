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
      console.log('unique', Item);
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
          },
          {
            identifier: 'Vatluru',
            radius: 10000, // in meters
            latitude: 16.6983514,
            longitude: 81.0503031,
          },
        ];

        onLocationSubscription = BackgroundGeolocation.onLocation(
          async location => {
            const {latitude, longitude} = location.coords;

            onLocationUpdate(latitude, longitude);

            const previousLocation = await EncryptedStorage.getItem(
              'workerPreviousLocation',
            );
            let locationData = previousLocation
              ? JSON.parse(previousLocation)
              : null;

            if (!locationData) {
              const insideGeofence = isLocationInGeofence(
                latitude,
                longitude,
                geofences,
              );
              await updateFirestoreLocation(
                insideGeofence ? latitude : 0,
                insideGeofence ? longitude : 0,
              );
              await EncryptedStorage.setItem(
                'workerPreviousLocation',
                JSON.stringify({latitude, longitude}),
              );
              return;
            }

            const previousCoords = {
              latitude: locationData.latitude,
              longitude: locationData.longitude,
            };
            const currentCoords = {latitude, longitude};

            const distance = haversine(previousCoords, currentCoords, {
              unit: 'km',
            });
            const newCumulativeDistance = cumulativeDistance + distance;
            setCumulativeDistance(newCumulativeDistance);

            if (newCumulativeDistance >= 1) {
              await updateFirestoreLocation(latitude, longitude);
              setCumulativeDistance(0);
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
              console.log(`Entered geofence: ${geofence.identifier}`);
              const currentPosition =
                await BackgroundGeolocation.getCurrentPosition({timeout: 30});
              const {latitude, longitude} = currentPosition.coords;
              await updateFirestoreLocation(latitude, longitude);
              setCumulativeDistance(0);
              await EncryptedStorage.setItem(
                'workerPreviousLocation',
                JSON.stringify({latitude, longitude}),
              );
            } else if (geofence.action === 'EXIT') {
              console.log(`Exited geofence: ${geofence.identifier}`);
              await updateFirestoreLocation(0, 0);
              await EncryptedStorage.setItem(
                'workerPreviousLocation',
                JSON.stringify(null),
              );
            }
          },
        );

        BackgroundGeolocation.ready({
          desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
          distanceFilter: 1,
          stopTimeout: 5,
          debug: false,
          logLevel: BackgroundGeolocation.LOG_LEVEL_OFF,
          stopOnTerminate: false,
          startOnBoot: true,
        }).then(() => {
          geofences.forEach(geofence =>
            BackgroundGeolocation.addGeofence(geofence),
          );
        });
      }
    };

    setupGeolocation();

    return () => {
      if (onLocationSubscription) onLocationSubscription.remove();
      if (onGeofenceSubscription) onGeofenceSubscription.remove();
    };
  };

  useEffect(() => {
    const geolocationCleanup = initializeGeolocation();
    return () => geolocationCleanup();
  }, []);

  useEffect(() => {
    if (isEnabled) {
      BackgroundGeolocation.start();
    } else {
      BackgroundGeolocation.stop();
      updateFirestoreLocation(0, 0);
      setCumulativeDistance(0);
    }
  }, [isEnabled]);

  return null;
};

export default LocationTracker;
