import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  BackHandler,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import Mapbox from '@rnmapbox/maps';
import Octicons from 'react-native-vector-icons/Octicons';
import axios from 'axios';
import {
  useNavigation,
  useRoute,
  CommonActions,
  useFocusEffect,
} from '@react-navigation/native';

// Set Mapbox access token
Mapbox.setAccessToken(
  'pk.eyJ1IjoieWFzd2FudGh2YW5hbWEiLCJhIjoiY2x5Ymw5MXZpMWZseDJqcTJ3NXFlZnRnYyJ9._E8mIoaIlyGrgdeu71StDg',
);

const ServiceCompletionScreen = () => {
  const {
    params: {encodedId},
  } = useRoute();
  const navigation = useNavigation();
  const [serviceArray, setServiceArray] = useState([]);
  const [locationDetails, setLocationDetails] = useState({
    paymentDetails: {},
    totalAmount: 0,
    center: [0, 0],
  });

  // Decode ID
  const decodedId = encodedId ? atob(encodedId) : null;

  // Fetch payment details
  useEffect(() => {
    if (decodedId) {
      const fetchPaymentDetails = async () => {
        try {
          const response = await axios.post(
            `${process.env.BackendAPI6}/api/worker/payment/service/completed/details`,
            {
              notification_id: decodedId,
            },
          );

          const {
            payment,
            payment_type,
            service,
            longitude,
            latitude,
            area,
            city,
            pincode,
            name,
          } = response.data;
          console.log(typeof service, service, response.data);
          let serviceBooked;
          if (typeof service === 'string') {
            try {
              serviceBooked = JSON.parse(service);
            } catch (parseError) {
              console.error('Error parsing service_booked:', parseError);
              serviceBooked = [];
            }
          } else {
            serviceBooked = service; // Already parsed
          }

          console.log(serviceBooked);
          setLocationDetails({
            paymentDetails: {
              payment_type,
              serviceBooked,
              area,
              city,
              pincode,
              name,
            },
            totalAmount: payment,
            center: [longitude, latitude],
          });
          setServiceArray(serviceBooked);
        } catch (error) {
          console.error('Error fetching payment details:', error);
        }
      };

      fetchPaymentDetails();
    }
  }, [decodedId]);

  // Handle back press
  const onBackPress = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{name: 'Tabs', state: {routes: [{name: 'Home'}]}}],
      }),
    );
    return true;
  }, [navigation]);

  // Add back handler listener
  useFocusEffect(
    useCallback(() => {
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [onBackPress]),
  );

  const {paymentDetails, totalAmount, center} = locationDetails;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        Service Completed with {paymentDetails.name}
      </Text>
      <Text style={styles.subHeading}>
        Collected amount in {paymentDetails.payment_type}
      </Text>

      <View style={styles.amountContainer}>
        <Text style={styles.amount}>₹{totalAmount}</Text>
        <Feather name="check-circle" size={22} color="#4CAF50" />
      </View>

      <Text style={styles.date}>26/04/2023 05:45 PM</Text>
      <Text style={styles.serviceType}>
        {serviceArray.map(service => service.serviceName).join(', ')}
      </Text>

      <View style={styles.locationContainer}>
        <Image
          style={styles.locationIcon}
          source={{
            uri: 'https://i.postimg.cc/rpb2czKR/1000051859-removebg-preview.png',
          }} // Pin icon
        />
        <Text style={styles.locationText}>
          {paymentDetails.area}
          <Text style={styles.time}>, 5:45 PM</Text>
        </Text>
      </View>

      <Mapbox.MapView style={styles.map}>
        <Mapbox.Camera zoomLevel={17} centerCoordinate={center} />
        <Mapbox.PointAnnotation id="current-location" coordinate={center}>
          <View style={styles.markerContainer}>
            <Octicons name="dot-fill" size={25} color="#0E52FB" />
          </View>
        </Mapbox.PointAnnotation>
      </Mapbox.MapView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.doneButton} onPress={onBackPress}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fafafa',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  doneButton: {
    borderWidth: 1,
    borderColor: '#FF5722',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 25,
    width: 250,
  },
  doneText: {
    color: '#FF5722',
    fontSize: 15,
    fontWeight: 'bold',
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    color: '#212121',
    paddingTop: 30,
    paddingBottom: 10,
  },
  subHeading: {
    fontSize: 14,
    color: '#9e9e9e',
    textAlign: 'center',
    marginBottom: 20,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
    marginTop: 20,
    gap: 10,
  },
  amount: {
    fontSize: 35,
    fontWeight: 'bold',
    color: '#000',
  },
  date: {
    fontSize: 14,
    color: '#757575',
    paddingBottom: 20,
  },
  serviceType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    paddingBottom: 20,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    width: '95%',
  },
  locationIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  locationText: {
    fontSize: 14,
    color: '#212121',
  },
  time: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 10,
  },
  map: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
});

export default ServiceCompletionScreen;
