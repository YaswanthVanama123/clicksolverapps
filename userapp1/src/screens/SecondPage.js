import React, {useEffect, useRef, useState, useMemo} from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useNavigation, useRoute} from '@react-navigation/native';
import EncryptedStorage from 'react-native-encrypted-storage';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import axios from 'axios';
import uuid from 'react-native-uuid';
import QuickSearch from '../Components/QuickSearch';
import LottieView from 'lottie-react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
// import Config from 'react-native-config';
import crashlytics from '@react-native-firebase/crashlytics';

function ServiceApp() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [greetingIcon, setGreetingIcon] = useState(null);
  const [messageBoxDisplay, setMessageBoxDisplay] = useState(false);
  const [trackScreen, setTrackScreen] = useState([]);
  const [name, setName] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const screenWidth = Dimensions.get('window').width;
  const scrollViewRef = useRef(null);
  const itemWidth = screenWidth * 0.95;
  const navigation = useNavigation();
  const route = useRoute(); // Access route parameters
  const [decodedId, setDecodedId] = useState(null); // Store decoded ID
  const messageBoxWidth =
    trackScreen.length > 1 ? screenWidth * 0.85 : screenWidth * 0.9;

  const specialOffers = useMemo(
    () => [
      {
        id: '1',
        title: '20%',
        subtitle: 'New User Special',
        description:
          'New users get a 20% discount on their first booking across any service category.',
        imageBACKENDAP:
          'https://i.postimg.cc/HsGnL9F1/58d3ebe039b0649cfcabe95ae59f4328.png',
        backgroundColor: '#FFF4E6',
        color: '#F24E1E',
      },
      {
        id: '2',
        title: '50%',
        subtitle: 'Summer Sale',
        description:
          'Get a 50% discount on all services booked during the summer season.',
        imageBACKENDAP:
          'https://i.postimg.cc/rwtnJ3vB/b08a4579e19f4587bc9915bc0f7502ee.png',
        backgroundColor: '#E8F5E9',
        color: '#4CAF50',
      },
      {
        id: '3',
        title: '30%',
        subtitle: 'Refer a Friend',
        description:
          'Refer a friend and get 30% off on your next service booking.',
        imageBACKENDAP:
          'https://i.postimg.cc/Kzwh9wZC/4c63fba81d3b7ef9ca889096ad629283.png',
        backgroundColor: '#E3F2FD',
        color: '#2196F3',
      },
    ],
    [],
  );

  // Close modal
  const closeModal = () => {
    setRating(0); // Reset rating
    setComment(''); // Reset comment
    setModalVisible(false);
  };

  useEffect(() => {
    crashlytics().log('ServiceApp component mounted');
  }, []);

  useEffect(() => {
    const {encodedId} = route.params || {}; // Get encodedId from params
    if (encodedId) {
      try {
        const decoded = atob(encodedId); // Decode the encodedId
        setDecodedId(decoded); // Update state with the decoded ID
        setModalVisible(true); // Show rating screen
      } catch (error) {
        console.error('Failed to decode encodedId:', error);
      }
    }
  }, [route.params]);

  // Handle rating and comment submission
  const submitFeedback = async () => {
    try {
      const response = await axios.post(
        `https://backend.clicksolver.com/api/user/feedback`, // Replace with your backend URL
        {
          rating: rating,
          comment: comment,
          notification_id: decodedId,
        },
        {
          headers: {
            Authorization: `Bearer ${await EncryptedStorage.getItem(
              'cs_token',
            )}`,
          },
        },
      );

      console.log('Feedback submitted successfully:', response.data);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      closeModal();
    }
  };

  useEffect(() => {
    fetchServices();
    fetchTrackDetails();
    setGreetingBasedOnTime();
  }, []);

  const fetchTrackDetails = async () => {
    try {
      const cs_token = await EncryptedStorage.getItem('cs_token');
      if (cs_token) {
        const response = await axios.get(
          `https://backend.clicksolver.com/api/user/track/details`,
          {
            headers: {Authorization: `Bearer ${cs_token}`},
          },
        );

        const track = response?.data?.track || [];
        const {user} = response.data;

        setName(user || response.data);
        setMessageBoxDisplay(track.length > 0);
        setTrackScreen(track);
      }
    } catch (error) {
      console.error('Error fetching track details:', error);
    }
  };

  const setGreetingBasedOnTime = () => {
    const currentHour = new Date().getHours();
    let greetingMessage = 'Good Day';
    let icon = <Icon name="sunny-sharp" size={14} color="#F24E1E" />;

    if (currentHour < 12) {
      greetingMessage = 'Good Morning';
      icon = <Icon name="sunny-sharp" size={16} color="#F24E1E" />;
    } else if (currentHour < 17) {
      greetingMessage = 'Good Afternoon';
      icon = <Feather name="sunset" size={16} color="#F24E1E" />;
    } else {
      greetingMessage = 'Good Evening';
      icon = <MaterialIcons name="nights-stay" size={16} color="#000" />;
    }

    setGreeting(greetingMessage);
    setGreetingIcon(icon);
  };

  // const fetchServices = async () => {
  //   try {
  //     setLoading(true);
  //     const response = await axios.get(
  //       `https://backend.clicksolver.com/api/servicecategories`,
  //     );
  //     const servicesWithIds = response.data.map(service => ({
  //       ...service,
  //       id: uuid.v4(),
  //     }));
  //     setServices(servicesWithIds);
  //   } catch (error) {
  //     console.error('Error fetching services:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  async function fetchServices() {
    try {
      setLoading(true);
      crashlytics().log('Attempting to fetch services from API');

      const response = await axios.get(
        'https://backend.clicksolver.com/api/servicecategories',
        {
          timeout: 10000, // Set a timeout of 10 seconds
        },
      );

      crashlytics().log('Services fetched successfully');
      console.log('Response Data:', response.data);

      const servicesWithIds = response.data.map(service => ({
        ...service,
        id: uuid.v4(),
      }));
      setServices(servicesWithIds);
    } catch (error) {
      crashlytics().log('Error occurred while fetching services');
      crashlytics().log(`Error details: ${JSON.stringify(error, null, 2)}`);
      crashlytics().recordError(error);

      if (error.response) {
        crashlytics().log(`Response status: ${error.response.status}`);
        crashlytics().log(
          `Response data: ${JSON.stringify(error.response.data)}`,
        );
      } else if (error.request) {
        crashlytics().log(
          'No response received from the server. Request may have timed out or been blocked.',
        );
      } else {
        crashlytics().log(`Request error: ${error.message}`);
      }

      // Log the error details to console for further debugging
      console.error('Detailed Error:', error.toJSON ? error.toJSON() : error);
    } finally {
      setLoading(false);
    }
  }

  const handleNotification = () => {
    navigation.push('Notifications');
  };

  const handleHelp = () => {
    navigation.push('Help');
  };

  const handleBookCommander = serviceId => {
    navigation.push('serviceCategory', {serviceObject: serviceId});
  };

  const renderSpecialOffers = () => {
    return specialOffers.map(offer => (
      <View
        key={offer.id}
        style={[styles.offerCard, {backgroundColor: offer.backgroundColor}]}>
        <View style={styles.offerDetails}>
          <Text style={[styles.offerTitle, {color: '#ff4500'}]}>
            {offer.title}
          </Text>
          <Text style={[styles.offerSubtitle, {color: '#4a4a4a'}]}>
            {offer.subtitle}
          </Text>
          <Text style={[styles.offerDescription, {color: '#4a4a4a'}]}>
            {offer.description}
          </Text>
        </View>
        <Image source={{uri: offer.imageBACKENDAP}} style={styles.offerImg} />
      </View>
    ));
  };

  const renderServices = () => {
    if (loading) {
      return (
        <LottieView
          source={require('../assets/cardsLoading.json')}
          autoPlay
          loop
          style={styles.loadingAnimation}
        />
      );
    }

    return services.map(service => (
      <View key={service.id} style={styles.serviceCard}>
        <Image
          source={{
            uri: service.service_urls || 'https://via.placeholder.com/100x100',
          }}
          style={styles.serviceImg}
          resizeMode="stretch"
        />
        <View style={styles.serviceDetails}>
          <Text style={styles.serviceTitle}>{service.service_name}</Text>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => handleBookCommander(service.service_name)}>
            <Text style={styles.bookButtonText}>Book Now ➔</Text>
          </TouchableOpacity>
        </View>
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.userInitialCircle}>
            <Text style={styles.userInitialText}>
              {name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.greeting}>
            <Text style={styles.greetingText}>
              {greeting} <Text style={styles.greetingIcon}>{greetingIcon}</Text>
            </Text>
            <Text style={styles.userName}>{name}</Text>
          </View>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={handleNotification}>
            <Icon name="notifications-outline" size={23} color="#212121" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleHelp}>
            <Feather name="help-circle" size={23} color="#212121" />
          </TouchableOpacity>
        </View>
      </View>

      <QuickSearch />

      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Special Offers</Text>
            {/* <Text style={styles.seeAll}>See All</Text> */}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.offersScrollView}>
            {renderSpecialOffers()}
          </ScrollView>
        </View>

        <View
          style={[
            {
              paddingBottom: messageBoxDisplay ? 65 : 10,
            },
          ]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Services</Text>
            {/* <Text style={styles.seeAll}>See All</Text> */}
          </View>
          {renderServices()}
        </View>
      </ScrollView>

      {messageBoxDisplay && (
        <ScrollView
          horizontal
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollViewHorizontal}
          showsHorizontalScrollIndicator={false}
          style={styles.absoluteMessageBox}>
          {trackScreen.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.messageBoxContainer, {width: messageBoxWidth}]} // Apply dynamic width here
              onPress={() =>
                navigation.replace(item.screen, {
                  encodedId: item.encodedId,
                  area: item.area,
                  city: item.city,
                  pincode: item.pincode,
                  alternateName: item.alternateName,
                  alternatePhoneNumber: item.alternatePhoneNumber,
                  serviceBooked: item.serviceBooked,
                  location: item.location,
                })
              }>
              <View style={styles.messageBox1}>
                <View style={styles.startingContainer}>
                  <View style={styles.timeContainer}>
                    {console.log(item.screen)}
                    {item.screen === 'Paymentscreen' ? (
                      <Foundation name="paypal" size={24} color="#ffffff" />
                    ) : item.screen === 'UserNavigation' ? (
                      <MaterialCommunityIcons
                        name="truck"
                        size={24}
                        color="#ffffff"
                      />
                    ) : item.screen === 'userwaiting' ? (
                      <Feather name="search" size={24} color="#ffffff" />
                    ) : item.screen === 'OtpVerification' ? (
                      <Feather name="shield" size={24} color="#ffffff" />
                    ) : item.screen === 'worktimescreen' ? (
                      <MaterialCommunityIcons
                        name="hammer"
                        size={24}
                        color="#ffffff"
                      />
                    ) : (
                      <Feather name="alert-circle" size={24} color="#000" />
                    )}
                  </View>
                  <View>
                    <Text style={styles.textContainerText}>
                      {item.serviceBooked && item.serviceBooked.length > 0
                        ? item.serviceBooked
                            .slice(0, 2) // Take only the first 2 items
                            .map(service => service.serviceName)
                            .join(', ') +
                          (item.serviceBooked.length > 2 ? '...' : '') // Add "..." if there are more than 2 items
                        : 'Switch board & Socket repairing'}
                    </Text>
                    <Text style={styles.textContainerTextCommander}>
                      {item.screen === 'Paymentscreen'
                        ? 'Payment in progress'
                        : item.screen === 'UserNavigation'
                        ? 'Commander is on the way'
                        : item.screen === 'OtpVerification'
                        ? 'User is waiting for your help'
                        : item.screen === 'worktimescreen'
                        ? 'Work in progress'
                        : 'Nothing'}
                    </Text>
                  </View>
                </View>

                <View style={styles.rightIcon}>
                  <Feather name="chevrons-right" size={18} color="#9e9e9e" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Rating Modal */}
      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Icon name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Title and Subtitle */}
            <Text style={styles.modalTitle}>
              How was the quality of your Service?
            </Text>
            <Text style={styles.modalSubtitle}>
              Your answer is anonymous. This helps us improve our service.
            </Text>

            {/* Star Rating */}
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starButton}>
                  <MaterialCommunityIcons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={30}
                    color={star <= rating ? '#FFD700' : '#A9A9A9'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Comment Box */}
            <TextInput
              style={styles.commentBox}
              placeholder="Write your comment here..."
              placeholderTextColor="#A9A9A9"
              multiline
              value={comment}
              onChangeText={setComment}
            />

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={closeModal}
                style={styles.notNowButton}>
                <Text style={styles.notNowText}>Not now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitFeedback}
                style={styles.submitButton}>
                <Text style={styles.submitText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const screenWidth = Dimensions.get('window').width; // Get screen width

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingBottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  Servicessection: {
    marginBottom: 20,
  },
  offersScrollView: {
    display: 'flex',
    gap: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInitialCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  loadingAnimation: {
    width: '100%',
    height: '100%',
  },
  userInitialText: {
    fontSize: 18,
    color: '#333',
    fontFamily: 'RobotoSlab-Bold',
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  greeting: {
    flexDirection: 'column',
    color: '#333',
  },
  greetingText: {
    fontSize: 14,
    fontFamily: 'Roboto',
    lineHeight: 18.75,
    fontStyle: 'italic',
    color: '#808080',
    fontFamily: 'RobotoSlab-ExtraBold',
  },
  greetingIcon: {
    fontSize: 17,
  },
  userName: {
    fontSize: 16,
    fontFamily: 'RobotoSlab-Bold',
    color: '#4A4A4A',
    lineHeight: 21.09,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 15,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#1D2951',
    fontFamily: 'RobotoSlab-Bold',
  },
  seeAll: {
    fontSize: 14,
    color: '#4a4a4a',
  },
  offerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 300,
    borderRadius: 10,
  },
  offerDetails: {
    width: '60%',
    padding: 15,
  },
  offerTitle: {
    fontSize: 40,
    fontFamily: 'RobotoSlab-Bold',
  },
  offerSubtitle: {
    fontSize: 14,
    lineHeight: 16.41,
    fontFamily: 'RobotoSlab-SemiBold',
  },
  offerDescription: {
    fontSize: 12,
    fontFamily: 'RobotoSlab-Regular',
    opacity: 0.8,
    lineHeight: 14.06,
    fontWeight: '400',
  },
  offerImg: {
    width: 119,
    height: 136,
    alignSelf: 'flex-end',
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  serviceImg: {
    width: 165,
    height: 105,
    borderRadius: 10,
  },
  serviceDetails: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 10,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF4500',
    borderRadius: 15,
    marginTop: 10,
    width: 110,
    height: 31,
    opacity: 0.88,
  },
  bookButtonText: {
    color: '#ffffff',
    fontFamily: 'RobotoSlab-SemiBold',
    fontSize: 13,
    textAlign: 'center',
  },
  absoluteMessageBox: {
    position: 'absolute',
    bottom: 2,
    left: 0,
    right: 0,
  },
  scrollViewHorizontal: {
    paddingHorizontal: 10, // Add padding to give space on the left and right
    alignItems: 'center',
  },
  messageBoxContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    flexDirection: 'row',
    padding: 10,
    marginHorizontal: 5,
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
    width: screenWidth * 0.9, // Set width to 80% of screen width for peek effect
  },
  // startingContainer: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  // },
  startingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Ensures it occupies available space
  },

  // messageBox1: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   justifyContent: 'space-between',
  //   width: '100%',
  // },
  // Updated Styles
  messageBox1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1, // Added flex property
  },

  timeContainer: {
    width: 45,
    height: 45,
    backgroundColor: '#ff5722',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },

  textContainerText: {
    fontSize: 13,
    paddingBottom: 5,
    fontFamily: 'RobotoSlab-Bold',
    color: '#212121',
    marginLeft: 10,
    width: '95%',
  },
  textContainerTextCommander: {
    fontSize: 12,
    color: '#9e9e9e',
    fontFamily: 'RobotoSlab-Regular',
    marginLeft: 10,
  },

  rightIcon: {
    marginLeft: 8,
  },
  iconContainer: {
    marginRight: 10,
  },
  iconImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  serviceInfoContainer: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontFamily: 'RobotoSlab-Bold',
    color: '#333',
  },
  rightIcon: {
    marginLeft: 8,
  },
  waitingText: {
    fontSize: 12,
    color: '#1D2951',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    // backgroundColor: '#212E36',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  closeButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#FF4500',
    borderRadius: 15,
    padding: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'RobotoSlab-Medium',
    color: '#212121',
    marginTop: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#9e9e9e',
    marginVertical: 10,
    textAlign: 'center',
    fontFamily: 'RobotoSlab-Regular',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  starButton: {
    marginHorizontal: 5,
  },
  commentBox: {
    width: '100%',
    height: 80,
    borderWidth: 1,
    borderColor: '#A9A9A9',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    padding: 10,
    color: '#000000',
    fontSize: 14,
    fontFamily: 'RobotoSlab-Regular',
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  notNowButton: {
    padding: 10,
    backgroundColor: '#A9A9A9',
    borderRadius: 5,
  },
  notNowText: {
    color: '#FFFFFF',
    fontFamily: 'RobotoSlab-Medium',
  },
  submitButton: {
    padding: 10,
    backgroundColor: '#FF4500',
    borderRadius: 5,
  },
  submitText: {
    color: '#FFFFFF',
    fontFamily: 'RobotoSlab-Medium',
  },
});

export default ServiceApp;
