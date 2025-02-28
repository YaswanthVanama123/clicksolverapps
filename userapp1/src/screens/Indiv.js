import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  BackHandler,
  Alert,
  Platform,
  Linking,
  useWindowDimensions, // <-- Import useWindowDimensions
} from 'react-native';
import {
  useNavigation,
  useRoute,
  CommonActions,
  useFocusEffect,
} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import axios from 'axios';
import uuid from 'react-native-uuid';
import EncryptedStorage from 'react-native-encrypted-storage';
import LottieView from 'lottie-react-native';
import PushNotification from 'react-native-push-notification';
import {SafeAreaView} from 'react-native-safe-area-context';

const PaintingServices = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // 1) Get screen dimensions
  const {width, height} = useWindowDimensions();
  // 2) Generate dynamic styles based on dimensions
  const styles = dynamicStyles(width, height);

  const [subservice, setSubServices] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (route.params) {
      setName(route.params.serviceObject);
      fetchServices(route.params.serviceObject);
    }
  }, [route.params]);

  // Handle back button press
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

  const fetchServices = useCallback(async serviceObject => {
    setLoading(true);
    try {
      const response = await axios.post(
        `http://192.168.55.102:5000/api/individual/service`,
        {
          serviceObject: serviceObject,
        },
      );
      const servicesWithIds = response.data.map(service => ({
        ...service,
        id: uuid.v4(),
      }));
      setSubServices(servicesWithIds);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBookCommander = useCallback(async serviceId => {
    try {
      // Check if notifications are enabled
      PushNotification.checkPermissions(permissions => {
        if (!permissions.alert) {
          Alert.alert(
            'Notifications Required',
            'You need to enable notifications to proceed. Go to app settings to enable them.',
            [
              {
                text: 'Cancel',
                onPress: () => console.log('Notification permission denied'),
                style: 'cancel',
              },
              {
                text: 'Open Settings',
                onPress: () => {
                  if (Platform.OS === 'ios') {
                    Linking.openURL('app-settings:');
                  } else {
                    Linking.openSettings();
                  }
                },
              },
            ],
            {cancelable: false},
          );
        } else {
          proceedToBookCommander(serviceId);
        }
      });
    } catch (error) {
      console.error('Error checking notification permissions:', error);
    }
  }, []);

  const proceedToBookCommander = useCallback(
    async serviceId => {
      navigation.push('ServiceBooking', {
        serviceName: serviceId,
      });
    },
    [navigation],
  );

  const handleBack = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{name: 'Tabs', state: {routes: [{name: 'Home'}]}}],
      }),
    );
  }, [navigation]);

  // Dummy search handler; add your search functionality here.
  const handleSearch = useCallback(() => {
    navigation.push('SearchItem');
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header with back arrow, title, and search icon */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.iconContainer}>
            <Icon name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{name}</Text>
          <TouchableOpacity onPress={handleSearch} style={styles.iconContainer}>
            <Icon name="search" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.banner}>
          <View style={styles.bannerText}>
            <View style={styles.bannerDetails}>
              <Text style={styles.bannerPrice}>Just 49/-</Text>
              <Text style={styles.bannerDescription}>{name}</Text>
              <Text style={styles.bannerInfo}>
                Just pay to book a Commander Inspection!
              </Text>
            </View>
          </View>
          <Image
            source={{
              uri: 'https://i.postimg.cc/nLSx6CFs/ec25d95ccdd81fad0f55cc8d83a8222e.png',
            }}
            style={styles.bannerImage}
          />
        </View>

        {/* Loading Animation */}
        {loading && (
          <LottieView
            source={require('../assets/cardsLoading.json')}
            autoPlay
            loop
            style={styles.loadingAnimation}
          />
        )}

        {/* Services List */}
        <ScrollView style={styles.services}>
          {subservice.map(service => (
            <ServiceItem
              key={service.id}
              title={service.service_name}
              imageUrl={service.service_urls}
              handleBookCommander={handleBookCommander}
              serviceId={service.service_name}
            />
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const ServiceItem = React.memo(
  ({title, imageUrl, handleBookCommander, serviceId}) => {
    // We'll need the same dynamic styles here if we want the items to respond to device size:
    const {width} = useWindowDimensions();
    const itemStyles = dynamicStyles(width); // We only need width for these small adjustments

    return (
      <View style={itemStyles.serviceItem}>
        <View style={itemStyles.serviceImageContainer}>
          <Image
            source={{uri: imageUrl}}
            style={itemStyles.serviceImage}
            resizeMode="stretch"
          />
        </View>
        <View style={itemStyles.serviceInfo}>
          <Text style={itemStyles.serviceTitle}>{title}</Text>
          <TouchableOpacity
            style={itemStyles.bookNow}
            onPress={() => handleBookCommander(serviceId)}>
            <Text style={itemStyles.bookNowText}>Book Now ➔</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  },
);

/**
 * DYNAMIC STYLES:
 * Adjusts layout based on width to accommodate tablets (width >= 600).
 */
const dynamicStyles = (width, height) => {
  const isTablet = width >= 600;

  return StyleSheet.create({
    safeArea: {
      flex: 1, 
      backgroundColor: '#FFFFFF',
    },
    container: {
      flex: 1,
      backgroundColor: '#ffffff',
      paddingHorizontal: isTablet ? 20 : 10,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: isTablet ? 20 : 15,
      justifyContent: 'space-between',
    },
    iconContainer: {
      padding: 5,
    },
    headerTitle: {
      fontSize: isTablet ? 24 : 20,
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 10,
      color: '#1D2951',
      fontFamily: 'RobotoSlab-Bold',
      lineHeight: 23.44,
    },
    loadingAnimation: {
      width: '100%',
      height: '100%',
    },
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF4E6',
      borderRadius: 15,
      marginVertical: isTablet ? 20 : 10,
      marginBottom: isTablet ? 40 : 30,
    },
    bannerText: {
      flex: 1,
      padding: isTablet ? 20 : 15,
    },
    bannerDetails: {
      // Extra spacing on tablets
      marginBottom: isTablet ? 10 : 0,
    },
    bannerPrice: {
      color: '#ff4500',
      fontSize: isTablet ? 30 : 25,
      fontFamily: 'RobotoSlab-Bold',
      lineHeight: 34,
    },
    bannerDescription: {
      color: '#808080',
      fontSize: isTablet ? 16 : 14,
      marginTop: 5,
      fontFamily: 'NotoSerif-SemiBold',
      lineHeight: 16.41,
    },
    bannerInfo: {
      color: '#808080',
      fontFamily: 'RobotoSlab-Regular',
      opacity: 0.8,
      fontSize: isTablet ? 14 : 12,
      marginTop: 5,
      lineHeight: 14.06,
    },
    bannerImage: {
      width: isTablet ? 120 : 100,
      height: isTablet ? 120 : 100,
      resizeMode: 'cover',
      transform: [{rotate: '0deg'}],
    },
    services: {
      flex: 1,
    },

    /* --- Service Item Styles --- */
    serviceItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: isTablet ? 15 : 10,
      borderRadius: 10,
      backgroundColor: '#fff',
      marginBottom: isTablet ? 15 : 10,
    },
    serviceImageContainer: {
      // Example: Could also add different styling for tablets
    },
    serviceImage: {
      width: isTablet ? 200 : 165,
      height: isTablet ? 130 : 105,
      borderRadius: 10,
    },
    serviceInfo: {
      flex: 1,
      paddingHorizontal: isTablet ? 20 : 15,
      paddingVertical: isTablet ? 15 : 10,
    },
    serviceTitle: {
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'RobotoSlab-Bold',
      color: '#333',
    },
    bookNow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FF4500',
      paddingVertical: isTablet ? 10 : 8,
      paddingHorizontal: isTablet ? 20 : 15,
      borderRadius: 15,
      marginTop: 10,
      width: isTablet ? 130 : 110,
      height: isTablet ? 38 : 32,
      opacity: 0.88,
      elevation: 5,
    },
    bookNowText: {
      color: '#FFF',
      fontWeight: 'bold',
      fontSize: isTablet ? 15 : 13,
      textAlign: 'center',
    },
  });
};

export default PaintingServices;
