import React, {useEffect, useState, useCallback, useRef} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Alert,
  BackHandler,
  Image,
  useWindowDimensions,
  Linking,
} from 'react-native';
import {decode} from 'base-64';
import {
  useRoute,
  useNavigation,
  CommonActions,
  useFocusEffect,
} from '@react-navigation/native';
import '../i18n/i18n';
import {useTranslation} from 'react-i18next';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../context/ThemeContext';

// Custom hooks
import useWorkerDetails from '../hooks/useWorkerDetails';
import useVerificationStatus from '../hooks/useVerificationStatus';
import useLocationTracking from '../hooks/useLocationTracking';
import useNavigationRoute from '../hooks/useNavigationRoute';
import useNavigationNotifications from '../hooks/useNavigationNotifications';
import useMapRefresh from '../hooks/useMapRefresh';

// Components
import NavigationMap from './navigation/NavigationMap';
import WorkerProfileCard from './navigation/WorkerProfileCard';
import ServiceListCard from './navigation/ServiceListCard';
import NavigationCancellationReasonModal from './navigation/NavigationCancellationReasonModal';
import NavigationCancellationConfirmationModal from './navigation/NavigationCancellationConfirmationModal';

// API services
import {
  cancelNavigationBooking,
  getWorkerPhoneNumber,
} from '../api/navigationService';

/**
 * Navigation Screen - Refactored
 * Shows real-time navigation with worker details and route
 */
