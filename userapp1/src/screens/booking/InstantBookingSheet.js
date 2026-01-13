import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LottieView from 'lottie-react-native';
import EncryptedStorage from 'react-native-encrypted-storage';
import axios from 'axios';
import Geolocation from 'react-native-geolocation-service';
import {check, request, PERMISSIONS, RESULTS, openSettings} from 'react-native-permissions';
import {Places} from 'ola-maps';
import {useTheme} from '../../context/ThemeContext';
import useBookingStore from '../../store/bookingStore';

// Import translations
import '../../i18n/i18n';
import {useTranslation} from 'react-i18next';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
const placesClient = new Places('iN1RT7PQ41Z0DVxin6jlf7xZbmbIZPtb9CyNwtlT');

const InstantBookingSheet = ({
  visible,
  onClose,
  preSelectedService = null,
  preSelectedAddress = null,
  navigation,
}) => {
  const {t} = useTranslation();
  const {isDarkMode} = useTheme();
  const styles = dynamicStyles(isDarkMode);

  // Zustand store
  const {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    setAddress,
    setTip,
    applyOffer,
    startBooking,
    completeBooking,
    selectedAddress,
    tipAmount,
    appliedOffer,
    discount,
  } = useBookingStore();

  // Step management
  const [currentStep, setCurrentStep] = useState(preSelectedService ? 2 : 1);
  const [service, setService] = useState(preSelectedService);
  const [subServices, setSubServices] = useState([]);
  const [quantities, setQuantities] = useState({});

  // Location state
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [pincode, setPincode] = useState('');
  const [alternateName, setAlternateName] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');

  // Offers
  const [offers, setOffers] = useState([]);
  const [showOffers, setShowOffers] = useState(false);

  // Success state
  const [showSuccess, setShowSuccess] = useState(false);
  const [bookingId, setBookingId] = useState(null);

  // Loading
  const [loading, setLoading] = useState(false);

  // Animation
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Tip options
  const tipOptions = [50, 75, 100, 150, 200];

  // Polygon geofences (copy from userLocation.js)
  const polygonGeofences = [
    {
      id: 'zone1',
      coordinates: [
        [17.006761409194525, 80.53093335197622],
        [17.005373260064985, 80.53291176992008],
        [16.998813039026402, 80.52664649280518],
        [16.993702747389463, 80.52215964720267],
        [16.98846563857974, 80.5205112174242],
        [16.985436512096513, 80.52097340481015],
        [16.982407772736835, 80.51886205401541],
        [16.987520443064497, 80.51325397397363],
        [16.99023324951544, 80.51463921162184],
        [16.995343035509578, 80.51463907310551],
        [16.997739960285273, 80.5172774280341],
        [16.998812144956858, 80.5151667160207],
        [17.001713715885202, 80.51609017256038],
        [17.002827038610846, 80.51776432647671],
        [17.003291715895045, 80.52011454583169],
        [17.00505854929827, 80.52875703518436],
        [17.00682448638898, 80.5309333429243],
        [17.006761409194525, 80.53093335197622],
      ],
    },
    {
      id: 'zone2',
      coordinates: [
        [16.743659016732067, 81.08236641250511],
        [16.74034916284056, 81.1094786505995],
        [16.75332517520627, 81.11236934565574],
        [16.75189061713202, 81.12344773457119],
        [16.74132482137297, 81.13930188707656],
        [16.738499354073056, 81.14316076908437],
        [16.727924964128718, 81.14435289187736],
        [16.72342039833586, 81.14527321552549],
        [16.714353330434236, 81.14475480852309],
        [16.703383261743355, 81.13502168775335],
        [16.696706590762375, 81.11606570973981],
        [16.690277614635917, 81.11161284859327],
        [16.690514707521203, 81.10219147444412],
        [16.682222407654322, 81.09411194809388],
        [16.680443872924542, 81.08526753004003],
        [16.681096564850336, 81.08063131598783],
        [16.68719744307066, 81.07017793961404],
        [16.70130255228827, 81.06808977263063],
        [16.696116367178703, 81.04868074812543],
        [16.712614628885774, 81.05789409014807],
        [16.730789178638346, 81.06475183815792],
        [16.74056558441238, 81.0761195443987],
        [16.743659016732067, 81.08236641250511],
      ],
    },
    {
      id: 'zone3',
      coordinates: [
        [16.67255137959924, 81.03321330178159],
        [16.6824145262823, 81.04647950748898],
        [16.6901906618056, 81.05994340182195],
        [16.694552978963202, 81.06568533268029],
        [16.677859504990124, 81.07340809687918],
        [16.681463988530027, 81.09657586209278],
        [16.68506890661233, 81.11340498431895],
        [16.68392977309564, 81.12271419996296],
        [16.68750736693913, 81.13547809505661],
        [16.689781680226105, 81.14855623455043],
        [16.701923001073155, 81.14795977957687],
        [16.710268916909044, 81.13191111175911],
        [16.710459773455327, 81.13230954617364],
        [16.715581889330167, 81.14954722240287],
        [16.734167808346427, 81.14736380596997],
        [16.749717375531958, 81.14795614271736],
        [16.753503098884124, 81.12557160723918],
        [16.75689984714704, 81.10200134965078],
        [16.739837869176796, 81.07013329316601],
        [16.719937818724915, 81.05944242728924],
        [16.707614321072228, 81.04677046623345],
        [16.707993326270454, 81.0238103387914],
        [16.672526135042432, 81.03270663044418],
      ],
    },
    {
      id: 'zone4',
      coordinates: [
        [17.091730887270444, 80.60650204489468],
        [17.09513456976032, 80.62335172753689],
        [17.109038349803853, 80.63004799391479],
        [17.121936424446076, 80.63527313830275],
        [17.131033832357872, 80.6446897485315],
        [17.13762235049235, 80.62366357630856],
        [17.13463581504783, 80.60368200587993],
      ],
    },
    {
      id: 'gachibowli',
      coordinates: [
        [17.441144863330976, 78.3376254568987],
        [17.428701935872226, 78.35687667241433],
        [17.42800101387249, 78.3767413879973],
        [17.43381411455306, 78.38748327347525],
        [17.445021109810384, 78.40529511275628],
        [17.47106054889956, 78.3945966028669],
        [17.472566887863067, 78.37674057114202],
        [17.467409875390615, 78.35340358285953],
        [17.45496302403113, 78.34790606796042],
        [17.441697955004187, 78.33820169415065],
        [17.441144863330976, 78.3376254568987],
      ],
    },
  ];

  // Geofence check
  const isPointInPolygon = (point, polygon) => {
    const x = point[1];
    const y = point[0];
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0],
        yi = polygon[i][1];
      const xj = polygon[j][0],
        yj = polygon[j][1];
      const intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Fetch offers
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const token = await EncryptedStorage.getItem('cs_token');
        if (!token) return;
        const response = await axios.get(
          'https://backend.clicksolver.com/api/user/offers',
          {headers: {Authorization: `Bearer ${token}`}},
        );
        setOffers(response.data.offers || []);
      } catch (error) {
        console.error('Error fetching offers:', error);
      }
    };
    if (visible) {
      fetchOffers();
    }
  }, [visible]);

  // Fetch saved addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const token = await EncryptedStorage.getItem('cs_token');
        if (!token) return;
        const response = await axios.get(
          'https://backend.clicksolver.com/api/user/addresses',
          {headers: {Authorization: `Bearer ${token}`}},
        );
        setSavedAddresses(response.data.addresses || []);
      } catch (error) {
        console.error('Error fetching addresses:', error);
      }
    };
    if (visible && currentStep === 2) {
      fetchAddresses();
    }
  }, [visible, currentStep]);

  // Animate step transitions
  const goToStep = nextStep => {
    const direction = nextStep > currentStep ? 1 : -1;
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: direction * SCREEN_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start();
    setCurrentStep(nextStep);
  };

  // Handle quantity changes
  const handleQuantityChange = (id, delta) => {
    setQuantities(prev => {
      const currentQty = prev[id] || 0;
      const newQty = Math.max(0, currentQty + delta);
      return {...prev, [id]: newQty};
    });
  };

  // Calculate totals
  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal - discount + tipAmount;
  };

  // Request location permission
  const requestLocationPermission = async () => {
    try {
      let status;
      if (Platform.OS === 'android') {
        status = (await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ))
          ? RESULTS.GRANTED
          : await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            );
      } else {
        status = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        if (status === RESULTS.DENIED) {
          status = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        }
      }

      if (status === RESULTS.BLOCKED) {
        Alert.alert(
          t('location_permission_blocked_title') || 'Location Disabled',
          t('location_permission_blocked_message') ||
            'Please enable location access in Settings.',
          [
            {text: t('cancel') || 'Cancel', style: 'cancel'},
            {text: t('open_settings') || 'Open Settings', onPress: openSettings},
          ],
        );
        return false;
      }
      return status === RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  // Get current location
  const handleCurrentLocation = async () => {
    setLocationLoading(true);
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setLocationLoading(false);
      return;
    }

    Geolocation.getCurrentPosition(
      async position => {
        const {latitude, longitude} = position.coords;
        setLocation([longitude, latitude]);

        // Reverse geocode
        try {
          const response = await placesClient.reverse_geocode(latitude, longitude);
          if (response?.body?.results?.length > 0) {
            const place = response.body.results[0];
            const addressComponents = place.address_components;

            const extractedPincode =
              addressComponents.find(c => c.types.includes('postal_code'))
                ?.long_name || '';
            let extractedCity =
              addressComponents.find(c => c.types.includes('locality'))
                ?.long_name || '';
            if (!extractedCity) {
              extractedCity =
                addressComponents.find(c =>
                  c.types.includes('administrative_area_level_3'),
                )?.long_name || '';
            }
            const extractedArea = place.formatted_address || '';

            setCity(extractedCity);
            setArea(extractedArea);
            setPincode(extractedPincode);

            // Check geofence
            const inGeofence = polygonGeofences.some(fence =>
              isPointInPolygon([longitude, latitude], fence.coordinates),
            );

            if (!inGeofence) {
              Alert.alert(
                t('location_not_serviceable') || 'Location Not Serviceable',
                t('location_not_available') ||
                  'We are not available in this area yet.',
              );
            }
          }
        } catch (error) {
          console.error('Error reverse geocoding:', error);
        }
        setLocationLoading(false);
      },
      error => {
        console.error('Geolocation error:', error);
        setLocationLoading(false);
      },
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
    );
  };

  // Handle offer application
  const handleApplyOffer = async offerCode => {
    if (appliedOffer === offerCode) {
      applyOffer(null);
      return;
    }
    try {
      const token = await EncryptedStorage.getItem('cs_token');
      if (!token) return;
      const subtotal = calculateSubtotal();
      const response = await axios.post(
        'https://backend.clicksolver.com/api/user/validate-offer',
        {offer_code: offerCode, totalAmount: subtotal},
        {headers: {Authorization: `Bearer ${token}`}},
      );

      if (response.data.valid) {
        applyOffer({
          code: offerCode,
          type: 'percentage',
          value: response.data.discountAmount,
          maxDiscount: response.data.discountAmount,
        });
      } else {
        Alert.alert(
          t('offer_not_valid') || 'Invalid Offer',
          response.data.error || t('offer_not_applicable'),
        );
      }
    } catch (error) {
      console.error('Error validating offer:', error);
    }
  };

  // Handle booking confirmation
  const handleConfirmBooking = async () => {
    if (!city || !area || !pincode) {
      Alert.alert(
        t('incomplete_address') || 'Incomplete Address',
        t('please_complete_address') || 'Please complete all address fields.',
      );
      return;
    }

    // Check geofence
    if (location) {
      const inGeofence = polygonGeofences.some(fence =>
        isPointInPolygon(location, fence.coordinates),
      );
      if (!inGeofence) {
        Alert.alert(
          t('location_not_serviceable') || 'Location Not Serviceable',
          t('location_not_available') ||
            'We are not available in this area yet.',
        );
        return;
      }
    }

    setLoading(true);

    try {
      const bookingData = {
        services: cart,
        address: {
          city,
          area,
          pincode,
          location,
          alternateName,
          alternatePhone,
        },
        tip: tipAmount,
        offer: appliedOffer,
        discount,
      };

      // Submit booking - background worker matching
      const response = await startBooking(bookingData);

      if (response.success) {
        setBookingId(response.bookingId);
        setShowSuccess(true);

        // Auto-close and navigate after 2 seconds
        setTimeout(() => {
          setShowSuccess(false);
          completeBooking();
          onClose();
          navigation.navigate('TrackingScreen', {bookingId: response.bookingId});
        }, 2000);
      } else {
        Alert.alert(
          t('booking_failed') || 'Booking Failed',
          response.error || t('please_try_again'),
        );
      }
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert(
        t('booking_failed') || 'Booking Failed',
        t('please_try_again') || 'Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  // Render Step 1: Service Selection
  const renderServiceSelection = () => (
    <Animated.View style={[styles.stepContainer, {transform: [{translateX: slideAnim}]}]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {service && (
          <View style={styles.serviceCard}>
            {service.image && (
              <Image source={{uri: service.image}} style={styles.serviceImage} />
            )}
            <Text style={styles.serviceName}>{service.name}</Text>
            <Text style={styles.serviceDescription}>{service.description}</Text>
            <Text style={styles.servicePrice}>₹{service.price}</Text>

            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(service.id, -1)}>
                <Entypo
                  name="minus"
                  size={20}
                  color={isDarkMode ? '#fff' : '#4a4a4a'}
                />
              </TouchableOpacity>
              <Text style={styles.quantityText}>
                {quantities[service.id] || 0}
              </Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(service.id, 1)}>
                <Entypo
                  name="plus"
                  size={20}
                  color={isDarkMode ? '#fff' : '#4a4a4a'}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {subServices.length > 0 && (
          <View style={styles.subServicesContainer}>
            <Text style={styles.sectionTitle}>
              {t('add_more_services') || 'Add More Services'}
            </Text>
            {subServices.map(sub => (
              <View key={sub.id} style={styles.subServiceCard}>
                <View style={styles.subServiceInfo}>
                  <Text style={styles.subServiceName}>{sub.name}</Text>
                  <Text style={styles.subServicePrice}>₹{sub.price}</Text>
                </View>
                <View style={styles.quantityContainer}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => handleQuantityChange(sub.id, -1)}>
                    <Entypo
                      name="minus"
                      size={18}
                      color={isDarkMode ? '#fff' : '#4a4a4a'}
                    />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>
                    {quantities[sub.id] || 0}
                  </Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => handleQuantityChange(sub.id, 1)}>
                    <Entypo
                      name="plus"
                      size={18}
                      color={isDarkMode ? '#fff' : '#4a4a4a'}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>{t('total') || 'Total'}:</Text>
          <Text style={styles.totalPrice}>₹{calculateSubtotal()}</Text>
        </View>
      </ScrollView>

      <LinearGradient
        colors={['#FF6B35', '#F7931E']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.continueButton}>
        <TouchableOpacity
          style={styles.continueButtonInner}
          onPress={() => goToStep(2)}>
          <Text style={styles.continueButtonText}>
            {t('continue') || 'Continue'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );

  // Render Step 2: Location Selection
  const renderLocationSelection = () => (
    <Animated.View style={[styles.stepContainer, {transform: [{translateX: slideAnim}]}]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>
          {t('select_location') || 'Select Location'}
        </Text>

        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={handleCurrentLocation}
          disabled={locationLoading}>
          <MaterialIcons
            name="my-location"
            size={24}
            color="#FF6B35"
            style={styles.locationIcon}
          />
          {locationLoading ? (
            <ActivityIndicator size="small" color="#FF6B35" />
          ) : (
            <Text style={styles.currentLocationText}>
              {t('use_current_location') || 'Use Current Location'}
            </Text>
          )}
        </TouchableOpacity>

        {savedAddresses.length > 0 && (
          <View style={styles.savedAddressesContainer}>
            <Text style={styles.savedAddressesTitle}>
              {t('saved_addresses') || 'Saved Addresses'}
            </Text>
            {savedAddresses.map(addr => (
              <TouchableOpacity
                key={addr.id}
                style={styles.savedAddressCard}
                onPress={() => {
                  setCity(addr.city);
                  setArea(addr.area);
                  setPincode(addr.pincode);
                  setLocation(addr.location);
                }}>
                <MaterialIcons name="location-on" size={24} color="#FF6B35" />
                <View style={styles.savedAddressInfo}>
                  <Text style={styles.savedAddressLabel}>{addr.label}</Text>
                  <Text style={styles.savedAddressText} numberOfLines={2}>
                    {addr.area}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.manualAddressContainer}>
          <Text style={styles.manualAddressTitle}>
            {t('enter_address_manually') || 'Or Enter Address Manually'}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('city') || 'City'}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={t('enter_city') || 'Enter city'}
              placeholderTextColor={isDarkMode ? '#888' : '#aaa'}
              value={city}
              onChangeText={setCity}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('area') || 'Area'}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={t('enter_area') || 'Enter area'}
              placeholderTextColor={isDarkMode ? '#888' : '#aaa'}
              value={area}
              onChangeText={setArea}
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('pincode') || 'Pincode'}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={t('enter_pincode') || 'Enter pincode'}
              placeholderTextColor={isDarkMode ? '#888' : '#aaa'}
              value={pincode}
              onChangeText={setPincode}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {t('contact_name') || 'Contact Name'}
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder={t('enter_name') || 'Enter name'}
              placeholderTextColor={isDarkMode ? '#888' : '#aaa'}
              value={alternateName}
              onChangeText={setAlternateName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {t('contact_phone') || 'Contact Phone'}
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder={t('enter_phone') || 'Enter phone'}
              placeholderTextColor={isDarkMode ? '#888' : '#aaa'}
              value={alternatePhone}
              onChangeText={setAlternatePhone}
              keyboardType="phone-pad"
            />
          </View>
        </View>
      </ScrollView>

      <LinearGradient
        colors={['#FF6B35', '#F7931E']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.continueButton}>
        <TouchableOpacity
          style={styles.continueButtonInner}
          onPress={() => goToStep(3)}>
          <Text style={styles.continueButtonText}>
            {t('continue') || 'Continue'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );

  // Render Step 3: Confirmation
  const renderConfirmation = () => (
    <Animated.View style={[styles.stepContainer, {transform: [{translateX: slideAnim}]}]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>
          {t('booking_summary') || 'Booking Summary'}
        </Text>

        {/* Services */}
        <View style={styles.summarySection}>
          <Text style={styles.summarySectionTitle}>
            {t('services') || 'Services'}
          </Text>
          {cart.map((item, idx) => (
            <View key={idx} style={styles.summaryItem}>
              <Text style={styles.summaryItemName}>
                {item.name} x {item.quantity}
              </Text>
              <Text style={styles.summaryItemPrice}>
                ₹{item.price * item.quantity}
              </Text>
            </View>
          ))}
        </View>

        {/* Location */}
        <View style={styles.summarySection}>
          <Text style={styles.summarySectionTitle}>
            {t('location') || 'Location'}
          </Text>
          <Text style={styles.summaryText}>{area}</Text>
          <Text style={styles.summaryText}>
            {city}, {pincode}
          </Text>
        </View>

        {/* Offers */}
        <View style={styles.offersSection}>
          <TouchableOpacity
            style={styles.offersHeader}
            onPress={() => setShowOffers(!showOffers)}>
            <View style={styles.offersHeaderLeft}>
              <MaterialIcons name="local-offer" size={20} color="#FF6B35" />
              <Text style={styles.offersHeaderText}>
                {t('apply_coupon') || 'Apply Coupon'}
              </Text>
            </View>
            <Entypo
              name={showOffers ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={isDarkMode ? '#fff' : '#333'}
            />
          </TouchableOpacity>

          {showOffers && (
            <View style={styles.offersList}>
              {offers.map(offer => (
                <View key={offer.offer_code} style={styles.offerCard}>
                  <View style={styles.offerInfo}>
                    <Text style={styles.offerTitle}>{offer.title}</Text>
                    <Text style={styles.offerDescription}>
                      {offer.description}
                    </Text>
                  </View>
                  {appliedOffer?.code === offer.offer_code ? (
                    <TouchableOpacity
                      style={styles.appliedButton}
                      onPress={() => handleApplyOffer(offer.offer_code)}>
                      <Entypo name="check" size={16} color="#FF6B35" />
                      <Text style={styles.appliedButtonText}>
                        {t('applied') || 'Applied'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.applyOfferButton}
                      onPress={() => handleApplyOffer(offer.offer_code)}>
                      <Text style={styles.applyOfferButtonText}>
                        {t('apply') || 'Apply'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Tip */}
        <View style={styles.tipSection}>
          <Text style={styles.tipTitle}>
            {t('add_tip') || 'Add Tip for Professional'}
          </Text>
          <View style={styles.tipOptions}>
            {tipOptions.map(tip => (
              <TouchableOpacity
                key={tip}
                style={[
                  styles.tipOption,
                  tipAmount === tip && styles.tipOptionSelected,
                ]}
                onPress={() => setTip(tipAmount === tip ? 0 : tip)}>
                <Text
                  style={[
                    styles.tipOptionText,
                    tipAmount === tip && styles.tipOptionTextSelected,
                  ]}>
                  ₹{tip}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Pricing Breakdown */}
        <View style={styles.pricingSection}>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>
              {t('subtotal') || 'Subtotal'}
            </Text>
            <Text style={styles.pricingValue}>₹{calculateSubtotal()}</Text>
          </View>

          {discount > 0 && (
            <View style={styles.pricingRow}>
              <Text style={[styles.pricingLabel, styles.discountLabel]}>
                {t('discount') || 'Discount'}
              </Text>
              <Text style={[styles.pricingValue, styles.discountValue]}>
                -₹{discount}
              </Text>
            </View>
          )}

          {tipAmount > 0 && (
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>{t('tip') || 'Tip'}</Text>
              <Text style={styles.pricingValue}>₹{tipAmount}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.pricingRow}>
            <Text style={styles.totalLabel}>{t('total') || 'Total'}</Text>
            <Text style={styles.totalValue}>₹{calculateTotal()}</Text>
          </View>
        </View>
      </ScrollView>

      <LinearGradient
        colors={['#FF6B35', '#F7931E']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.confirmBookingButton}>
        <TouchableOpacity
          style={styles.confirmBookingButtonInner}
          onPress={handleConfirmBooking}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.confirmBookingButtonText}>
              {t('confirm_booking') || 'Confirm Booking'}
            </Text>
          )}
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );

  // Render Success State
  const renderSuccess = () => (
    <View style={styles.successContainer}>
      <LottieView
        source={require('../../assets/success.json')}
        autoPlay
        loop={false}
        style={styles.successAnimation}
      />
      <Text style={styles.successTitle}>
        {t('booking_confirmed') || 'Booking Confirmed!'}
      </Text>
      <Text style={styles.successSubtitle}>
        {t('finding_worker') || 'Finding the best worker for you...'}
      </Text>
    </View>
  );

  // Progress Indicator
  const renderProgressIndicator = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3].map(step => (
        <View
          key={step}
          style={[
            styles.progressDot,
            currentStep >= step && styles.progressDotActive,
          ]}
        />
      ))}
    </View>
  );

  if (!visible) return null;

  if (showSuccess) {
    return (
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>{renderSuccess()}</View>
      </View>
    );
  }

  return (
    <View style={styles.overlay}>
      <SafeAreaView style={styles.sheetContainer} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => goToStep(currentStep - 1)}>
              <Icon name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#333'} />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>
            {currentStep === 1 && (t('select_service') || 'Select Service')}
            {currentStep === 2 && (t('select_location') || 'Select Location')}
            {currentStep === 3 && (t('confirm_booking') || 'Confirm Booking')}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={24} color={isDarkMode ? '#fff' : '#333'} />
          </TouchableOpacity>
        </View>

        {/* Progress Indicator */}
        {renderProgressIndicator()}

        {/* Content */}
        {currentStep === 1 && renderServiceSelection()}
        {currentStep === 2 && renderLocationSelection()}
        {currentStep === 3 && renderConfirmation()}
      </SafeAreaView>
    </View>
  );
};

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    sheetContainer: {
      backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: SCREEN_HEIGHT * 0.9,
      minHeight: SCREEN_HEIGHT * 0.6,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#333' : '#eee',
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: isDarkMode ? '#fff' : '#333',
      flex: 1,
      textAlign: 'center',
    },
    closeButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    progressContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 15,
      gap: 10,
    },
    progressDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: isDarkMode ? '#444' : '#ddd',
    },
    progressDotActive: {
      backgroundColor: '#FF6B35',
      width: 24,
    },
    stepContainer: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 100,
    },
    serviceCard: {
      backgroundColor: isDarkMode ? '#2a2a2a' : '#f9f9f9',
      borderRadius: 12,
      padding: 15,
      marginBottom: 20,
    },
    serviceImage: {
      width: '100%',
      height: 200,
      borderRadius: 12,
      marginBottom: 15,
    },
    serviceName: {
      fontSize: 20,
      fontWeight: '700',
      color: isDarkMode ? '#fff' : '#333',
      marginBottom: 8,
    },
    serviceDescription: {
      fontSize: 14,
      color: isDarkMode ? '#bbb' : '#666',
      marginBottom: 12,
      lineHeight: 20,
    },
    servicePrice: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FF6B35',
      marginBottom: 15,
    },
    quantityContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
    },
    quantityButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDarkMode ? '#444' : '#eee',
      justifyContent: 'center',
      alignItems: 'center',
    },
    quantityText: {
      fontSize: 18,
      fontWeight: '700',
      color: isDarkMode ? '#fff' : '#333',
      minWidth: 30,
      textAlign: 'center',
    },
    subServicesContainer: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: isDarkMode ? '#fff' : '#333',
      marginBottom: 15,
    },
    subServiceCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#2a2a2a' : '#f9f9f9',
      borderRadius: 12,
      padding: 15,
      marginBottom: 10,
    },
    subServiceInfo: {
      flex: 1,
    },
    subServiceName: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? '#fff' : '#333',
      marginBottom: 4,
    },
    subServicePrice: {
      fontSize: 14,
      color: '#FF6B35',
      fontWeight: '600',
    },
    totalContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#2a2a2a' : '#f9f9f9',
      borderRadius: 12,
      padding: 20,
      marginTop: 10,
    },
    totalLabel: {
      fontSize: 18,
      fontWeight: '700',
      color: isDarkMode ? '#fff' : '#333',
    },
    totalPrice: {
      fontSize: 20,
      fontWeight: '700',
      color: '#FF6B35',
    },
    continueButton: {
      position: 'absolute',
      bottom: 20,
      left: 20,
      right: 20,
      borderRadius: 12,
      overflow: 'hidden',
    },
    continueButtonInner: {
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    continueButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#fff',
    },
    currentLocationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode ? '#2a2a2a' : '#f9f9f9',
      borderRadius: 12,
      padding: 15,
      marginBottom: 20,
      gap: 10,
    },
    locationIcon: {
      marginRight: 10,
    },
    currentLocationText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? '#fff' : '#333',
    },
    savedAddressesContainer: {
      marginBottom: 20,
    },
    savedAddressesTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: isDarkMode ? '#fff' : '#333',
      marginBottom: 12,
    },
    savedAddressCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#2a2a2a' : '#f9f9f9',
      borderRadius: 12,
      padding: 15,
      marginBottom: 10,
      gap: 12,
    },
    savedAddressInfo: {
      flex: 1,
    },
    savedAddressLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? '#fff' : '#333',
      marginBottom: 4,
    },
    savedAddressText: {
      fontSize: 14,
      color: isDarkMode ? '#bbb' : '#666',
    },
    manualAddressContainer: {
      marginTop: 20,
    },
    manualAddressTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: isDarkMode ? '#fff' : '#333',
      marginBottom: 15,
    },
    inputGroup: {
      marginBottom: 15,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: isDarkMode ? '#bbb' : '#666',
      marginBottom: 8,
    },
    textInput: {
      backgroundColor: isDarkMode ? '#2a2a2a' : '#f9f9f9',
      borderRadius: 12,
      padding: 15,
      fontSize: 16,
      color: isDarkMode ? '#fff' : '#333',
      borderWidth: 1,
      borderColor: isDarkMode ? '#444' : '#eee',
    },
    summarySection: {
      marginBottom: 20,
    },
    summarySectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: isDarkMode ? '#fff' : '#333',
      marginBottom: 12,
    },
    summaryItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    summaryItemName: {
      fontSize: 14,
      color: isDarkMode ? '#bbb' : '#666',
    },
    summaryItemPrice: {
      fontSize: 14,
      fontWeight: '600',
      color: isDarkMode ? '#fff' : '#333',
    },
    summaryText: {
      fontSize: 14,
      color: isDarkMode ? '#bbb' : '#666',
      lineHeight: 20,
    },
    offersSection: {
      marginBottom: 20,
    },
    offersHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#2a2a2a' : '#f9f9f9',
      borderRadius: 12,
      padding: 15,
    },
    offersHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    offersHeaderText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? '#fff' : '#333',
    },
    offersList: {
      marginTop: 10,
    },
    offerCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#2a2a2a' : '#f9f9f9',
      borderRadius: 12,
      padding: 15,
      marginBottom: 10,
    },
    offerInfo: {
      flex: 1,
      marginRight: 10,
    },
    offerTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: isDarkMode ? '#fff' : '#333',
      marginBottom: 4,
    },
    offerDescription: {
      fontSize: 12,
      color: isDarkMode ? '#bbb' : '#666',
    },
    appliedButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#FF6B35',
    },
    appliedButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FF6B35',
    },
    applyOfferButton: {
      backgroundColor: '#FF6B35',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    applyOfferButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#fff',
    },
    tipSection: {
      marginBottom: 20,
    },
    tipTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: isDarkMode ? '#fff' : '#333',
      marginBottom: 12,
    },
    tipOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    tipOption: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
      backgroundColor: isDarkMode ? '#2a2a2a' : '#f9f9f9',
      borderWidth: 1,
      borderColor: isDarkMode ? '#444' : '#ddd',
    },
    tipOptionSelected: {
      backgroundColor: '#FF6B35',
      borderColor: '#FF6B35',
    },
    tipOptionText: {
      fontSize: 14,
      fontWeight: '600',
      color: isDarkMode ? '#fff' : '#333',
    },
    tipOptionTextSelected: {
      color: '#fff',
    },
    pricingSection: {
      backgroundColor: isDarkMode ? '#2a2a2a' : '#f9f9f9',
      borderRadius: 12,
      padding: 20,
    },
    pricingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    pricingLabel: {
      fontSize: 14,
      color: isDarkMode ? '#bbb' : '#666',
    },
    pricingValue: {
      fontSize: 14,
      fontWeight: '600',
      color: isDarkMode ? '#fff' : '#333',
    },
    discountLabel: {
      color: '#4CAF50',
    },
    discountValue: {
      color: '#4CAF50',
    },
    divider: {
      height: 1,
      backgroundColor: isDarkMode ? '#444' : '#ddd',
      marginVertical: 12,
    },
    totalValue: {
      fontSize: 20,
      fontWeight: '700',
      color: '#FF6B35',
    },
    confirmBookingButton: {
      position: 'absolute',
      bottom: 20,
      left: 20,
      right: 20,
      borderRadius: 12,
      overflow: 'hidden',
    },
    confirmBookingButtonInner: {
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmBookingButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#fff',
    },
    successContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    successAnimation: {
      width: 200,
      height: 200,
    },
    successTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: isDarkMode ? '#fff' : '#333',
      marginTop: 20,
      textAlign: 'center',
    },
    successSubtitle: {
      fontSize: 16,
      color: isDarkMode ? '#bbb' : '#666',
      marginTop: 10,
      textAlign: 'center',
    },
  });

export default InstantBookingSheet;
