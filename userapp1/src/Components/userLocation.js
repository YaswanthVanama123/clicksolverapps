import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  PermissionsAndroid,
  Platform,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  BackHandler,
} from 'react-native';
import Mapbox from '@rnmapbox/maps';
import Geolocation from 'react-native-geolocation-service';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions, useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import EncryptedStorage from 'react-native-encrypted-storage';
import axios from 'axios';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import EvilIcons from 'react-native-vector-icons/AntDesign';
import Octicons from 'react-native-vector-icons/Octicons';
import { Places } from 'ola-maps';

Mapbox.setAccessToken('pk.eyJ1IjoieWFzd2FudGh2YW5hbWEiLCJhIjoiY20ybTMxdGh3MGZ6YTJxc2Zyd2twaWp2ZCJ9.uG0mVTipkeGVwKR49iJTbw');
const placesClient = new Places('iN1RT7PQ41Z0DVxin6jlf7xZbmbIZPtb9CyNwtlT');

const UserLocation = () => {
  const navigation = useNavigation();
  const route = useRoute();
  // Expect route.params to include serviceName (array), savings, and tipAmount
  const { serviceName, suggestion, savings, tipAmount } = route.params;
  
  // "service" holds the array of service objects (each with a totalCost)
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
  
  // Error and input states for the modal
  const [cityError, setCityError] = useState('');
  const [areaError, setAreaError] = useState('');
  const [pincodeError, setPincodeError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [nameError, setNameError] = useState('');
  const [inputText, setInputText] = useState(suggestion ? suggestion.title : '');
  const [showMessageBox, setShowMessageBox] = useState(false);

  const mapRef = useRef(null);

  // On mount, set service array and discount from route.params
  useEffect(() => {
    if (serviceName) {
      setService(serviceName);
      setDiscount(savings);
    }
    if (suggestion) {
      setSuggestionName(suggestion);
    }
  }, [route.params]);

  // Request location and fetch place details
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
            const { latitude, longitude } = suggestion ? suggestion : position.coords;
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
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [])
  );

  // const fetchAndSetPlaceDetails = useCallback(async (latitude, longitude) => {
  //   try {
  //     const response = await placesClient.reverse_geocode(latitude, longitude);
  //     if (response && response.body && response.body.results.length > 0) {
  //       const place = response.body.results[0];
  //       const addressComponents = place.address_components;
  //       const city =
  //         addressComponents.find(component =>
  //           component.types.includes('sublocality') ||
  //           component.types.includes('locality') ||
  //           component.types.includes('administrative_area_level_3') ||
  //           component.types.includes('administrative_area_level_2')
  //         )?.long_name || '';
  //       const area = place.formatted_address || '';
  //       const pincode =
  //         addressComponents.find(component =>
  //           component.types.includes('postal_code')
  //         )?.short_name || '';
  //         console.log("location",response.body)
  //       setCity(city);
  //       setArea(area);
  //       setPincode(pincode);
  //     } else {
  //       console.warn('No address details found.');
  //     }
  //   } catch (error) {
  //     console.error('Failed to fetch place details:', error);
  //   }
  // }, []);

  const fetchAndSetPlaceDetails = useCallback(async (latitude, longitude) => {
    try {
      const response = await placesClient.reverse_geocode(latitude, longitude);
  
      if (response && response.body && response.body.results.length > 0) {
        const place = response.body.results[0];
        const addressComponents = place.address_components;
  
        // Extracting pincode (postal_code)
        const pincode = addressComponents.find(component =>
          component.types.includes('postal_code')
        )?.long_name || '';
  
        // Extracting city name (locality or closest admin area)
        let city = addressComponents.find(component =>
          component.types.includes('locality')
        )?.long_name || '';
  
        // If locality is missing, try administrative area
        if (!city) {
          city = addressComponents.find(component =>
            component.types.includes('administrative_area_level_3')
          )?.long_name || '';
        }
        if (!city) {
          city = addressComponents.find(component =>
            component.types.includes('administrative_area_level_2')
          )?.long_name || '';
        }
  
        // Extracting area as full formatted address
        let area = place.formatted_address || '';
  
        console.log("Extracted Location Details:", { city, area, pincode });
  
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
    setShowMessageBox(true);
    try {
      const token = await EncryptedStorage.getItem('cs_token');
      if (!token) {
        console.error('No token found');
        setConfirmLoading(false);
        return;
      }
      const response = await axios.get(
        `https://backend.clicksolver.com/api/get/user`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
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
      Alert.alert('Error', 'Failed to fetch user data. Please try again.');
      setShowMessageBox(false);
    }
    setConfirmLoading(false);
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
                  tipAmount
                },
              },
            ],
          })
        );
      }, 0);
    }
  };

  const handlePressLocation = (e) => {
    const coordinates = e.geometry.coordinates;
    setLocation(coordinates);
    const [lon, lat] = coordinates;
    sendDataToServer(lon, lat);
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  // Calculate the total cost of all services
  const totalServiceCost = service.reduce((sum, s) => sum + s.totalCost, 0);

  // Render each service item.
  // If a discount is applied (discount > 0), display the original cost (with strike-through)
  // and the final discounted cost; otherwise, display only one value.
  const renderServiceItem = ({ item }) => {
    if (discount > 0) {
      const allocatedDiscount = Math.round((item.totalCost / totalServiceCost) * discount);
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
            placeholderTextColor="#1D2951"
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
          <View style={styles.horizantalLine} />
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmLocation}>
            {confirmLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirm Location</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {showMessageBox && (
        <Modal
          transparent={true}
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
                    <TextInput style={styles.input} placeholder="City" value={city} onChangeText={setCity} />
                    {cityError ? <Text style={styles.errorText}>{cityError}</Text> : null}
                  </View>
                  <Text style={styles.label}>Area</Text>
                  <View style={styles.inputView}>
                    <TextInput style={styles.input} placeholder="Area" value={area} onChangeText={setArea} />
                    {areaError ? <Text style={styles.errorText}>{areaError}</Text> : null}
                  </View>
                  <Text style={styles.label}>Pincode</Text>
                  <View style={styles.inputView}>
                    <TextInput style={styles.input} placeholder="Pincode" value={pincode} onChangeText={setPincode} />
                    {pincodeError ? <Text style={styles.errorText}>{pincodeError}</Text> : null}
                  </View>
                  <Text style={styles.label}>Phone number</Text>
                  <View style={styles.inputView}>
                    <TextInput
                      style={styles.input}
                      placeholder="Alternate phone number"
                      keyboardType="phone-pad"
                      value={alternatePhoneNumber}
                      onChangeText={setAlternatePhoneNumber}
                    />
                    {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
                  </View>
                  <Text style={styles.label}>Name</Text>
                  <View style={styles.inputView}>
                    <TextInput style={styles.input} placeholder="Alternate name" value={alternateName} onChangeText={setAlternateName} />
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

export default UserLocation;

const styles = StyleSheet.create({
  page: { flex: 1 },
  container: { flex: 1 },
  contentContainer: { paddingBottom: 80 },
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
    backgroundColor: 'white',
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
  searchBox: { flex: 1, color: '#1D2951', fontSize: 14, paddingHorizontal: 5 },
  backArrow: { marginRight: 12 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#212121' },
  horizantalLine: { width: '100%', height: 4, backgroundColor: '#f5f5f5' },
  markerContainer: { backgroundColor: 'transparent' },
  marker: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ff0000' },
  map: { flex: 1 },
  loadingContainer: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center' },
  bookingCard: { padding: 10, paddingHorizontal: 20, position: 'absolute', backgroundColor: '#ffffff', borderRadius: 20, width: '100%', bottom: 0, elevation: 5 },
  confirmButton: { backgroundColor: '#FF4500', padding: 10, borderRadius: 5 },
  confirmButtonText: { color: '#FFFFFF', textAlign: 'center', fontSize: 16 },
  messageBoxBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  messageBox: { width: '80%', padding: 20, backgroundColor: 'white', borderRadius: 10, elevation: 10 },
  completeAddressHead: { fontSize: 18, marginBottom: 10, color: '#1D2951' },
  label: { color: '#808080', fontSize: 12, padding: 5 },
  input: { height: 40, borderColor: '#ddd', borderWidth: 1, borderRadius: 5, paddingHorizontal: 10, color: '#000' },
  inputView: { marginBottom: 10 },
  bookButton: { backgroundColor: '#ff4500', padding: 10, borderRadius: 6, marginTop: 10 },
  bookButtonText: { color: '#FFFFFF', textAlign: 'center', fontSize: 16 },
  closeButton: { position: 'absolute', top: 10, right: 10, backgroundColor: '#f2f2f2', borderRadius: 15, width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  closeButtonText: { color: 'white', fontSize: 20 },
  serviceItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  serviceName: { fontSize: 14, color: '#212121', width: 90 },
  cost: { fontSize: 14, color: '#212121' },
  strikeThrough: { textDecorationLine: 'line-through', color: '#888' },
  quantityContainer: {
    backgroundColor: '#EFDCCB',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 15,
    borderColor: '#FF4500',
    borderWidth: 1,
    width: 70,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  quantity: { fontSize: 14, color: '#808080' },
  crosshairsContainer: { position: 'absolute', right: 20, bottom: 290, backgroundColor: 'white', borderRadius: 25, padding: 10, elevation: 5 },
  flatContainer: { height: '77%' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  bottomBarTotal: { fontSize: 18, fontWeight: '700', color: '#333' },
  bottomBarButton: { backgroundColor: '#ff6f00', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6 },
  bottomBarButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 8, width: '80%', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  modalMessage: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  modalButton: { backgroundColor: '#ff6f00', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 6 },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
