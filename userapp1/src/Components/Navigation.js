import React, {useEffect, useState, useCallback, useRef} from 'react';
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
  AppState,
  ScrollView,
  Animated,
  Easing,
  Linking,
  useWindowDimensions, // <-- 1) Import useWindowDimensions
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
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';
import polyline from '@mapbox/polyline';
import {SafeAreaView} from 'react-native-safe-area-context';

// Local images
const startMarker = require('../assets/start-marker.png');
const endMarker = require('../assets/end-marker.png');

// Mapbox Access Token
Mapbox.setAccessToken(
  'pk.eyJ1IjoieWFzd2FudGh2YW5hbWEiLCJhIjoiY20ybTMxdGh3MGZ6YTJxc2Zyd2twaWp2ZCJ9.uG0mVTipkeGVwKR49iJTbw',
);

const Navigation = () => {
  // 1) Get screen dimensions
  const {width, height} = useWindowDimensions();
  // 2) Generate dynamic styles
  const styles = dynamicStyles(width, height);

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
  const [confirmationModalVisible, setConfirmationModalVisible] =
    useState(false);
  const [cameraBounds, setCameraBounds] = useState(null);
  const [showUpArrowService, setShowUpArrowService] = useState(false);
  const [showDownArrowService, setShowDownArrowService] = useState(false);
  // Loading indicator
  const [isLoading, setIsLoading] = useState(false);

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
    } else {
      if (animation) {
        animation.stop();
      }
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
            console.log('Location permission denied');
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
    const starSize = 16; // icon + ratingNumber size
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
            color="#ccc"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
            }}
          />
          {/* Orange star in front, clipped by fraction */}
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
          await axios.post(
            'https://backend.clicksolver.com/api/user/action',
            {
              encodedId: encodedData,
              screen: 'worktimescreen',
            },
            {
              headers: {Authorization: `Bearer ${cs_token}`},
            },
          );

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

      const routeEncoded = response.data.routes[0].overview_polyline;
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
          console.error('Route data has empty coordinates:', olaRouteData);
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
      const reversedStart = startPoint.map(parseFloat).reverse(); // to [lng, lat]
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
      const [x, y] = coord;
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
        await axios.post(
          'https://backend.clicksolver.com/api/user/action',
          {
            encodedId: encodedData,
            screen: '',
          },
          {
            headers: {Authorization: `Bearer ${cs_token}`},
          },
        );

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
        console.log('Failed to initiate call:', response.data);
      }
    } catch (error) {
      console.error(
        'Error initiating call:',
        error.response ? error.response.data : error.message,
      );
    }
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

  // Markers
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
      {/* Main Container */}
      <View style={styles.container}>
        <View style={styles.mapContainer}>
          {/* Mapbox Map */}
          {locationDetails ? (
            <Mapbox.MapView style={styles.map}>
              <Mapbox.Camera
                bounds={
                  cameraBounds
                    ? {
                        ne: cameraBounds.ne,
                        sw: cameraBounds.sw,
                        paddingLeft: 50,
                        paddingRight: 50,
                        paddingTop: 50,
                        paddingBottom: 50,
                      }
                    : null
                }
              />

              <Mapbox.Images
                images={{
                  'start-point-icon': startMarker,
                  'end-point-icon': endMarker,
                }}
              />

              {/* Marker Layer */}
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

              {/* Route Layer */}
              {routeData && (
                <Mapbox.ShapeSource id="routeSource" shape={routeData}>
                  <Mapbox.LineLayer id="routeLine" style={styles.routeLine} />
                </Mapbox.ShapeSource>
              )}
            </Mapbox.MapView>
          ) : (
            <View style={styles.loadingContainer}>
              <Text>Loading Map...</Text>
            </View>
          )}

          {/* Absolute Refresh Button on the Map */}
          <TouchableOpacity
            style={styles.refreshContainer}
            onPress={handleRefresh}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            {/* Rotate this view when isLoading is true */}
            <Animated.View style={{transform: [{rotate: spin}]}}>
              <MaterialIcons name="refresh" size={22} color="#212121" />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Bottom Card */}
        <View style={styles.detailsContainer}>
          <View style={styles.minimumChargesContainer}>
            <Text style={styles.serviceFare}>Commander on the way</Text>
          </View>

          <View style={styles.firstContainer}>
            {/* Location */}
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

          {/* Service & Commander Details */}
          <View style={styles.serviceDetails}>
            <View>
              <Text style={styles.serviceType}>Service</Text>
              <View style={{position: 'relative'}}>
                {showUpArrowService && (
                  <View style={styles.arrowUpContainer}>
                    <Entypo name="chevron-small-up" size={20} color="#9e9e9e" />
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
                        {serviceItem.serviceName}
                      </Text>
                    </View>
                  ))}
                </ScrollView>

                {showDownArrowService && (
                  <View style={styles.arrowDownContainer}>
                    <Entypo
                      name="chevron-small-down"
                      size={20}
                      color="#9e9e9e"
                    />
                  </View>
                )}
              </View>

              <View style={styles.pinContainer}>
                <Text style={styles.pinText}>PIN</Text>
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
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {/* Commander/Worker Details with Rating */}
            <View style={styles.workerDetailsContainer}>
              <View style={styles.profileImage}>
                {addressDetails.profile && (
                  <Image
                    source={{uri: addressDetails.profile}}
                    style={styles.image}
                  />
                )}
              </View>
              <Text style={styles.workerName}>{addressDetails.name}</Text>

              {addressDetails.rating !== undefined && (
                <View style={styles.ratingContainer}>
                  {/* Numeric rating (e.g. 4.3) */}
                  <Text style={styles.ratingNumber}>
                    {Number(addressDetails.rating).toFixed(1)}
                  </Text>
                  {/* Fractional stars */}
                  {renderFractionalStars(Number(addressDetails.rating))}
                </View>
              )}

              {addressDetails.serviceCounts !== undefined &&
                addressDetails.serviceCounts > 0 && (
                  <View style={styles.ServiceContainer}>
                    <Text style={styles.ServiceNumber}>
                      No of Services:{' '}
                      <Text style={styles.ratingNumber}>
                        {Number(addressDetails.serviceCounts)}
                      </Text>
                    </Text>
                  </View>
                )}

              <View style={styles.iconsContainer}>
                <TouchableOpacity style={styles.actionButton} onPress={phoneCall}>
                  <MaterialIcons name="call" size={18} color="#FF5722" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
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
              <AntDesign name="arrowleft" size={20} color="black" />
            </TouchableOpacity>

            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>
                What is the reason for your cancellation?
              </Text>
              <Text style={styles.modalSubtitle}>
                Could you let us know why you're canceling?
              </Text>

              <TouchableOpacity
                style={styles.reasonButton}
                onPress={openConfirmationModal}
              >
                <Text style={styles.reasonText}>Found a better price</Text>
                <AntDesign name="right" size={16} color="#4a4a4a" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reasonButton}
                onPress={openConfirmationModal}
              >
                <Text style={styles.reasonText}>Wrong work location</Text>
                <AntDesign name="right" size={16} color="#4a4a4a" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reasonButton}
                onPress={openConfirmationModal}
              >
                <Text style={styles.reasonText}>Wrong service booked</Text>
                <AntDesign name="right" size={16} color="#4a4a4a" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reasonButton}
                onPress={openConfirmationModal}
              >
                <Text style={styles.reasonText}>
                  More time to assign a commander
                </Text>
                <AntDesign name="right" size={16} color="#4a4a4a" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reasonButton}
                onPress={openConfirmationModal}
              >
                <Text style={styles.reasonText}>Others</Text>
                <AntDesign name="right" size={16} color="#4a4a4a" />
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
                <Entypo name="cross" size={20} color="black" />
              </TouchableOpacity>
            </View>

            <View style={styles.confirmationModalContainer}>
              <Text style={styles.confirmationTitle}>
                Are you sure you want to cancel this Service?
              </Text>
              <Text style={styles.confirmationSubtitle}>
                Please avoid canceling – we’re working to connect you with
                the best expert to solve your problem.
              </Text>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleCancelBooking}
              >
                <Text style={styles.confirmButtonText}>Cancel my service</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