const Navigation = () => {
  const {width, height} = useWindowDimensions();
  const {isDarkMode} = useTheme();
  const styles = dynamicStyles(width, height, isDarkMode);
  const isTablet = width >= 600;

  const route = useRoute();
  const navigation = useNavigation();
  const {t} = useTranslation();
  const cameraRef = useRef(null);

  // State
  const [decodedId, setDecodedId] = useState(null);
  const [encodedData, setEncodedData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Decode Base64 ID from route params
  useEffect(() => {
    const {encodedId} = route.params;
    console.log('params i am getting', encodedId);
    setEncodedData(encodedId);
    if (encodedId) {
      try {
        const decoded = decode(encodedId);
        setDecodedId(decoded);
      } catch (error) {
        console.error('Error decoding Base64:', error);
      }
    }
  }, [route.params]);

  // Custom hooks
  const {workerDetails, pin, serviceArray, loading: workerLoading, refreshWorkerDetails} =
    useWorkerDetails(decodedId, navigation);

  useVerificationStatus(decodedId, encodedData, navigation);

  const {locationDetails, loading: locationLoading, refreshLocation} =
    useLocationTracking(decodedId);

  const {routeData, cameraBounds, loading: routeLoading} =
    useNavigationRoute(locationDetails);

  useNavigationNotifications(decodedId, navigation);

  const {spin} = useMapRefresh(
    isLoading || workerLoading || locationLoading || routeLoading,
    cameraBounds,
    cameraRef,
  );

  // Override Android back button
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

  // Handle back navigation
  const handleHome = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    Promise.all([refreshWorkerDetails(), refreshLocation()])
      .then(() => setIsLoading(false))
      .catch(() => setIsLoading(false));
  }, [refreshWorkerDetails, refreshLocation]);

  // Handle phone call
  const handlePhoneCall = useCallback(async () => {
    try {
      const result = await getWorkerPhoneNumber(decodedId);
      if (result.success && result.phoneNumber) {
        const dialURL = `tel:${result.phoneNumber}`;
        Linking.openURL(dialURL).catch(err =>
          console.error('Error opening dialer:', err),
        );
      }
    } catch (error) {
      console.error('Error initiating call:', error);
    }
  }, [decodedId]);

  // Handle message/chat
  const handleMessage = useCallback(() => {
    navigation.push('ChatScreen', {
      request_id: decodedId,
      senderType: 'user',
      profileImage: workerDetails.profile,
      profileName: workerDetails.name,
    });
  }, [navigation, decodedId, workerDetails]);

  // Handle cancellation
  const handleCancelModal = useCallback(() => {
    setModalVisible(true);
  }, []);

  const handleSelectReason = useCallback(() => {
    setModalVisible(false);
    setConfirmationModalVisible(true);
  }, []);

  const handleCancelBooking = useCallback(async () => {
    setConfirmationModalVisible(false);
    setModalVisible(false);
    try {
      setIsLoading(true);
      const result = await cancelNavigationBooking(decodedId);

      if (result.success) {
        setCancelSuccess(true);
      } else {
        Alert.alert('Cancellation failed', result.error);
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      Alert.alert('Error', 'There was an error processing your cancellation.');
    } finally {
      setIsLoading(false);
    }
  }, [decodedId]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Map Container */}
        <NavigationMap
          locationDetails={locationDetails}
          routeData={routeData}
          cameraBounds={cameraBounds}
          onBack={handleHome}
          onRefresh={handleRefresh}
          isLoading={isLoading}
          spin={spin}
          isDarkMode={isDarkMode}
          isTablet={isTablet}
        />

        {/* Bottom Card */}
        <View style={styles.detailsContainer}>
          <View style={styles.minimumChargesContainer}>
            <Text style={styles.serviceFare}>
              {t('commander_on_way') || 'Commander on the way'}
            </Text>
          </View>

          <View style={styles.firstContainer}>
            <View style={styles.locationContainer}>
              <Image
                source={{
                  uri: 'https://i.postimg.cc/qvJw8Kzy/Screenshot-2024-11-13-170828-removebg-preview.png',
                }}
                style={styles.locationPinImage}
              />
              <View style={styles.locationDetails}>
                <Text style={styles.locationAddress} numberOfLines={3}>
                  {workerDetails.area}
                </Text>
              </View>
            </View>
          </View>

          {/* Service & Profile Row */}
          <View style={styles.serviceDetails}>
            <ServiceListCard
              serviceArray={serviceArray}
              pin={pin}
              onCancel={handleCancelModal}
              isDarkMode={isDarkMode}
              isTablet={isTablet}
            />

            <WorkerProfileCard
              workerDetails={workerDetails}
              onCall={handlePhoneCall}
              onMessage={handleMessage}
              isDarkMode={isDarkMode}
              isTablet={isTablet}
            />
          </View>
        </View>

        {/* Cancellation Modals */}
        <NavigationCancellationReasonModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSelectReason={handleSelectReason}
          isDarkMode={isDarkMode}
        />

        <NavigationCancellationConfirmationModal
          visible={confirmationModalVisible}
          onClose={() => setConfirmationModalVisible(false)}
          onConfirm={handleCancelBooking}
          isDarkMode={isDarkMode}
          onDismiss={() => {
            if (cancelSuccess) {
              navigation.reset({
                index: 0,
                routes: [{name: 'Tabs', params: {screen: 'Home'}}],
              });
            }
          }}
        />
      </View>
    </SafeAreaView>
  );
};

