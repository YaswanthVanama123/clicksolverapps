import React, {useEffect, useRef, useState, useCallback} from 'react';
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
  Button,
  Pressable,
  Alert,
  BackHandler,
} from 'react-native';
import Mapbox from '@rnmapbox/maps';
import Geolocation from 'react-native-geolocation-service';
import {SafeAreaView} from 'react-native-safe-area-context';
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
import {Places, Routing} from 'ola-maps'; // Import Ola Maps Places module

// Set Mapbox access token
Mapbox.setAccessToken(
  'pk.eyJ1IjoieWFzd2FudGh2YW5hbWEiLCJhIjoiY20ybTMxdGh3MGZ6YTJxc2Zyd2twaWp2ZCJ9.uG0mVTipkeGVwKR49iJTbw',
);

const placesClient = new Places('iN1RT7PQ41Z0DVxin6jlf7xZbmbIZPtb9CyNwtlT');
const UserLocation = () => {
  const navigation = useNavigation();
  const [location, setLocation] = useState(null);
  const [suggestionName, setSuggestionName] = useState({});
  const [showMessageBox, setShowMessageBox] = useState(false);
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [pincode, setPincode] = useState('');
  const [alternatePhoneNumber, setAlternatePhoneNumber] = useState('');
  const [alternateName, setAlternateName] = useState('');
  const [service, setService] = useState([]); // Changed from 'Sample Service' to an array
  const route = useRoute();
  const {serviceName, suggestion} = route.params;
  const mapRef = useRef(null);
  const [cityError, setCityError] = useState('');
  const [areaError, setAreaError] = useState('');
  const [pincodeError, setPincodeError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [nameError, setNameError] = useState('');
  const [startCoordinates, setStartCoordinates] = useState({
    latitude: 16.69834,
    longitude: 81.05022,
  });
  const [endCoordinates, setEndCoordinates] = useState({
    latitude: 16.50695,
    longitude: 80.61539,
  });

  useEffect(() => {
    if (serviceName) {
      setService(serviceName);
    }
    if (suggestion) {
      setSuggestionName(suggestion);
    }
  }, [route.params]);

  //   useEffect(()=>{
  //       // Example usage:

  //       calculateDistanceBetweenCoordinates(startCoordinates, endCoordinates).then(distance => {
  //     if (distance !== null) {
  //         console.log(`Calculated Distance: ${distanceInKilometers.toFixed(2)} km`);
  //     }
  // })
  //   },[])

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
            },
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Location permission denied');
            return;
          }
        }
        Geolocation.getCurrentPosition(
          position => {
            const {latitude, longitude} = suggestion
              ? suggestion
              : position.coords;
            fetchAndSetPlaceDetails(latitude, longitude);
            setLocation([longitude, latitude]);
            sendDataToServer(longitude, latitude);
          },
          error => {
            console.error('Geolocation error:', error);
          },
          {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
        );
      } catch (err) {
        console.warn(err);
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
    }, []),
  );

  const fetchAndSetPlaceDetails = useCallback(async (latitude, longitude) => {
    try {
      // Use Ola Maps Places reverse geocode
      const response = await placesClient.reverse_geocode(latitude, longitude);
      const place = response.body.results[0];
      // console.log("details", JSON.stringify(response.body, null, 2)); // For detailed inspection

      if (response && response.body && response.body.results.length > 0) {
        const addressComponents = response.body.results[0].address_components;

        // Extract city, prioritizing 'sublocality' if it seems to match the desired result
        const city =
          addressComponents.find(
            component =>
              component.types.includes('sublocality') || // Prioritize sublocality first
              component.types.includes('locality') ||
              component.types.includes('administrative_area_level_3') ||
              component.types.includes('administrative_area_level_2'),
          )?.long_name || '';

        // Extract area information, using a broader range of potential sources
        const area = place.formatted_address || '';

        // Extract pincode directly from 'postal_code'
        const pincode =
          addressComponents.find(component =>
            component.types.includes('postal_code'),
          )?.short_name || '';

        setCity(city);
        setArea(area);
        setPincode(pincode);
      } else {
        console.warn('No address details found.');
      }
    } catch (error) {
      console.error('Failed to fetch place details using Ola Maps:', error);
    }
  }, []);

  // Function to calculate the distance between two coordinates using Ola Maps Routes

  const calculateDistanceBetweenCoordinates = async (
    startCoordinates,
    endCoordinates,
  ) => {
    try {
      const apiKey = 'iN1RT7PQ41Z0DVxin6jlf7xZbmbIZPtb9CyNwtlT'; // Replace with your API key

      // Format the coordinates as required by the Distance Matrix API
      const origins = `${startCoordinates.latitude},${startCoordinates.longitude}`;
      const destinations = `${endCoordinates.latitude},${endCoordinates.longitude}`;

      // Construct the API URL
      const url = `https://api.olamaps.io/routing/v1/distanceMatrix?origins=${origins}&destinations=${destinations}&api_key=${apiKey}`;

      // Make the API request
      const response = await axios.get(url, {
        headers: {
          'X-Request-Id': 'your-request-id', // Optional, but useful for tracking requests
        },
      });

      console.log('distanceResponse', response.data);

      // Check if the response contains valid data
      if (response && response.data && response.data.rows.length > 0) {
        const elements = response.data.rows[0].elements;

        if (elements && elements.length > 0) {
          const distanceInMeters = elements[0].distance;

          if (distanceInMeters) {
            const distanceInKilometers = (distanceInMeters / 1000).toFixed(2);
            console.log(`Distance: ${distanceInKilometers} km`);
            return distanceInKilometers;
          } else {
            console.log('Distance data is not available.');
            return null;
          }
        } else {
          console.log('No elements found in the distance response.');
          return null;
        }
      } else {
        console.log('No distance found between the specified locations.');
        return null;
      }
    } catch (error) {
      if (error.response) {
        // Log details of the error response
        console.error('Error calculating distance:', error.response.data);
      } else {
        console.error('Error calculating distance:', error.message);
      }
    }
  };

  const sendDataToServer = useCallback(async (longitude, latitude) => {
    try {
      const token = await EncryptedStorage.getItem('cs_token');
      if (!token) {
        console.error('No token found');
        return;
      }
      const response = await axios.post(
        `${process.env.BACKENDAIPL}/api/user/location`,
        {longitude: String(longitude), latitude: String(latitude)},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 200) {
        console.log('User location sent to BACKENDAIPL successfully');
      }
    } catch (error) {
      console.error('Failed to send user location to BACKENDAIPL:', error);
    }
  }, []);

  const handleCrosshairsPress = () => {
    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        setLocation([longitude, latitude]);
        sendDataToServer(longitude, latitude);
        fetchAndSetPlaceDetails(latitude, longitude);
      },
      error => {
        console.error('Geolocation error:', error);
      },
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
    );
  };

  const handleConfirmLocation = async () => {
    setShowMessageBox(true);
    try {
      const token = await EncryptedStorage.getItem('cs_token');
      if (!token) {
        console.error('No token found');
        return;
      }
      const response = await axios.get(
        `${process.env.BACKENDAIPL}/api/get/user`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = response.data;
      setAlternatePhoneNumber(data.phone_number || '');
      setAlternateName(data.name);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
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
              },
            },
          ],
        }),
      );
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

  const screenHeight = Dimensions.get('window').height;

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.searchBoxContainer}>
        <View style={styles.iconSearchContainer}>
          <TouchableOpacity onPress={handleBackPress}>
            <FontAwesome6 name="arrow-left-long" size={18} color="gray" />
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.searchBox}
          placeholder="Search location ..."
          placeholderTextColor="#1D2951"
          onFocus={() => navigation.push('LocationSearch', {serviceName})}
          value={suggestion ? suggestion.title : ''}
        />
        <View style={styles.iconContainer}>
          <TouchableOpacity onPress={() => setSuggestionName('')}>
            <EvilIcons name="hearto" size={20} color="#808080" />
          </TouchableOpacity>
        </View>
        <View style={styles.iconDotContainer}>
          <TouchableOpacity onPress={() => setSuggestionName('')}>
            <Octicons name="dot-fill" size={17} color="#4CAF50" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={[styles.container, {height: screenHeight * 0.75}]}>
        <Mapbox.MapView
          ref={mapRef}
          style={styles.map}
          zoomEnabled={true}
          styleURL="mapbox://styles/mapbox/streets-v11"
          onPress={handlePressLocation}>
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
      </View>
      <View style={[styles.bookingCard, {height: screenHeight * 0.3}]}>
        <View>
          <View style={styles.flatContainer}>
            <FlatList
              data={service}
              renderItem={({item}) => (
                <View style={styles.serviceItem}>
                  <View>
                    <Text style={styles.serviceName}>{item.serviceName}</Text>
                  </View>
                  <View style={styles.quantityContainer}>
                    <Text style={styles.quantity}>{item.quantity}</Text>
                  </View>
                  <View>
                    <Text style={styles.cost}>₹ {item.cost}</Text>
                  </View>
                </View>
              )}
              keyExtractor={(item, index) => index.toString()}
            />
          </View>
          <View style={styles.horizantalLine} />
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirmLocation}>
            <Text style={styles.confirmButtonText}>Confirm Location</Text>
          </TouchableOpacity>
        </View>
      </View>
      {showMessageBox && (
        <Modal
          transparent={true}
          visible={showMessageBox}
          animationType="slide"
          onRequestClose={() => setShowMessageBox(false)}>
          <View style={styles.messageBoxBackdrop}>
            <View style={styles.messageBox}>
              <Text style={styles.completeAddressHead}>
                Enter complete address!
              </Text>
              <Text style={styles.label}>City</Text>
              <View style={styles.inputView}>
                <TextInput
                  style={styles.input}
                  placeholder="City"
                  value={city}
                  onChangeText={setCity}
                />
                {cityError ? (
                  <Text style={styles.errorText}>{cityError}</Text>
                ) : null}
              </View>
              <Text style={styles.label}>Area</Text>
              <View style={styles.inputView}>
                <TextInput
                  style={styles.input}
                  placeholder="Area"
                  value={area}
                  onChangeText={setArea}
                />
                {areaError ? (
                  <Text style={styles.errorText}>{areaError}</Text>
                ) : null}
              </View>
              <Text style={styles.label}>Pincode</Text>
              <View style={styles.inputView}>
                <TextInput
                  style={styles.input}
                  placeholder="Pincode"
                  value={pincode}
                  onChangeText={setPincode}
                />
                {pincodeError ? (
                  <Text style={styles.errorText}>{pincodeError}</Text>
                ) : null}
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
                {phoneError ? (
                  <Text style={styles.errorText}>{phoneError}</Text>
                ) : null}
              </View>
              <Text style={styles.label}>Name</Text>
              <View style={styles.inputView}>
                <TextInput
                  style={styles.input}
                  placeholder="Alternate name"
                  value={alternateName}
                  onChangeText={setAlternateName}
                />
                {nameError ? (
                  <Text style={styles.errorText}>{nameError}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                style={styles.bookButton}
                onPress={handleBookCommander}>
                <Text style={styles.bookButtonText}>Book Commander</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowMessageBox(false)}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
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
  page: {
    flex: 1,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  serviceName: {
    fontSize: 15,
    color: '#212121',
    width: 80,
    fontWeight: '500',
    flex: 1, // Ensures the service name takes remaining space
    textAlign: 'left', // Aligns the service name to the left
  },
  quantityContainer: {
    backgroundColor: '#EFDCCB',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 15,
    borderColor: '#FF4500',
    borderWidth: 1,
    width: 70,
    alignItems: 'center',
    marginHorizontal: 10, // Add some margin between the items
  },
  quantity: {
    fontSize: 14,
    color: '#808080',
  },
  cost: {
    fontSize: 14,
    color: '#212121',
  },
  horizantalLine: {
    width: '100%',
    height: 4,
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginTop: 5,
  },
  contactSection: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  flatContainer: {
    height: '77%',
  },
  crosshairsContainer: {
    position: 'absolute',
    right: 20,
    bottom: 290,
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 10,
    elevation: 5,
  },
  searchBoxContainer: {
    position: 'absolute',
    top: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  iconContainer: {
    position: 'absolute',
    right: 40,
    top: 16,
  },
  iconDotContainer: {
    position: 'absolute',
    right: '74%',
    top: 19,
  },
  iconSearchContainer: {
    position: 'absolute',
    right: '85%',
    top: 18,
    zIndex: 20,
  },
  searchBox: {
    height: 55,
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 9,
    fontWeight: '500',
    paddingHorizontal: 85,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.8,
    shadowRadius: 2,
    color: '#1D2951',
    fontSize: 14,
  },
  label: {
    color: '#808080',
    fontWeight: '500',
    fontSize: 12,
    padding: 5,
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
  bookingCard: {
    padding: 10,
    paddingHorizontal: 20,
    position: 'absolute',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    width: '100%',
    bottom: 0,
    elevation: 5,
  },
  confirmButton: {
    backgroundColor: '#FF4500',
    padding: 10,
    borderRadius: 5,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
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
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 10,
  },
  completeAddressHead: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1D2951',
  },
  input: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    color: '#000',
  },
  inputView: {
    marginBottom: 10,
  },
  bookButton: {
    backgroundColor: '#ff4500',
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    textAlign: 'center',
    fontSize: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#f2f2f2',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 20,
  },
});
