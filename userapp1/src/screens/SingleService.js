import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  useWindowDimensions,
  Button,
} from 'react-native';
import axios from 'axios';
import Swiper from 'react-native-swiper';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  CommonActions,
} from '@react-navigation/native';
import Entypo from 'react-native-vector-icons/Entypo';
import Icon from 'react-native-vector-icons/Ionicons';
import EncryptedStorage from 'react-native-encrypted-storage';
import LottieView from 'lottie-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

// 1. Import i18n initialization (loads your JSON translations)
import '../i18n/i18n';
// 2. Import useTranslation hook
import { useTranslation } from 'react-i18next';

const SingleService = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { serviceName,id } = route.params;
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useTheme();
  const { t } = useTranslation(); // get the translation function
  const styles = dynamicStyles(width, isDarkMode);

  // State variables
  const [services, setServices] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [bookedServices, setBookedServices] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Fetch details from API
  const fetchDetails = useCallback(async () => {
    try {
      // console.log('serviceName', serviceName,id);
      const response = await axios.post(
        'https://backend.clicksolver.com/api/single/service',
        { serviceName }
      );
      const { relatedServices } = response.data;
      setServices(relatedServices);
 
      // Initialize quantity to 0 for each service
      setQuantities(
        relatedServices.reduce((acc, item) => {
          acc[item.main_service_id] = 0;
          return acc;
        }, {})
      );
      setLoading(false);
      // // console.log('single', relatedServices);
    } catch (error) {
      console.error('Error fetching services:', error);
      setLoading(false);
    }
  }, [serviceName]);

  // Fetch any stored cart items
  const fetchStoredCart = useCallback(async () => {
    try {
      const storedCart = await EncryptedStorage.getItem(serviceName);
      if (storedCart) {
        const parsedCart = JSON.parse(storedCart);
        if (Array.isArray(parsedCart)) {
          setBookedServices(parsedCart);
          const parsedQuantities = parsedCart.reduce((acc, item) => {
            acc[item.main_service_id] = item.quantity;
            return acc;
          }, {});
          setQuantities(parsedQuantities);
        }
      }
    } catch (error) {
      console.error('Error fetching stored cart:', error);
    }
  }, [serviceName]);

  // Effects: Fetch details and stored cart on mount or when route params change
  useEffect(() => {
    fetchDetails().then(fetchStoredCart);
  }, [fetchDetails, fetchStoredCart]);

  useFocusEffect(
    useCallback(() => {
      fetchDetails().then(fetchStoredCart);
    }, [fetchDetails, fetchStoredCart])
  );

  // Recompute totals & store cart whenever quantities or services change
  useEffect(() => {
    let total = 0;
    services.forEach((service) => {
      const qty = quantities[service.main_service_id] || 0;
      const cost = parseFloat(service.cost) || 0;
      total += cost * qty;
    });
    setTotalAmount(total);

    const newBooked = services
      .map((srv) => {
        const qty = quantities[srv.main_service_id];
        if (qty > 0) {
          return {
            serviceName: srv.service_tag,
            quantity: qty,
            cost: parseFloat(srv.cost) * qty,
            url: srv.service_details.urls,
            description: srv.service_details.about,
            main_service_id: srv.main_service_id,
          };
        }
        return null;
      })
      .filter(Boolean);
    setBookedServices(newBooked);

    if (newBooked.length > 0) {
      (async () => {
        try {
          await EncryptedStorage.setItem(serviceName, JSON.stringify(newBooked));
        } catch (err) {
          console.error('Error storing cart:', err);
        }
      })();
    }
  }, [quantities, services, serviceName]);

  // Quantity actions
  const handleQuantityChange = (id, delta) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta),
    }));
  };

  // Booking flow
  const handleBookNow = () => {
    setModalVisible(true);
  };

  const bookService = async () => {
    try {
      setBookingLoading(true);
      const cs_token = await EncryptedStorage.getItem('cs_token');
      if (cs_token) {
        setModalVisible(false);
        setBookingLoading(false);
        navigation.push('OrderScreen', { serviceName: bookedServices });
      } else {
        setModalVisible(false);
        setBookingLoading(false);
        setLoginModalVisible(true);
      }
    } catch (error) {
      console.error('Error accessing storage:', error);
      setBookingLoading(false);
    }
  };

  const navigateToLogin = () => {
    setLoginModalVisible(false);
    navigation.push('Login');
  };

  // Navigation: Back button handler
  const handleBackPress = () => {
    navigation.goBack();
  };

  // Render
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Carousel Container */}
        <View style={styles.carouselContainer}>
          {/* Carousel Icons */}
          <View style={styles.carouselIconsContainer}>
            <TouchableOpacity style={styles.iconButton} onPress={handleBackPress}>
              <Icon name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#000'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.push('SearchItem')}>
              <Icon name="search" size={24} color={isDarkMode ? '#fff' : '#000'} />
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.carouselLoaderContainer}>
              <LottieView
                source={require('../assets/singlecard.json')}
                autoPlay
                loop
                style={styles.carouselLoader}
              />
            </View>
          ) : (
            <Swiper style={styles.wrapper} autoplay autoplayTimeout={3} showsPagination={false}>
              {services.map((srv) => (
                <View key={srv.main_service_id}>
                  <Image
                    source={{ uri: srv.service_urls[0] }}
                    style={styles.carouselImage}
                    resizeMode="cover"
                  />
                </View>
              ))}
            </Swiper>
          )}
        </View>

        {/* Service Title & Info */}
        <View style={styles.serviceHeader}>
          <View style={styles.serviceDetails}>
            <Text style={styles.serviceTitle}> { t(`IndivService_${id}`) || serviceName }</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.Sparetext}>
                {t('spare_text') || 'Spare parts, if required, will incur additional charges'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.horizantalLine} />

        {/* Service Items */}
        <View style={styles.recomendedContainer}>
          {loading ? (
            <View style={styles.recommendedLoaderContainer}>
              <LottieView
                source={require('../assets/cardsLoading.json')}
                autoPlay
                loop
                style={styles.recommendedLoader}
              />
            </View>
          ) : (
            services.map((srv) => (
              <TouchableOpacity key={srv.main_service_id} style={styles.recomendedCard}>
                <View style={styles.recomendedCardDetails}>
                  <Text style={styles.recomendedCardDetailsHead}>
                     { t(`singleService_${srv.main_service_id}`) || srv.service_tag }
                  </Text>
                  <Text style={styles.recomendedCardDetailsDescription} numberOfLines={2}>
                     { t(`descriptionSingleService_${srv.main_service_id}`) || srv.service_details.about }
                  </Text>
                  <Text style={styles.recomendedCardDetailsRating}>
                    ₹{srv.cost}
                  </Text>
                  <View style={styles.addButton}>
                    <TouchableOpacity onPress={() => handleQuantityChange(srv.main_service_id, -1)}>
                      <Entypo name="minus" size={20} color={isDarkMode ? '#ddd' : '#4a4a4a'} />
                    </TouchableOpacity>
                    <Text style={styles.addButtonText}>
                      {quantities[srv.main_service_id] > 0 ? quantities[srv.main_service_id] : t('add') || 'Add'}
                    </Text>
                    <TouchableOpacity onPress={() => handleQuantityChange(srv.main_service_id, 1)}>
                      <Entypo name="plus" size={20} color={isDarkMode ? '#ddd' : '#4a4a4a'} />
                    </TouchableOpacity>
                  </View>
                </View>
                {srv.service_details.urls && (
                  <Image
                    source={{ uri: srv.service_details.urls }}
                    style={styles.recomendedImage}
                    resizeMode="stretch"
                  />
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Bottom Cart Bar */}
      {totalAmount > 0 && (
        <View style={styles.cartContainer}>
          <Text style={styles.amount}>{t('total_amount') || 'Total:'} ₹{totalAmount}</Text>
          <TouchableOpacity onPress={handleBookNow} style={styles.buttonContainer}>
            <Text style={styles.buttonText}>{t('view_cart') || 'View Cart'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Booked Services Modal */}
      <Modal
        transparent
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.crossIconContainer} onPress={() => setModalVisible(false)}>
            <View style={styles.crossIcon}>
              <Entypo name="cross" size={20} color={isDarkMode ? '#fff' : '#4a4a4a'} />
            </View>
          </TouchableOpacity>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('booked_services') || 'Booked Services'}</Text>
            <ScrollView
            style={{ flex: 1, width: '100%' }}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}>
              <View style={styles.itemContainers}>
                {bookedServices.map((srv, idx) => (
                  
                  <View key={idx} style={styles.itemContainer}>
                   
                    {srv.url ? (
                      <Image
                        source={{ uri: srv.url }}
                        style={styles.recomendedModalImage}
                        resizeMode="stretch"
                      />
                    ) : (
                      <Image
                        source={{ uri: 'https://postimage.png' }}
                        style={styles.recomendedModalImage}
                        resizeMode="stretch"
                      />
                    )}
                    <View style={styles.descriptionContainer}>
                      <Text style={styles.recomendedCardDetailsHead} numberOfLines={3}>
                      { t(`singleService_${srv.main_service_id}`) || srv.serviceName }
                        
                      </Text>
                      <Text style={styles.recomendedCardDetailsDescription} numberOfLines={2}>
                      { t(`descriptionSingleService_${srv.main_service_id}`) || srv.description }
                 
                      </Text>
                      <View style={styles.addButton}>
                        <TouchableOpacity onPress={() => handleQuantityChange(srv.main_service_id, -1)}>
                          <Entypo name="minus" size={20} color={isDarkMode ? '#ddd' : '#4a4a4a'} />
                        </TouchableOpacity>
                        <Text style={styles.addButtonText}>
                          {quantities[srv.main_service_id]}
                        </Text>
                        <TouchableOpacity onPress={() => handleQuantityChange(srv.main_service_id, 1)}>
                          <Entypo name="plus" size={20} color={isDarkMode ? '#ddd' : '#4a4a4a'} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
            <Text style={styles.modalTotal}>{t('total_amount') || 'Total Amount:'} ₹{totalAmount}</Text>
            {bookingLoading ? (
              <ActivityIndicator size="large" color="#FF5720" style={{ marginVertical: 20 }} />
            ) : (
              <TouchableOpacity style={styles.bookButton} onPress={bookService}>
                <Text style={styles.modalButtonText}>{t('view_cart') || 'View Cart'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Login Prompt Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={loginModalVisible}
        onRequestClose={() => setLoginModalVisible(false)}>
        <View style={styles.loginModalOverlay}>
          <View style={styles.loginModalContent}>
            <Text style={styles.loginModalTitle}>{t('login_required') || 'Login Required'}</Text>
            <Text style={styles.loginModalMessage}>
              {t('login_required_message') ||
                'You need to log in to book services. Would you like to log in now?'}
            </Text>
            <View style={styles.loginModalButtons}>
              <TouchableOpacity
                style={styles.loginCancelButton}
                onPress={() => setLoginModalVisible(false)}>
                <Text style={styles.loginCancelText}>{t('cancel') || 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.loginProceedButton}
                onPress={() => {
                  setLoginModalVisible(false);
                  navigation.push('Login', { serviceName, id });
                }}>
                <Text style={styles.loginProceedText}>{t('login') || 'Login'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const dynamicStyles = (width, isDarkMode) => {
  const isTablet = width >= 600;
  const aspectRatio = 16 / 9;
  const carouselHeight = Math.round(width / aspectRatio);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#ffffff',
    },
    carouselContainer: {
      width: '100%',
      height: carouselHeight,
      backgroundColor: isDarkMode ? '#333' : '#f5f5f5',
      position: 'relative',
    },
    carouselIconsContainer: {
      position: 'absolute',
      top: isTablet ? 20 : 10,
      left: 0,
      right: 0,
      zIndex: 2,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: isTablet ? 20 : 15,
    },
    iconButton: {
      width: isTablet ? 45 : 40,
      height: isTablet ? 45 : 40,
      borderRadius: isTablet ? 22 : 20,
      backgroundColor: isDarkMode ? '#444' : '#ffffff',
      justifyContent: 'center',
      alignItems: 'center',
    },
    wrapper: {
      width: '100%',
      height: carouselHeight,
    },
    carouselLoaderContainer: {
      width: '100%',
      height: carouselHeight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    carouselLoader: {
      width: '100%',
      height: '100%',
    },
    carouselImage: {
      width: '100%',
      height: carouselHeight,
      resizeMode: 'cover',
    },
    serviceHeader: {
      backgroundColor: isDarkMode ? '#121212' : '#fff',
    },
    serviceDetails: {
      padding: isTablet ? 25 : 20,
      paddingTop: 10,
    },
    serviceTitle: {
      fontSize: isTablet ? 24 : 22,
      color: isDarkMode ? '#fff' : '#212121',
      fontFamily: 'RobotoSlab-SemiBold',
      width: '90%',
      lineHeight: 25,
    },
    priceContainer: {
      marginTop: 5,
    },
    Sparetext: {
      color: isDarkMode ? '#ccc' : '#4a4a4a',
      opacity: 0.8,
      fontSize: isTablet ? 16 : 14,
      width: '90%',
      fontFamily: 'RobotoSlab-Regular',
    },
    horizantalLine: {
      width: '100%',
      height: isTablet ? 6 : 5,
      backgroundColor: isDarkMode ? '#555' : '#f5f5f5',
    },
    recomendedContainer: {
      padding: isTablet ? 25 : 20,
      backgroundColor: isDarkMode ? '#121212' : '#ffffff',
    },
    recommendedLoaderContainer: {
      height: isTablet ? 250 : 200,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    recommendedLoader: {
      width: isTablet ? 180 : 150,
      height: isTablet ? 180 : 150,
    },
    recomendedCard: {
      flexDirection: 'row',
      width: '100%',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: isTablet ? 30 : 25,
    },
    recomendedCardDetails: {
      width: isTablet ? '60%' : '55%',
    },
    recomendedCardDetailsHead: {
      color: isDarkMode ? '#fff' : '#212121',
      fontFamily: 'RobotoSlab-Medium',
      fontSize: isTablet ? 17 : 15,
      paddingBottom: 5,
    },
    recomendedCardDetailsDescription: {
      color: isDarkMode ? '#bbb' : '#4a4a4a',
      fontSize: isTablet ? 12 : 10,
      lineHeight: isTablet ? 18 : 15,
      fontFamily: 'RobotoSlab-Regular',
    },
    recomendedCardDetailsRating: {
      color: isDarkMode ? '#fff' : '#212121',
      fontSize: isTablet ? 17 : 15,
      paddingBottom: 10,
      paddingTop: 5,
    },
    recomendedImage: {
      width: isTablet ? 120 : 105,
      height: isTablet ? 120 : 105,
      borderRadius: 10,
    },
    addButton: {
      padding: isTablet ? 8 : 5,
      borderWidth: 1,
      borderColor: isDarkMode ? '#bbb' : '#1D2951',
      backgroundColor: isDarkMode ? '#333' : '#ffffff',
      width: isTablet ? 110 : 100,
      borderRadius: 10,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 5,
      gap: 12,
      paddingHorizontal: 5,
    },
    addButtonText: {
      color: isDarkMode ? '#fff' : '#4a4a4a',
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'RobotoSlab-Medium',
    },
    cartContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: isDarkMode ? '#333' : '#FFFFFF',
      paddingVertical: isTablet ? 20 : 15,
      paddingHorizontal: isTablet ? 30 : 25,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 10,
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
      zIndex: 10,
    },
    buttonContainer: {
      backgroundColor: '#ff4500',
      padding: isTablet ? 12 : 10,
      borderRadius: 10,
      width: isTablet ? 140 : 120,
      alignItems: 'center',
    },
    buttonText: {
      color: '#FFFFFF',
      fontFamily: 'RobotoSlab-Medium',
      fontSize: isTablet ? 16 : 14,
    },
    amount: {
      fontSize: isTablet ? 17 : 15,
      color: isDarkMode ? '#fff' : '#212121',
      fontFamily: 'RobotoSlab-Medium',
    },
    modalContainer: {
      flex: 1,
      marginTop: isTablet ? 90 : 70,
      justifyContent: 'flex-end',
      alignItems: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    crossIconContainer: {
      marginRight: 10,
      marginBottom: 10,
    },
    crossIcon: {
      padding: 10,
      backgroundColor: isDarkMode ? '#444' : '#FFFFFF',
      borderRadius: 50,
    },
    modalContent: {
      width: '100%',
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#ffffff',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: isTablet ? 25 : 20,
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: isTablet ? 22 : 20,
      fontFamily: 'RobotoSlab-SemiBold',
      marginBottom: 20,
      color: isDarkMode ? '#fff' : '#1D2951',
    },
    modalTotal: {
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'RobotoSlab-Regular',
      paddingBottom: 10,
      paddingTop: 10,
      color: isDarkMode ? '#ccc' : '#4a4a4a',
    },
    bookButton: {
      backgroundColor: '#ff4500',
      width: isTablet ? '40%' : '50%',
      padding: isTablet ? 10 : 8,
      alignItems: 'center',
      borderRadius: 10,
      elevation: 5,
    },
    modalButtonText: {
      color: '#ffffff',
      fontFamily: 'RobotoSlab-Medium',
      fontSize: isTablet ? 17 : 15,
    },
    itemContainers: {
      flexDirection: 'column',
      width: '100%',
      gap: 20,
    },
    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 30,
      width: '100%',
    },
    descriptionContainer: {
      width: '45%',
    },
    recomendedModalImage: {
      width: isTablet ? 150 : 125,
      height: isTablet ? 125 : 105,
      borderRadius: 10,
    },
    loginModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    loginModalContent: {
      width: isTablet ? '60%' : '80%',
      backgroundColor: isDarkMode ? '#333' : '#ffffff',
      borderRadius: 20,
      padding: isTablet ? 25 : 20,
      alignItems: 'center',
    },
    loginModalTitle: {
      fontSize: isTablet ? 20 : 18,
      fontFamily: 'RobotoSlab-Medium',
      color: isDarkMode ? '#fff' : '#212121',
      marginBottom: 10,
      textAlign: 'center',
    },
    loginModalMessage: {
      fontSize: isTablet ? 16 : 14,
      color: isDarkMode ? '#ccc' : '#4a4a4a',
      textAlign: 'center',
      marginBottom: 20,
      fontFamily: 'RobotoSlab-Regular',
    },
    loginModalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
    },
    loginCancelButton: {
      flex: 1,
      padding: isTablet ? 12 : 10,
      backgroundColor: '#A9A9A9',
      borderRadius: 10,
      marginRight: 10,
      alignItems: 'center',
    },
    loginCancelText: {
      color: '#FFFFFF',
      fontFamily: 'RobotoSlab-Medium',
      fontSize: isTablet ? 16 : 14,
    },
    loginProceedButton: {
      flex: 1,
      padding: isTablet ? 12 : 10,
      backgroundColor: '#FF4500',
      borderRadius: 10,
      marginLeft: 10,
      alignItems: 'center',
    },
    loginProceedText: {
      color: '#FFFFFF',
      fontFamily: 'RobotoSlab-Medium',
      fontSize: isTablet ? 16 : 14,
    },
  });
};

export default SingleService;
