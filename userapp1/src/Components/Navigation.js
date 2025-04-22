import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Alert,
  BackHandler,
  Image,
  TouchableOpacity,
  Modal,
  PermissionsAndroid,
  Platform,
  ScrollView,
  Animated,
  Easing,
  Linking,
  useWindowDimensions,
  AppState,
} from 'react-native';
import Mapbox from '@rnmapbox/maps';
import EncryptedStorage from 'react-native-encrypted-storage';
import axios from 'axios';
import {
  useRoute,
  useNavigation,
  CommonActions,
  useFocusEffect,
} from '@react-navigation/native';
import '../i18n/i18n';
// Import useTranslation hook to access the translation function
import { useTranslation } from 'react-i18next';
import { encode } from 'base-64';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';
import polyline from '@mapbox/polyline';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../context/ThemeContext'; // Your theme hook
import messaging from '@react-native-firebase/messaging';

// Local images
const startMarker = require('../assets/start-marker.png');
const endMarker = require('../assets/end-marker.png');

// Set Mapbox Access Token
Mapbox.setAccessToken(
  'pk.eyJ1IjoieWFzd2FudGh2YW5hbWEiLCJhIjoiY20ybTMxdGh3MGZ6YTJxc2Zyd2twaWp2ZCJ9.uG0mVTipkeGVwKR49iJTbw',
);

