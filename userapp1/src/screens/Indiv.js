import React, { useEffect, useState, useCallback } from 'react';
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
  useWindowDimensions,
  Button,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  CommonActions,
  useFocusEffect,
} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import LottieView from 'lottie-react-native';
import PushNotification from 'react-native-push-notification';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

// 1. Import i18n to initialize translations
import '../i18n/i18n';
// 2. Import language change helper
import { changeAppLanguage } from '../i18n/languageChange';
// 3. Import useTranslation hook
import { useTranslation } from 'react-i18next';

const PaintingServices = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { width, height } = useWindowDimensions();
  const { isDarkMode } = useTheme();
  const { t } = useTranslation();
  const styles = dynamicStyles(width, height, isDarkMode);

  const [subservice, setSubServices] = useState([]);
  const [name, setName] = useState('');
  const [sid,setId] = useState(null)
  const [loading, setLoading] = useState(true);

  // When the component mounts, extract serviceObject from route params and fetch backend data.
  useEffect(() => {
    if (route.params) {
      setName(route.params.serviceObject);
      setId(route.params.id)
      fetchServices(route.params.serviceObject);
    }
  }, [route.params]);

  // Handle back button press for Android
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
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation])
  );

  // Fetch subservices from the backend
  const fetchServices = useCallback(async (serviceObject) => {
    setLoading(true);
    try {
      const response = await axios.post(
        'https://backend.clicksolver.com/api/individual/service',
        { serviceObject }
      );
      // console.log("data",response.data)
      // const servicesWithIds = response.data.map((service) => ({
      //   ...service,
      //   id: uuid.v4(),
      // }));
      setSubServices(response.data); 
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBookCommander = useCallback(
    async (serviceId,id) => {
      try {
        // Check if notifications are enabled
        PushNotification.checkPermissions((permissions) => {
          if (!permissions.alert) {
            Alert.alert(
              t('notifications_required') || 'Notifications Required',
              t('enable_notifications') ||
                'You need to enable notifications to proceed. Go to app settings to enable them.',
              [
                {
                  text: t('cancel') || 'Cancel',
                  onPress: () =>  console.log(''),
                  style: 'cancel',
                },
                {
                  text: t('open_settings') || 'Open Settings',
                  onPress: () => {
                    if (Platform.OS === 'ios') {
                      Linking.openURL('app-settings:');
                    } else {
                      Linking.openSettings();
                    }
                  },
                },
              ],
              { cancelable: false }
            );
          } else {
            proceedToBookCommander(serviceId,id);
          }
        });
      } catch (error) {
        console.error('Error checking notification permissions:', error);
      }
    },
    [t]
  );

  const proceedToBookCommander = useCallback(
    async (serviceId,id) => {
      // console.log("book",serviceId,id)
      navigation.push('ServiceBooking', {
        serviceName: serviceId,
        id:id
      });
    },
    [navigation]
  );

  const handleBack = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }],
      })
    );
  }, [navigation]);

  // Dummy search handler; add your search functionality here.
  const handleSearch = useCallback(() => {
    navigation.push('SearchItem');
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header with back arrow, title, search, and language selector */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.iconContainer}>
            <Icon name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}> { t(`service_${sid}`) || name }</Text>
          <TouchableOpacity onPress={handleSearch} style={styles.iconContainer}>
            <Icon name="search" size={24} color={isDarkMode ? '#fff' : '#000'} />
          </TouchableOpacity>
        </View>

        {/* Language Selector Button */}
        {/* <View style={{ alignSelf: 'flex-end', marginVertical: 10 }}>
          <Button
            title={t('change_language') || 'Change Language'}
            onPress={() => navigation.navigate('LanguageSelector')}
          />
        </View> */}

        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerText}>
            <View style={styles.bannerDetails}>
            <Text style={styles.bannerPrice}>{t('just_49') || 'Just 49/-'}</Text>
              <Text style={styles.bannerDescription}>{ t(`service_${sid}`) || name }</Text>
              <Text style={styles.bannerInfo}>
                {t('just_pay') || 'Just pay to book a Commander Inspection!'}
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
          {subservice.map((service) => (
            <ServiceItem
              key={service.service_id}
              title={service.service_name}
              imageUrl={service.service_urls}
              handleBookCommander={handleBookCommander}
              serviceId={service.service_name}
              isDarkMode={isDarkMode}
              t={t}  // Pass translation function to the item
              id={service.service_id}
            />
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const ServiceItem = React.memo(
  ({ title, imageUrl, handleBookCommander, serviceId, isDarkMode, t,id }) => {
    const { width } = useWindowDimensions();
    const itemStyles = dynamicStyles(width, undefined, isDarkMode);

    return (
      <View style={itemStyles.serviceItem}>
        <View style={itemStyles.serviceImageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={itemStyles.serviceImage}
            resizeMode="stretch"
          />
        </View>
        <View style={itemStyles.serviceInfo}>
          <Text style={itemStyles.serviceTitle}>{ t(`IndivService_${id}`) || title }</Text>
          <TouchableOpacity
            style={itemStyles.bookNow}
            onPress={() => handleBookCommander(serviceId,id)}
          >
            <Text style={itemStyles.bookNowText}>
              {t('book_now') || 'Book Now ➔'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);

const dynamicStyles = (width, height, isDarkMode) => {
  const isTablet = width >= 600;
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
    },
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#ffffff',
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
      color: isDarkMode ? '#fff' : '#1D2951',
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
      backgroundColor: isDarkMode ? '#333' : '#FFF4E6',
      borderRadius: 15,
      marginVertical: isTablet ? 20 : 10,
      marginBottom: isTablet ? 40 : 30,
    },
    bannerText: {
      flex: 1,
      padding: isTablet ? 20 : 15,
    },
    bannerDetails: {
      marginBottom: isTablet ? 10 : 0,
    },
    bannerPrice: {
      color: '#ff4500',
      fontSize: isTablet ? 30 : 25,
      fontFamily: 'RobotoSlab-Bold',
      lineHeight: 34,
    },
    bannerDescription: {
      color: isDarkMode ? '#ccc' : '#808080',
      fontSize: isTablet ? 16 : 14,
      marginTop: 5,
      fontFamily: 'NotoSerif-SemiBold',
      lineHeight: 16.41,
    },
    bannerInfo: {
      color: isDarkMode ? '#ccc' : '#808080',
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
    },
    services: {
      flex: 1,
    },
    serviceItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: isTablet ? 15 : 10,
      borderRadius: 10,
      backgroundColor: isDarkMode ? '#121212' : '#fff',
      marginBottom: isTablet ? 15 : 10,
    },
    serviceImageContainer: {},
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
      color: isDarkMode ? '#fff' : '#333',
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
      // ← no width or height!
      alignSelf: 'flex-start',
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
