import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Text, Alert, BackHandler, Image, Dimensions, TouchableOpacity } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import EncryptedStorage from 'react-native-encrypted-storage';
import axios from 'axios';
import { useRoute, useNavigation, CommonActions, useFocusEffect } from '@react-navigation/native';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import polyline from '@mapbox/polyline';

Mapbox.setAccessToken('pk.eyJ1IjoieWFzd2FudGh2YW5hbWEiLCJhIjoiY20ybTMxdGh3MGZ6YTJxc2Zyd2twaWp2ZCJ9.uG0mVTipkeGVwKR49iJTbw');

const Navigation = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [routeData, setRouteData] = useState(null);
  const [locationDetails, setLocationDetails] = useState({ startPoint: [80.519353, 16.987142], endPoint: [80.6093701, 17.1098751] });
  const [decodedId, setDecodedId] = useState(null);
  const [addressDetails, setAddressDetails] = useState({});
  const [encodedData, setEncodedData] = useState(null);
  const [pin, setPin] = useState('');
  const [serviceArray, setServiceArray] = useState([]);

  useEffect(() => {
    const { encodedId } = route.params;
    setEncodedData(encodedId);
    if (encodedId) {
      try {
        setDecodedId(atob(encodedId));
      } catch (error) {
        console.error('Error decoding Base64:', error);
      }
    }
  }, [route.params]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }],
          })
        );
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation])
  );

  const handleCancelBooking = useCallback(async () => {
    try {
      const response = await axios.post(
        `${process.env.BACKENDAIPD}/api/user/work/cancel`,
        { notification_id: decodedId }
      );

      if (response.status === 200) {
        const cs_token = await EncryptedStorage.getItem('cs_token');
        await axios.post(`${process.env.BACKENDAIPD}/api/user/action`, {
          encodedId: encodedData,
          screen: ''
        }, {
          headers: { Authorization: `Bearer ${cs_token}` }
        });

        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }]
          })
        );
      } else {
        Alert.alert('Cancellation failed', 'Your cancellation time of 2 minutes is over.');
      }
    } catch (error) {
      Alert.alert('Error', 'There was an error processing your cancellation.');
    }
  }, [decodedId, encodedData, navigation]);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        const response = await axios.get(
          `${process.env.BACKENDAIPD}/api/worker/verification/status`,
          { params: { notification_id: decodedId } }
        );

        if (response.data === 'true') {
          const cs_token = await EncryptedStorage.getItem('cs_token');
          await axios.post(`${process.env.BACKENDAIPD}/api/user/action`, {
            encodedId: encodedData,
            screen: 'worktimescreen'
          }, {
            headers: { Authorization: `Bearer ${cs_token}` }
          });

          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'worktimescreen', params: { encodedId: encodedData } }]
            })
          );
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
      }
    };

    if (decodedId) checkVerificationStatus();
  }, [decodedId, encodedData, navigation]);

  useEffect(() => {
    const fetchWorkerDetails = async () => {
      const jwtToken = await EncryptedStorage.getItem('cs_token');
      try {
        const response = await axios.post(
          `${process.env.BACKENDAIPD}/api/worker/navigation/details`,
          { notificationId: decodedId },
          { headers: { Authorization: `Bearer ${jwtToken}` } }
        );

        if (response.status === 404) {
          navigation.navigate('SkillRegistration');
        } else {
          const { name, phone_number, pin, profile, pincode, area, city, service_booked } = response.data;
          const pinString = String(pin);
          const details = {
            name,
            phone_number,
            profile,
            pincode,
            area,
            city,
            service: service_booked
          };
          setPin(pinString);
          setAddressDetails(details);
          setServiceArray(service_booked);
        }
      } catch (error) {
        console.error('Error fetching worker details:', error);
      }
    };

    if (decodedId) fetchWorkerDetails();
  }, [decodedId, navigation]);

  useEffect(() => {
    const fetchLocationDetails = async () => {
      try {
        const response = await axios.get(
          `${process.env.BACKENDAIPD}/api/user/location/navigation`,
          { params: { notification_id: decodedId } }
        );

        const { startPoint, endPoint } = response.data;
        const reversedStart = startPoint.map(parseFloat).reverse();
        const reversedEnd = endPoint.map(parseFloat).reverse();
         setLocationDetails({ startPoint: reversedStart, endPoint: reversedEnd });
        fetchRoute(reversedStart, reversedEnd);
      } catch (error) {
        console.error('Error fetching location details:', error);
      }
    };

    const fetchOlaRoute = async (startPoint, endPoint, waypoints = []) => {
      try {
          const apiKey = 'iN1RT7PQ41Z0DVxin6jlf7xZbmbIZPtb9CyNwtlT';
          
          // Construct the base URL with origin and destination
          let url = `https://api.olamaps.io/routing/v1/directions?origin=${startPoint[1]},${startPoint[0]}&destination=${endPoint[1]},${endPoint[0]}&api_key=${apiKey}`;
          
          // Add waypoints if any
          if (waypoints.length > 0) {
              const waypointParams = waypoints.map(point => `${point[1]},${point[0]}`).join('|');
              url += `&waypoints=${encodeURIComponent(waypointParams)}`;
          }
   
          const response = await axios.post(
              url,
              {},
              {
                  headers: {
                      'X-Request-Id': 'unique-request-id' // Replace with actual request ID if needed
                  }
              }
          );
   
          const routeData = response.data.routes[0].overview_polyline;
          const decodedCoordinates = polyline.decode(routeData).map(coord => [coord[1], coord[0]]); // Map to [lng, lat]
          
          return {
              type: 'Feature',
              geometry: {
                  type: 'LineString',
                  coordinates: decodedCoordinates
              }
          };
      } catch (error) {
          console.error('Error fetching route from Ola Maps:', error);
      }
   };
  
  

   const fetchRoute = async (startPoint, endPoint) => {
    try {
        const olaRouteData = await fetchOlaRoute(startPoint, endPoint);
        console.log(olaRouteData)
        if (olaRouteData && olaRouteData.geometry && olaRouteData.geometry.coordinates.length > 0) {
          console.log(olaRouteData);
          setRouteData(olaRouteData); // Only set if coordinates are non-empty
      } else {
          console.error("Route data has empty coordinates:", olaRouteData);
      }
      
    } catch (error) {
        console.error('Error fetching route:', error);
    }
 };
  

    if (decodedId) {
      fetchLocationDetails();
      const intervalId = setInterval(fetchLocationDetails, 60000);
      return () => clearInterval(intervalId);
    }
  }, [decodedId]);

  return (
    <View style={styles.container}>
      <Mapbox.MapView style={styles.map}>
        <Mapbox.Camera
          zoomLevel={14}
          centerCoordinate={locationDetails.startPoint}
        />
  

        <Mapbox.PointAnnotation
          id="start-point"
          coordinate={locationDetails.startPoint}
        >
          <FontAwesome6 name='location-dot' size={25} color='#4CAF50' />
        </Mapbox.PointAnnotation>

        <Mapbox.PointAnnotation
          id="end-point"
          coordinate={locationDetails.endPoint}
        >
          <FontAwesome6 name='location-dot' size={25} color='#ff4500' />
        </Mapbox.PointAnnotation>
  
        {routeData && (
          <Mapbox.ShapeSource id="routeSource" shape={routeData}>
            <Mapbox.LineLayer
              id="routeLine"
              style={styles.routeLine}
            />
          </Mapbox.ShapeSource>
        )}
      </Mapbox.MapView>
  
      <View style={styles.detailsContainer}>
        <View style={styles.minimumChargesContainer}>
          <Text style={styles.serviceFare}>Commander on the way</Text>
        </View>
  
        <View style={styles.firstContainer}>
          <View>
            {/* Service Location */}
            <View style={styles.locationContainer}>
              <Image
                source={{ uri: 'https://i.postimg.cc/rpb2czKR/1000051859-removebg-preview.png' }}
                style={styles.locationPinImage}
              />
              <View style={styles.locationDetails}>
                <Text style={styles.locationAddress}>
                  {addressDetails.area} 
                </Text>
              </View>
            </View>
          </View>
        </View>
        {/* Service Type */}
        <View style={styles.serviceDetails}>
          <View>
            <View>
              <Text style={styles.serviceType}>Service</Text>
              <View style={styles.servicesNamesContainer}>
                {serviceArray.map((serviceItem, index) => (
                  <View key={index}>
                    <Text style={styles.serviceText}>{serviceItem.serviceName}</Text>
                  </View>
                ))}
              </View>
            </View>           
                <View style={styles.pinContainer}>
                  <Text style={styles.pinText}>PIN</Text>
      
                  {/* Display each pin digit in its own box */}
                  <View style={styles.pinBoxesContainer}>
                    {pin.split('').map((digit, index) => (
                      <View key={index} style={styles.pinBox}>
                        <Text style={styles.pinNumber}>{digit}</Text>
                      </View>
                    ))}
                  </View>
                </View>           
            </View>
          <View style={styles.workerDetailsContainer}>
            <View>
              {addressDetails.profile && <Image source={{ uri: addressDetails.profile }} style={styles.image} />}
              <Text style={styles.workerName}>{addressDetails.name}</Text>
            </View>
            <View style={styles.iconsContainer}>
              <TouchableOpacity style={styles.actionButton}>
                <MaterialIcons name="call" size={18} color="#FF5722" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <AntDesign name="message1" size={18} color="#FF5722" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const screenHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  serviceText: {
    color: '#212121',
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 5,
  },
  servicesNamesContainer:{
    flexDirection:'row',
    alignItems:'center',
    gap:5
  },
  firstContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  workerName: {
    color: '#212121',
    textAlign: 'center',
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 50,
  },
  serviceName:{
    color:'#212121'
  },
  iconsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  locationPinImage: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width:'100%',
    alignItems: 'center',
  },
  minimumChargesContainer: {
    height: 46,
    backgroundColor: '#f6f6f6',
    borderRadius: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
  },
  map: {
    flex: 1,
    minHeight: 0.45 * screenHeight,
  },
  routeLine: {
    lineColor: '#0000ff',
    lineWidth: 5,
  },
  pinContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingVertical: 10,
  },
  pinText: {
    color: '#9e9e9e',
    fontSize: 18,
    paddingTop: 10,
  },
  pinBoxesContainer: {
    flexDirection: 'row',
    gap: 5,
  },
  pinBox: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#212121',
    borderRadius: 5,
  },
  pinNumber: {
    color: '#212121',
    fontSize: 14,
  },
  detailsContainer: {
    flex: 2,
    backgroundColor: '#ffffff',
    padding: 15,
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  serviceFare: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 16,
    color: '#1D2951',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    width:'90%'
  },
  locationDetails: {
    marginLeft: 10,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  locationAddress: {
    fontSize: 13,
    color: '#212121',
  },
  workerDetailsContainer:{
    flexDirection:'column',
    gap:5,
    alignItems:'center'
  },
  serviceType: {
    fontSize: 16,
    marginTop: 10,
    color: '#9e9e9e',
  },
  actionButton: {
    backgroundColor: '#EFDCCB',
    height: 35,
    width: 35,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrivalButton: {
    backgroundColor: '#FF5722',
    borderRadius: 5,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 25,
  },
  arrivalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});


export default Navigation;
