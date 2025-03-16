import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  BackHandler,
  Modal,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import messaging from '@react-native-firebase/messaging';
import LottieView from 'lottie-react-native';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import EncryptedStorage from 'react-native-encrypted-storage';
import { useNavigation, useRoute, CommonActions, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
// Import theme hook
import { useTheme } from '../context/ThemeContext';

const ServiceInProgressScreen = () => {
  const { width } = useWindowDimensions();
  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(width, isDarkMode);

  const [details, setDetails] = useState({});
  const [services, setServices] = useState([]);
  const [decodedId, setDecodedId] = useState(null);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);

  const route = useRoute();
  const { encodedId } = route.params;
  const navigation = useNavigation();

  // 1) Decode `encodedId`
  useEffect(() => {
    if (encodedId) {
      setDecodedId(atob(encodedId));
    }
  }, [encodedId]);

  // 2) Define fetchBookings function to fetch data from backend
  const fetchBookings = async () => {
    if (!decodedId) return;
    try {
      const response = await axios.post(
        'http://192.168.55.106:5000/api/user/work/progress/details',
        { decodedId }
      );
      const data = response.data[0];
      console.log("data",data); 
      setDetails(data);

      // Build a combined array of services with status
      const mappedServices = data.service_booked.map((serviceBookedItem) => {
        const statusItem = data.service_status.find(
          (s) => s.serviceName === serviceBookedItem.serviceName
        );
        return {
          id: serviceBookedItem.main_service_id,
          name: serviceBookedItem.serviceName,
          quantity: serviceBookedItem.quantity,
          image:
            serviceBookedItem.url ||
            'https://i.postimg.cc/6Tsbn3S6/Image-8.png',
          status: {
            accept: statusItem?.accept || null,
            arrived: statusItem?.arrived || null,
            workCompleted: statusItem?.workCompleted || null,
          },
        };
      });
      setServices(mappedServices);
    } catch (error) {
      console.error('Error fetching bookings data:', error);
    }
  };

  // 3) Fetch bookings when decodedId changes
  useEffect(() => {
    fetchBookings();
  }, [decodedId]);

  // 4) Listen for incoming notifications; if notification.data has "status", call fetchBookings
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('FCM notification received in ServiceInProgressScreen:', remoteMessage);
      if (remoteMessage.data && remoteMessage.data.status) {
        console.log('Notification has status data. Calling fetchBookings...');
        fetchBookings();
      }
    });
    return () => unsubscribe();
  }, [decodedId]);

  // 5) Generate timeline data
  const generateTimelineData = (status) => {
    const statusKeys = ['accept', 'arrived', 'workCompleted'];
    const statusDisplayNames = {
      accept: 'In Progress',
      arrived: 'Work Started',
      workCompleted: 'Work Completed',
    };
    return statusKeys.map((statusKey) => ({
      key: statusKey,
      title: statusDisplayNames[statusKey],
      time: status[statusKey] || null,
      iconColor: status[statusKey] ? '#ff4500' : '#a1a1a1',
      lineColor: status[statusKey] ? '#ff4500' : '#a1a1a1',
    }));
  };

  // 6) Confirm completion
  const handleCompleteClick = () => {
    setConfirmationModalVisible(true);
  };

  const handleConfirmComplete = async () => {
    try {
      const response = await axios.post(
        'https://backend.clicksolver.com/api/work/time/completed/request',
        { notification_id: decodedId }
      );
      if (response.status === 200) {
        setConfirmationModalVisible(false);
      }
    } catch (error) {
      console.error('Error completing work:', error);
    }
  };

  // 7) On hardware back => go home
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

  // 8) Format date strings
  const formatDate = (dateString) => {
    if (!dateString) return 'Pending';
    const date = new Date(dateString);
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    };
    return date.toLocaleString('en-US', options);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <FontAwesome6
            name="arrow-left-long"
            size={20}
            color={isDarkMode ? '#fff' : "#212121"}
            style={styles.leftIcon}
            onPress={() => {
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }],
                })
              );
            }}
          />
          <Text style={styles.headerText}>Service In Progress</Text>
        </View>

        {/* Content */}
        <ScrollView style={styles.scrollContainer}>
          {/* Profile / Technician Info */}
          <View style={styles.profileContainer}>
            <View style={styles.technicianContainer}>
              <Image
                source={{
                  uri: details.profile || 'https://i.postimg.cc/mZnDzdqJ/IMG-20240929-WA0024.jpg',
                }}
                style={styles.technicianImage}
              />
              <View style={styles.technicianDetails}>
                <Text style={styles.technicianName}>{details.name || 'Technician'}</Text>
                <Text style={styles.technicianTitle}>Certified Technician</Text>
              </View>
            </View>
            <Text style={styles.estimatedCompletion}>Estimated Completion: 2 hours</Text>
            <Text style={styles.statusText}>
              Status: Working on {services.map((service) => service.name).join(', ')} ...
            </Text>
          </View>

          {/* Lottie / Loading Animation */}
          <View style={styles.lottieContainer}>
            <LottieView
              source={require('../assets/serviceLoading.json')}
              autoPlay
              loop
              style={styles.loadingAnimation}
            />
          </View>

          {/* Complete Button */}
          <TouchableOpacity style={styles.button} onPress={handleCompleteClick}>
            <Text style={styles.buttonText}>Service Completed</Text>
          </TouchableOpacity>

          {/* Service Details */}
          <View style={styles.serviceDetailsContainer}>
            <View style={styles.serviceDetailsHeaderContainer}>
              <Text style={styles.serviceDetailsTitle}>Service Details</Text>
              <TouchableOpacity>
                <Icon name="keyboard-arrow-right" size={24} color="#ff4500" />
              </TouchableOpacity>
            </View>

            {/* Additional Info */}
            <View style={styles.iconDetailsContainer}>
              <View style={styles.detailsRow}>
                <Icon name="calendar-today" size={20} color="#ff4500" />
                <Text style={styles.detailText}>
                  Work started <Text style={styles.highlight}>{formatDate(details.created_at)}</Text>
                </Text>
              </View>
              <View style={styles.detailsRow}>
                <Icon name="location-on" size={20} color="#ff4500" />
                <Text style={styles.detailText}>
                  Location: <Text style={styles.highlight}>{details.area}</Text>
                </Text>
              </View>
            </View>

            {/* Services & Timelines */}
            <View>
              {services.map((service, index) => {
                const timelineData = generateTimelineData(service.status);
                return (
                  <View style={styles.ServiceCardsContainer} key={index}>
                    {/* Service image + info */}
                    <View style={styles.technicianContainer}>
                      <Image source={{ uri: service.image }} style={styles.technicianImage} />
                      <View style={styles.technicianDetails}>
                        <Text style={styles.technicianName}>{service.name}</Text>
                        <Text style={styles.technicianTitle}>Quantity: {service.quantity}</Text>
                      </View>
                    </View>

                    <Text style={styles.statusText}>
                      Service Status:{' '}
                      <Text style={styles.highlight}>
                        {timelineData.find((item) => item.time)?.title || 'Pending'}
                      </Text>
                    </Text>
                    <Text style={styles.statusText}>
                      Estimated Completion: <Text style={styles.highlight}>2 hours</Text>
                    </Text>

                    {/* Timeline */}
                    <View style={styles.sectionContainer}>
                      <View style={styles.serviceTimeLineContainer}>
                        <Text style={styles.sectionTitle}>Service Timeline</Text>
                      </View>
                      <View style={styles.innerContainerLine}>
                        {timelineData.map((item) => (
                          <View key={item.key} style={styles.timelineItem}>
                            <View style={styles.iconAndLineContainer}>
                              <MaterialCommunityIcons
                                name="circle"
                                size={14}
                                color={item.iconColor}
                              />
                              {item.key !== 'workCompleted' && (
                                <View
                                  style={[
                                    styles.lineSegment,
                                    { backgroundColor: item.lineColor },
                                  ]}
                                />
                              )}
                            </View>
                            <View style={styles.timelineContent}>
                              <View style={styles.timelineTextContainer}>
                                <Text style={styles.timelineText}>{item.title}</Text>
                                <Text style={styles.timelineTime}>
                                  {item.time ? formatDate(item.time) : 'Pending'}
                                </Text>
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Confirmation Modal */}
        <Modal
          animationType="slide"
          transparent
          visible={confirmationModalVisible}
          onRequestClose={() => setConfirmationModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.confirmationModalContainer}>
              <Text style={styles.confirmationTitle}>Confirm Service Completion</Text>
              <Text style={styles.confirmationSubtitle}>
                Are you sure you want to mark the service as completed? Once done,
                we will no longer track its progress.
              </Text>
              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity
                  style={styles.modalButtonCancel}
                  onPress={() => setConfirmationModalVisible(false)}
                >
                  <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButtonConfirm}
                  onPress={handleConfirmComplete}
                >
                  <Text style={styles.modalButtonTextConfirm}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

/**
 * DYNAMIC STYLES with Dark Theme Support
 */
function dynamicStyles(width, isDarkMode) {
  const isTablet = width >= 600;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
    },
    mainContainer: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#ffffff',
    },
    scrollContainer: {
      flex: 1,
    },
    /* Header */
    headerContainer: {
      backgroundColor: isDarkMode ? '#121212' : '#ffffff',
      paddingVertical: isTablet ? 20 : 15,
      paddingHorizontal: isTablet ? 24 : 20,
      alignItems: 'center',
      elevation: 1,
      zIndex: 1,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#333' : '#EEE',
    },
    leftIcon: {
      position: 'absolute',
      left: isTablet ? 24 : 15,
      top: isTablet ? 20 : 15,
    },
    headerText: {
      color: isDarkMode ? '#fff' : '#212121',
      fontSize: isTablet ? 20 : 18,
      fontFamily: 'RobotoSlab-SemiBold',
    },
    /* Technician / Profile Container */
    profileContainer: {
      flexDirection: 'column',
      backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
      padding: isTablet ? 24 : 20,
      marginVertical: isTablet ? 16 : 10,
      marginHorizontal: isTablet ? 28 : 20,
      borderRadius: 10,
    },
    technicianContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    technicianImage: {
      width: isTablet ? 60 : 50,
      height: isTablet ? 60 : 50,
      borderRadius: 30,
      resizeMode: 'cover',
    },
    technicianDetails: {
      marginLeft: isTablet ? 20 : 15,
      flex: 1,
    },
    technicianName: {
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'RobotoSlab-Medium',
      color: isDarkMode ? '#fff' : '#212121',
    },
    technicianTitle: {
      color: isDarkMode ? '#ccc' : '#4a4a4a',
      fontFamily: 'RobotoSlab-Regular',
      fontSize: isTablet ? 14 : 12,
    },
    estimatedCompletion: {
      color: isDarkMode ? '#fff' : '#212121',
      fontWeight: '500',
      fontFamily: 'RobotoSlab-Medium',
      marginTop: 8,
      fontSize: isTablet ? 14 : 12,
    },
    statusText: {
      color: isDarkMode ? '#ccc' : '#4a4a4a',
      marginTop: 4,
      fontFamily: 'RobotoSlab-Regular',
      fontSize: isTablet ? 14 : 12,
    },
    /* Lottie Container */
    lottieContainer: {
      alignItems: 'center',
      marginVertical: isTablet ? 24 : 20,
    },
    loadingAnimation: {
      width: '100%',
      height: isTablet ? 250 : 200,
    },
    /* Complete Button */
    button: {
      backgroundColor: '#ff4500',
      paddingVertical: isTablet ? 12 : 10,
      marginHorizontal: isTablet ? 100 : 60,
      borderRadius: 25,
      alignItems: 'center',
      marginBottom: 10,
    },
    buttonText: {
      color: '#fff',
      fontSize: isTablet ? 16 : 14,
      fontFamily: 'RobotoSlab-Medium',
    },
    /* Service Details Container */
    serviceDetailsContainer: {
      flexDirection: 'column',
      backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
      padding: isTablet ? 24 : 20,
      marginTop: isTablet ? 24 : 20,
      marginHorizontal: isTablet ? 28 : 20,
      borderRadius: 10,
      marginBottom: isTablet ? 16 : 10,
    },
    serviceDetailsHeaderContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    serviceDetailsTitle: {
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'RobotoSlab-Medium',
      color: isDarkMode ? '#fff' : '#212121',
    },
    iconDetailsContainer: {
      marginVertical: 10,
      gap: 5,
      flexDirection: 'column',
    },
    detailsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 5,
    },
    detailText: {
      marginLeft: 10,
      color: isDarkMode ? '#ccc' : '#4a4a4a',
      fontFamily: 'RobotoSlab-Regular',
      fontSize: isTablet ? 14 : 12,
    },
    highlight: {
      fontFamily: 'RobotoSlab-Medium',
      color: isDarkMode ? '#fff' : '#212121',
    },
    /* Service Card */
    ServiceCardsContainer: {
      flexDirection: 'column',
      marginVertical: isTablet ? 12 : 10,
      backgroundColor: isDarkMode ? '#2c2c2c' : '#f9f9f9',
      padding: isTablet ? 18 : 15,
      borderRadius: 10,
    },
    /* Timeline Section */
    sectionContainer: {
      marginTop: 10,
    },
    serviceTimeLineContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 5,
    },
    sectionTitle: {
      fontSize: isTablet ? 16 : 14,
      fontFamily: 'RobotoSlab-SemiBold',
      color: isDarkMode ? '#fff' : '#212121',
    },
    innerContainerLine: {
      marginTop: 5,
    },
    timelineItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    iconAndLineContainer: {
      alignItems: 'center',
      width: 20,
    },
    lineSegment: {
      width: 2,
      height: isTablet ? 40 : 35,
      marginTop: 2,
    },
    timelineContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginLeft: 10,
    },
    timelineTextContainer: {
      flex: 1,
    },
    timelineText: {
      fontSize: isTablet ? 14 : 12,
      color: isDarkMode ? '#fff' : '#212121',
      fontFamily: 'RobotoSlab-Medium',
    },
    timelineTime: {
      fontSize: isTablet ? 12 : 10,
      color: isDarkMode ? '#ccc' : '#4a4a4a',
      fontFamily: 'RobotoSlab-Regular',
    },
    /* Confirmation Modal */
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    confirmationModalContainer: {
      width: isTablet ? '60%' : '80%',
      backgroundColor: isDarkMode ? '#2c2c2c' : 'white',
      borderRadius: 20,
      padding: isTablet ? 25 : 20,
      alignItems: 'center',
    },
    confirmationTitle: {
      fontSize: isTablet ? 20 : 18,
      fontFamily: 'RobotoSlab-Medium',
      marginBottom: 10,
      color: isDarkMode ? '#fff' : '#212121',
      textAlign: 'center',
    },
    confirmationSubtitle: {
      fontSize: isTablet ? 14 : 13,
      fontFamily: 'RobotoSlab-Regular',
      color: isDarkMode ? '#ccc' : '#666',
      textAlign: 'center',
      marginBottom: 20,
    },
    modalButtonsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
    },
    modalButtonCancel: {
      backgroundColor: '#a1a1a1',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 10,
      marginRight: 10,
      flex: 1,
      alignItems: 'center',
    },
    modalButtonConfirm: {
      backgroundColor: '#ff4500',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 10,
      flex: 1,
      alignItems: 'center',
    },
    modalButtonTextCancel: {
      color: '#fff',
      fontFamily: 'RobotoSlab-Medium',
    },
    modalButtonTextConfirm: {
      color: '#fff',
      fontFamily: 'RobotoSlab-Medium',
    },
  });
}

export default ServiceInProgressScreen;
 