const Navigation = () => {
  const {width, height} = useWindowDimensions();
  const {isDarkMode} = useTheme();
  const styles = dynamicStyles(width, height, isDarkMode);

  const route = useRoute();
  const navigation = useNavigation();

  // --- States ---
  const [routeData, setRouteData] = useState(null);
  const [locationDetails, setLocationDetails] = useState(null);
  const [decodedId, setDecodedId] = useState(null);
  const [addressDetails, setAddressDetails] = useState({});
  const [encodedData, setEncodedData] = useState(null);
  const [pin, setPin] = useState('');
  const [serviceArray, setServiceArray] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [cameraBounds, setCameraBounds] = useState(null);
  const [showUpArrowService, setShowUpArrowService] = useState(false);
  const [showDownArrowService, setShowDownArrowService] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Loading indicator
  const { t } = useTranslation();
  // Camera ref for calling fitBounds
  const cameraRef = useRef(null);

  // For rotating refresh icon
  const rotationValue = useRef(new Animated.Value(0)).current;

  // Animate refresh icon if loading
  useEffect(() => {
    let animation;
    if (isLoading) {
      rotationValue.setValue(0);
      animation = Animated.loop(
        Animated.timing(rotationValue, {
          toValue: 1,
          duration: 800,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      animation.start();
    } else if (animation) {
      animation.stop();
    }
    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [isLoading, rotationValue]);

  const spin = rotationValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Request Location Permissions (Android)
  useEffect(() => {
    const requestLocationPermission = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message: 'This app needs access to your location',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            // console.log('Location permission denied');
          }
        } catch (err) {
          console.warn(err);
        }
      }
    };
    requestLocationPermission();
  }, []);

  // Decode Base64 ID from route params
  useEffect(() => {
    const {encodedId} = route.params;
    setEncodedData(encodedId);
    if (encodedId) {
      try {
        setDecodedId(atob(encodedId));
      } catch (error) {
        console.error('Error decoding Base64:', error);
      }
    }
  }, [route.params]);

  // Override Android back button to navigate to Home
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: 'Tabs', state: {routes: [{name: 'Home'}]}}],
          }),
        );
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation]),
  );

  /**
   * Render fractional stars up to 5 stars.
   */
  const renderFractionalStars = (ratingValue = 0) => {
    const totalStars = 5;
    const starSize = 16;
    const stars = [];

    for (let i = 1; i <= totalStars; i++) {
      let fraction = ratingValue - (i - 1);
      if (fraction < 0) fraction = 0;
      if (fraction > 1) fraction = 1;

      stars.push(
        <View
          key={i}
          style={{
            width: starSize,
            height: starSize,
            marginRight: 4,
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          {/* Gray star behind */}
          <AntDesign
            name="star"
            size={starSize}
            color={isDarkMode ? "#555" : "#ccc"}
            style={{position: 'absolute', left: 0, top: 0}}
          />
          {/* Colored star in front */}
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: starSize * fraction,
              overflow: 'hidden',
              height: starSize,
            }}
          >
            <AntDesign name="star" size={starSize} color="#FF5722" />
          </View>
        </View>
      );
    }
    return <View style={{flexDirection: 'row'}}>{stars}</View>;
  };

  /**
   * Fetch Worker Details
   */
  const fetchWorkerDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const jwtToken = await EncryptedStorage.getItem('cs_token');
      const response = await axios.post(
        'https://backend.clicksolver.com/api/worker/navigation/details',
        {notificationId: decodedId},
        {headers: {Authorization: `Bearer ${jwtToken}`}},
      );

      if (response.status === 404) {
        navigation.navigate('SkillRegistration');
      } else {
        const {
          name,
          phone_number,
          pin,
          profile,
          pincode,
          area,
          city,
          service_booked,
          average_rating,
          service_counts,
        } = response.data;

        setPin(String(pin));
        setAddressDetails({
          name,
          phone_number,
          profile,
          pincode,
          area,
          city,
          service: service_booked,
          rating: average_rating,
          serviceCounts: service_counts,
        });
        setServiceArray(service_booked);
      }
    } catch (error) {
      console.error('Error fetching worker details:', error);
    } finally {
      setIsLoading(false);
    }
  }, [decodedId, navigation]);

  // Call fetchWorkerDetails once we have decodedId
  useEffect(() => {
    if (decodedId) {
      fetchWorkerDetails();
    }
  }, [decodedId, fetchWorkerDetails]);

  // Check verification status
  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        const response = await axios.get(
          'https://backend.clicksolver.com/api/worker/verification/status',
          {params: {notification_id: decodedId}},
        );

        if (response.data === 'true') {
          const cs_token = await EncryptedStorage.getItem('cs_token');
          // await axios.post(
          //   'https://backend.clicksolver.com/api/user/action',
          //   {
          //     encodedId: encodedData,
          //     screen: 'worktimescreen',
          //   },
          //   {
          //     headers: {Authorization: `Bearer ${cs_token}`},
          //   },
          // );

          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {name: 'worktimescreen', params: {encodedId: encodedData}},
              ],
            }),
          );
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
      }
    };
    if (decodedId) checkVerificationStatus();
  }, [decodedId, encodedData, navigation]);

  /**
   * Fetch route from Ola Maps
   */
  const fetchOlaRoute = useCallback(async (startPoint, endPoint, waypoints = []) => {
    try {
      // console.log('Ola route start/end (lng, lat) =>', startPoint, endPoint);

      const apiKey = 'iN1RT7PQ41Z0DVxin6jlf7xZbmbIZPtb9CyNwtlT';
      let url = `https://api.olamaps.io/routing/v1/directions?origin=${startPoint[1]},${startPoint[0]}&destination=${endPoint[1]},${endPoint[0]}&api_key=${apiKey}`;

      if (waypoints.length > 0) {
        const waypointParams = waypoints
          .map((point) => `${point[1]},${point[0]}`)
          .join('|');
        url += `&waypoints=${encodeURIComponent(waypointParams)}`;
      }

      const response = await axios.post(
        url,
        {},
        {
          headers: {
            'X-Request-Id': 'unique-request-id',
          },
        },
      );

      if (!response.data.routes || response.data.routes.length === 0) {
        // console.log('No routes returned by Ola Maps');
        return null;
      }

      const routeEncoded = response.data.routes[0].overview_polyline;
      if (!routeEncoded) {
        // console.log('No overview_polyline in Ola route');
        return null;
      }

      const decodedCoordinates = polyline
        .decode(routeEncoded)
        .map((coord) => [coord[1], coord[0]]); // [lng, lat]

      return {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: decodedCoordinates,
        },
      };
    } catch (error) {
      console.error('Error fetching route from Ola Maps:', error);
      return null;
    }
  }, []);

  /**
   * Wrapper to fetch route
   */
  const fetchRoute = useCallback(
    async (startPoint, endPoint) => {
      try {
        const olaRouteData = await fetchOlaRoute(startPoint, endPoint);
        if (
          olaRouteData &&
          olaRouteData.geometry &&
          olaRouteData.geometry.coordinates.length > 0
        ) {
          setRouteData(olaRouteData);
        } else {
          console.error('Route data has empty coordinates or is null:', olaRouteData);
        }
      } catch (error) {
        console.error('Error fetching route:', error);
      }
    },
    [fetchOlaRoute],
  );

  /**
   * Fetch location details from backend
   */
  const fetchLocationDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        'https://backend.clicksolver.com/api/user/location/navigation',
        {params: {notification_id: decodedId}},
      );

      const {startPoint, endPoint} = response.data;
      // Reverse from [lat, lng] to [lng, lat]
      const reversedStart = startPoint.map(parseFloat).reverse();
      const reversedEnd = endPoint.map(parseFloat).reverse();

      setLocationDetails({startPoint: reversedStart, endPoint: reversedEnd});
      await fetchRoute(reversedStart, reversedEnd);
    } catch (error) {
      console.error('Error fetching location details:', error);
    } finally {
      setIsLoading(false);
    }
  }, [decodedId, fetchRoute]);

  // Fetch location on mount + refresh every 60s
  useEffect(() => {
    let intervalId;
    if (decodedId) {
      fetchLocationDetails();
      intervalId = setInterval(fetchLocationDetails, 60000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [decodedId, fetchLocationDetails]);

  // Compute bounding box for the route
  useEffect(() => {
    if (
      locationDetails &&
      routeData &&
      routeData.geometry &&
      routeData.geometry.coordinates.length > 0
    ) {
      const allCoordinates = [
        locationDetails.startPoint,
        locationDetails.endPoint,
        ...routeData.geometry.coordinates,
      ];
      const bounds = computeBoundingBox(allCoordinates);
      setCameraBounds(bounds);
    }
  }, [locationDetails, routeData]);

  const computeBoundingBox = (coords) => {
    let minX, minY, maxX, maxY;
    for (let coord of coords) {
      const [x, y] = coord; // x = lng, y = lat
      if (minX === undefined || x < minX) {
        minX = x;
      }
      if (maxX === undefined || x > maxX) {
        maxX = x;
      }
      if (minY === undefined || y < minY) {
        minY = y;
      }
      if (maxY === undefined || y > maxY) {
        maxY = y;
      }
    }
    return {
      ne: [maxX, maxY],
      sw: [minX, minY],
    };
  };

  // Fit the camera bounds when they change
  useEffect(() => {
    if (cameraBounds && cameraRef.current) {
      cameraRef.current.fitBounds(
        [cameraBounds.sw[0], cameraBounds.sw[1]],
        [cameraBounds.ne[0], cameraBounds.ne[1]],
        50
      );
    }
  }, [cameraBounds]);

  // Re‐fit the camera when app returns from background
  const appState = useRef(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        if (cameraBounds && cameraRef.current) {
          cameraRef.current.fitBounds(
            [cameraBounds.sw[0], cameraBounds.sw[1]],
            [cameraBounds.ne[0], cameraBounds.ne[1]],
            50
          );
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [cameraBounds]);


  // ------------------ Notification Handling ------------------
  // This useEffect listens for notifications in all states.
  // If notification.data.notification_id matches decodedId, it encodes the id and navigates to the target screen.
  useEffect(() => {
    if (!decodedId) return; // Do not register listeners until decodedId is set

    const handleNotificationData = (data) => {
      if (data && data.notification_id) {
        if (data.notification_id.toString() === decodedId) {
          const notification_id = data.notification_id
          const encodedNotificationId = encode(notification_id.toString());

          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {
                  name: data.screen, // Use target screen from notification payload
                  params: { encodedId: encodedNotificationId },
                },
              ],
            })
          );
        }
      }
    };

    // Cold start notifications
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage && remoteMessage.data) {
          // console.log('[Navigation] Cold start notification:', remoteMessage);
          handleNotificationData(remoteMessage.data);
        }
      });

    // Foreground notifications
    const unsubscribeForeground = messaging().onMessage((remoteMessage) => {
      if (remoteMessage && remoteMessage.data) {
        // console.log('[Navigation] Foreground notification:', remoteMessage);
        handleNotificationData(remoteMessage.data);
      }
    });

    // Notifications tapped from background
    const unsubscribeOpened = messaging().onNotificationOpenedApp((remoteMessage) => {
      if (remoteMessage && remoteMessage.data) {
        // console.log('[Navigation] Notification opened from background:', remoteMessage);
        handleNotificationData(remoteMessage.data);
      }
    });

    return () => {
      unsubscribeForeground();
      unsubscribeOpened();
    };
  }, [decodedId, navigation]);
 

    // ----------------- Additional AppState Listener for Pending Notifications -----------------
    useEffect(() => {
      const subscription = AppState.addEventListener('change', async (nextAppState) => {
        if (nextAppState === 'active') {
          // console.log('[Navigation] App became active. Checking for pending notifications...');
          try {
            const pending = await EncryptedStorage.getItem('pendingNotification');
            if (pending) {
              const remoteMessage = JSON.parse(pending);
              // console.log('[Navigation] Found pending notification:', remoteMessage);
              if (remoteMessage.data) {
                // Send encodedId as decodedId as requested

                const encodedNotificationId = encode(notification_id.toString());

                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [
                      {
                        name: remoteMessage.data.screen,
                        params: { encodedId: encodedNotificationId },
                      },
                    ],
                  })
                );
              }
              await EncryptedStorage.removeItem('pendingNotification');
            }
          } catch (error) {
            console.error('[Navigation] Error handling pending notification:', error);
          }
        }
      });
      // console.log('[Navigation] Additional AppState listener added for pending notifications.');
      return () => {
        // console.log('[Navigation] Removing additional AppState listener for pending notifications.');
        subscription.remove();
      };
    }, [navigation]);

  // ------------------ End Notification Handling ------------------


  // Cancel booking
  const handleCancelBooking = useCallback(async () => {
    setConfirmationModalVisible(false);
    setModalVisible(false);
    try {
      setIsLoading(true);
      const response = await axios.post(
        'https://backend.clicksolver.com/api/user/work/cancel',
        {notification_id: decodedId},
      );
      if (response.status === 200) {
        const cs_token = await EncryptedStorage.getItem('cs_token');
        // await axios.post(
        //   'https://backend.clicksolver.com/api/user/action',
        //   {
        //     encodedId: encodedData,
        //     screen: '',
        //   },
        //   {
        //     headers: {Authorization: `Bearer ${cs_token}`},
        //   },
        // );

        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: 'Tabs', state: {routes: [{name: 'Home'}]}}],
          }),
        );
      } else {
        Alert.alert(
          'Cancellation failed',
          'Your cancellation time of 2 minutes is over.',
        );
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      Alert.alert('Error', 'There was an error processing your cancellation.');
    } finally {
      setIsLoading(false);
    }
  }, [decodedId, encodedData, navigation]);

  // Cancel reason modal
  const handleCancelModal = () => {
    setModalVisible(true);
  };

  const phoneCall = async () => {
    try {
      const response = await axios.post(
        'https://backend.clicksolver.com/api/worker/call',
        {decodedId},
      );
      if (response.status === 200 && response.data.mobile) {
        const phoneNumber = response.data.mobile;
        const dialURL = `tel:${phoneNumber}`;
        Linking.openURL(dialURL).catch((err) =>
          console.error('Error opening dialer:', err),
        );
      } else {
        // console.log('Failed to initiate call:', response.data);
      }
    } catch (error) {
      console.error(
        'Error initiating call:',
        error.response ? error.response.data : error.message,
      );
    }
  };

  const messageChatting = async () => {
    navigation.push('ChatScreen', {
      request_id: decodedId,
      senderType: 'user',
      profileImage: addressDetails.profile,
      profileName: addressDetails.name,
    });
  };

  const closeModal = () => {
    setModalVisible(false);
  };
  const openConfirmationModal = () => {
    setConfirmationModalVisible(true);
  };
  const closeConfirmationModal = () => {
    setConfirmationModalVisible(false);
  };

  // Scroll arrows in the service list
  const handleServiceScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const containerHeight = event.nativeEvent.layoutMeasurement.height;
    const contentHeight = event.nativeEvent.contentSize.height;

    setShowUpArrowService(offsetY > 0);
    setShowDownArrowService(offsetY + containerHeight < contentHeight);
  };

  // Refresh button handler
  const handleRefresh = () => {
    if (decodedId) {
      fetchLocationDetails();
    }
  };

  // Prepare markers
  let markers = null;
  if (locationDetails) {
    markers = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            icon: 'start-point-icon',
            iconSize: 0.2,
          },
          geometry: {
            type: 'Point',
            coordinates: locationDetails.startPoint,
          },
        },
        {
          type: 'Feature',
          properties: {
            icon: 'end-point-icon',
            iconSize: 0.13,
          },
          geometry: {
            type: 'Point',
            coordinates: locationDetails.endPoint,
          },
        },
      ],
    };
  }

  return (
    <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
      {/* Map Container */}
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
                  50
                );
              }
            }}
          >
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
            <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>
              {t('loading_map') || 'Loading Map...'}
            </Text>
          </View>
        )}

        {/* Absolute Refresh Button on the Map */}
        <TouchableOpacity
          style={styles.refreshContainer}
          onPress={handleRefresh}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <MaterialIcons
              name="refresh"
              size={22}
              color={isDarkMode ? '#fff' : '#212121'}
            />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Bottom Card */}
      <View style={styles.detailsContainer}>
        <View style={styles.minimumChargesContainer}>
          <Text style={styles.serviceFare}>
            {t('commander_on_way') || 'Commander on the way'}
          </Text>
        </View>

        <View style={styles.firstContainer}>
          <View style={styles.locationContainer}>
            <Image
              source={{
                uri: 'https://i.postimg.cc/qvJw8Kzy/Screenshot-2024-11-13-170828-removebg-preview.png',
              }}
              style={styles.locationPinImage}
            />
            <View style={styles.locationDetails}>
              <Text style={styles.locationAddress} numberOfLines={3}>
                {addressDetails.area}
              </Text>
            </View>
          </View>
        </View>

        {/* Service & Profile Row */}
        <View style={styles.serviceDetails}>
          {/* LEFT SECTION: Service list, PIN, Cancel */}
          <View style={styles.leftSection}>
            <Text style={styles.serviceType}>{t('service') || 'Service'}</Text>

            {/* Scrollable Services List */}
            <View style={styles.servicesListContainer}>
              {showUpArrowService && (
                <View style={styles.arrowUpContainer}>
                  <Entypo
                    name="chevron-small-up"
                    size={20}
                    color={isDarkMode ? '#ccc' : '#9e9e9e'}
                  />
                </View>
              )}
              <ScrollView
                style={styles.servicesNamesContainer}
                contentContainerStyle={styles.servicesNamesContent}
                onScroll={handleServiceScroll}
                scrollEventThrottle={16}
              >
                {serviceArray.map((serviceItem, index) => (
                  <View key={index} style={styles.serviceItem}>
                    <Text style={styles.serviceText}>
                    { t(`singleService_${serviceItem.main_service_id}`) || serviceItem.serviceName }
                     
                    </Text>
                  </View>
                ))}
              </ScrollView>
              {showDownArrowService && (
                <View style={styles.arrowDownContainer}>
                  <Entypo
                    name="chevron-small-down"
                    size={20}
                    color={isDarkMode ? '#ccc' : '#9e9e9e'}
                  />
                </View>
              )}
            </View>

            {/* PIN Section */}
            <View style={styles.pinContainer}>
              <Text style={styles.pinText}>{t('pin') || 'PIN'}</Text>
              <View style={styles.pinBoxesContainer}>
                {pin.split('').map((digit, index) => (
                  <View key={index} style={styles.pinBox}>
                    <Text style={styles.pinNumber}>{digit}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelModal}
            >
              <Text style={styles.cancelText}>{t('cancel') || 'Cancel'}</Text>
            </TouchableOpacity>
          </View>

          {/* RIGHT SECTION: Worker Profile & Info */}
          <View style={styles.rightSection}>
            {/* Profile Image */}
            <View style={styles.profileImage}>
              {addressDetails.profile && (
                <Image
                  source={{ uri: addressDetails.profile }}
                  style={styles.image}
                />
              )}
            </View>

            {/* Worker Name */}
            <Text style={styles.workerName}>{addressDetails.name}</Text>

            {/* Rating */}
            {addressDetails.rating !== undefined && (
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingNumber}>
                  {Number(addressDetails.rating).toFixed(1)}
                </Text>
                {renderFractionalStars(Number(addressDetails.rating))}
              </View>
            )}

            {/* Service Count */}
            {addressDetails.serviceCounts !== undefined &&
              addressDetails.serviceCounts > 0 && (
                <View style={styles.ServiceContainer}>
                  <Text style={styles.ServiceNumber}>
                    {t('no_of_services') || 'No of Services:'}{' '}
                    <Text style={styles.ratingNumber}>
                      {Number(addressDetails.serviceCounts)}
                    </Text>
                  </Text>
                </View>
              )}

            {/* Icons (Call / Message) */}
            <View style={styles.iconsContainer}>
              <TouchableOpacity style={styles.actionButton} onPress={phoneCall}>
                <MaterialIcons name="call" size={18} color="#FF5722" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={messageChatting}>
                <AntDesign name="message1" size={18} color="#FF5722" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Cancellation Reason Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            onPress={closeModal}
            style={styles.backButtonContainer}
          >
            <AntDesign
              name="arrowleft"
              size={20}
              color={isDarkMode ? '#fff' : 'black'}
            />
          </TouchableOpacity>

          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {t('cancellation_reason_title') ||
                'What is the reason for your cancellation?'}
            </Text>
            <Text style={styles.modalSubtitle}>
              {t('cancellation_reason_subtitle') ||
                "Could you let us know why you're canceling?"}
            </Text>

            <TouchableOpacity
              style={styles.reasonButton}
              onPress={openConfirmationModal}
            >
              <Text style={styles.reasonText}>
                {t('found_better_price') || 'Found a better price'}
              </Text>
              <AntDesign
                name="right"
                size={16}
                color={isDarkMode ? '#fff' : '#4a4a4a'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reasonButton}
              onPress={openConfirmationModal}
            >
              <Text style={styles.reasonText}>
                {t('wrong_location') || 'Wrong work location'}
              </Text>
              <AntDesign
                name="right"
                size={16}
                color={isDarkMode ? '#fff' : '#4a4a4a'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reasonButton}
              onPress={openConfirmationModal}
            >
              <Text style={styles.reasonText}>
                {t('wrong_service') || 'Wrong service booked'}
              </Text>
              <AntDesign
                name="right"
                size={16}
                color={isDarkMode ? '#fff' : '#4a4a4a'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reasonButton}
              onPress={openConfirmationModal}
            >
              <Text style={styles.reasonText}>
                {t('more_time') || 'More time to assign a commander'}
              </Text>
              <AntDesign
                name="right"
                size={16}
                color={isDarkMode ? '#fff' : '#4a4a4a'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reasonButton}
              onPress={openConfirmationModal}
            >
              <Text style={styles.reasonText}>
                {t('others') || 'Others'}
              </Text>
              <AntDesign
                name="right"
                size={16}
                color={isDarkMode ? '#fff' : '#4a4a4a'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={confirmationModalVisible}
        onRequestClose={closeConfirmationModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.crossContainer}>
            <TouchableOpacity
              onPress={closeConfirmationModal}
              style={styles.backButtonContainer}
            >
              <Entypo
                name="cross"
                size={20}
                color={isDarkMode ? '#fff' : 'black'}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.confirmationModalContainer}>
            <Text style={styles.confirmationTitle}>
              {t('confirmation_title') ||
                'Are you sure you want to cancel this Service?'}
            </Text>
            <Text style={styles.confirmationSubtitle}>
              {t('confirmation_subtitle') ||
                'Please avoid canceling – we’re working to connect you with the best expert to solve your problem.'}
            </Text>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleCancelBooking}
            >
              <Text style={styles.confirmButtonText}>
                {t('cancel_service') || 'Cancel my service'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </View>
    </SafeAreaView>
  );
};