const dynamicStyles = (width, height, isDarkMode) => {
  const isTablet = width >= 600;
  const bottomCardHeight = isTablet ? 380 : 350;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
    },
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#f5f5f5',
    },
    mapContainer: {
      flex: 1,
    },
    map: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    refreshContainer: {
      position: 'absolute',
      top: isTablet ? 40 : 30,
      right: isTablet ? 30 : 20,
      backgroundColor: isDarkMode ? '#333' : '#ffffff',
      borderRadius: 25,
      padding: isTablet ? 10 : 7,
      zIndex: 999,
      elevation: 3,
    },
    leftIcon: {
      position: 'absolute',
      top: isTablet ? 40 : 30,
      left: isTablet ? 30 : 20,
      backgroundColor: isDarkMode ? '#333' : '#ffffff',
      borderRadius: 25,
      padding: isTablet ? 10 : 7,
      zIndex: 999,
      elevation: 3,
    },
    detailsContainer: {
      height: bottomCardHeight,
      backgroundColor: isDarkMode ? '#333' : '#ffffff',
      padding: isTablet ? 20 : 15,
      paddingHorizontal: isTablet ? 30 : 20,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: -5},
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 10,
    },
    minimumChargesContainer: {
      height: isTablet ? 50 : 46,
      backgroundColor: isDarkMode ? '#444' : '#f6f6f6',
      borderRadius: 32,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 10,
      marginBottom: isTablet ? 15 : 0,
    },
    serviceFare: {
      textAlign: 'center',
      marginBottom: 10,
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'RobotoSlab-Bold',
      color: isDarkMode ? '#fff' : '#1D2951',
    },
    firstContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    locationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: isTablet ? 12 : 10,
      width: '90%',
    },
    locationPinImage: {
      width: isTablet ? 24 : 20,
      height: isTablet ? 24 : 20,
      marginRight: 10,
    },
    locationDetails: {
      marginLeft: 10,
    },
    locationAddress: {
      fontSize: isTablet ? 15 : 13,
      fontFamily: 'RobotoSlab-Regular',
      color: isDarkMode ? '#fff' : '#212121',
    },
    serviceDetails: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      width: '100%',
      marginTop: 10,
    },
    leftSection: {
      flex: 1, // Occupies leftover horizontal space
      marginRight: 10,
    },
    serviceType: {
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'RobotoSlab-Medium',
      marginTop: 10,
      color: isDarkMode ? '#aaa' : '#9e9e9e',
    },
    servicesListContainer: {
      position: 'relative',
      marginTop: 5,
    },
    servicesNamesContainer: {
      maxHeight: isTablet ? 80 : 60, // Restrict the height so it doesn't overflow
    },
    servicesNamesContent: {
      flexDirection: 'column',
      paddingVertical: 10,
    },
    serviceItem: {
      marginBottom: 5,
    },
    serviceText: {
      color: isDarkMode ? '#fff' : '#212121',
      fontFamily: 'RobotoSlab-Medium',
      fontSize: isTablet ? 15 : 14,
      marginTop: 5,
    },
    arrowUpContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      alignItems: 'center',
      backgroundColor: isDarkMode
        ? 'rgba(0, 0, 0, 0.8)'
        : 'rgba(255, 255, 255, 0.8)',
      zIndex: 1,
    },
    arrowDownContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      alignItems: 'center',
      backgroundColor: isDarkMode
        ? 'rgba(0, 0, 0, 0.8)'
        : 'rgba(255, 255, 255, 0.8)',
      zIndex: 1,
    },
    pinContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 10,
      paddingVertical: 10,
    },
    pinText: {
      color: isDarkMode ? '#ccc' : '#9e9e9e',
      fontFamily: 'RobotoSlab-Regular',
      fontSize: isTablet ? 20 : 18,
      paddingTop: 10,
    },
    pinBoxesContainer: {
      flexDirection: 'row',
      gap: 5,
    },
    pinBox: {
      width: isTablet ? 24 : 20,
      height: isTablet ? 24 : 20,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDarkMode ? '#fff' : '#212121',
      borderRadius: 5,
    },
    pinNumber: {
      color: isDarkMode ? '#fff' : '#212121',
      fontFamily: 'RobotoSlab-Regular',
      fontSize: isTablet ? 16 : 14,
    },
    cancelButton: {
      backgroundColor: isDarkMode ? '#333' : '#FFFFFF',
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 1,
      width: isTablet ? 100 : 80,
      height: isTablet ? 40 : 35,
    },
    cancelText: {
      fontSize: isTablet ? 15 : 13,
      color: isDarkMode ? '#ccc' : '#4a4a4a',
      fontFamily: 'RobotoSlab-Regular',
    },
    rightSection: {
      width: isTablet ? 130 : 110, // Adjust as needed
      alignItems: 'center',
    },
    profileImage: {
      flexDirection: 'row',
      justifyContent: 'center',
    },
    image: {
      width: isTablet ? 70 : 60,
      height: isTablet ? 70 : 60,
      borderRadius: 50,
    },
    workerName: {
      color: isDarkMode ? '#fff' : '#212121',
      textAlign: 'center',
      marginTop: 5,
      fontSize: isTablet ? 16 : 14,
      fontFamily: 'RobotoSlab-Medium',
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    ServiceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    ratingNumber: {
      marginRight: 5,
      fontSize: isTablet ? 18 : 16,
      color: isDarkMode ? '#fff' : '#212121',
      fontFamily: 'RobotoSlab-Regular',
    },
    ServiceNumber: {
      fontSize: isTablet ? 16 : 15,
      fontFamily: 'RobotoSlab-Regular',
      color: isDarkMode ? '#fff' : '#212121',
    },
    iconsContainer: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 10,
    },
    actionButton: {
      backgroundColor: isDarkMode ? '#555' : '#EFDCCB',
      height: isTablet ? 40 : 35,
      width: isTablet ? 40 : 35,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
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
      padding: isTablet ? 30 : 20,
      paddingBottom: isTablet ? 40 : 30,
    },
    modalTitle: {
      fontSize: isTablet ? 20 : 18,
      fontFamily: 'RobotoSlab-Medium',
      textAlign: 'center',
      marginBottom: 5,
      color: isDarkMode ? '#fff' : '#000',
    },
    modalSubtitle: {
      fontSize: isTablet ? 16 : 14,
      fontFamily: 'RobotoSlab-Regular',
      color: isDarkMode ? '#ccc' : '#666',
      textAlign: 'center',
      marginBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#555' : '#eee',
      paddingBottom: 10,
    },
    reasonButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: isTablet ? 18 : 15,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#555' : '#eee',
    },
    reasonText: {
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'RobotoSlab-Regular',
      color: isDarkMode ? '#fff' : '#333',
    },
    backButtonContainer: {
      width: isTablet ? 45 : 40,
      height: isTablet ? 45 : 40,
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
    crossContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    confirmationModalContainer: {
      backgroundColor: isDarkMode ? '#333' : 'white',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: isTablet ? 50 : 40,
      paddingBottom: isTablet ? 40 : 30,
      paddingHorizontal: isTablet ? 30 : 20,
      alignItems: 'center',
    },
    confirmationTitle: {
      fontSize: isTablet ? 20 : 18,
      fontFamily: 'RobotoSlab-Medium',
      textAlign: 'center',
      paddingBottom: 10,
      marginBottom: 5,
      color: isDarkMode ? '#fff' : '#000',
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#555' : '#eee',
    },
    confirmationSubtitle: {
      fontSize: isTablet ? 16 : 14,
      fontFamily: 'RobotoSlab-Regular',
      color: isDarkMode ? '#ccc' : '#666',
      textAlign: 'center',
      marginBottom: 20,
      paddingBottom: 10,
      paddingTop: 10,
    },
    confirmButton: {
      backgroundColor: '#FF4500',
      borderRadius: 40,
      paddingVertical: isTablet ? 18 : 15,
      paddingHorizontal: isTablet ? 50 : 40,
      alignItems: 'center',
    },
    confirmButtonText: {
      color: 'white',
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'RobotoSlab-Medium',
    },
    classicWarningBox: {
      backgroundColor: isDarkMode ? '#2c2c2c' : '#fff8e1', // Light yellow in light mode, dark in dark mode
      borderColor: isDarkMode ? '#ffa726' : '#ff9800',
      borderWidth: 1,
      borderRadius: 10,
      padding: 12,
      marginTop: 20,
      marginBottom: 20,
    },
    classicWarningTitle: {
      fontSize: 15,
      fontWeight: 'bold',
      color: isDarkMode ? '#ffa726' : '#e65100',
      marginBottom: 8,
    },
    classicWarningText: {
      fontSize: 13,
      color: isDarkMode ? '#ddd' : '#4e342e',
      textAlign: 'center',
    },
  });
};

export default Navigation;
