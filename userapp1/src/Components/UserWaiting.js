import React, {useEffect, useState, useRef, useCallback} from 'react';
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
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import messaging from '@react-native-firebase/messaging';
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
import Entypo from 'react-native-vector-icons/Entypo';
import AntDesign from 'react-native-vector-icons/AntDesign';
// Import the theme hook
import {useTheme} from '../context/ThemeContext';

Mapbox.setAccessToken(
  'pk.eyJ1IjoieWFzd2FudGh2YW5hbWEiLCJhIjoiY20ybTMxdGh3MGZ6YTJxc2Zyd2twaWp2ZCJ9.uG0mVTipkeGVwKR49iJTbw',
);

const WaitingUser = () => {
  const {isDarkMode} = useTheme();
  const styles = dynamicStyles(isDarkMode);

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
  const [location, setLocation] = useState([81.05078857408955, 16.699433706595414]);
  const [service, setService] = useState(null);
  const [alternateName, setAlternateName] = useState(null);
  const [encodedData, setEncodedData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const attemptCountRef = useRef(0);
  // New States for Modals
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [discount, setDiscount] = useState(0);
  const [tipAmount, setTipAmount] = useState(0);
  // New state to handle backend operations loading
  const [backendLoading, setBackendLoading] = useState(false);

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
    console.log('screen params', route.params);
    const {
      area, 
      city,
      pincode, 
      alternateName,
      alternatePhoneNumber,
      serviceBooked,
      location,
      discount,
      tipAmount
    } = route.params;
    setCity(city);
    setArea(area); 
    setPincode(pincode);
    setAlternatePhoneNumber(alternatePhoneNumber);
    setAlternateName(alternateName);
    setService(serviceBooked);
    setLocation(location);
    setDiscount(discount);
    setTipAmount(tipAmount);
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
      tipAmount 
    } = route.params;
    setCity(city);  
    setArea(area); 
    setPincode(pincode);   
    setAlternatePhoneNumber(alternatePhoneNumber);
    setAlternateName(alternateName);
    setService(serviceBooked);    
    setLocation(location);  
    setDiscount(discount);  
    setTipAmount(tipAmount);  
    setBackendLoading(true); 
    try {
      const jwtToken = await EncryptedStorage.getItem('cs_token');
      if (!jwtToken) { 
        return;
      }
      console.log("tip", tipAmount);
      const response = await axios.post(
        `http://192.168.55.106:5000/api/workers-nearby`,
        {   
          area,
          city, 
          pincode, 
          alternateName,      
          alternatePhoneNumber,
          serviceBooked,
          discount,
          tipAmount
        },
        {headers: {Authorization: `Bearer ${jwtToken}`}},
      );

      if (response.status === 200) {
        const encode = response.data; 
        setEncodedData(encode);
        console.log('res', response.data);
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
              tipAmount
            },
            {headers: {Authorization: `Bearer ${jwtToken}`}},
          );
        }
      }
    } catch (error) {
      console.error('Error fetching nearby workers:', error);
    } finally {
      setBackendLoading(false);
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

  // Open the cancellation modal
  const handleManualCancel = () => {
    setModalVisible(true);
  };

  // Handler to perform cancellation after confirmation 
  const handleCancelBooking = async () => {
    setConfirmationModalVisible(false);
    setBackendLoading(true);
    try {
      if (decodedId) {
        await axios.post(
          `https://backend.clicksolver.com/api/user/cancellation`,
          {
            user_notification_id: decodedId,
            cancellation_reason: selectedReason,
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
    } finally {
      setBackendLoading(false);
    }
  };

  // Open confirmation modal after selecting a reason
  const handleSelectReason = reason => {
    setSelectedReason(reason);
    setModalVisible(false);
    setConfirmationModalVisible(true);
  };

  const handleCancelAndRetry = async () => {
    setBackendLoading(true);
    try {
      attemptCountRef.current += 1;

      if (attemptCountRef.current > 3) {
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
    } catch (error) {
      console.error('Error in cancel and retry:', error);
    } finally {
      setBackendLoading(false);
    }
  };

  // Inside your WaitingUser component (or similar)
  useEffect(() => {
  // Function to handle notification data
  const handleNotificationData = (data) => {
    if (data && data.notification_id && decodedId) {
      // Compare notification_id (as string) with your decodedId
      if (data.notification_id.toString() === decodedId) {
        const encodedNotificationId = Buffer.from(
          data.notification_id.toString(),
          'utf-8'
        ).toString('base64');

        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: data.screen, // the target screen from notification data
                params: { encodedId: encodedNotificationId, service: service },
              },
            ],
          })
        );
      }
    }
  };

  // 1. Check if the app was opened from a quit state by a notification
  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage && remoteMessage.data) {
        console.log('App opened from quit state by notification:', remoteMessage);
        handleNotificationData(remoteMessage.data);
      }
    });

  // 2. Listener for foreground messages
  const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
    if (remoteMessage && remoteMessage.data) {
      console.log('Foreground notification received:', remoteMessage);
      handleNotificationData(remoteMessage.data);
    }
  });

  // 3. Listener for when the app is in background and the user taps the notification
  const unsubscribeOnNotificationOpened = messaging().onNotificationOpenedApp(remoteMessage => {
    if (remoteMessage && remoteMessage.data) {
      console.log('Notification opened from background:', remoteMessage);
      handleNotificationData(remoteMessage.data);
    }
  });

  // Clean up the listeners on unmount
  return () => {
    unsubscribeOnMessage();
    unsubscribeOnNotificationOpened();
  };
}, [decodedId, navigation, service]);

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

  useFocusEffect(
    useCallback(() => {
      let intervalId;
  
      const checkStatus = async () => {
        setBackendLoading(true);
        try {
          const response = await axios.get(
            `https://backend.clicksolver.com/api/checking/status`,
            {
              params: { user_notification_id: decodedId },
              validateStatus: (status) => status === 200 || status === 201,
            }
          );
  
          console.log('API Response:', response.status);
  
          // If status code is 201: accepted
          if (response.status === 201) {
            setStatus('accepted');
  
            const { notification_id } = response.data;
            if (typeof notification_id !== 'number') {
              throw new TypeError('Unexpected type for notification_id in API response');
            }
            const encodedNotificationId = Buffer.from(notification_id.toString(), 'utf-8').toString('base64');
            const cs_token = await EncryptedStorage.getItem('cs_token');
  
            // Cancel the previous waiting action
            await axios.post(
              `https://backend.clicksolver.com/api/user/action/cancel`,
              { encodedId: encodedData, screen: 'userwaiting' },
              { headers: { Authorization: `Bearer ${cs_token}` } }
            );
  
            // Proceed with the accepted action
            await axios.post(
              `https://backend.clicksolver.com/api/user/action`,
              {
                encodedId: encodedNotificationId,
                screen: 'UserNavigation',
                serviceBooked: service,
              },
              { headers: { Authorization: `Bearer ${cs_token}` } }
            );
  
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [
                  {
                    name: 'UserNavigation',
                    params: { encodedId: encodedNotificationId, service: service },
                  },
                ],
              })
            );
          } else if (response.status === 200) {
            // 200 means still waiting
            setStatus('waiting');
          }
        } catch (error) {
          console.error('Error checking status:', error);
        } finally {
          setBackendLoading(false);
        }
      };
  
      if (
        decodedId &&
        decodedId !== 'No workersverified found within 2 km radius'
      ) {
        console.log("Decoded ID when screen focused:", decodedId);
        checkStatus(); // Initial call when screen is focused
  
        // Set interval to call checkStatus every 1m50s (110,000ms)
        intervalId = setInterval(() => {
          console.log("Checking status again...");
          checkStatus();
        }, 110000);
      }
  
      // Cleanup function to clear interval when screen loses focus
      return () => {
        if (intervalId) {
          clearInterval(intervalId);
          console.log("Interval cleared as screen lost focus.");
        }
      };
    }, [decodedId, navigation]) // Dependencies for re-execution when focused
  );

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
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
        const storedTime = await EncryptedStorage.getItem(
          `estimatedTime${service}`,
        );
        console.log('Stored Time:', storedTime);

        if (!storedTime) {
          const currentTime = Date.now();
          await EncryptedStorage.setItem(
            `estimatedTime${service}`,
            currentTime.toString(),
          );
          setTimeLeft(600);
        } else {
          const savedTime = parseInt(storedTime, 10);
          const currentTime = Date.now();
          const timeDifference = Math.floor((currentTime - savedTime) / 1000);
          const remainingTime = 600 - timeDifference;
          setTimeLeft(remainingTime > 0 ? remainingTime : 0);
        }
      } catch (error) {
        console.error('Error loading data from EncryptedStorage:', error);
      }
    };

    loadData();

    const interval = setInterval(() => {
      setTimeLeft(prevTime => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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
        <Mapbox.Camera zoomLevel={16} centerCoordinate={location} />
        <Mapbox.MarkerView coordinate={location}>
          <Image
            source={{
              uri: 'https://i.postimg.cc/ZRdQkj5d/Screenshot-2024-11-13-164652-removebg-preview.png',
            }}
            style={styles.markerImage}
          />
        </Mapbox.MarkerView>
      </Mapbox.MapView>

      {/* Message Box Section */}
      <View style={styles.messageBox}>
        <View style={styles.innerButton}>
          <View style={styles.addingMessageBox} />
        </View>
        <View style={styles.textContainer}>
          <View style={styles.detailsContainer}>
            <View style={styles.rowAlignment}>
              <Text style={styles.searchingText}>
                Looking best commander for you
              </Text>
            </View>
            <View style={styles.rowSpaceAlignment}>
              <View style={styles.rowAlignment}>
                <Text style={styles.serviceName}>Service Booked</Text>
              </View>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleManualCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={styles.horizontalLine} />
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

      {backendLoading && (
        <View style={styles.activityIndicatorOverlay}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}

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
            <AntDesign name="arrowleft" size={20} color={isDarkMode ? '#fff' : 'black'} />
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
              onPress={() => handleSelectReason('Found a better price')}>
              <Text style={styles.reasonText}>Found a better price</Text>
              <AntDesign name="right" size={16} color={isDarkMode ? '#fff' : '#4a4a4a'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reasonButton}
              onPress={() => handleSelectReason('Wrong work location')}>
              <Text style={styles.reasonText}>Wrong work location</Text>
              <AntDesign name="right" size={16} color={isDarkMode ? '#fff' : '#4a4a4a'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reasonButton}
              onPress={() => handleSelectReason('Wrong service booked')}>
              <Text style={styles.reasonText}>Wrong service booked</Text>
              <AntDesign name="right" size={16} color={isDarkMode ? '#fff' : '#4a4a4a'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reasonButton}
              onPress={() =>
                handleSelectReason('More time to assign a commander')
              }>
              <Text style={styles.reasonText}>More time to assign a commander</Text>
              <AntDesign name="right" size={16} color={isDarkMode ? '#fff' : '#4a4a4a'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reasonButton}
              onPress={() => handleSelectReason('Others')}>
              <Text style={styles.reasonText}>Others</Text>
              <AntDesign name="right" size={16} color={isDarkMode ? '#fff' : '#4a4a4a'} />
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
              <Entypo name="cross" size={20} color={isDarkMode ? '#fff' : 'black'} />
            </TouchableOpacity>
          </View>
          <View style={styles.confirmationModalContainer}>
            <Text style={styles.confirmationTitle}>
              Are you sure you want to cancel this Service?
            </Text>
            <Text style={styles.confirmationSubtitle}>
              Please avoid canceling – we’re working to connect you with the best expert to solve your problem.
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

function dynamicStyles(isDarkMode) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#f5f5f5',
    },
    locationHeadDetails: {
      color: isDarkMode ? '#fff' : '#121212',
      fontFamily: 'RobotoSlab-Medium',
      fontSize: 16,
    },
    rowAlignment: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    serviceName: {
      color: isDarkMode ? '#fff' : '#1D2951',
      fontFamily: 'RobotoSlab-Medium',
      fontSize: 18,
    },
    searchingText: {
      color: isDarkMode ? '#eee' : '#212121',
      fontSize: 14,
      fontFamily: 'RobotoSlab-Regular',
    },
    horizontalLine: {
      width: Dimensions.get('window').width,
      height: 5,
      backgroundColor: isDarkMode ? '#333' : '#E5E7EB',
    },
    textContainer: {
      padding: 15,
    },
    cancelButtonText: {
      textAlign: 'center',
      color: isDarkMode ? '#ccc' : '#9e9e9e',
      fontFamily: 'RobotoSlab-Medium',
    },
    cancelButton: {
      padding: 7,
      borderWidth: 0.5,
      borderColor: isDarkMode ? '#444' : '#CEDEEB',
      width: 90,
      borderRadius: 20,
    },
    innerButton: {
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
      backgroundColor: isDarkMode ? '#444' : '#E5E7EB',
      marginTop: 10,
      borderRadius: 10,
    },
    detailsContainer: {
      padding: 10,
      flexDirection: 'column',
    },
    messageBox: {
      position: 'absolute',
      bottom: 0,
      height: '44%',
      width: '100%',
      backgroundColor: isDarkMode ? '#333' : '#f8f8f8',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.8,
      shadowRadius: 2,
      elevation: 5,
      flexDirection: 'column',
    },
    map: {
      height: '60%',
    },
    markerImage: {
      width: 25,
      height: 50,
      resizeMode: 'contain',
    },
    locationSubContainer: {
      backgroundColor: isDarkMode ? '#444' : '#d4d6d8',
      padding: 20,
      marginTop: 10,
      borderRadius: 10,
    },
    locationHead: {
      color: isDarkMode ? '#aaa' : '#68707C',
      marginLeft: 10,
      fontSize: 15,
      fontWeight: '500',
    },
    locationIconContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    locationInfoIconContainer: {
      flexDirection: 'row',
    },
    addressHeading: {
      color: isDarkMode ? '#ccc' : 'rgb(75, 85, 99)',
    },
    locationMainContainer: {
      backgroundColor: isDarkMode ? '#333' : '#e9e9e6',
      padding: 20,
      width: '100%',
      borderRadius: 10,
      marginTop: 15,
      marginBottom: 10,
    },
    waitingText: {
      backgroundColor: isDarkMode ? '#444' : '#EFF6FF',
      padding: 10,
      marginTop: 20,
    },
    waitingDetailsContainer: {
      alignItems: 'center',
    },
    timer: {
      fontSize: 30,
      fontWeight: 'bold',
      color: 'rgb(59, 130, 246)',
      marginBottom: 10,
    },
    loadingContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 20,
      height: '100%',
    },
    estimatedTimeText: {
      color: isDarkMode ? '#fff' : '#333333',
      fontSize: 18,
      fontWeight: '600',
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      fontFamily: 'Roboto',
      marginBottom: 15,
      color: isDarkMode ? '#fff' : '#000',
    },
    subtitle: {
      fontSize: 18,
      marginBottom: 20,
      color: isDarkMode ? '#aaa' : '#888',
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
      color: isDarkMode ? '#fff' : 'rgb(30, 64, 175)',
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
    backButtonContainer: {
      width: 40,
      height: 40,
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
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: isDarkMode ? '#333' : 'white',
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
      color: isDarkMode ? '#fff' : '#000',
    },
    modalSubtitle: {
      fontSize: 14,
      color: isDarkMode ? '#ccc' : '#666',
      textAlign: 'center',
      marginBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#555' : '#eee',
      paddingBottom: 10,
      fontFamily: 'RobotoSlab-Regular',
    },
    reasonButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#555' : '#eee',
    },
    reasonText: {
      fontSize: 16,
      color: isDarkMode ? '#fff' : '#333',
      fontFamily: 'RobotoSlab-Regular',
    },
    crossContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      padding: 10,
    },
    confirmationModalContainer: {
      backgroundColor: isDarkMode ? '#333' : 'white',
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
      color: isDarkMode ? '#fff' : '#000',
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#555' : '#eee',
    },
    confirmationSubtitle: {
      fontSize: 14,
      color: isDarkMode ? '#ccc' : '#666',
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
    activityIndicatorOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
  });
}

export default WaitingUser;
