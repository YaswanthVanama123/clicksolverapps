import React, {useEffect, useState, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome6';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import SwipeButton from 'rn-swipe-button';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import {useRoute, useNavigation} from '@react-navigation/native';
import {RadioButton} from 'react-native-paper';
import axios from 'axios';
import Geolocation from '@react-native-community/geolocation';

const ServiceTrackingItemScreen = () => {
  const [titleColor, setTitleColor] = useState('#FFFFFF');
  const [swiped, setSwiped] = useState(false);
  const [details, setDetails] = useState({});
  const [paymentDetails, setPaymentDetails] = useState({});
  const [serviceArray, setServiceArray] = useState([]);
  const [isEditVisible, setEditVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const {tracking_id} = useRoute().params;
  const statuses = [
    'Collected Item',
    'Work started',
    'Work Completed',
    'Delivered',
  ];
  const navigation = useNavigation();

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

  const handleEditPress = () => {
    setEditVisible(prev => !prev); // Toggle the edit mode
  };

  const handleStatusChange = status => {
    setSelectedStatus(status);
    Alert.alert(
      'Confirm Change',
      `Are you sure you want to change the status to "${status}"?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Yes', onPress: () => applyStatusChange(status)},
      ],
    );
  };

  const handlesubmit = () => {
    navigation.push('TrackingConfirmation', {trackingId: tracking_id});
  };

  const applyStatusChange = async newStatus => {
    try {
      await axios.post(
        `http://192.168.55.103:5000/api/service/tracking/update/status`,
        {
          tracking_id,
          newStatus,
        },
      );
      setDetails({...details, service_status: newStatus});
      setSelectedStatus('');
      setEditVisible(false); // Hide the edit mode on successful update
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const openGoogleMaps = () => {
    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        const url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${details.latitude},${details.longitude}&travelmode=driving`;
        Linking.openURL(url).catch(err =>
          console.error('Error opening Google Maps:', err),
        );
      },
      error => {
        console.error('Error getting current location:', error);
      },
    );
  };

  const getTimelineData = useMemo(() => {
    const currentStatusIndex = statuses.indexOf(details.service_status);
    return statuses.map((status, index) => ({
      title: status,
      time: '',
      iconColor: index <= currentStatusIndex ? '#ff4500' : '#a1a1a1',
      lineColor: index <= currentStatusIndex ? '#ff4500' : '#a1a1a1',
      isSelectable: index > currentStatusIndex && status !== 'Delivered', // Only future statuses are selectable, except "Delivered"
    }));
  }, [details.service_status]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const {
          data: {data, paymentDetails}, 
        } = await axios.post(
          `http://192.168.55.103:5000/api/service/tracking/worker/item/details`,
          {tracking_id},
        );
        setDetails(data);
        setPaymentDetails(paymentDetails);
        setServiceArray(data.service_booked);
      } catch (error) {
        console.error('Error fetching bookings data:', error);
      }
    };
    fetchBookings();
  }, [tracking_id]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon
          name="arrow-left-long"
          size={20}
          color="#212121"
          style={styles.backIcon}
        />
        <Text style={styles.headerText}>Service Trackings</Text>
      </View>
      <ScrollView>
        <View style={styles.profileContainer}>
          <View style={styles.profileImage}>
            <Text style={styles.profileInitial}>
              {details.name ? details.name.charAt(0).toUpperCase() : ''}
            </Text>
          </View>
          <View style={styles.profileTextContainer}>
            <Text style={styles.userName}>{details.name}</Text>
            <TouchableOpacity style={styles.callIconContainer}>
              <MaterialIcons name="call" size={22} color="#FF5722" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.horizantalLine} />

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionBookedTitle}>Service Details</Text>
          <View style={styles.innerContainer}>
            {serviceArray.map((service, index) => (
              <Text key={index} style={styles.serviceDetail}>
                {service.serviceName}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.horizantalLine} />

        <View style={styles.sectionContainer}>
          <View style={styles.serviceTimeLineContainer}>
            <Text style={styles.sectionTitle}>Service Timeline</Text>
            <TouchableOpacity onPress={handleEditPress}>
              <Text style={styles.editText}>
                {isEditVisible ? 'Cancel' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.innerContainerLine}>
            {getTimelineData.map((item, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={{alignItems: 'center'}}>
                  <MaterialCommunityIcons
                    name="circle"
                    size={14}
                    color={item.iconColor}
                    style={styles.timelineIcon}
                  />
                  {index !== getTimelineData.length - 1 && (
                    <View
                      style={[
                        styles.lineSegment,
                        {backgroundColor: getTimelineData[index + 1].iconColor},
                      ]}
                    />
                  )}
                </View>
                <View style={styles.timelineTextContainer}>
                  <Text style={styles.timelineText}>{item.title}</Text>
                  <Text style={styles.timelineTime}>{item.time}</Text>
                </View>
                {isEditVisible && item.isSelectable && (
                  <RadioButton
                    value={item.title}
                    status={
                      selectedStatus === item.title ? 'checked' : 'unchecked'
                    }
                    onPress={() => handleStatusChange(item.title)}
                    color="#ff4500"
                  />
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.horizantalLine} />

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Address</Text>
          <View style={styles.addressContainer}>
            <Image
              source={{
                uri: 'https://i.postimg.cc/qvJw8Kzy/Screenshot-2024-11-13-170828-removebg-preview.png',
              }}
              style={styles.locationPinImage}
            />
            <View style={styles.addressTextContainer}>
              <Text style={styles.address}>{details.area}</Text>
            </View>
          </View>
          <View style={styles.googleMapsButtonContainer}>
            <TouchableOpacity
              style={styles.googleMapsButton}
              onPress={openGoogleMaps}>
              <Text style={styles.googleMapsText}>Google Maps</Text>
              <MaterialCommunityIcons
                name="navigation-variant"
                size={20}
                color="#C1C1C1"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.paymentInnerContainer}>
          <Text style={styles.sectionPaymentTitle}>Payment Details</Text>
        </View>
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
                ₹{paymentDetails.cgstAmount}.00
              </Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>CGST (5%)</Text>
              <Text style={styles.paymentValue}>
                ₹{paymentDetails.gstAmount}.00
              </Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Cashback (5%)</Text>
              <Text style={styles.paymentValue}>
                ₹{paymentDetails.discountAmount}.00
              </Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Pay Via Scan</Text>
              <Text style={styles.paymentValue}>
                Grand Total ₹{paymentDetails.fetchedFinalTotalAmount}.00
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.swipeButton}>
          <SwipeButton
            title="Delivered"
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
              handlesubmit();
              setTitleColor('#FFFFFF');
              setSwiped(true);
            }}
            onSwipeFail={() => setTitleColor('#FFFFFF')}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    backgroundColor: '#ffffff',
  },
  backIcon: {
    marginRight: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D2951',
    paddingLeft: 30,
  },
  profileContainer: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
    paddingLeft: 16,
  },
  profileImage: {
    width: 60,
    height: 60,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF7A22',
    borderRadius: 30,
  },
  profileInitial: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  profileTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  lineSegment: {
    width: 2,
    height: 40, // Adjust the height as needed
  },
  googleMapsButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  googleMapsButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    marginTop: 10,
    width: 140,
    height: 40,
  },
  googleMapsText: {
    fontSize: 14,
    color: '#212121',
    fontWeight: 'bold',
  },
  callIconContainer: {
    backgroundColor: '#fff',
    borderRadius: 50,
    padding: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  swipeButton: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  locationPinImage: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  horizantalLine: {
    height: 2,
    backgroundColor: '#F5F5F5',
    marginBottom: 12,
  },
  innerContainer: {
    paddingLeft: 16,
  },
  paymentInnerContainer: {
    padding: 10,
    backgroundColor: '#f5f5f5',
    marginTop: 10,
    marginBottom: 10,
  },
  PaymentItemContainer: {
    paddingLeft: 16,
    flexDirection: 'column',
    gap: 5,
  },
  sectionContainer: {
    marginBottom: 16,
    paddingLeft: 16,
    paddingRight: 16,
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
  editText: {
    color: '#ff5700',
    fontSize: 15,
    fontWeight: '500',
  },
  serviceTimeLineContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionPaymentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
    paddingLeft: 10,
  },
  innerContainerLine: {
    paddingLeft: 16,
  },
  serviceDetail: {
    fontSize: 14,
    color: '#212121',
    marginBottom: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  timelineTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  timelineText: {
    fontSize: 14,
    color: '#212121',
    fontWeight: 'bold',
  },
  timelineTime: {
    fontSize: 10,
    color: '#4a4a4a',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
  },
  addressTextContainer: {
    marginLeft: 10,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  address: {
    fontSize: 13,
    color: '#212121',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#212121',
  },
  paymentValue: {
    fontSize: 14,
    color: '#212121',
    fontWeight: 'bold',
  },
  serviceTimeLineContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: 300,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {fontSize: 18, fontWeight: 'bold', marginBottom: 10},
  statusOption: {paddingVertical: 10, fontSize: 16, color: '#212121'},
});

export default ServiceTrackingItemScreen;
