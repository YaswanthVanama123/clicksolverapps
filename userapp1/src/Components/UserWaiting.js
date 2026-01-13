import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  BackHandler,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  CommonActions,
  useFocusEffect,
} from '@react-navigation/native';
import {Buffer} from 'buffer';
import {useTheme} from '../context/ThemeContext';
import '../i18n/i18n';
import {useTranslation} from 'react-i18next';

// Custom hooks
import useStatusPolling from '../hooks/useStatusPolling';
import useWaitingScreenNotifications from '../hooks/useWaitingScreenNotifications';
import useAutoRetry from '../hooks/useAutoRetry';
import useCountdownTimer from '../hooks/useCountdownTimer';

// Components
import WaitingMap from './waiting/WaitingMap';
import WaitingContent from './waiting/WaitingContent';
import CancellationReasonModal from './waiting/CancellationReasonModal';
import CancellationConfirmationModal from './waiting/CancellationConfirmationModal';

// API services
import {
  fetchNearbyWorkers,
  cancelBooking,
} from '../api/bookingService';

/**
 * WaitingUser Screen - Refactored
 * Screen shown after booking, waiting for worker to accept
 */
const WaitingUser = () => {
  const {isDarkMode} = useTheme();
  const styles = dynamicStyles(isDarkMode);
  const route = useRoute();
  const navigation = useNavigation();
  const {t} = useTranslation();

  // Extract route params
  const {
    area,
    city,
    pincode,
    alternateName,
    alternatePhoneNumber,
    serviceBooked,
    location,
    discount,
    tipAmount,
    offer,
    encodedId: initialEncodedId,
  } = route.params;

  // State
  const [decodedId, setDecodedId] = useState(null);
  const [encodedData, setEncodedData] = useState(initialEncodedId || null);
  const [backendLoading, setBackendLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');

  // Decode encodedData
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

  // Fetch nearby workers on mount
  const fetchData = useCallback(async () => {
    setBackendLoading(true);
    try {
      const result = await fetchNearbyWorkers({
        area,
        city,
        pincode,
        alternateName,
        alternatePhoneNumber,
        serviceBooked,
        discount,
        tipAmount,
        offer,
      });

      if (result.success) {
        setEncodedData(result.data);
      }
    } catch (error) {
      console.error('Error fetching nearby workers:', error);
    } finally {
      setBackendLoading(false);
    }
  }, [area, city, pincode, alternateName, alternatePhoneNumber, serviceBooked, discount, tipAmount, offer]);

  // Fetch data if no initial encodedId
  useEffect(() => {
    if (!initialEncodedId) {
      fetchData();
    }
  }, [initialEncodedId, fetchData]);

  // Custom hooks
  useStatusPolling({
    decodedId,
    encodedData,
    service: serviceBooked,
    offer,
    navigation,
    pollInterval: 110000,
  });

  useWaitingScreenNotifications({
    decodedId,
    encodedData,
    service: serviceBooked,
    navigation,
  });

  useAutoRetry({
    decodedId,
    encodedData,
    offer,
    navigation,
    fetchData,
    maxAttempts: 3,
    retryInterval: 120000,
  });

  const {formattedTime} = useCountdownTimer(serviceBooked, 600);

  // Handle back button - show cancellation modal
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        setModalVisible(true);
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, []),
  );

  // Handle manual cancel
  const handleManualCancel = () => {
    setModalVisible(true);
  };

  // Handle reason selection
  const handleSelectReason = reason => {
    setSelectedReason(reason);
    setModalVisible(false);
    setConfirmationModalVisible(true);
  };

  // Handle booking cancellation
  const handleCancelBooking = async () => {
    setConfirmationModalVisible(false);
    setBackendLoading(true);

    try {
      await cancelBooking(decodedId, selectedReason, encodedData, offer);

      // Navigate to home
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{name: 'Tabs', state: {routes: [{name: 'Home'}]}}],
        }),
      );
    } catch (error) {
      console.error('Error cancelling booking:', error);
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

  return (
    <View style={styles.container}>
      {/* Map Section */}
      <WaitingMap location={location} />

      {/* Waiting Content */}
      <WaitingContent onCancel={handleManualCancel} isDarkMode={isDarkMode} />

      {/* Loading Overlay */}
      {backendLoading && (
        <View style={styles.activityIndicatorOverlay}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}

      {/* Cancellation Reason Modal */}
      <CancellationReasonModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelectReason={handleSelectReason}
        isDarkMode={isDarkMode}
      />

      {/* Cancellation Confirmation Modal */}
      <CancellationConfirmationModal
        visible={confirmationModalVisible}
        onClose={() => setConfirmationModalVisible(false)}
        onConfirm={handleCancelBooking}
        isDarkMode={isDarkMode}
      />
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
