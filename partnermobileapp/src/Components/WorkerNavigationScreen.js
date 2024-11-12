import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Alert,
  Image,
  BackHandler,
  Linking,
  Platform,
  Animated,
  PermissionsAndroid,
  TouchableOpacity,
  Easing,
  Dimensions,
  Modal
} from 'react-native';
import Mapbox from '@rnmapbox/maps';
import EncryptedStorage from 'react-native-encrypted-storage';
import axios from 'axios';
import { useRoute, useNavigation, CommonActions, useFocusEffect } from '@react-navigation/native';
import Geolocation from '@react-native-community/geolocation';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import SwipeButton from 'rn-swipe-button';
import Entypo from 'react-native-vector-icons/Entypo';

// Set your Mapbox access token here
Mapbox.setAccessToken('pk.eyJ1IjoieWFzd2FudGh2YW5hbWEiLCJhIjoiY20ybTMxdGh3MGZ6YTJxc2Zyd2twaWp2ZCJ9.uG0mVTipkeGVwKR49iJTbw');

const WorkerNavigationScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [routeData, setRouteData] = useState(null);
  const [locationDetails, setLocationDetails] = useState({
    startPoint: [80.519353, 16.987142],
    endPoint: [80.6093701, 17.1098751],
  });
  const [decodedId, setDecodedId] = useState(null);
  const [addressDetails, setAddressDetails] = useState(null);
  const [titleColor, setTitleColor] = useState('#FFFFFF');
  const [swiped, setSwiped] = useState(false);
  const [reasonModalVisible, setReasonModalVisible] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);

  useEffect(() => {
    const { encodedId } = route.params;
    if (encodedId) {
      try {
        setDecodedId(atob(encodedId));
      } catch (error) {
        console.error('Error decoding Base64:', error);
      }
    }
  }, [route.params]);

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
            }
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

  useEffect(() => {
    if (decodedId) {
      checkCancellationStatus();
      fetchAddressDetails();
      fetchLocationDetails();
    }
  }, [decodedId]);

  const checkCancellationStatus = async () => {
    try {
      const response = await axios.get(`${process.env.BackendAPI6}/api/worker/cancelled/status`, {
        params: { notification_id: decodedId },
      });

      if (response.data.notificationStatus === 'usercanceled') {
        const pcs_token = await EncryptedStorage.getItem('pcs_token');
        await axios.post(
          `${process.env.BackendAPI6}/api/worker/action`,
          {
            encodedId: '',
            screen: '',
          },
          {
            headers: { Authorization: `Bearer ${pcs_token}` },
          }
        );

        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }],
          })
        );
      }
    } catch (error) {
      console.error('Error checking cancellation status:', error);
    }
  };

  const ThumbIcon = () => {
    return (
      <View style={styles.thumbContainer}>
        <Text>
          {swiped ? (
            <Entypo name="check" size={20} color="#ff4500" style={styles.checkIcon} />
          ) : (
            <FontAwesome6 name="arrow-right-long" size={18} color="#ff4500" />
          )}
        </Text>
      </View>
    );
  };

  const fetchAddressDetails = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.BackendAPI6}/api/user/address/details`, {
        params: { notification_id: decodedId },
      });
      setAddressDetails(response.data);
    } catch (error) {
      console.error('Error fetching address details:', error);
    }
  }, [decodedId]);

  const fetchLocationDetails = async () => {
    try {
      const response = await axios.post(`${process.env.BackendAPI6}/api/service/location/navigation`, {
        notification_id: decodedId,
      });

      const { startPoint, endPoint } = response.data;
      setLocationDetails({
        startPoint: startPoint.map((coord) => parseFloat(coord)),
        endPoint: endPoint.map((coord) => parseFloat(coord)),
      });
    } catch (error) {
      console.error('Error fetching location details:', error);
    }
  };

  useEffect(() => {
    if (locationDetails.startPoint && locationDetails.endPoint) {
      const fetchRoute = async () => {
        try {
          const response = await axios.get(
            `https://api.mapbox.com/directions/v5/mapbox/driving/${locationDetails.startPoint.join(
              ','
            )};${locationDetails.endPoint.join(
              ','
            )}?alternatives=true&steps=true&geometries=geojson&access_token=pk.eyJ1IjoieWFzd2FudGh2YW5hbWEiLCJhIjoiY20ybTMxdGh3MGZ6YTJxc2Zyd2twaWp2ZCJ9.uG0mVTipkeGVwKR49iJTbw`
          );

          if (response.data.routes.length > 0) {
            setRouteData(response.data.routes[0].geometry);
          } else {
            console.error('No routes found in the response.');
          }
        } catch (error) {
          console.error('Error fetching route:', error);
        }
      };
      fetchRoute();
    }
  }, [locationDetails]);

  const handleLocationReached = () => {
    const encodedNotificationId = btoa(decodedId);
    navigation.push('OtpVerification', { encodedId: encodedNotificationId });
  };

  const handleCancelModal = () => {
    setReasonModalVisible(true);
  };

  const closeReasonModal = () => {
    setReasonModalVisible(false);
  };

  const openConfirmationModal = () => {
    setConfirmationModalVisible(true);
  };

  const closeConfirmationModal = () => {
    setConfirmationModalVisible(false);

  };

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

  const openGoogleMaps = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${locationDetails.endPoint[1]},${locationDetails.endPoint[0]}&travelmode=driving`;
        Linking.openURL(url).catch((err) => console.error('Error opening Google Maps:', err));
      },
      (error) => {
        console.error('Error getting current location:', error);
      }
    );
  };

  return (
    <View style={styles.container}>
      <Mapbox.MapView style={styles.map}>
        <Mapbox.Camera zoomLevel={14} centerCoordinate={locationDetails.startPoint} />

        {/* Marker for Start Point */}
        <Mapbox.PointAnnotation id="start-point" coordinate={locationDetails.startPoint}>
          <FontAwesome6 name="location-dot" size={25} color="#4CAF50" />
        </Mapbox.PointAnnotation>

        {/* Marker for End Point */}
        <Mapbox.PointAnnotation id="end-point" coordinate={locationDetails.endPoint}>
          <FontAwesome6 name="location-dot" size={25} color="#ff4500" />
        </Mapbox.PointAnnotation>

        {routeData && (
          <Mapbox.ShapeSource id="routeSource" shape={routeData}>
            <Mapbox.LineLayer id="routeLine" style={styles.routeLine} />
          </Mapbox.ShapeSource>
        )}
      </Mapbox.MapView>
      <TouchableOpacity style={styles.cancelButton} onPress={handleCancelModal}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.googleMapsButton} onPress={openGoogleMaps}>
        <Text style={styles.googleMapsText}>Google Maps</Text>
        <MaterialCommunityIcons name="navigation-variant" size={20} color="#C1C1C1" />
      </TouchableOpacity>
      {/* Reason Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={reasonModalVisible}
        onRequestClose={closeReasonModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity onPress={closeReasonModal} style={styles.backButtonContainer}>
            <AntDesign name="arrowleft" size={20} color="black" />
          </TouchableOpacity>

          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>What is the reason for your cancellation?</Text>
            <Text style={styles.modalSubtitle}>Could you let us know why you're canceling?</Text>

            <TouchableOpacity style={styles.reasonButton} onPress={openConfirmationModal}>
              <Text style={styles.reasonText}>Found a better price</Text>
              <AntDesign name="right" size={16} color="#4a4a4a" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.reasonButton} onPress={openConfirmationModal}>
              <Text style={styles.reasonText}>Wrong work location</Text>
              <AntDesign name="right" size={16} color="#4a4a4a" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.reasonButton} onPress={openConfirmationModal}>
              <Text style={styles.reasonText}>Wrong service booked</Text>
              <AntDesign name="right" size={16} color="#4a4a4a" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.reasonButton} onPress={openConfirmationModal}>
              <Text style={styles.reasonText}>More time to assign a commander</Text>
              <AntDesign name="right" size={16} color="#4a4a4a" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.reasonButton} onPress={openConfirmationModal}>
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
          <TouchableOpacity onPress={closeConfirmationModal} style={styles.backButtonContainer}>
            <Entypo name="cross" size={20} color="black" />
          </TouchableOpacity>
          </View>

          <View style={styles.confirmationModalContainer}>
            <Text style={styles.confirmationTitle}>Are you sure you want to cancel this ride?</Text>
            <Text style={styles.confirmationSubtitle}>
            The user is waiting for your help to solve their issue. Please avoid clicking cancel and assist them as soon as possible
            </Text>

            <TouchableOpacity style={styles.confirmButton} onPress={closeConfirmationModal}>
              <Text style={styles.confirmButtonText}>Cancel my service</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {addressDetails && (
        <View style={styles.detailsContainer}>
          <View style={styles.minimumChargesContainer}>
            <Text style={styles.serviceFare}>
              Minimum Service Fare: <Text style={styles.amount}>₹199</Text>
            </Text>
          </View>

          {/* Service Location */}
          <View style={styles.locationContainer}>
            <Image
              source={{
                uri: 'https://i.postimg.cc/rpb2czKR/1000051859-removebg-preview.png',
              }}
              style={styles.locationPinImage}
            />
            <View style={styles.locationDetails}>
              {/* <Text style={styles.locationTitle}>{addressDetails.city}</Text> */}
              <Text style={styles.locationAddress}>
                {addressDetails.area}
              </Text>
            </View>
          </View>

          {/* Service Type */}
          <View style={styles.serviceDetails}>
            <View>
              <Text style={styles.serviceType}>Service</Text>
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
          <Text style={styles.serviceText}>AC Service & Repairing</Text>
          <Text style={styles.pickupText}>You are at pickup location</Text>

          {/* Arrival Button */}
          <View style={{ paddingTop: 20 }}>
            <SwipeButton
              title="I've Arrived"
              titleStyles={{ color: titleColor }}
              railBackgroundColor="#FF5722"
              railBorderColor="#FF5722"
              railStyles={{
                borderRadius: 25,
                height: 50,
                backgroundColor: '#FF572200',
                borderColor: '#FF572200',
              }}
              thumbIconComponent={ThumbIcon}
              thumbIconBackgroundColor="#FFFFFF"
              thumbIconBorderColor="#FFFFFF"
              thumbIconWidth={50}
              thumbIconHeight={50}
              onSwipeStart={() => setTitleColor('#B0B0B0')}
              onSwipeSuccess={() => {
                handleLocationReached();
                setTitleColor('#FFFFFF');
                setSwiped(true);
              }}
              onSwipeFail={() => setTitleColor('#FFFFFF')}
            />
          </View>
        </View>
      )}
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
  thumbContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
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
  amount: {
    color: '#212121',
    fontSize: 16,
    fontWeight: 'bold',
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  minimumChargesContainer: {
    height: 46,
    backgroundColor: '#f6f6f6',
    borderRadius: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 5,
  },
  map: {
    flex: 1,
    minHeight: 0.35 * screenHeight,
  },
  routeLine: {
    lineColor: '#0000ff',
    lineWidth: 5,
  },
  cancelButton: {
    position: 'absolute',
    top: 0.498 * screenHeight,
    left: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    width: 80,
    height: 35,
  },
  cancelText: {
    fontSize: 13,
    color: '#4a4a4a',
    fontWeight: 'bold',
  },
  googleMapsButton: {
    position: 'absolute',
    top: 0.49 * screenHeight,
    right: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    width: 140,
    height: 40,
  },
  googleMapsText: {
    fontSize: 14,
    color: '#212121',
    fontWeight: 'bold',
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
    color: '#9e9e9e',
  },
  locationContainer: {
    flexDirection: 'row',
    width:'90%',
    justifyContent:'space-between',
    alignItems: 'center',
    marginVertical: 10,
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
    fontSize: 14,
    color: '#212121',
    fontWeight:'450',
    
  },
  serviceType: {
    fontSize: 16,
    marginTop: 10,
    color: '#9e9e9e',
  },
  pickupText: {
    fontSize: 16,
    color: '#212121',
    marginTop: 20,
  },
  actionButton: {
    backgroundColor: '#EFDCCB',
    height: 35,
    width: 35,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonContainer: {
    width:40,
    height:40,     
    flexDirection:'column',
    alignItems:'center',
    justifyContent:'center',      // Distance from the left side of the screen
      backgroundColor: 'white', // Background color for the circular container
      borderRadius: 50,    // Rounds the container to make it circular
          // Padding to make the icon container larger
      elevation: 5,        // Elevation for shadow effect (Android)
      shadowColor: '#000', // Shadow color (iOS)
      shadowOffset: { width: 0, height: 2 }, // Shadow offset (iOS)
      shadowOpacity: 0.2,  // Shadow opacity (iOS)
      shadowRadius: 4,     // Shadow radius (iOS)
      zIndex: 1,   
      marginHorizontal:10,        // Ensures the icon is above other elements,
      marginBottom:5
  },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: 'white',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      paddingBottom: 30,
    },
    backButton: {
      alignSelf: 'flex-start',
      marginBottom: 10,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      textAlign:'center',
      marginBottom: 5,
      color: '#000',
    },
    modalSubtitle: {
      fontSize: 14,
      color: '#666',
      textAlign:'center',
      marginBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      paddingBottom:10
    },
    reasonButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    reasonText: {
      fontSize: 16,
      color: '#333',
    },
    closeButton: {
      marginTop: 15,
      padding: 10,
      backgroundColor: '#ddd',
      borderRadius: 5,
    },
    closeText: {
      fontSize: 16,
      color: '#555',
    },
  
  
    crossContainer:{
      flexDirection:'row',
      justifyContent:'flex-end'
    },
    confirmationModalContainer: {
      backgroundColor: 'white',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 40,
      paddingBottom: 30,
      paddingHorizontal: 20,
      alignItems: 'center',
    },
    confirmationTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
      paddingBottom: 10,
      marginBottom:5,
      color: '#000',
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    confirmationSubtitle: {
      fontSize: 14,
      color: '#666',
      textAlign: 'center',
      marginBottom: 20,
      paddingBottom:10,
      paddingTop:10
    },
    confirmButton: {
      backgroundColor: '#FF4500',
      borderRadius: 40,
      paddingVertical: 15,
      paddingHorizontal: 40,
      alignItems: 'center',
    },
    confirmButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },
});

export default WorkerNavigationScreen;
