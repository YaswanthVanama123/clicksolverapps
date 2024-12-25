// LocationTracker.js

import React, {useState, useEffect} from 'react';
import BackgroundGeolocation from 'react-native-background-geolocation';
import EncryptedStorage from 'react-native-encrypted-storage';
import firestore from '@react-native-firebase/firestore';
import haversine from 'haversine'; // (Still used for distance traveled)
import moment from 'moment-timezone';

/**
 * Helper function: Ray-casting algorithm for point-in-polygon.
 * Expects `polygon` as an array of [latitude, longitude] pairs.
 * Returns true if (lat, lng) is inside the polygon.
 */
function pointInPolygon(lat, lng, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const lat_i = polygon[i][0];
    const lng_i = polygon[i][1];
    const lat_j = polygon[j][0];
    const lng_j = polygon[j][1];

    const intersect =
      lng_i > lng !== lng_j > lng &&
      lat < ((lat_j - lat_i) * (lng - lng_i)) / (lng_j - lng_i) + lat_i;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Returns true if (latitude, longitude) is within at least one polygon in `geofences`.
 * Each geofence has { identifier, vertices: [ [lat, lng], [lat, lng], ... ] }
 */
function isLocationInGeofence(latitude, longitude, geofences) {
  return geofences.some(geofence =>
    pointInPolygon(latitude, longitude, geofence.vertices),
  );
}

/**
 * LocationTracker Component
 *
 * Props:
 *   - isEnabled (Boolean): controls whether tracking is active or not
 *   - onLocationUpdate (Function): callback to receive live location updates in the parent
 */
const LocationTracker = ({isEnabled, onLocationUpdate}) => {
  // Keep track of the distance traveled since last Firestore update inside geofence
  const [cumulativeDistance, setCumulativeDistance] = useState(0);

  /**
   * Sends location (latitude, longitude) to Firestore. It either updates or creates
   * a doc in the 'locations' collection, keyed by worker_id.
   * Also sets the nullCoordinates state in EncryptedStorage based on (0,0).
   */
  const updateFirestoreLocation = async (latitude, longitude) => {
    try {
      // Retrieve worker ID from EncryptedStorage
      const workerIdStr = await EncryptedStorage.getItem('unique');
      if (!workerIdStr) {
        console.log(
          'No worker ID found in EncryptedStorage. Skipping update...',
        );
        return;
      }

      const workerId = parseInt(workerIdStr, 10);
      const locationsCollection = firestore().collection('locations');
      const locationData = {
        location: new firestore.GeoPoint(latitude, longitude),
        timestamp: moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'),
        worker_id: workerId,
      };

      // Check if this worker already has a doc
      const snapshot = await locationsCollection
        .where('worker_id', '==', workerId)
        .limit(1)
        .get();

      // Update existing doc or add a new doc if not found
      if (!snapshot.empty) {
        const docId = snapshot.docs[0].id;
        await locationsCollection.doc(docId).update({
          location: locationData.location,
          timestamp: locationData.timestamp,
        });
        console.log(
          `Firestore UPDATE => worker_id=${workerId}, (${latitude}, ${longitude})`,
        );
      } else {
        await locationsCollection.add(locationData);
        console.log(
          `Firestore ADD => worker_id=${workerId}, (${latitude}, ${longitude})`,
        );
      }

      // Also set the nullCoordinates flag based on whether we sent (0,0)
      if (latitude === 0 && longitude === 0) {
        await EncryptedStorage.setItem('nullCoordinates', 'true');
      } else {
        await EncryptedStorage.setItem('nullCoordinates', 'false');
      }
    } catch (error) {
      console.error('Error sending location to Firestore:', error);
    }
  };

  /**
   * Main initialization: configure background geolocation, set polygon geofences,
   * and create event listeners for location and geofence events.
   */
  const initializeGeolocation = () => {
    let onLocationSubscription;
    let onGeofenceSubscription;

    const setupGeolocation = async () => {
      // If no pcs_token, we skip tracking setup
      const pcsToken = await EncryptedStorage.getItem('pcs_token');
      if (!pcsToken) {
        console.log('No pcs_token found. Skipping location tracking setup.');
        return;
      }

      // **************************************
      // 1) Define your POLYGON geofences here
      // **************************************
      const geofences = [
        {
          identifier: 'PolygonA',
          notifyOnEntry: true,

          notifyOnExit: true,
          notifyOnDwell: false,
          loiteringDelay: 30000,
          // FLIP [lng, lat] => [lat, lng]:
          vertices: [
            [17.006761409194525, 80.53093335197622],
            [17.005373260064985, 80.53291176992008],
            [16.998813039026402, 80.52664649280518],
            [16.993702747389463, 80.52215964720267],
            [16.98846563857974, 80.5205112174242],
            [16.985436512096513, 80.52097340481015],
            [16.982407772736835, 80.51886205401541],
            [16.987520443064497, 80.51325397397363],
            [16.99023324951544, 80.51463921162184],
            [16.995343035509578, 80.51463907310551],
            [16.997739960285273, 80.5172774280341],
            [16.998812144956858, 80.5151667160207],
            [17.001713715885202, 80.51609017256038],
            [17.002827038610846, 80.51776432647671],
            [17.003291715895045, 80.52011454583169],
            [17.00505854929827, 80.52875703518436],
            [17.00682448638898, 80.5309333429243],
            [17.006761409194525, 80.53093335197622], // repeat first to close
          ],
        },
        {
          identifier: 'PolygonB',
          notifyOnEntry: true,
          notifyOnExit: true,
          notifyOnDwell: false,
          loiteringDelay: 30000,
          vertices: [
            [16.743659016732067, 81.08236641250511],
            [16.74034916284056, 81.1094786505995],
            [16.75332517520627, 81.11236934565574],
            [16.75189061713202, 81.12344773457119],
            [16.74132482137297, 81.13930188707656],
            [16.738499354073056, 81.14316076908437],
            [16.727924964128718, 81.14435289187736],
            [16.72342039833586, 81.14527321552549],
            [16.714353330434236, 81.14475480852309],
            [16.703383261743355, 81.13502168775335],
            [16.696706590762375, 81.11606570973981],
            [16.690277614635917, 81.11161284859327],
            [16.690514707521203, 81.10419147444412],
            [16.682222407654322, 81.09411194809388],
            [16.680443872924542, 81.08526753004003],
            [16.681096564850336, 81.08063131598783],
            [16.68719744307066, 81.07017793961404],
            [16.70130255228827, 81.06808977263063],
            [16.696116367178703, 81.04868074812543],
            [16.712614628885774, 81.05789409014807],
            [16.730789178638346, 81.06475183815792],
            [16.74056558441238, 81.0761195443987],
            [16.743659016732067, 81.08236641250511],
          ],
        },
      ];

      // 2) Subscribe to location updates
      onLocationSubscription = BackgroundGeolocation.onLocation(
        async location => {
          const {latitude, longitude} = location.coords;

          // Pass the fresh coords to the parent component if needed
          onLocationUpdate(latitude, longitude);

          // Retrieve previous location from storage
          const prevLocStr = await EncryptedStorage.getItem(
            'workerPreviousLocation',
          );
          const previousLocation = prevLocStr ? JSON.parse(prevLocStr) : null;

          // Check if we're inside at least one polygon geofence
          const insideGeofence = isLocationInGeofence(
            latitude,
            longitude,
            geofences,
          );

          // 1) NO previous location
          if (!previousLocation) {
            if (insideGeofence) {
              // First-time inside => send real coords
              console.log(
                'First-time location inside geofence => sending real coords',
              );
              await updateFirestoreLocation(latitude, longitude);
              // Store current coords
              await EncryptedStorage.setItem(
                'workerPreviousLocation',
                JSON.stringify({latitude, longitude}),
              );
              await EncryptedStorage.setItem('nullCoordinates', 'false');
            } else {
              // First-time outside => send (0,0)
              console.log(
                'First-time location outside geofence => sending (0,0)',
              );
              await updateFirestoreLocation(0, 0);
              await EncryptedStorage.setItem(
                'workerPreviousLocation',
                JSON.stringify(null),
              );
              await EncryptedStorage.setItem('nullCoordinates', 'true');
            }
            return;
          }

          // 2) We DO have a previous location
          if (!insideGeofence) {
            // Outside scenario
            const nullCoordinates = await EncryptedStorage.getItem(
              'nullCoordinates',
            );
            if (nullCoordinates === 'false') {
              // If we haven't already sent (0,0), do it now
              console.log('Outside geofence => sending (0,0)');
              await updateFirestoreLocation(0, 0);
              await EncryptedStorage.setItem(
                'workerPreviousLocation',
                JSON.stringify(null),
              );
              await EncryptedStorage.setItem('nullCoordinates', 'true');
            }
            return;
          }

          // 3) INSIDE a geofence & previousLocation is not null
          const prevCoords = {
            latitude: previousLocation.latitude,
            longitude: previousLocation.longitude,
          };
          const currentCoords = {latitude, longitude};

          // Calculate distance from last known location
          const distanceMoved = haversine(prevCoords, currentCoords, {
            unit: 'km',
          });
          const updatedCumulative = cumulativeDistance + distanceMoved;

          // If traveled >= 1 km => send location to Firestore
          if (updatedCumulative >= 1) {
            console.log(
              `Traveled >=1 km => Updating Firestore with (${latitude}, ${longitude})`,
            );
            await updateFirestoreLocation(latitude, longitude);

            // Reset cumulative distance
            setCumulativeDistance(0);
            // Store current coords
            await EncryptedStorage.setItem(
              'workerPreviousLocation',
              JSON.stringify({latitude, longitude}),
            );
            await EncryptedStorage.setItem('nullCoordinates', 'false');
          } else {
            // Not yet 1 km => just update previousLocation and keep accumulating
            console.log(
              'Inside geofence but <1 km => updating previousLocation only',
            );
            setCumulativeDistance(updatedCumulative);
            await EncryptedStorage.setItem(
              'workerPreviousLocation',
              JSON.stringify({latitude, longitude}),
            );
          }
        },
      );

      // 3) Subscribe to geofence events (ENTER, EXIT)
      onGeofenceSubscription = BackgroundGeolocation.onGeofence(
        async geofence => {
          const {identifier, action} = geofence;
          console.log(`Geofence event => ID: ${identifier}, Action: ${action}`);

          if (action === 'ENTER') {
            // Worker just entered a polygon
            console.log(`Entered geofence => ${identifier}`);
            // Mark nullCoordinates = 'false'
            await EncryptedStorage.setItem('nullCoordinates', 'false');

            // Optional: If you want to do an immediate Firestore update on ENTER
            // you could trigger one here, but your onLocation callback
            // typically handles it automatically.
          } else if (action === 'EXIT') {
            // Worker just exited a polygon
            console.log(`Exited geofence => ${identifier}`);
            // Send (0,0) only if we haven't already
            const nullCoordinates = await EncryptedStorage.getItem(
              'nullCoordinates',
            );
            if (nullCoordinates === 'false') {
              console.log(
                'Exited geofence => sending (0,0) and resetting prevLocation...',
              );
              await updateFirestoreLocation(0, 0);
              await EncryptedStorage.setItem('nullCoordinates', 'true');
              await EncryptedStorage.setItem(
                'workerPreviousLocation',
                JSON.stringify(null),
              );
            }
          }
        },
      );

      // 4) Listen for provider changes (e.g., user disables GPS)
      BackgroundGeolocation.onProviderChange(async event => {
        if (!event.enabled) {
          console.log(
            'GPS disabled => stopping location tracking, sending (0,0)',
          );
          await updateFirestoreLocation(0, 0);
          await EncryptedStorage.setItem('nullCoordinates', 'true');
          await EncryptedStorage.setItem(
            'workerPreviousLocation',
            JSON.stringify(null),
          );
          BackgroundGeolocation.stop();
        }
      });

      // 5) Configure the background geolocation
      BackgroundGeolocation.ready({
        desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
        distanceFilter: 1,
        stopTimeout: 5,
        debug: false, // set true to see logs on device
        logLevel: BackgroundGeolocation.LOG_LEVEL_OFF,
        stopOnTerminate: false, // continue tracking after app is terminated
        startOnBoot: true, // resume tracking after device reboot
        batchSync: false,
        autoSync: true,
      }).then(() => {
        // Add all polygon geofences
        geofences.forEach(geofence => {
          BackgroundGeolocation.addGeofence(geofence).catch(error => {
            console.error(
              `Failed adding polygon geofence: ${geofence.identifier}`,
              error,
            );
          });
        });
      });
    };

    // Initialize everything
    setupGeolocation();

    // Return a cleanup function for unmount
    return () => {
      if (onLocationSubscription) onLocationSubscription.remove();
      if (onGeofenceSubscription) onGeofenceSubscription.remove();
    };
  };

  // On component mount, initialize geolocation
  useEffect(() => {
    const cleanup = initializeGeolocation();
    return () => cleanup && cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start or stop tracking based on isEnabled
  useEffect(() => {
    (async () => {
      if (isEnabled) {
        BackgroundGeolocation.start();
      } else {
        console.log(
          'Tracking disabled => stopping BG Geolocation, sending (0,0)',
        );
        BackgroundGeolocation.stop();
        await updateFirestoreLocation(0, 0);
        await EncryptedStorage.setItem('nullCoordinates', 'true');
        await EncryptedStorage.setItem(
          'workerPreviousLocation',
          JSON.stringify(null),
        );
        setCumulativeDistance(0);
      }
    })();
  }, [isEnabled]);

  // This component doesn't render any UI
  return null;
};

export default LocationTracker;
