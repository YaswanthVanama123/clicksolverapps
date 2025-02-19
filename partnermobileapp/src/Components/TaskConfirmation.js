import {useNavigation, useRoute, CommonActions} from '@react-navigation/native';
import React, {useEffect, useState, useMemo} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import SwipeButton from 'rn-swipe-button';
import Feather from 'react-native-vector-icons/Feather';
import Entypo from 'react-native-vector-icons/Entypo';
import LottieView from 'lottie-react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const TaskConfirmation = () => {
  const route = useRoute();
  const {encodedId} = route.params;
  const [decodedId, setDecodedId] = useState(null);
  const [details, setDetails] = useState({
    city: null,
    area: null,
    alternateName: null,
    alternatePhoneNumber: null,
    pincode: null,
    service: null,
  });
  const [paymentDetails, setPaymentDetails] = useState({});
  const [titleColor, setTitleColor] = useState('#FFFFFF');
  const [swiped, setSwiped] = useState(false);
  const [serviceArray, setServiceArray] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    if (encodedId) {
      const decoded = atob(encodedId);
      setDecodedId(decoded);
    }
  }, [encodedId]);

  const ThumbIcon = useMemo(
    () => () =>
      (
        <View style={styles.thumbContainer}>
          <Text>
            {swiped ? (
              <Entypo
                name="check"
                size={20}
                color="#ff4500"
                style={styles.checkIcon}
              />
            ) : (
              <FontAwesome6 name="arrow-right-long" size={15} color="#ff4500" />
            )}
          </Text>
        </View>
      ),
    [swiped],
  );

  useEffect(() => {
    if (decodedId) {
      const fetchPaymentDetails = async () => {
        try {
          const response = await axios.post(
            `http://192.168.55.103:5000/api/worker/details`,
            {
              notification_id: decodedId,
            },
          );
          console.log(response.data);
          const {workDetails} = response.data;
          setDetails({
            city: workDetails.city,
            area: workDetails.area,
            pincode: workDetails.pincode,
            alternateName: workDetails.alternate_name,
            alternatePhoneNumber: workDetails.alternate_phone_number,
            service: workDetails.service_booked,
            discount: workDetails.discount,
            totalCost: workDetails.total_cost,
          });

          console.log(response.data.workDetails.discount);
          // setPaymentDetails(paymentDetails);
          setServiceArray(workDetails.service_booked);
        } catch (error) {
          console.error('Error fetching payment details:', error);
        }
      };
      fetchPaymentDetails();
    }
  }, [decodedId]);

  const handleComplete = async () => {
    const encoded = btoa(decodedId);
    try {
      const response = await axios.post(
        `http://192.168.55.103:5000/api/worker/confirm/completed`,
        {
          notification_id: decodedId,
          encodedId: encoded,
        },
      );

      if (response.status === 200) {
        const pcs_token = await EncryptedStorage.getItem('pcs_token');

        await axios.post(
          `http://192.168.55.103:5000/api/worker/action`,
          {
            encodedId: encoded,
            screen: 'Paymentscreen',
          },
          {
            headers: {
              Authorization: `Bearer ${pcs_token}`,
            },
          },
        );

        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: 'Paymentscreen', params: {encodedId: encoded}}],
          }),
        );
      } else {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: 'Tabs', state: {routes: [{name: 'Home'}]}}],
          }),
        );
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handlePress = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{name: 'Tabs', state: {routes: [{name: 'Home'}]}}],
      }),
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backArrow}>
        <Icon name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      {/* Checkmark Image */}
      <LottieView
        source={require('../assets/success.json')}
        autoPlay
        loop
        style={styles.loadingAnimation}
      />

      {/* Title and Subtitle */}
      <Text style={styles.title}>Work Completion request !</Text>
      <Text style={styles.subtitle}>
        Please confirm the completion of the service. Click confirm
      </Text>

      <View style={styles.paymentDetails}>
        <Text style={styles.detailsText}>Payment Details</Text>

        <View style={styles.sectionContainer}>
          <View style={styles.PaymentItemContainer}>
            {serviceArray.map((service, index) => (
              <View key={index} style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>{service.serviceName}</Text>
                <Text style={styles.paymentValue}>₹{service.cost}.00</Text>
              </View>
            ))}
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>SGST (5%)</Text>
              <Text style={styles.paymentValue}>
                {/* ₹{paymentDetails.cgstAmount}.00 */}
                ₹0.00
              </Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>CGST (5%)</Text>
              <Text style={styles.paymentValue}>
                {/* ₹{paymentDetails.gstAmount}.00 */}
                ₹0.00
              </Text>
            </View>
            {details.discount > 0 &&
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Cashback (5%)</Text>
                <Text style={styles.paymentValue}>
                {/* ₹{paymentDetails.discountAmount}.00 */}- ₹{details.discount}
                .00
                </Text>
              </View>
            }

            <View style={[styles.horizantalLine, {marginTop: 10}]} />
            <View style={styles.paymentGrandRow}>
              <Text style={styles.paymentTotalValue}>
                Grand Total ₹{details.totalCost}.00
              </Text>
            </View>
            <View style={[styles.horizantalLine]} />
          </View>
        </View>
      </View>
      <View style={styles.swipeButton}>
        <SwipeButton
          title="Completed"
          titleStyles={{color: titleColor, fontSize: 16, fontWeight: '500'}}
          railBackgroundColor="#FF5722"
          railBorderColor="#FF5722"
          height={40}
          railStyles={{
            borderRadius: 20,
            backgroundColor: '#FF572200',
            borderColor: '#FF572200',
          }}
          thumbIconComponent={ThumbIcon}
          thumbIconBackgroundColor="#FFFFFF"
          thumbIconBorderColor="#FFFFFF"
          thumbIconWidth={40}
          thumbIconStyles={{height: 30, width: 30, borderRadius: 20}}
          onSwipeStart={() => setTitleColor('#B0B0B0')}
          onSwipeSuccess={() => {
            handleComplete();
            setTitleColor('#FFFFFF');
            setSwiped(true);
          }}
          onSwipeFail={() => setTitleColor('#FFFFFF')}
        />
      </View>

      {/* <View style={styles.confirmationContainer}>
        <View style={styles.taskHeader}>
          <Text style={styles.headerText}>Task Completion Confirmation</Text>
          <Text style={styles.subHeaderText}>Please confirm if you have completed the assigned task.</Text>
        </View>
        <Text style={styles.taskText}>Task: {' '}
          {details.service && details.service.length > 0
            ? details.service.map(service => service.serviceName).join(', ')
            : 'Switch board & Socket repairing'}
          </Text>
        <Text style={styles.taskText}>Location: {details.area}</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, styles.completedButton]} onPress={handleComplete}>
            <Icon name="check-circle" size={16} color="#fff" />
            <Text style={styles.buttonText}>Yes, Completed</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.notCompletedButton]} onPress={handlePress}>
            <Icon name="times-circle" size={16} color="#000" />
            <Text style={[styles.buttonText, styles.notCompletedText]}>No, Not Completed</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.responseText}>
          Your response has been recorded and will be reviewed by your supervisor.
        </Text>
      </View> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    backgroundColor: '#fff',
  },
  backArrow: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 1,
  },
  loadingAnimation: {
    width: '100%',
    height: 200,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,

    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    backgroundColor: '#ffffff',
    zIndex: 1, // Ensure header is above other components
  },
  completionText: {
    color: '#212121',
    fontWeight: 'bold',
  },
  timeText: {
    color: '#9e9e9e',
  },
  swipeButton: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  confirmationContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    padding: 10,
    width: '90%',
  },
  detailsContainer: {
    flexDirection: 'column',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    backgroundColor: '#ffffff',
    zIndex: 1,
    margin: 20,
    padding: 10,
    borderRadius: 10,
  },
  detailsCard: {
    flexDirection: 'row',
    gap: 10,
  },
  detailsText: {
    color: '#212121',
    fontSize: 15,
    fontWeight: 'bold',
    paddingBottom: 10,
  },
  paymentDetails: {
    padding: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    elevation: 1,
    marginBottom: 10,
    borderRadius: 10,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#212121',
    width: '90%',
  },
  paymentValue: {
    fontSize: 14,
    color: '#212121',
    fontWeight: 'bold',
  },
  paymentTotalValue: {
    fontSize: 16,
    color: '#212121',
    fontWeight: 'bold',
    paddingVertical: 10,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  paymentGrandRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  PaymentItemContainer: {
    paddingLeft: 16,
    flexDirection: 'column',
    gap: 5,
  },
  sectionContainer: {
    marginBottom: 16,

    width: '95%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
    paddingBottom: 15,
  },
  sectionBookedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  location: {
    color: '#9e9e9e',
  },
  successContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  successIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#4CAF50',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeText: {
    color: '#212121',
    fontWeight: 'bold',
  },
  taskHeader: {
    marginBottom: 30,
  },
  headerText: {
    fontSize: 25,
    marginBottom: 10,
    color: '#333',
  },
  subHeaderText: {
    fontSize: 14,
    color: '#666',
  },
  horizantalLine: {
    height: 1,
    backgroundColor: '#f5f5f5',
  },
  iconContainer: {
    height: 50,
    width: 50,
    backgroundColor: '#ff5722',
    borderRadius: 25,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskText: {
    fontSize: 16,
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 30,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '38%',
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    backgroundColor: '#ffffff',
    zIndex: 1,
    margin: 20,
    padding: 10,
    borderRadius: 10,
  },
  completedButton: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  notCompletedButton: {
    backgroundColor: '#fff',
  },
  buttonText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 8,
  },
  notCompletedText: {
    color: '#000',
  },
  responseText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default TaskConfirmation;