const dynamicStyles = (width, height, isDarkMode) => {
  const isTablet = width >= 600;
  const bottomCardHeight = isTablet ? 380 : 330;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
    },
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#f5f5f5',
    },
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
    refreshContainer: {
      position: 'absolute',
      top: isTablet ? 40 : 30,
      right: isTablet ? 30 : 20,
      backgroundColor: isDarkMode ? '#333' : '#ffffff',
      borderRadius: 25,
      padding: isTablet ? 10 : 7,
      zIndex: 999,
      elevation: 3,
    },
    detailsContainer: {
      height: bottomCardHeight,
      backgroundColor: isDarkMode ? '#333' : '#ffffff',
      padding: isTablet ? 20 : 15,
      paddingHorizontal: isTablet ? 30 : 20,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: -5},
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 10,
    },
    minimumChargesContainer: {
      height: isTablet ? 50 : 46,
      backgroundColor: isDarkMode ? '#444' : '#f6f6f6',
      borderRadius: 32,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 10,
      marginBottom: isTablet ? 15 : 0,
    },
    serviceFare: {
      textAlign: 'center',
      marginBottom: 10,
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'RobotoSlab-Bold',
      color: isDarkMode ? '#fff' : '#1D2951',
    },
    firstContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    locationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: isTablet ? 12 : 10,
      width: '90%',
    },
    locationPinImage: {
      width: isTablet ? 24 : 20,
      height: isTablet ? 24 : 20,
      marginRight: 10,
    },
    locationDetails: {
      marginLeft: 10,
    },
    locationAddress: {
      fontSize: isTablet ? 15 : 13,
      fontFamily: 'RobotoSlab-Regular',
      color: isDarkMode ? '#fff' : '#212121',
    },
    serviceDetails: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      width: '100%',
      marginTop: 10,
    },
    leftSection: {
      flex: 1, // Occupies leftover horizontal space
      marginRight: 10,
    },
    serviceType: {
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'RobotoSlab-Medium',
      marginTop: 10,
      color: isDarkMode ? '#aaa' : '#9e9e9e',
    },
    servicesListContainer: {
      position: 'relative',
      marginTop: 5,
    },
    servicesNamesContainer: {
      maxHeight: isTablet ? 80 : 60, // Restrict the height so it doesn't overflow
    },
    servicesNamesContent: {
      flexDirection: 'column',
      paddingVertical: 10,
    },
    serviceItem: {
      marginBottom: 5,
    },
    serviceText: {
      color: isDarkMode ? '#fff' : '#212121',
      fontFamily: 'RobotoSlab-Medium',
      fontSize: isTablet ? 15 : 14,
      marginTop: 5,
    },
    arrowUpContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      alignItems: 'center',
      backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
      zIndex: 1,
    },
    arrowDownContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      alignItems: 'center',
      backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
      zIndex: 1,
    },
    pinContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 10,
      paddingVertical: 10,
    },
    pinText: {
      color: isDarkMode ? '#ccc' : '#9e9e9e',
      fontFamily: 'RobotoSlab-Regular',
      fontSize: isTablet ? 20 : 18,
      paddingTop: 10,
    },
    pinBoxesContainer: {
      flexDirection: 'row',
      gap: 5,
    },
    pinBox: {
      width: isTablet ? 24 : 20,
      height: isTablet ? 24 : 20,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDarkMode ? '#fff' : '#212121',
      borderRadius: 5,
    },
    pinNumber: {
      color: isDarkMode ? '#fff' : '#212121',
      fontFamily: 'RobotoSlab-Regular',
      fontSize: isTablet ? 16 : 14,
    },
    cancelButton: {
      backgroundColor: isDarkMode ? '#333' : '#FFFFFF',
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 1,
      width: isTablet ? 100 : 80,
      height: isTablet ? 40 : 35,
    },
    cancelText: {
      fontSize: isTablet ? 15 : 13,
      color: isDarkMode ? '#ccc' : '#4a4a4a',
      fontFamily: 'RobotoSlab-Regular',
    },
    rightSection: {
      width: isTablet ? 130 : 110, // Adjust as needed
      alignItems: 'center',
    },
    profileImage: {
      flexDirection: 'row',
      justifyContent: 'center',
    },
    image: {
      width: isTablet ? 70 : 60,
      height: isTablet ? 70 : 60,
      borderRadius: 50,
    },
    workerName: {
      color: isDarkMode ? '#fff' : '#212121',
      textAlign: 'center',
      marginTop: 5,
      fontSize: isTablet ? 16 : 14,
      fontFamily: 'RobotoSlab-Medium',
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    ServiceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    ratingNumber: {
      marginRight: 5,
      fontSize: isTablet ? 18 : 16,
      color: isDarkMode ? '#fff' : '#212121',
      fontFamily: 'RobotoSlab-Regular',
    },
    ServiceNumber: {
      fontSize: isTablet ? 16 : 15,
      fontFamily: 'RobotoSlab-Regular',
      color: isDarkMode ? '#fff' : '#212121',
    },
    iconsContainer: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 10,
    },
    actionButton: {
      backgroundColor: isDarkMode ? '#555' : '#EFDCCB',
      height: isTablet ? 40 : 35,
      width: isTablet ? 40 : 35,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: isDarkMode ? '#333' : 'white',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: isTablet ? 30 : 20,
      paddingBottom: isTablet ? 40 : 30,
    },
    modalTitle: {
      fontSize: isTablet ? 20 : 18,
      fontFamily: 'RobotoSlab-Medium',
      textAlign: 'center',
      marginBottom: 5,
      color: isDarkMode ? '#fff' : '#000',
    },
    modalSubtitle: {
      fontSize: isTablet ? 16 : 14,
      fontFamily: 'RobotoSlab-Regular',
      color: isDarkMode ? '#ccc' : '#666',
      textAlign: 'center',
      marginBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#555' : '#eee',
      paddingBottom: 10,
    },
    reasonButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: isTablet ? 18 : 15,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#555' : '#eee',
    },
    reasonText: {
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'RobotoSlab-Regular',
      color: isDarkMode ? '#fff' : '#333',
    },
    backButtonContainer: {
      width: isTablet ? 45 : 40,
      height: isTablet ? 45 : 40,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode ? '#333' : 'white',
      borderRadius: 50,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.2,
      shadowRadius: 4,
      zIndex: 1,
      marginHorizontal: 10,
      marginBottom: 5,
    },
    crossContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    confirmationModalContainer: {
      backgroundColor: isDarkMode ? '#333' : 'white',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: isTablet ? 50 : 40,
      paddingBottom: isTablet ? 40 : 30,
      paddingHorizontal: isTablet ? 30 : 20,
      alignItems: 'center',
    },
    confirmationTitle: {
      fontSize: isTablet ? 20 : 18,
      fontFamily: 'RobotoSlab-Medium',
      textAlign: 'center',
      paddingBottom: 10,
      marginBottom: 5,
      color: isDarkMode ? '#fff' : '#000',
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#555' : '#eee',
    },
    confirmationSubtitle: {
      fontSize: isTablet ? 16 : 14,
      fontFamily: 'RobotoSlab-Regular',
      color: isDarkMode ? '#ccc' : '#666',
      textAlign: 'center',
      marginBottom: 20,
      paddingBottom: 10,
      paddingTop: 10,
    },
    confirmButton: {
      backgroundColor: '#FF4500',
      borderRadius: 40,
      paddingVertical: isTablet ? 18 : 15,
      paddingHorizontal: isTablet ? 50 : 40,
      alignItems: 'center',
    },
    confirmButtonText: {
      color: 'white',
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'RobotoSlab-Medium',
    },
  });
};

export default Navigation;
