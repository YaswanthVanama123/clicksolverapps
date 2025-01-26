// LocationTracker.js

import React, {useState, useEffect} from 'react';
import BackgroundGeolocation from 'react-native-background-geolocation';
import EncryptedStorage from 'react-native-encrypted-storage';
import firestore from '@react-native-firebase/firestore';
import haversine from 'haversine';
import moment from 'moment-timezone';

/**
 * Helper function: Ray-casting algorithm for point-in-polygon.
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
 * Returns true if (latitude, longitude) is inside at least one polygon in `geofences`.
 */
function isLocationInGeofence(latitude, longitude, geofences) {
  return geofences.some(geofence =>
    pointInPolygon(latitude, longitude, geofence.vertices),
  );
}

const LocationTracker = ({isEnabled, onLocationUpdate}) => {
  // Keep track of distance traveled inside the geofence since last update
  const [cumulativeDistance, setCumulativeDistance] = useState(0);

  /**
   * Sends location to Firestore and updates timestamp.
   */
  const updateFirestoreLocation = async (latitude, longitude) => {
    try {
      const workerIdStr = await EncryptedStorage.getItem('unique');
      if (!workerIdStr) {
        console.log(
          'No worker ID found in EncryptedStorage. Skipping Firestore update...',
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

      // Check existing doc for this worker
      const snapshot = await locationsCollection
        .where('worker_id', '==', workerId)
        .limit(1)
        .get();

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

      // Mark whether we just sent (0,0)
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
   * Main setup: define geofences, subscribe to location & geofence events, configure BG Geolocation.
   */
  const initializeGeolocation = () => {
    let onLocationSubscription;
    let onGeofenceSubscription;

    const setupGeolocation = async () => {
      // If no pcs_token, skip setup
      const pcsToken = await EncryptedStorage.getItem('pcs_token');
      if (!pcsToken) {
        console.log('No pcs_token found. Skipping location tracking setup.');
        return;
      }

      // Define polygon geofences
      const geofences = [
        {
          identifier: 'PolygonA',
          notifyOnEntry: true,
          notifyOnExit: true,
          notifyOnDwell: false,
          loiteringDelay: 30000,
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
            [17.006761409194525, 80.53093335197622],
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
        {
          identifier: 'Chandrugonda',
          notifyOnEntry: true,
          notifyOnExit: true,
          notifyOnDwell: false,
          loiteringDelay: 30000,
          vertices: [
            [80.63369145143679, 17.390042404120663],
            [80.63464400354599, 17.393299672168467],
            [80.63975074124545, 17.39213817238675],
            [80.64162938568472, 17.395471151975457],
            [80.6424231791093, 17.395647899197584],
            [80.64168230524632, 17.391759420863266],
            [80.66549013578845, 17.38398742015015],
            [80.66695273406538, 17.371101579573804],
            [80.64701080411146, 17.37945102139436],
            [80.63979862457018, 17.385593101328965],
            [80.63369949884378, 17.390250991288397],
            [80.63369145143679, 17.390042404120663],
          ],
        },
      ];

      // Subscribe to location updates
      onLocationSubscription = BackgroundGeolocation.onLocation(
        async location => {
          const {latitude, longitude} = location.coords;

          // Pass coords to parent
          onLocationUpdate(latitude, longitude);

          // Are we inside any polygon?
          const insideGeofence = isLocationInGeofence(
            latitude,
            longitude,
            geofences,
          );

          // Get previousLocation
          const prevLocStr = await EncryptedStorage.getItem(
            'workerPreviousLocation',
          );
          const previousLocation = prevLocStr ? JSON.parse(prevLocStr) : null;

          // CASE 1: No previousLocation => first location event
          if (!previousLocation) {
            if (insideGeofence) {
              console.log(
                'First-time location is INSIDE geofence => sending real coords',
              );
              await updateFirestoreLocation(latitude, longitude);

              // Store real location
              await EncryptedStorage.setItem(
                'workerPreviousLocation',
                JSON.stringify({latitude, longitude}),
              );
              await EncryptedStorage.setItem('nullCoordinates', 'false');
            } else {
              console.log(
                'First-time location is OUTSIDE geofence => sending (0,0)',
              );
              await updateFirestoreLocation(0, 0);

              // Store (0,0) to avoid repeating "first-time outside" logs
              await EncryptedStorage.setItem(
                'workerPreviousLocation',
                JSON.stringify({latitude: 0, longitude: 0}),
              );
              await EncryptedStorage.setItem('nullCoordinates', 'true');
            }
            return;
          }

          // CASE 2: We DO have a previousLocation, check if inside or outside
          if (!insideGeofence) {
            // Already outside => skip sending (0,0) again
            console.log(
              'Already outside geofence => skipping repeated (0,0) update',
            );
            return;
          }

          // CASE 3: INSIDE geofence & we have a previousLocation
          // Check if previousLocation was (0,0) => means we just came from outside
          if (
            previousLocation.latitude === 0 &&
            previousLocation.longitude === 0
          ) {
            console.log(
              'Re-entered geofence from outside => sending immediate real coords',
            );
            await updateFirestoreLocation(latitude, longitude);

            setCumulativeDistance(0);
            await EncryptedStorage.setItem(
              'workerPreviousLocation',
              JSON.stringify({latitude, longitude}),
            );
            await EncryptedStorage.setItem('nullCoordinates', 'false');
            return;
          }

          // Normal inside scenario => check distance
          const prevCoords = {
            latitude: previousLocation.latitude,
            longitude: previousLocation.longitude,
          };
          const currentCoords = {latitude, longitude};
          const distanceMoved = haversine(prevCoords, currentCoords, {
            unit: 'km',
          });

          const updatedCumulative = cumulativeDistance + distanceMoved;
          if (updatedCumulative >= 1) {
            console.log(
              `Inside geofence => traveled >=1 km => sending real coords (${latitude}, ${longitude})`,
            );
            await updateFirestoreLocation(latitude, longitude);

            setCumulativeDistance(0);
            await EncryptedStorage.setItem(
              'workerPreviousLocation',
              JSON.stringify({latitude, longitude}),
            );
            await EncryptedStorage.setItem('nullCoordinates', 'false');
          } else {
            console.log(
              `Inside geofence => traveled <1 km => accumulating (total now ~${updatedCumulative.toFixed(
                3,
              )} km)`,
            );
            setCumulativeDistance(updatedCumulative);

            // Still update previousLocation so next distance calc is correct
            await EncryptedStorage.setItem(
              'workerPreviousLocation',
              JSON.stringify({latitude, longitude}),
            );
          }
        },
      );

      // Subscribe to geofence events
      onGeofenceSubscription = BackgroundGeolocation.onGeofence(
        async geofence => {
          const {identifier, action} = geofence;
          console.log(`Geofence event => ID: ${identifier}, Action: ${action}`);

          if (action === 'ENTER') {
            console.log(`ENTER geofence => ${identifier}`);
            await EncryptedStorage.setItem('nullCoordinates', 'false');
            // Optional: immediate Firestore update on ENTER is possible,
            // but typically your onLocation callback handles it.
          } else if (action === 'EXIT') {
            console.log(`EXIT geofence => ${identifier}`);
            // Only send (0,0) once
            const nullCoordinates = await EncryptedStorage.getItem(
              'nullCoordinates',
            );
            if (nullCoordinates === 'false') {
              console.log('EXIT => sending (0,0) once');
              await updateFirestoreLocation(0, 0);

              await EncryptedStorage.setItem('nullCoordinates', 'true');
              // Store (0,0) => so we don't spam repeated outside updates
              await EncryptedStorage.setItem(
                'workerPreviousLocation',
                JSON.stringify({latitude: 0, longitude: 0}),
              );
            } else {
              console.log('EXIT => already sent (0,0) previously');
            }
          }
        },
      );

      // Provider changes (GPS off, etc.)
      BackgroundGeolocation.onProviderChange(async event => {
        if (!event.enabled) {
          console.log(
            'GPS disabled => stopping location tracking, sending (0,0)',
          );
          await updateFirestoreLocation(0, 0);
          await EncryptedStorage.setItem('nullCoordinates', 'true');
          await EncryptedStorage.setItem(
            'workerPreviousLocation',
            JSON.stringify({latitude: 0, longitude: 0}),
          );
          BackgroundGeolocation.stop();
        }
      });

      // Configure BG Geolocation
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
        // Add polygon geofences
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

    setupGeolocation();

    // Cleanup on unmount
    return () => {
      if (onLocationSubscription) onLocationSubscription.remove();
      if (onGeofenceSubscription) onGeofenceSubscription.remove();
    };
  };

  // Initialize on component mount
  useEffect(() => {
    const cleanup = initializeGeolocation();
    return () => {
      if (cleanup) cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start/stop tracking based on isEnabled
  useEffect(() => {
    (async () => {
      if (isEnabled) {
        console.log(
          'Location tracking enabled => BackgroundGeolocation.start()',
        );
        BackgroundGeolocation.start();
      } else {
        console.log('Location tracking disabled => stopping & sending (0,0)');
        BackgroundGeolocation.stop();

        await updateFirestoreLocation(0, 0);
        await EncryptedStorage.setItem('nullCoordinates', 'true');

        // Store (0,0) so we don't keep logging "first-time outside"
        await EncryptedStorage.setItem(
          'workerPreviousLocation',
          JSON.stringify({latitude: 0, longitude: 0}),
        );
        setCumulativeDistance(0);
      }
    })();
  }, [isEnabled]);

  // Component renders no UI
  return null;
};

export default LocationTracker;
