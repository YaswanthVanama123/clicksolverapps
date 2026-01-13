import React, {useState, useCallback} from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
  Dimensions,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {CommonActions, useNavigation, useFocusEffect, useRoute} from '@react-navigation/native';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Octicons from 'react-native-vector-icons/Octicons';
import EvilIcons from 'react-native-vector-icons/AntDesign';
import {useTheme} from '../context/ThemeContext';
import {useTranslation} from 'react-i18next';
import '../i18n/i18n';

// Custom hooks
import useUserLocation from '../hooks/useUserLocation';
import useGeofencing from '../hooks/useGeofencing';
import useReverseGeocode from '../hooks/useReverseGeocode';

// Components
import LocationMap from './location/LocationMap';
import ServiceList from './location/ServiceList';
import OutOfServiceModal from './location/OutOfServiceModal';
import AddressConfirmationModal from './location/AddressConfirmationModal';

// API services
import {sendUserLocation, fetchUserData} from '../api/locationService';

/**
 * UserLocation Screen - Refactored
 * Allows users to select location, confirm address, and proceed with booking
 */
const UserLocation = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {isDarkMode} = useTheme();
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();

  // Extract route params
  const {serviceName, savings, tipAmount, offer, suggestion} = route.params;

  // State
  const [service, setService] = useState(serviceName || []);
  const [discount, setDiscount] = useState(savings || 0);
  const [inputText, setInputText] = useState(suggestion ? suggestion.title : '');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [showMessageBox, setShowMessageBox] = useState(false);
  const [showOutOfPolygonModal, setShowOutOfPolygonModal] = useState(false);

  // Address form state
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [pincode, setPincode] = useState('');
  const [alternatePhoneNumber, setAlternatePhoneNumber] = useState('');
  const [alternateName, setAlternateName] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Custom hooks
  const {location, loading: locationLoading, updateLocation, refreshLocation} = useUserLocation(suggestion);
  const {validateLocation, geofenceFeatures} = useGeofencing();
  const {addressData} = useReverseGeocode();

  // Update address fields when geocoding completes
  React.useEffect(() => {
    if (addressData.city) setCity(addressData.city);
    if (addressData.area) setArea(addressData.area);
    if (addressData.pincode) setPincode(addressData.pincode);
  }, [addressData]);

  // Send location to backend whenever it changes
  React.useEffect(() => {
    if (location) {
      const [lon, lat] = location;
      sendUserLocation(lon, lat);
    }
  }, [location]);

  // Handle Android back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleBackPress();
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, []),
  );

  // Handle map location press
  const handlePressLocation = e => {
    const coordinates = e.geometry.coordinates;
    const [lon, lat] = coordinates;
    updateLocation(lon, lat);
  };

  // Handle crosshairs press (refresh location)
  const handleCrosshairsPress = () => {
    setInputText('');
    refreshLocation();
  };

  // Handle back navigation
  const handleBackPress = () => {
    navigation.goBack();
  };

  // Validate form fields
  const validateForm = () => {
    const errors = {};
    if (!city) errors.city = t('city_required') || 'City is required.';
    if (!area) errors.area = t('area_required') || 'Area is required.';
    if (!pincode) errors.pincode = t('pincode_required') || 'Pincode is required.';
    if (!alternatePhoneNumber) errors.phone = t('phone_required') || 'Phone number is required.';
    if (!alternateName) errors.name = t('name_required') || 'Name is required.';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle location confirmation
  const handleConfirmLocation = async () => {
    setConfirmLoading(true);

    // Validate geofence
    if (location) {
      const {isValid} = validateLocation(location);
      if (!isValid) {
        setShowOutOfPolygonModal(true);
        setConfirmLoading(false);
        return;
      }
    }

    // Fetch user data
    const result = await fetchUserData();
    if (result.success) {
      setAlternatePhoneNumber(result.data.phoneNumber);
      setAlternateName(result.data.name);
      setShowMessageBox(true);
    } else {
      console.error('Failed to fetch user data');
    }

    setConfirmLoading(false);
  };

  // Handle "Remind Me" for out-of-service location
  const handleRemindMe = async () => {
    setShowOutOfPolygonModal(false);
  };

  // Handle booking confirmation
  const handleBookCommander = () => {
    if (!validateForm()) {
      return;
    }

    setShowMessageBox(false);
    setTimeout(() => {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: 'userwaiting',
              params: {
                area,
                city,
                pincode,
                alternateName,
                alternatePhoneNumber,
                serviceBooked: service,
                location,
                discount,
                tipAmount,
                offer: offer || null,
              },
            },
          ],
        }),
      );
    }, 0);
  };

  return (
    <SafeAreaView style={styles.page}>
      {/* Search Box */}
      <View style={styles.searchBoxContainer}>
        <View style={styles.searchInnerContainer}>
          <TouchableOpacity onPress={handleBackPress} style={{marginRight: 10}}>
            <FontAwesome6 name="arrow-left-long" size={18} color="gray" />
          </TouchableOpacity>
          <View style={{marginRight: 10}}>
            <Octicons name="dot-fill" size={17} color="#4CAF50" />
          </View>
          <TextInput
            style={styles.searchBox}
            placeholder={t('search_location') || 'Search location ...'}
            placeholderTextColor={isDarkMode ? '#ccc' : '#1D2951'}
            value={inputText}
            onChangeText={setInputText}
            onFocus={() =>
              navigation.replace('LocationSearch', {
                serviceName,
                savings,
                tipAmount,
                offer,
              })
            }
          />
          <TouchableOpacity onPress={() => setInputText('')}>
            <EvilIcons name="hearto" size={20} color="#808080" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Map */}
      <LocationMap
        location={location}
        onLocationPress={handlePressLocation}
        geofenceFeatures={geofenceFeatures}
        height={Dimensions.get('window').height * 0.75}
        isDarkMode={isDarkMode}
      />

      {locationLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5722" />
        </View>
      )}

      {/* Booking Card */}
      <View
        style={[
          styles.bookingCard,
          {height: Dimensions.get('window').height * 0.3},
        ]}>
        <View>
          <ServiceList services={service} discount={discount} isDarkMode={isDarkMode} />
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirmLocation}>
            {confirmLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmButtonText}>
                {t('confirm_location') || 'Confirm Location'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Out of Service Modal */}
      <OutOfServiceModal
        visible={showOutOfPolygonModal}
        onClose={() => setShowOutOfPolygonModal(false)}
        onRemindMe={handleRemindMe}
        city={city}
        isDarkMode={isDarkMode}
      />

      {/* Address Confirmation Modal */}
      <AddressConfirmationModal
        visible={showMessageBox}
        onClose={() => setShowMessageBox(false)}
        onConfirm={handleBookCommander}
        loading={false}
        city={city}
        setCity={setCity}
        area={area}
        setArea={setArea}
        pincode={pincode}
        setPincode={setPincode}
        alternatePhoneNumber={alternatePhoneNumber}
        setAlternatePhoneNumber={setAlternatePhoneNumber}
        alternateName={alternateName}
        setAlternateName={setAlternateName}
        errors={formErrors}
        isDarkMode={isDarkMode}
      />

      {/* Crosshairs Button */}
      <View style={styles.crosshairsContainer}>
        <TouchableOpacity onPress={handleCrosshairsPress}>
          <FontAwesome6
            name="location-crosshairs"
            size={24}
            color={isDarkMode ? '#f7f7f7' : 'gray'}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    page: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#fff',
    },
    container: {
      flex: 1,
    },
    searchBoxContainer: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 60 : 30,
      left: 0,
      right: 0,
      zIndex: 1,
      alignItems: 'center',
    },

    searchInnerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#333' : '#fff',
      borderRadius: 9,
      width: '90%',
      elevation: Platform.OS === 'android' ? 10 : 0, // Android shadow
      shadowColor: Platform.OS === 'ios' ? '#000' : undefined,
      shadowOffset: Platform.OS === 'ios' ? {width: 0, height: 2} : undefined,
      shadowOpacity: Platform.OS === 'ios' ? 0.2 : undefined,
      shadowRadius: Platform.OS === 'ios' ? 4 : undefined,
      paddingHorizontal: 10,
      height: Platform.OS === 'ios' ? 60 : 55, // Slightly taller for iOS
    },
    searchBox: {
      flex: 1,
      color: isDarkMode ? '#fff' : '#1D2951',
      fontSize: 14,
      paddingHorizontal: 5,
    },
    map: {
      flex: 1,
    },
    markerContainer: {
      backgroundColor: 'transparent',
    },
    marker: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#ff0000',
    },
    loadingContainer: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDarkMode
        ? 'rgba(18,18,18,0.8)'
        : 'rgba(255,255,255,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    bookingCard: {
      padding: 10,
      paddingHorizontal: 20,
      position: 'absolute',
      backgroundColor: isDarkMode ? '#333' : '#fff',
      borderRadius: 20,
      width: '100%',
      bottom: 0,
      elevation: 5,
    },
    flatContainer: {
      height: '77%',
    },
    serviceItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
    },
    serviceName: {
      fontSize: 14,
      color: isDarkMode ? '#fff' : '#212121',
      width: 90,
    },
    cost: {
      fontSize: 14,
      color: isDarkMode ? '#fff' : '#212121',
    },
    strikeThrough: {
      textDecorationLine: 'line-through',
      color: '#888',
    },
    horizantalLine: {
      width: '100%',
      height: 4,
      backgroundColor: isDarkMode ? '#555' : '#f5f5f5',
    },
    confirmButton: {
      backgroundColor: '#FF4500',
      padding: 10,
      borderRadius: 5,
    },
    confirmButtonText: {
      color: '#FFFFFF',
      textAlign: 'center',
      fontSize: 16,
    },
    messageBoxBackdrop: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    messageBox: {
      width: '80%',
      padding: 20,
      backgroundColor: isDarkMode ? '#333' : '#fff',
      borderRadius: 10,
      elevation: 10,
    },
    completeAddressHead: {
      fontSize: 18,
      marginBottom: 10,
      color: isDarkMode ? '#fff' : '#1D2951',
    },
    label: {
      color: isDarkMode ? '#ccc' : '#808080',
      fontSize: 12,
      padding: 5,
    },
    inputView: {
      marginBottom: 10,
    },
    input: {
      height: 40,
      borderColor: '#ddd',
      borderWidth: 1,
      borderRadius: 5,
      paddingHorizontal: 10,
      color: isDarkMode ? '#fff' : '#000',
    },
    bookButton: {
      backgroundColor: '#ff4500',
      padding: 10,
      borderRadius: 6,
      marginTop: 10,
    },
    bookButtonText: {
      color: '#FFFFFF',
      textAlign: 'center',
      fontSize: 16,
    },
    closeButton: {
      position: 'absolute',
      top: 10,
      right: 10,
      backgroundColor: isDarkMode ? '#555' : '#f2f2f2',
      borderRadius: 15,
      width: 30,
      height: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeButtonText: {
      color: '#fff',
      fontSize: 20,
    },
    errorText: {
      color: '#ff0000',
      fontSize: 12,
    },
    crosshairsContainer: {
      position: 'absolute',
      right: 20,
      bottom: 290,
      backgroundColor: isDarkMode ? '#333' : '#fff',
      borderRadius: 25,
      padding: 10,
      elevation: 5,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: isDarkMode ? '#333' : '#fff',
      padding: 20,
      borderRadius: 8,
      width: '80%',
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
      color: isDarkMode ? '#fff' : '#212121',
    },
    modalMessage: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 20,
      color: isDarkMode ? '#ccc' : '#212121',
    },
    modalCancelButton: {
      backgroundColor: isDarkMode ? '#555' : '#f5f5f5',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 6,
      marginHorizontal: 5,
    },
    modalCancelButtonText: {
      color: isDarkMode ? '#fff' : '#9e9e9e',
      fontSize: 16,
      fontWeight: '600',
    },
    modalButton: {
      backgroundColor: '#ff6f00',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 6,
      marginHorizontal: 5,
    },
    modalButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    loadingContent: {
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 10,
      fontSize: 14,
      color: isDarkMode ? '#fff' : '#000',
    },
  });

export default UserLocation;
