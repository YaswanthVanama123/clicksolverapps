import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  BackHandler,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LottieView from 'lottie-react-native';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import EncryptedStorage from 'react-native-encrypted-storage';
import {
  useNavigation,
  useRoute,
  CommonActions,
  useFocusEffect,
} from '@react-navigation/native';
import axios from 'axios';

const ServiceInProgressScreen = () => {
  const [details, setDetails] = useState({});
  const [serviceArray, setServiceArray] = useState([]);
  const [decodedId, setDecodedId] = useState(null);

  const route = useRoute();
  // const { encodedId } = route.params;
  const encodedId = 'MTQ0OA==';
  const navigation = useNavigation();

  useEffect(() => {
    if (encodedId) {
      setDecodedId(atob(encodedId));
    }
  }, [encodedId]);

  const handleCheck = useCallback(async () => {
    try {
      // First API call to check the status
      const response = await axios.post(
        `${process.env.BACKENDAIPE}/api/task/confirm/status`,
        {
          notification_id: decodedId,
        },
      );

      if (response.status === 20) {
        const cs_token = await EncryptedStorage.getItem('cs_token');

        // Proceed if `cs_token` exists
        if (cs_token) {
          await axios.post(
            `${process.env.BACKENDAIPE}/api/user/action`,
            {
              encodedId: encodedId,
              screen: 'Paymentscreen',
            },
            {
              headers: {
                Authorization: `Bearer ${cs_token}`,
              },
            },
          );

          // Reset navigation to Paymentscreen
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{name: 'Paymentscreen', params: {encodedId: encodedId}}],
            }),
          );
        } else {
          console.error('Token is missing');
        }
      }
    } catch (error) {
      console.error('Error checking status:', error);
    }
  }, [decodedId, encodedId, navigation]);

  useEffect(() => {
    handleCheck();
  }, [decodedId, encodedId]);

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

  const handleCompleteClick = async () => {
    if (decodedId) {
      try {
        const response = await axios.post(
          `${process.env.BACKENDAIPE}/api/work/time/completed/request`,
          {
            notification_id: decodedId,
          },
        );

        if (response.status === 200) {
          setShowMessage(true);
          await EncryptedStorage.setItem('messageBox', JSON.stringify(true));
          setTimeLeft(60);
          setIsWaiting(true);
        }
      } catch (error) {
        console.error('Error completing work:', error);
      }
    }
  };

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await axios.post(
          `${process.env.BACKENDAIPE}/api/user/work/progress/details`,
          {
            decodedId,
          },
        );
        const data = response.data[0];
        setDetails(data);

        setServiceArray(data.service_booked);
        // console.log(data.service_booked)
      } catch (error) {
        console.error('Error fetching bookings data:', error);
      }
    };
    if (decodedId) {
      console.log(decodedId);
      fetchBookings();
    }
  }, [decodedId]);

  const formatDate = created_at => {
    const date = new Date(created_at);
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return `${monthNames[date.getMonth()]} ${String(date.getDate()).padStart(
      2,
      '0',
    )}, ${date.getFullYear()}`;
  };

  return (
    <View style={styles.mainCOntainer}>
      <View style={styles.headerContainer}>
        <FontAwesome6
          name="arrow-left-long"
          size={20}
          color="#212121"
          style={styles.leftIcon}
        />
        <Text style={styles.headerText}>Service In Progress</Text>
      </View>
      <ScrollView style={styles.container}>
        <View style={styles.profileContainer}>
          <View style={styles.technicianContainer}>
            <Image
              source={{
                uri: 'https://i.postimg.cc/mZnDzdqJ/IMG-20240929-WA0024.jpg',
              }}
              style={styles.technicianImage}
            />
            <View style={styles.technicianDetails}>
              <Text style={styles.technicianName}>{details.name}</Text>
              <Text style={styles.technicianTitle}>Certified Technician</Text>
            </View>
          </View>
          <Text style={styles.estimatedCompletion}>
            Estimated Completion: 2 hours
          </Text>
          <Text style={styles.statusText}>
            Status: Working on your{' '}
            {serviceArray.map(service => service.serviceName).join(', ')} unit
            to ensure optimal performance.
          </Text>
        </View>
        <View style={styles.houseImageContainer}>
          <LottieView
            source={require('../assets/serviceLoading.json')}
            autoPlay
            loop
            style={styles.loadingAnimation}
          />
          {/* <Image source={{ uri: 'https://via.placeholder.com/200' }} style={styles.houseImage} /> */}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleCompleteClick}>
          <Text style={styles.buttonText}>Service Completed</Text>
        </TouchableOpacity>

        <View style={styles.serviceDetailsContainer}>
          <View style={styles.serviceDetailsHeaderContainer}>
            <Text style={styles.serviceDetailsTitle}>Service Details</Text>
            <TouchableOpacity>
              <Icon name="keyboard-arrow-right" size={24} color="#ff4500" />
            </TouchableOpacity>
          </View>
          <View style={styles.iconDetailsContainer}>
            <View style={styles.detailsRow}>
              <Icon name="calendar-today" size={20} color="#ff4500" />
              <Text style={styles.detailText}>
                Work started{' '}
                <Text style={styles.highLightText}>
                  {formatDate(details.created_at)}
                </Text>
              </Text>
            </View>
            <View style={styles.detailsRow}>
              <Icon name="location-on" size={20} color="#ff4500" />
              <Text style={styles.detailText}>
                Location:{' '}
                <Text style={styles.highLightText}>{details.area}</Text>
              </Text>
            </View>
          </View>
          <View>
            <View style={{marginTop: 20}}>
              {serviceArray.map((service, index) => {
                console.log(service); // Log to verify each service item
                return (
                  <View style={styles.ServiceCardsContainer} key={index}>
                    <View style={styles.technicianContainer}>
                      <Image
                        source={{
                          uri:
                            service.url ||
                            'https://i.postimg.cc/6Tsbn3S6/Image-8.png',
                        }}
                        style={styles.technicianImage}
                      />
                      <View style={styles.technicianDetails}>
                        <Text style={styles.technicianName}>
                          {service.serviceName}
                        </Text>
                        <Text style={styles.technicianTitle}>
                          Quantity: {service.quantity}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.statusText}>
                      Service Status:{' '}
                      <Text style={styles.highLightText}>In Progress</Text>
                    </Text>
                    <Text style={styles.statusText}>
                      Estimated Completion:{' '}
                      <Text style={styles.highLightText}>2 hours</Text>
                    </Text>
                  </View>
                );
              })}
              {/* {[...Array(3)].map((_, index) => (
              <View style={styles.ServiceCardsContainer} key={index}>
                <View style={styles.technicianContainer}>
                  <Image source={{ uri: 'https://i.postimg.cc/6Tsbn3S6/Image-8.png' }} style={styles.technicianImage} />
                  <View style={styles.technicianDetails}>
                    <Text style={styles.technicianName}>Ac Repair</Text>
                    <Text style={styles.technicianTitle}>Quantity : 1</Text>
                  </View>
                </View>
                <Text style={styles.statusText}>Service Status: <Text style={styles.highLightText}>In Progress</Text> </Text>
                <Text style={styles.statusText}>Estimated Completion: <Text style={styles.highLightText}>2 hours</Text> </Text>
              </View>
            ))} */}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainCOntainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    elevation: 1,
    shadowRadius: 4,
    backgroundColor: '#ffffff',
    zIndex: 1, // Ensure header is above other components
  },
  leftIcon: {
    position: 'absolute',
    top: 15,
    left: 10,
  },
  headerText: {
    color: '#212121',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileContainer: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 20,
    marginVertical: 10,
    marginHorizontal: 20,
    borderRadius: 10,
    elevation: 1,
  },
  loadingAnimation: {
    width: '100%',
    height: 200,
  },
  ServiceCardsContainer: {
    flexDirection: 'column',
    marginVertical: 10,
  },
  technicianContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  technicianImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  technicianDetails: {
    marginLeft: 15,
    flex: 1,
  },
  technicianName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  technicianTitle: {
    color: '#4a4a4a',
  },
  estimatedCompletion: {
    color: '#212121',
    fontWeight: '500',
    marginTop: 5,
  },
  statusText: {
    color: '#4a4a4a',
    marginTop: 5,
  },
  houseImageContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  houseImage: {
    width: 200,
    height: 200,
  },
  button: {
    backgroundColor: '#ff4500',
    paddingVertical: 10,
    marginHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    marginHorizontal: '20%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  serviceDetailsContainer: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 10,
    elevation: 3,
    marginBottom: 10,
  },
  serviceDetailsHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceDetailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  iconDetailsContainer: {
    marginVertical: 10,
    gap: 5,
    flexDirection: 'column',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 10,
    color: '#4a4a4a',
  },
  highLightText: {
    fontWeight: 'bold',
  },
  serviceHistoryContainer: {
    // flexDirection: 'row',
    // backgroundColor: '#fff',
    // padding: 15,
    // marginVertical: 10,
    // borderRadius: 10,
    // elevation: 3,
    marginBottom: 1,
  },
  serviceImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  serviceDetails: {
    marginLeft: 15,
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  serviceSubtitle: {
    color: '#4a4a4a',
  },
  serviceStatus: {
    color: '#ff4500',
    marginTop: 5,
  },
});

export default ServiceInProgressScreen;