/**
 * 3) A helper function that returns a StyleSheet whose values depend on the device width/height.
 *    If `width >= 600`, we treat it as a tablet and scale up certain styles (font sizes, spacing, etc.).
 */
const dynamicStyles = (width, height) => {
  const isTablet = width >= 600;

  // Adjust bottom card height if on a tablet
  const bottomCardHeight = isTablet ? 380 : 330;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    container: {
      flex: 1,
    },
    mapContainer: {
      flex: 1,
    },
    map: {
      flex: 1,
    },
    routeLine: {
      lineColor: '#212121',
      lineWidth: isTablet ? 4 : 3,
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
      backgroundColor: '#ffffff',
      borderRadius: 25,
      padding: isTablet ? 10 : 7,
      zIndex: 999,
      elevation: 3,
    },

    /* Bottom Card */
    detailsContainer: {
      height: bottomCardHeight,
      backgroundColor: '#ffffff',
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
      backgroundColor: '#f6f6f6',
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
      color: '#1D2951',
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
      color: '#212121',
    },

    /* Service Details */
    serviceDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '95%',
      alignItems: 'center',
    },
    serviceType: {
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'RobotoSlab-Medium',
      marginTop: 10,
      color: '#9e9e9e',
    },
    servicesNamesContainer: {
      width: '90%',
      maxHeight: isTablet ? 80 : 60,
    },
    servicesNamesContent: {
      flexDirection: 'column',
      paddingVertical: 10,
    },
    serviceItem: {
      marginBottom: 5,
    },
    serviceText: {
      color: '#212121',
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
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      zIndex: 1,
    },
    arrowDownContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      zIndex: 1,
    },

    /* PIN */
    pinContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 10,
      paddingVertical: 10,
    },
    pinText: {
      color: '#9e9e9e',
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
      borderColor: '#212121',
      borderRadius: 5,
    },
    pinNumber: {
      color: '#212121',
      fontFamily: 'RobotoSlab-Regular',
      fontSize: isTablet ? 16 : 14,
    },

    /* Cancel Button */
    cancelButton: {
      backgroundColor: '#FFFFFF',
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 1,
      width: isTablet ? 100 : 80,
      height: isTablet ? 40 : 35,
    },
    cancelText: {
      fontSize: isTablet ? 15 : 13,
      color: '#4a4a4a',
      fontFamily: 'RobotoSlab-Regular',
    },

    /* Worker (Commander) Details */
    workerDetailsContainer: {
      flexDirection: 'column',
      gap: 5,
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
      color: '#212121',
      textAlign: 'center',
      marginTop: 5,
      fontSize: isTablet ? 16 : 14,
      fontFamily: 'RobotoSlab-Medium',
    },

    /* Rating Container */
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
      color: '#212121',
      fontFamily: 'RobotoSlab-Regular',
    },
    ServiceNumber: {
      fontSize: isTablet ? 16 : 15,
      fontFamily: 'RobotoSlab-Regular',
      color: '#212121',
    },
    iconsContainer: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 10,
    },
    actionButton: {
      backgroundColor: '#EFDCCB',
      height: isTablet ? 40 : 35,
      width: isTablet ? 40 : 35,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },

    /* Modals */
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: 'white',
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
      color: '#000',
    },
    modalSubtitle: {
      fontSize: isTablet ? 16 : 14,
      fontFamily: 'RobotoSlab-Regular',
      color: '#666',
      textAlign: 'center',
      marginBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      paddingBottom: 10,
    },
    reasonButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: isTablet ? 18 : 15,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    reasonText: {
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'RobotoSlab-Regular',
      color: '#333',
    },
    backButtonContainer: {
      width: isTablet ? 45 : 40,
      height: isTablet ? 45 : 40,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'white',
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
      backgroundColor: 'white',
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
      color: '#000',
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    confirmationSubtitle: {
      fontSize: isTablet ? 16 : 14,
      fontFamily: 'RobotoSlab-Regular',
      color: '#666',
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
