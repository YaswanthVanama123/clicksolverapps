import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  PermissionsAndroid,
  Platform,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  BackHandler,
  Dimensions,
} from 'react-native';
import Mapbox from '@rnmapbox/maps';
import Geolocation from 'react-native-geolocation-service';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CommonActions,
  useNavigation,
  useFocusEffect,
  useRoute,
} from '@react-navigation/native';
import EncryptedStorage from 'react-native-encrypted-storage';
import axios from 'axios';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import EvilIcons from 'react-native-vector-icons/AntDesign';
import Octicons from 'react-native-vector-icons/Octicons';
import { Places } from 'ola-maps';
import { useTheme } from '../context/ThemeContext'; // <-- import theme hook

Mapbox.setAccessToken(
  'pk.eyJ1IjoieWFzd2FudGh2YW5hbWEiLCJhIjoiY20ybTMxdGh3MGZ6YTJxc2Zyd2twaWp2ZCJ9.uG0mVTipkeGVwKR49iJTbw'
);
const placesClient = new Places('iN1RT7PQ41Z0DVxin6jlf7xZbmbIZPtb9CyNwtlT');

const UserLocation = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { serviceName, suggestion, savings, tipAmount } = route.params;

  const { isDarkMode } = useTheme(); // get isDarkMode
  const styles = dynamicStyles(isDarkMode); // pass into our style function

  const [service, setService] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [suggestionName, setSuggestionName] = useState({});
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [pincode, setPincode] = useState('');
  const [alternatePhoneNumber, setAlternatePhoneNumber] = useState('');
  const [alternateName, setAlternateName] = useState('');

  // Errors for complete address modal
  const [cityError, setCityError] = useState('');
  const [areaError, setAreaError] = useState('');
  const [pincodeError, setPincodeError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [nameError, setNameError] = useState('');
  const [inputText, setInputText] = useState(suggestion ? suggestion.title : '');
  const [showMessageBox, setShowMessageBox] = useState(false);

  // New state for the out-of-geofence modal
  const [showOutOfPolygonModal, setShowOutOfPolygonModal] = useState(false);

  const mapRef = useRef(null);

  // Define example polygon geofences
  const polygonGeofences = [
    {
      id: 'zone1',
      coordinates: [
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
      id: 'zone2',
      coordinates: [
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
        [16.690514707521203, 81.10219147444412],
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

  // Ray-casting algorithm to check if a point is in a polygon
  const isPointInPolygon = (point, polygon) => {
    const x = point[1];
    const y = point[0];
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0],
        yi = polygon[i][1];
      const xj = polygon[j][0],
        yj = polygon[j][1];
      const intersect =
        yi > y !== yj > y &&
        x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  };

  useEffect(() => {
    if (serviceName) {
      setService(serviceName);
      setDiscount(savings);
    }
    if (suggestion) {
      setSuggestionName(suggestion);
    }
  }, [route.params]);

  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message: 'This app needs access to your location',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Location permission denied');
            setLocationLoading(false);
            return;
          }
        }
        Geolocation.getCurrentPosition(
          position => {
            const { latitude, longitude } = suggestion
              ? suggestion
              : position.coords;
            fetchAndSetPlaceDetails(latitude, longitude);
            setLocation([longitude, latitude]);
            sendDataToServer(longitude, latitude);
            setLocationLoading(false);
          },
          error => {
            console.error('Geolocation error:', error);
            setLocationLoading(false);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      } catch (err) {
        console.warn(err);
        setLocationLoading(false);
      }
    };

    requestLocationPermission();
  }, [suggestion]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleBackPress();
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [])
  );

  const fetchAndSetPlaceDetails = useCallback(async (latitude, longitude) => {
    try {
      const response = await placesClient.reverse_geocode(latitude, longitude);

      if (response && response.body && response.body.results.length > 0) {
        const place = response.body.results[0];
        const addressComponents = place.address_components;

        const pincode =
          addressComponents.find(component =>
            component.types.includes('postal_code')
          )?.long_name || '';

        let city =
          addressComponents.find(component =>
            component.types.includes('locality')
          )?.long_name || '';

        if (!city) {
          city =
            addressComponents.find(component =>
              component.types.includes('administrative_area_level_3')
            )?.long_name || '';
        }
        if (!city) {
          city =
            addressComponents.find(component =>
              component.types.includes('administrative_area_level_2')
            )?.long_name || '';
        }

        let area = place.formatted_address || '';

        console.log('Extracted Location Details:', { city, area, pincode });

        setCity(city);
        setArea(area);
        setPincode(pincode);
      } else {
        console.warn('No address details found.');
      }
    } catch (error) {
      console.error('Failed to fetch place details:', error);
    }
  }, []);

  const sendDataToServer = useCallback(async (longitude, latitude) => {
    try {
      const token = await EncryptedStorage.getItem('cs_token');
      if (!token) {
        console.error('No token found');
        return;
      }
      const response = await axios.post(
        `https://backend.clicksolver.com/api/user/location`,
        { longitude: String(longitude), latitude: String(latitude) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200) {
        console.log('User location sent successfully');
      }
    } catch (error) {
      console.error('Failed to send user location:', error);
    }
  }, []);

  const handleCrosshairsPress = () => {
    setInputText('');
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        setLocation([longitude, latitude]);
        sendDataToServer(longitude, latitude);
        fetchAndSetPlaceDetails(latitude, longitude);
      },
      error => {
        console.error('Geolocation error:', error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const handleConfirmLocation = async () => {
    setConfirmLoading(true);
    if (location) {
      const inAnyGeofence = polygonGeofences.some(fence =>
        isPointInPolygon(location, fence.coordinates)
      );
      if (!inAnyGeofence) {
        setShowOutOfPolygonModal(true);
        setConfirmLoading(false);
        return;
      }
    }
    setShowMessageBox(true);
    try {
      const token = await EncryptedStorage.getItem('cs_token');
      if (!token) {
        console.error('No token found');
        setConfirmLoading(false);
        return;
      }
      const response = await axios.get(`https://backend.clicksolver.com/api/get/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 200) {
        const data = response.data;
        console.log('User data fetched:', data);
        setAlternatePhoneNumber(data.phone_number || '');
        setAlternateName(data.name);
      } else {
        console.warn('Unexpected response:', response);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      setShowMessageBox(false);
    }
    setConfirmLoading(false);
  };

  const handleRemindMe = async () => {
    try {
      const token = await EncryptedStorage.getItem('cs_token');
      if (!token) {
        console.error('No token found');
        setShowOutOfPolygonModal(false);
        return;
      }
      const response = await axios.post(
        `https://backend.clicksolver.com/api/send/reminder`,
        { area, city },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Reminder sent successfully:', response.data);
    } catch (error) {
      console.error('Failed to send reminder:', error);
    } finally {
      setShowOutOfPolygonModal(false);
    }
  };

  const handleCancelOutModal = () => {
    setShowOutOfPolygonModal(false);
  };

  const handleBookCommander = () => {
    let hasError = false;
    setCityError('');
    setAreaError('');
    setPincodeError('');
    setPhoneError('');
    setNameError('');
    if (!city) {
      setCityError('City is required.');
      hasError = true;
    }
    if (!area) {
      setAreaError('Area is required.');
      hasError = true;
    }
    if (!pincode) {
      setPincodeError('Pincode is required.');
      hasError = true;
    }
    if (!alternatePhoneNumber) {
      setPhoneError('Phone number is required.');
      hasError = true;
    }
    if (!alternateName) {
      setNameError('Name is required.');
      hasError = true;
    }
    if (!hasError) {
      setShowMessageBox(false);
      setTimeout(() => {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'userwaiting',
                params: {
                  area,
                  city,
                  pincode,
                  alternateName,
                  alternatePhoneNumber,
                  serviceBooked: service,
                  location,
                  discount,
                  tipAmount,
                },
              },
            ],
          })
        );
      }, 0);
    }
  };

  const handlePressLocation = e => {
    const coordinates = e.geometry.coordinates;
    setLocation(coordinates);
    const [lon, lat] = coordinates;
    sendDataToServer(lon, lat);
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const totalServiceCost = service.reduce((sum, s) => sum + s.totalCost, 0);

  const renderServiceItem = ({ item }) => {
    if (discount > 0) {
      const allocatedDiscount = Math.round(
        (item.totalCost / totalServiceCost) * discount
      );
      const finalCost = item.totalCost - allocatedDiscount;
      return (
        <View style={styles.serviceItem}>
          <Text style={styles.serviceName} numberOfLines={2}>
            {item.serviceName}
          </Text>
          <Text style={styles.cost}>
            <Text style={styles.strikeThrough}>₹{item.totalCost}</Text>  ₹{finalCost}
          </Text>
        </View>
      );
    } else {
      return (
        <View style={styles.serviceItem}>
          <Text style={styles.serviceName} numberOfLines={2}>
            {item.serviceName}
          </Text>
          <Text style={styles.cost}>₹{item.totalCost}</Text>
        </View>
      );
    }
  };

  const screenHeight = Dimensions.get('window').height;

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.searchBoxContainer}>
        <View style={styles.searchInnerContainer}>
          <TouchableOpacity onPress={handleBackPress} style={{ marginRight: 10 }}>
            <FontAwesome6 name="arrow-left-long" size={18} color="gray" />
          </TouchableOpacity>
          <View style={{ marginRight: 10 }}>
            <Octicons name="dot-fill" size={17} color="#4CAF50" />
          </View>
          <TextInput
            style={styles.searchBox}
            placeholder="Search location ..."
            placeholderTextColor={isDarkMode ? '#ccc' : '#1D2951'}
            onFocus={() =>
              navigation.replace('LocationSearch', { serviceName, savings, tipAmount })
            }
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity onPress={() => setSuggestionName('')}>
            <EvilIcons name="hearto" size={20} color="#808080" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.container, { height: screenHeight * 0.75 }]}>
        <Mapbox.MapView
          ref={mapRef}
          style={styles.map}
          zoomEnabled={true}
          styleURL="mapbox://styles/mapbox/streets-v11"
          onPress={handlePressLocation}
        >
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
          <Mapbox.ShapeSource
            id="polygonGeofence"
            shape={{
              type: 'FeatureCollection',
              features: polygonGeofences.map(fence => ({
                type: 'Feature',
                geometry: {
                  type: 'Polygon',
                  coordinates: [fence.coordinates],
                },
                properties: { id: fence.id },
              })),
            }}
          >
            <Mapbox.FillLayer
              id="polygonGeofenceFill"
              style={{ fillColor: 'rgba(255, 0, 0, 0.2)' }}
            />
          </Mapbox.ShapeSource>
        </Mapbox.MapView>
        {locationLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF5722" />
          </View>
        )}
      </View>

      <View style={[styles.bookingCard, { height: screenHeight * 0.3 }]}>
        <View>
          <View style={styles.flatContainer}>
            <FlatList
              data={service}
              renderItem={renderServiceItem}
              keyExtractor={(item, index) => index.toString()}
            />
          </View>
          {/* <View style={styles.horizantalLine} /> */}
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmLocation}>
            {confirmLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirm Location</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {showOutOfPolygonModal && (
        <Modal
          transparent
          visible={showOutOfPolygonModal}
          animationType="slide"
          onRequestClose={() => setShowOutOfPolygonModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Location Not Serviceable</Text>
              <Text style={styles.modalMessage}>
                We are not in {city || 'this'} location. Please choose another
                location or tap "Remind Me" to get a notification when service
                is available.
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%' }}>
                <TouchableOpacity style={styles.modalCancelButton} onPress={handleCancelOutModal}>
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalButton} onPress={handleRemindMe}>
                  <Text style={styles.modalButtonText}>Remind Me</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {showMessageBox && (
        <Modal
          transparent
          visible={showMessageBox}
          animationType="slide"
          onRequestClose={() => setShowMessageBox(false)}
        >
          <View style={styles.messageBoxBackdrop}>
            <View style={styles.messageBox}>
              {confirmLoading ? (
                <View style={styles.loadingContent}>
                  <ActivityIndicator size="large" color="#FF5722" />
                  <Text style={styles.loadingText}>Fetching details...</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.completeAddressHead}>Enter complete address!</Text>
                  <Text style={styles.label}>City</Text>
                  <View style={styles.inputView}>
                    <TextInput
                      style={styles.input}
                      placeholder="City"
                      placeholderTextColor={isDarkMode ? '#aaa' : '#000'}
                      value={city}
                      onChangeText={setCity}
                    />
                    {cityError ? <Text style={styles.errorText}>{cityError}</Text> : null}
                  </View>
                  <Text style={styles.label}>Area</Text>
                  <View style={styles.inputView}>
                    <TextInput
                      style={styles.input}
                      placeholder="Area"
                      placeholderTextColor={isDarkMode ? '#aaa' : '#000'}
                      value={area}
                      onChangeText={setArea}
                    />
                    {areaError ? <Text style={styles.errorText}>{areaError}</Text> : null}
                  </View>
                  <Text style={styles.label}>Pincode</Text>
                  <View style={styles.inputView}>
                    <TextInput
                      style={styles.input}
                      placeholder="Pincode"
                      placeholderTextColor={isDarkMode ? '#aaa' : '#000'}
                      value={pincode}
                      onChangeText={setPincode}
                    />
                    {pincodeError ? <Text style={styles.errorText}>{pincodeError}</Text> : null}
                  </View>
                  <Text style={styles.label}>Phone number</Text>
                  <View style={styles.inputView}>
                    <TextInput
                      style={styles.input}
                      placeholder="Alternate phone number"
                      placeholderTextColor={isDarkMode ? '#aaa' : '#000'}
                      keyboardType="phone-pad"
                      value={alternatePhoneNumber}
                      onChangeText={setAlternatePhoneNumber}
                    />
                    {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
                  </View>
                  <Text style={styles.label}>Name</Text>
                  <View style={styles.inputView}>
                    <TextInput
                      style={styles.input}
                      placeholder="Alternate name"
                      placeholderTextColor={isDarkMode ? '#aaa' : '#000'}
                      value={alternateName}
                      onChangeText={setAlternateName}
                    />
                    {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
                  </View>
                  <TouchableOpacity style={styles.bookButton} onPress={handleBookCommander}>
                    <Text style={styles.bookButtonText}>Book Commander</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.closeButton} onPress={() => setShowMessageBox(false)}>
                    <Text style={styles.closeButtonText}>×</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>
      )}

      <View style={styles.crosshairsContainer}>
        <TouchableOpacity onPress={handleCrosshairsPress}>
          <FontAwesome6 name="location-crosshairs" size={24} color="#000" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

/** 
 * Dynamic styles for Dark/Light Mode 
 * Adjust it for device widths if needed.
 */
const dynamicStyles = (isDarkMode) =>
  StyleSheet.create({
    page: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#fff',
    },
    container: {
      flex: 1,
    },
    searchBoxContainer: {
      position: 'absolute',
      top: 30,
      left: 0,
      right: 0,
      zIndex: 1,
      alignItems: 'center',
    },
    searchInnerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#333' : '#fff',
      borderRadius: 9,
      width: '90%',
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.8,
      shadowRadius: 2,
      paddingHorizontal: 10,
      height: 55,
    },
    searchBox: {
      flex: 1,
      color: isDarkMode ? '#fff' : '#1D2951',
      fontSize: 14,
      paddingHorizontal: 5,
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
    loadingContainer: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDarkMode ? 'rgba(18,18,18,0.8)' : 'rgba(255,255,255,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    bookingCard: {
      padding: 10,
      paddingHorizontal: 20,
      position: 'absolute',
      backgroundColor: isDarkMode ? '#333' : '#fff',
      borderRadius: 20,
      width: '100%',
      bottom: 0,
      elevation: 5,
    },
    flatContainer: {
      height: '77%',
    },
    serviceItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
    },
    serviceName: {
      fontSize: 14,
      color: isDarkMode ? '#fff' : '#212121',
      width: 90,
    },
    cost: {
      fontSize: 14,
      color: isDarkMode ? '#fff' : '#212121',
    },
    strikeThrough: {
      textDecorationLine: 'line-through',
      color: '#888',
    },
    horizantalLine: {
      width: '100%',
      height: 4,
      backgroundColor: isDarkMode ? '#555' : '#f5f5f5',
    },
    confirmButton: {
      backgroundColor: '#FF4500',
      padding: 10,
      borderRadius: 5,
    },
    confirmButtonText: {
      color: '#FFFFFF',
      textAlign: 'center',
      fontSize: 16,
    },
    messageBoxBackdrop: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    messageBox: {
      width: '80%',
      padding: 20,
      backgroundColor: isDarkMode ? '#333' : '#fff',
      borderRadius: 10,
      elevation: 10,
    },
    completeAddressHead: {
      fontSize: 18,
      marginBottom: 10,
      color: isDarkMode ? '#fff' : '#1D2951',
    },
    label: {
      color: isDarkMode ? '#ccc' : '#808080',
      fontSize: 12,
      padding: 5,
    },
    inputView: {
      marginBottom: 10,
    },
    input: {
      height: 40,
      borderColor: '#ddd',
      borderWidth: 1,
      borderRadius: 5,
      paddingHorizontal: 10,
      color: isDarkMode ? '#fff' : '#000',
    },
    bookButton: {
      backgroundColor: '#ff4500',
      padding: 10,
      borderRadius: 6,
      marginTop: 10,
    },
    bookButtonText: {
      color: '#FFFFFF',
      textAlign: 'center',
      fontSize: 16,
    },
    closeButton: {
      position: 'absolute',
      top: 10,
      right: 10,
      backgroundColor: isDarkMode ? '#555' : '#f2f2f2',
      borderRadius: 15,
      width: 30,
      height: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeButtonText: {
      color: '#fff',
      fontSize: 20,
    },
    errorText: {
      color: '#ff0000',
      fontSize: 12,
    },
    crosshairsContainer: {
      position: 'absolute',
      right: 20,
      bottom: 290,
      backgroundColor: isDarkMode ? '#333' : '#fff',
      borderRadius: 25,
      padding: 10,
      elevation: 5,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: isDarkMode ? '#333' : '#fff',
      padding: 20,
      borderRadius: 8,
      width: '80%',
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
      color: isDarkMode ? '#fff' : '#212121',
    },
    modalMessage: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 20,
      color: isDarkMode ? '#ccc' : '#212121',
    },
    modalCancelButton: {
      backgroundColor: isDarkMode ? '#555' : '#f5f5f5',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 6,
      marginHorizontal: 5,
    },
    modalCancelButtonText: {
      color: isDarkMode ? '#fff' : '#9e9e9e',
      fontSize: 16,
      fontWeight: '600',
    },
    modalButton: {
      backgroundColor: '#ff6f00',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 6,
      marginHorizontal: 5,
    },
    modalButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    loadingContent: {
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 10,
      fontSize: 14,
      color: isDarkMode ? '#fff' : '#000',
    },
  });

export default UserLocation;
