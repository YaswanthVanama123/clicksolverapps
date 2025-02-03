import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  BackHandler,
  StyleSheet,
  Dimensions,
  Image,
  Modal,
} from 'react-native';
import axios from 'axios';
import {
  useNavigation,
  useRoute,
  CommonActions,
  useFocusEffect,
} from '@react-navigation/native';
import EncryptedStorage from 'react-native-encrypted-storage';
import LottieView from 'lottie-react-native';
import {Buffer} from 'buffer';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Octicons from 'react-native-vector-icons/Octicons';
import Mapbox from '@rnmapbox/maps';
Mapbox.setAccessToken(
  'pk.eyJ1IjoieWFzd2FudGh2YW5hbWEiLCJhIjoiY20ybTMxdGh3MGZ6YTJxc2Zyd2twaWp2ZCJ9.uG0mVTipkeGVwKR49iJTbw',
);
import Entypo from 'react-native-vector-icons/Entypo';
import AntDesign from 'react-native-vector-icons/AntDesign';
// import Config from 'react-native-config';

const WaitingUser = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [decodedId, setDecodedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('waiting');
  const [cancelMessage, setCancelMessage] = useState('');
  const [city, setCity] = useState(null);
  const [area, setArea] = useState(null);
  const [pincode, setPincode] = useState(null);
  const [alternatePhoneNumber, setAlternatePhoneNumber] = useState(null);
  const [location, setLocation] = useState([
    81.05078857408955, 16.699433706595414,
  ]);
  const [service, setService] = useState(null);
  const [alternateName, setAlternateName] = useState(null);
  const [encodedData, setEncodedData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const attemptCountRef = useRef(0);
  // New States for Modals
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] =
    useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    if (
      encodedData &&
      encodedData !== 'No workers found within 2 km radius' &&
      encodedData !== 'No user found or no worker matches subservices' &&
      encodedData !== 'No Firestore location data for these workers' &&
      encodedData !== 'No workers match the requested subservices'
    ) {
      try {
        const decoded = Buffer.from(encodedData, 'base64').toString('utf-8');
        setDecodedId(decoded);
      } catch (error) {
        console.error('Error decoding Base64:', error);
      }
    }
  }, [encodedData]);

  useEffect(() => {
    console.log('screnn params', route.params);
    const {
      area,
      city,
      pincode,
      alternateName,
      alternatePhoneNumber,
      serviceBooked,
      location,
      discount,
    } = route.params;
    console.log('user waiting params', route.params);
    setCity(city);
    setArea(area);
    setPincode(pincode);
    setAlternatePhoneNumber(alternatePhoneNumber);
    setAlternateName(alternateName);
    setService(serviceBooked);
    setLocation(location);
    setDiscount(discount);
  }, []);

  const fetchData = async () => {
    const {
      area,
      city,
      pincode,
      alternateName,
      alternatePhoneNumber,
      serviceBooked,
      location,
      discount,
    } = route.params;
    setCity(city);
    setArea(area);
    setPincode(pincode);
    setAlternatePhoneNumber(alternatePhoneNumber);
    setAlternateName(alternateName);
    setService(serviceBooked);
    setLocation(location);
    setDiscount(discount);

    try {
      const jwtToken = await EncryptedStorage.getItem('cs_token');
      if (!jwtToken) {
        // Alert.alert('Error', 'No token found');
        return;
      }

      const response = await axios.post(
        `https://backend.clicksolver.com/api/workers-nearby`,
        {
          area,
          city,
          pincode,
          alternateName,
          alternatePhoneNumber,
          serviceBooked,
          discount,
        },
        {headers: {Authorization: `Bearer ${jwtToken}`}},
      );

      if (response.status === 200) {
        const encode = response.data;
        setEncodedData(encode);
        console.log('res', response.data);
        console.log(encode);
        if (
          encode &&
          encode !== 'No workers found within 2 km radius' &&
          encode !== 'No user found or no worker matches subservices' &&
          encode !== 'No Firestore location data for these workers' &&
          encode !== 'No workers match the requested subservices'
        ) {
          await axios.post(
            `https://backend.clicksolver.com/api/user/action`,
            {
              encodedId: encode,
              screen: 'userwaiting',
              serviceBooked,
              area,
              city,
              pincode,
              alternateName,
              alternatePhoneNumber,
              location,
              discount,
            },
            {headers: {Authorization: `Bearer ${jwtToken}`}},
          );
        }
      } else {
        // Alert.alert('Error', 'Unexpected response status');
      }
    } catch (error) {
      console.error('Error fetching nearby workers:', error);
      // Alert.alert('Error', 'Failed to fetch nearby workers');
    }
  };

  useEffect(() => {
    const {encodedId} = route.params;
    if (
      encodedId &&
      encodedData !== 'No workers found within 2 km radius' &&
      encodedData !== 'No user found or no worker matches subservices' &&
      encodedData !== 'No Firestore location data for these workers' &&
      encodedData !== 'No workers match the requested subservices'
    ) {
      setEncodedData(encodedId);
      try {
        const decoded = Buffer.from(encodedId, 'base64').toString('utf-8');
        setDecodedId(decoded);
      } catch (error) {
        console.error('Error decoding Base64:', error);
      }
    } else {
      fetchData();
    }
  }, [route.params]);

  // const handleManualCancel = async () => {
  //   try {
  //     if (decodedId) {
  //       await axios.post(
  //         `https://backend.clicksolver.com/api/user/cancellation`,
  //         {
  //           user_notification_id: decodedId,
  //         },
  //       );

  //       const cs_token = await EncryptedStorage.getItem('cs_token');
  //       await axios.post(
  //         `https://backend.clicksolver.com/api/user/action/cancel`,
  //         {encodedId: encodedData, screen: 'userwaiting'},
  //         {headers: {Authorization: `Bearer ${cs_token}`}},
  //       );
  //     }

  //     navigation.dispatch(
  //       CommonActions.reset({
  //         index: 0,
  //         routes: [{name: 'Tabs', state: {routes: [{name: 'Home'}]}}],
  //       }),
  //     );
  //   } catch (error) {
  //     console.error('Error calling cancellation API:', error);
  //     setCancelMessage('Cancel timed out');
  //     setTimeout(() => setCancelMessage(''), 3000);
  //     navigation.dispatch(
  //       CommonActions.reset({
  //         index: 0,
  //         routes: [{name: 'Tabs', state: {routes: [{name: 'Home'}]}}],
  //       }),
  //     );
  //   }
  // };

  // Updated handleManualCancel to open the first modal
  const handleManualCancel = () => {
    setModalVisible(true);
  };

  // New handler to perform cancellation after confirmation
  const handleCancelBooking = async () => {
    setConfirmationModalVisible(false);
    try {
      if (decodedId) {
        await axios.post(
          `https://backend.clicksolver.com/api/user/cancellation`,
          {
            user_notification_id: decodedId,
            cancellation_reason: selectedReason, // Optionally send the reason
          },
        );

        const cs_token = await EncryptedStorage.getItem('cs_token');
        await axios.post(
          `https://backend.clicksolver.com/api/user/action/cancel`,
          {encodedId: encodedData, screen: 'userwaiting'},
          {headers: {Authorization: `Bearer ${cs_token}`}},
        );
      }

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{name: 'Tabs', state: {routes: [{name: 'Home'}]}}],
        }),
      );
    } catch (error) {
      console.error('Error calling cancellation API:', error);
      setCancelMessage('Cancel timed out');
      setTimeout(() => setCancelMessage(''), 3000);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{name: 'Tabs', state: {routes: [{name: 'Home'}]}}],
        }),
      );
    }
  };

  // New handler to open confirmation modal after selecting a reason
  const handleSelectReason = reason => {
    setSelectedReason(reason);
    setModalVisible(false);
    setConfirmationModalVisible(true);
  };

  const handleCancelAndRetry = async () => {
    attemptCountRef.current += 1;

    if (attemptCountRef.current > 3) {
      // Alert.alert(
      //   'No workers found',
      //   'Unable to find workers after 3 attempts. Please try again later.',
      // );
      await axios.post(
        `https://backend.clicksolver.com/api/user/cancellation`,
        {
          user_notification_id: decodedId,
        },
      );
      const cs_token = await EncryptedStorage.getItem('cs_token');
      await axios.post(
        `https://backend.clicksolver.com/api/user/action/cancel`,
        {encodedId: encodedData, screen: 'userwaiting'},
        {headers: {Authorization: `Bearer ${cs_token}`}},
      );

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{name: 'Tabs', state: {routes: [{name: 'Home'}]}}],
        }),
      );
      return;
    }

    if (decodedId) {
      try {
        await axios.post(
          `https://backend.clicksolver.com/api/user/cancellation`,
          {
            user_notification_id: decodedId,
          },
        );
      } catch (error) {
        console.error('Error cancelling previous request:', error);
      }
    }

    const cs_token = await EncryptedStorage.getItem('cs_token');
    await axios.post(
      `https://backend.clicksolver.com/api/user/action/cancel`,
      {encodedId: encodedData, screen: 'userwaiting'},
      {headers: {Authorization: `Bearer ${cs_token}`}},
    );

    await fetchData();
  };

  useEffect(() => {
    let intervalId;
    if (
      decodedId ||
      encodedData === 'No workers found within 2 km radius' ||
      encodedData !== 'No user found or no worker matches subservices' ||
      encodedData !== 'No Firestore location data for these workers' ||
      encodedData !== 'No workers match the requested subservices'
    ) {
      intervalId = setInterval(handleCancelAndRetry, 120000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [decodedId, encodedData]);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await axios.get(
          `https://backend.clicksolver.com/api/checking/status`,
          {
            params: {user_notification_id: decodedId},
          },
        );

        console.log('API Response:', response.data);

        const {status, notification_id} = response.data;

        // Update type checks to accommodate number type for notification_id
        if (typeof status !== 'string' || typeof notification_id !== 'number') {
          throw new TypeError('Unexpected type in API response');
        }

        if (status === 'accept') {
          setStatus('accepted');
          // Convert notification_id to a string if needed
          const encodedNotificationId = Buffer.from(
            notification_id.toString(),
            'utf-8',
          ).toString('base64');
          const cs_token = await EncryptedStorage.getItem('cs_token');

          await axios.post(
            `https://backend.clicksolver.com/api/user/action/cancel`,
            {encodedId: encodedData, screen: 'userwaiting'},
            {headers: {Authorization: `Bearer ${cs_token}`}},
          );

          await axios.post(
            `https://backend.clicksolver.com/api/user/action`,
            {
              encodedId: encodedNotificationId,
              screen: 'UserNavigation',
              serviceBooked: service,
            },
            {headers: {Authorization: `Bearer ${cs_token}`}},
          );

          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {
                  name: 'UserNavigation',
                  params: {encodedId: encodedNotificationId, service: service},
                },
              ],
            }),
          );
        }
      } catch (error) {
        console.error('Error checking status:', error);
      }
    };

    if (
      decodedId &&
      decodedId !== 'No workersverified found within 2 km radius'
    ) {
      console.log(decodedId);
      // const intervalId = setInterval(checkStatus, 3000);
      // return () => clearInterval(intervalId);
      checkStatus();
    }
  }, [decodedId, navigation]);

  // useFocusEffect(
  //   React.useCallback(() => {
  //     const onBackPress = () => {
  //       // Alert.alert('Cancel', 'Are you sure you want to cancel?', [
  //       //   {text: 'No', style: 'cancel'},
  //       //   {text: 'Yes', onPress: handleManualCancel},
  //       // ]);
  //       navigation.dispatch(
  //         CommonActions.reset({
  //           index: 0,
  //           routes: [{name: 'Tabs', state: {routes: [{name: 'Home'}]}}],
  //         }),
  //       );
  //       return true;
  //     };

  //     BackHandler.addEventListener('hardwareBackPress', onBackPress);
  //     return () =>
  //       BackHandler.removeEventListener('hardwareBackPress', onBackPress);
  //   }, [navigation]),
  // );

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Open the cancellation modal instead of directly navigating home
        setModalVisible(true);
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation]),
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        // Retrieve the stored time from EncryptedStorage
        const storedTime = await EncryptedStorage.getItem(
          `estimatedTime${service}`,
        );
        console.log('Stored Time:', storedTime);

        // If no stored time, set it to current time in milliseconds
        if (!storedTime) {
          const currentTime = Date.now(); // in milliseconds
          await EncryptedStorage.setItem(
            `estimatedTime${service}`,
            currentTime.toString(),
          );
          setTimeLeft(600); // Set timer to 10 minutes (600 seconds)
        } else {
          // Convert stored time to integer (milliseconds)
          const savedTime = parseInt(storedTime, 10);
          const currentTime = Date.now(); // Current time in milliseconds

          // Calculate time difference in seconds
          const timeDifference = Math.floor((currentTime - savedTime) / 1000);

          // Calculate remaining time, ensuring it's non-negative
          const remainingTime = 600 - timeDifference; // 10 minutes = 600 seconds
          setTimeLeft(remainingTime > 0 ? remainingTime : 0);
        }
      } catch (error) {
        console.error('Error loading data from EncryptedStorage:', error);
      }
    };

    loadData();

    const interval = setInterval(() => {
      setTimeLeft(prevTime => (prevTime > 0 ? prevTime - 1 : 0)); // Countdown
    }, 1000); // Update every second

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  // Format time into MM:SS
  const formatTime = seconds => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(
      remainingSeconds,
    ).padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Map View Section */}
      <Mapbox.MapView style={styles.map}>
        {/* Map camera, centered on the user's location */}
        <Mapbox.Camera zoomLevel={16} centerCoordinate={location} />

        {/* Center Marker on the Map */}
        <Mapbox.MarkerView coordinate={location}>
          <Image
            source={{
              uri: 'https://i.postimg.cc/ZRdQkj5d/Screenshot-2024-11-13-164652-removebg-preview.png',
            }} // Marker image URL
            style={styles.markerImage}
          />
        </Mapbox.MarkerView>
      </Mapbox.MapView>

      {/* Message Box Section */}
      <View style={styles.messageBox}>
        {/* Button Placeholder */}
        <View style={styles.innerButton}>
          <View style={styles.addingMessageBox} />
        </View>

        {/* Text Section */}
        <View style={styles.textContainer}>
          <View style={styles.detailsContainer}>
            {/* Searching Text */}
            <View style={styles.rowAlignment}>
              <Text style={styles.searchingText}>
                Looking best commander for you
              </Text>
            </View>

            {/* Service Details */}
            <View style={styles.rowSpaceAlignment}>
              <View style={styles.rowAlignment}>
                {/* Service Name */}
                <Text style={styles.serviceName}>Service Booked</Text>
              </View>

              {/* Cancel Button */}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleManualCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Horizontal Divider */}
        <View style={styles.horizontalLine} />

        {/* Loading Animation */}
        <View style={styles.loadingContainer}>
          {loading && (
            <LottieView
              source={require('../assets/waitingLoading.json')}
              autoPlay
              loop
              style={styles.loadingAnimation}
            />
          )}
        </View>
      </View>
      {/* Modal for Cancellation Reasons */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            onPress={() => setModalVisible(false)}
            style={styles.backButtonContainer}>
            <AntDesign name="arrowleft" size={20} color="black" />
          </TouchableOpacity>

          <View style={styles.modalContainer}>
            {/* Title and Subtitle */}
            <Text style={styles.modalTitle}>
              What is the reason for your cancellation?
            </Text>
            <Text style={styles.modalSubtitle}>
              Could you let us know why you're canceling?
            </Text>

            {/* Cancellation Reasons */}
            <TouchableOpacity
              style={styles.reasonButton}
              onPress={() => handleSelectReason('Found a better price')}>
              <Text style={styles.reasonText}>Found a better price</Text>
              <AntDesign name="right" size={16} color="#4a4a4a" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reasonButton}
              onPress={() => handleSelectReason('Wrong work location')}>
              <Text style={styles.reasonText}>Wrong work location</Text>
              <AntDesign name="right" size={16} color="#4a4a4a" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reasonButton}
              onPress={() => handleSelectReason('Wrong service booked')}>
              <Text style={styles.reasonText}>Wrong service booked</Text>
              <AntDesign name="right" size={16} color="#4a4a4a" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reasonButton}
              onPress={() =>
                handleSelectReason('More time to assign a commander')
              }>
              <Text style={styles.reasonText}>
                More time to assign a commander
              </Text>
              <AntDesign name="right" size={16} color="#4a4a4a" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reasonButton}
              onPress={() => handleSelectReason('Others')}>
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
        onRequestClose={() => setConfirmationModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.crossContainer}>
            <TouchableOpacity
              onPress={() => setConfirmationModalVisible(false)}
              style={styles.backButtonContainer}>
              <Entypo name="cross" size={20} color="black" />
            </TouchableOpacity>
          </View>

          <View style={styles.confirmationModalContainer}>
            <Text style={styles.confirmationTitle}>
              Are you sure you want to cancel this Service?
            </Text>
            <Text style={styles.confirmationSubtitle}>
              Please avoid canceling – we’re working to connect you with the
              best expert to solve your problem.
            </Text>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleCancelBooking}>
              <Text style={styles.confirmButtonText}>Cancel my service</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: 'center',
    // alignItems: 'center',
    backgroundColor: 'f5f5f5',
  },
  locationHeadDetails: {
    color: '#121212',
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 16,
  },
  rowAlignment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  serviceName: {
    color: '#1D2951',
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 18,
  },
  searchingText: {
    color: '#212121',
    fontSize: 14,
    fontFamily: 'RobotoSlab-Regular',
  },
  horizontalLine: {
    width: Dimensions.get('window').width,
    height: 1, // Height of the line
    backgroundColor: '#E5E7EB', // Color of the line,

    height: 5,
  },
  locationDetails: {
    paddingLeft: 10,
  },
  textContainer: {
    padding: 15,
  },
  pinImg: {
    height: 15,
    width: 15,
  },
  cancelButtonText: {
    textAlign: 'center',
    color: '#9e9e9e',
    fontFamily: 'RobotoSlab-Medium',
  },
  cancelButton: {
    padding: 7,
    borderWidth: 0.5,
    borderColor: '#CEDEEB',
    width: 90,
    borderRadius: 20,
  },
  innerButton: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  rowSpaceAlignment: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  addingMessageBox: {
    width: 60,
    height: 4,
    backgroundColor: '#E5E7EB',
    marginTop: 10,
    borderRadius: 10,
  },
  detailsContainer: {
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
  },
  messageBox: {
    position: 'absolute',
    bottom: 0, // Aligns it at the bottom
    height: '44%', // 40% of the screen height
    width: '100%', // Full width of the screen
    backgroundColor: '#f8f8f8',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
    display: 'flex',
    flexDirection: 'column',
  },
  messageText: {
    fontSize: 18,
    color: '#333',
    fontFamily: 'RobotoSlab-Medium',
  },
  map: {
    height: '60%',
  },
  markerImage: {
    width: 25, // Adjust size as needed
    height: 50, // Adjust size as needed
    resizeMode: 'contain',
  },
  locationSubContainer: {
    backgroundColor: '#d4d6d8',
    padding: 20,
    marginTop: 10,
    borderRadius: 10,
  },
  locationHead: {
    color: '#68707C',
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '500',
  },
  locationIconContainer: {
    flexDirection: 'row',
    alignItems: 'center', // Center items vertically
  },
  locationInfoIconContainer: {
    flexDirection: 'row',
  },
  addressHeading: {
    color: 'rgb(75, 85, 99)',
  },
  locationMainContainer: {
    backgroundColor: '#e9e9e6',
    padding: 20,
    width: '100%',
    borderRadius: 10,
    marginTop: 15,
    marginBottom: 10,
  },
  waitingText: {
    backgroundColor: '#EFF6FF',
    padding: 10,
    marginTop: 20,
  },
  waitingDetailsContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  timer: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'rgb(59, 130, 246)',
    marginBottom: 10,
  },
  loadingContainer: {
    // width: Dimensions.get('window').width, // Set width to screen width
    marginHorizontal: 'auto',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    height: '100%',
  },
  estimatedTimeText: {
    color: '#333333',
    fontSize: 18,
    fontWeight: '600',
    // color: 'rgb(59, 130, 246)'
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'Roboto',
    marginBottom: 15,
    color: '#000',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
    color: '#888',
  },
  loadingAnimation: {
    width: 130,
    height: 130,
    marginBottom: 20,
  },
  buttonContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  greet: {
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'center',
    color: 'rgb(30, 64, 175)',
    marginLeft: 10,
  },
  button: {
    backgroundColor: '#FF6347',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginTop: 10,
    fontSize: 14,
  },
  // Modal Styles (same as in Navigation component)
  backButtonContainer: {
    width: 40,
    height: 40,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center', // Distance from the left side of the screen
    backgroundColor: 'white', // Background color for the circular container
    borderRadius: 50, // Rounds the container to make it circular
    // Padding to make the icon container larger
    elevation: 5, // Elevation for shadow effect (Android)
    shadowColor: '#000', // Shadow color (iOS)
    shadowOffset: {width: 0, height: 2}, // Shadow offset (iOS)
    shadowOpacity: 0.2, // Shadow opacity (iOS)
    shadowRadius: 4, // Shadow radius (iOS)
    zIndex: 1,
    marginHorizontal: 10, // Ensures the icon is above other elements,
    marginBottom: 5,
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
  modalTitle: {
    fontSize: 18,
    fontFamily: 'RobotoSlab-Medium',
    textAlign: 'center',
    marginBottom: 5,
    color: '#000',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
    fontFamily: 'RobotoSlab-Regular',
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
    fontFamily: 'RobotoSlab-Regular',
  },
  crossContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 10,
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
    fontFamily: 'RobotoSlab-Medium',
    textAlign: 'center',
    paddingBottom: 10,
    marginBottom: 5,
    color: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  confirmationSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    paddingTop: 10,
    fontFamily: 'RobotoSlab-Regular',
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
    fontFamily: 'RobotoSlab-Medium',
  },
});

export default WaitingUser;
