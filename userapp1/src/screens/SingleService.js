import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  ActivityIndicator, // Import ActivityIndicator here
} from 'react-native';
import axios from 'axios';
import Swiper from 'react-native-swiper';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import Entypo from 'react-native-vector-icons/Entypo';
import Icon from 'react-native-vector-icons/Ionicons';
import EncryptedStorage from 'react-native-encrypted-storage';
import LottieView from 'lottie-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SingleService = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { serviceName } = route.params;

  const [services, setServices] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [bookedServices, setBookedServices] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  const insets = useSafeAreaInsets();

  const fetchDetails = useCallback(async () => {
    try {
      console.log('serviceName', serviceName);
      const response = await axios.post(
        'http://192.168.55.101:5000/api/single/service',
        { serviceName },
      );
      const { relatedServices } = response.data;
      setServices(relatedServices);
      setQuantities(
        relatedServices.reduce(
          (acc, service) => ({ ...acc, [service.main_service_id]: 0 }),
          {},
        ),
      );
      setLoading(false);
      console.log('single', relatedServices);
    } catch (error) {
      console.error('Error fetching services:', error);
      setLoading(false);
    }
  }, [serviceName]);

  const fetchStoredCart = useCallback(async () => {
    try {
      const storedCart = await EncryptedStorage.getItem(serviceName);
      if (storedCart) {
        const parsedCart = JSON.parse(storedCart);
        if (Array.isArray(parsedCart)) {
          setBookedServices(parsedCart);
          // Update quantities from booked services
          const parsedQuantities = parsedCart.reduce((acc, service) => {
            acc[service.main_service_id] = service.quantity;
            return acc;
          }, {});
          setQuantities(parsedQuantities);
        }
      }
    } catch (error) {
      console.error('Error fetching stored cart:', error);
    }
  }, [serviceName]);

  useEffect(() => {
    fetchDetails().then(fetchStoredCart);
  }, [fetchDetails, fetchStoredCart]);

  useFocusEffect(
    useCallback(() => {
      fetchDetails().then(fetchStoredCart);
      return () => {};
    }, [fetchDetails, fetchStoredCart]),
  );

  useEffect(() => {
    // Calculate total amount based on cost * quantity (no discounts)
    const total = services.reduce((acc, service) => {
      const quantity = quantities[service.main_service_id] || 0;
      const cost = parseFloat(service.cost) || 0;
      return acc + cost * quantity;
    }, 0);

    setTotalAmount(total);

    // Build the booked services array
    const booked = services
      .map((service) => {
        const quantity = quantities[service.main_service_id];
        if (quantity > 0) {
          return {
            serviceName: service.service_tag,
            quantity,
            cost: parseFloat(service.cost) * quantity,
            url: service.service_details.urls,
            description: service.service_details.about,
            main_service_id: service.main_service_id,
          };
        }
        return null;
      })
      .filter(Boolean);

    setBookedServices(booked);

    // Store the current cart in EncryptedStorage
    if (booked.length > 0) {
      const storeCart = async () => {
        try {
          await EncryptedStorage.setItem(serviceName, JSON.stringify(booked));
        } catch (error) {
          console.error('Error storing cart:', error);
        }
      };
      storeCart();
    }
  }, [quantities, services, serviceName]);

  const handleQuantityChange = (id, delta) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta),
    }));
  };

  const handleBookNow = () => {
    setModalVisible(true);
  };

  const navigateToLogin = () => {
    setLoginModalVisible(false);
    navigation.push('Login');
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
        console.log('login screen');
        setModalVisible(false);
        setBookingLoading(false);
        setLoginModalVisible(true);
      }
    } catch (error) {
      console.error('Error accessing storage:', error);
      setBookingLoading(false);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchDetails().then(fetchStoredCart);
      return () => {};
    }, []),
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
          {/* Top Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.imageIcons} onPress={handleBackPress}>
              <Icon name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.imageIcons}
              onPress={() => navigation.push('SearchItem')}>
              <Icon name="search" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Carousel or Carousel Loader */}
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
            <View style={styles.carouselContainer}>
              <Swiper
                style={styles.wrapper}
                autoplay
                autoplayTimeout={3}
                showsPagination={false}>
                {services.map((service) => (
                  <View key={service.main_service_id}>
                    <Image
                      source={{ uri: service.service_urls[0] }}
                      style={styles.carouselImage}
                      resizeMode="cover"
                    />
                  </View>
                ))}
              </Swiper>
            </View>
          )}

          {/* Title, Price Info */}
          <View style={styles.serviceHeader}>
            <View style={styles.serviceDetails}>
              <Text style={styles.serviceTitle}>{serviceName}</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.Sparetext}>
                  Spare parts, if required, will incur additional charges
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.horizantalLine} />

          {/* Recommended Container or Loader */}
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
              services.map((service) => (
                <TouchableOpacity
                  key={service.main_service_id}
                  style={styles.recomendedCard}>
                  <View style={styles.recomendedCardDetails}>
                    <Text style={styles.recomendedCardDetailsHead}>
                      {service.service_tag}
                    </Text>
                    <Text
                      style={styles.recomendedCardDetailsDescription}
                      numberOfLines={2}>
                      {service.service_details.about}
                    </Text>
                    <Text style={styles.recomendedCardDetailsRating}>
                      ₹{service.cost}
                    </Text>
                    <View style={styles.addButton}>
                      <TouchableOpacity
                        onPress={() =>
                          handleQuantityChange(service.main_service_id, -1)
                        }>
                        <Entypo name="minus" size={20} color="#4a4a4a" />
                      </TouchableOpacity>
                      <Text style={styles.addButtonText}>
                        {quantities[service.main_service_id] > 0
                          ? quantities[service.main_service_id]
                          : 'Add'}
                      </Text>
                      <TouchableOpacity
                        onPress={() =>
                          handleQuantityChange(service.main_service_id, 1)
                        }>
                        <Entypo name="plus" size={20} color="#4a4a4a" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {service.service_details.urls && (
                    <Image
                      source={{ uri: service.service_details.urls }}
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
          <View style={[styles.cartContainer]}>
            <Text style={styles.amount}>Total: ₹{totalAmount}</Text>
            <TouchableOpacity
              onPress={handleBookNow}
              style={styles.buttonContainer}>
              <Text style={styles.buttonText}>View</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Modal - Booked Services */}
        <Modal
          transparent
          animationType="slide"
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.crossIconContainer}
              onPress={() => setModalVisible(false)}>
              <View style={styles.crossIcon}>
                <Entypo name="cross" size={20} color="#4a4a4a" />
              </View>
            </TouchableOpacity>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Booked Services</Text>
              <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                <View style={styles.itemContainers}>
                  {bookedServices.map((service, index) => (
                    <View key={index} style={styles.itemContainer}>
                      {service.url ? (
                        <Image
                          source={{ uri: service.url }}
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
                        <Text
                          style={styles.recomendedCardDetailsHead}
                          numberOfLines={3}>
                          {service.serviceName}
                        </Text>
                        <Text
                          style={styles.recomendedCardDetailsDescription}
                          numberOfLines={2}>
                          {service.description}
                        </Text>
                        <View style={styles.addButton}>
                          <TouchableOpacity
                            onPress={() =>
                              handleQuantityChange(service.main_service_id, -1)
                            }>
                            <Entypo name="minus" size={20} color="#4a4a4a" />
                          </TouchableOpacity>
                          <Text style={styles.addButtonText}>
                            {quantities[service.main_service_id]}
                          </Text>
                          <TouchableOpacity
                            onPress={() =>
                              handleQuantityChange(service.main_service_id, 1)
                            }>
                            <Entypo name="plus" size={20} color="#4a4a4a" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
              <Text style={styles.modalTotal}>Total Amount: ₹{totalAmount}</Text>

              {/* Show ActivityIndicator if booking is in progress */}
              {bookingLoading ? (
                <ActivityIndicator
                  size="large"
                  color="#FF5720"
                  style={{ marginVertical: 20 }}
                />
              ) : (
                <TouchableOpacity style={styles.bookButton} onPress={bookService}>
                  <Text style={styles.modalButtonText}>Book Now</Text>
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
              <Text style={styles.loginModalTitle}>Login Required</Text>
              <Text style={styles.loginModalMessage}>
                You need to log in to book services. Would you like to log in now?
              </Text>
              <View style={styles.loginModalButtons}>
                <TouchableOpacity
                  style={styles.loginCancelButton}
                  onPress={() => setLoginModalVisible(false)}>
                  <Text style={styles.loginCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.loginProceedButton}
                  onPress={navigateToLogin}>
                  <Text style={styles.loginProceedText}>Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    alignItems: 'center',
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0, 
    zIndex: 1,
  },
  imageIcons: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselContainer: {
    marginTop: 0,
    backgroundColor: '#ffffff',
    width: '100%',
  },
  carouselLoaderContainer: {
    height: 250,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselLoader: {
    height: 250,
    width: '100%',
  },
  wrapper: {
    height: 250,
  },
  carouselImage: {
    width: Dimensions.get('window').width,
    height: 240,
    resizeMode: 'cover',
  },
  serviceHeader: {
    backgroundColor: '#fff',
  },
  serviceDetails: {
    padding: 20,
    paddingTop: 5,
  },
  serviceTitle: {
    fontSize: 22,
    color: '#212121',
    fontFamily: 'RobotoSlab-SemiBold',
    width: '90%',
    lineHeight: 25,
  },
  priceContainer: {
    marginTop: 5,
  },
  Sparetext: {
    color: '#4a4a4a',
    opacity: 0.8,
    fontSize: 14,
    width: '90%',
    fontFamily: 'RobotoSlab-Regular',
  },
  horizantalLine: {
    width: '100%',
    height: 5,
    backgroundColor: '#f5f5f5',
  },
  recomendedContainer: {
    padding: 20,
    paddingTop: 0,
    backgroundColor: '#ffffff',
  },
  recommendedLoaderContainer: {
    height: 200,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendedLoader: {
    width: 150,
    height: 150,
  },
  recomendedCard: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 25,
  },
  recomendedCardDetails: {
    width: '55%',
  },
  recomendedCardDetailsHead: {
    color: '#212121',
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 15,
    paddingBottom: 5,
  },
  recomendedCardDetailsDescription: {
    color: '#4a4a4a',
    fontSize: 10,
    lineHeight: 15,
    fontFamily: 'RobotoSlab-Regular',
  },
  recomendedCardDetailsRating: {
    color: '#212121',
    fontSize: 15,
    paddingBottom: 10,
    paddingTop: 5,
  },
  recomendedImage: {
    width: 105,
    height: 105,
    borderRadius: 10,
  },
  addButton: {
    padding: 5,
    borderWidth: 1,
    borderColor: '#1D2951',
    backgroundColor: '#ffffff',
    width: 100,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 5,
    gap: 12,
    paddingHorizontal: 5,
  },
  addButtonText: {
    color: '#4a4a4a',
    fontSize: 16,
    fontFamily: 'RobotoSlab-Medium',
  },
  cartContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    paddingHorizontal: 25,
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
    padding: 10,
    borderRadius: 10,
    width: 120,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: 'RobotoSlab-Medium',
  },
  amount: {
    fontSize: 15,
    color: '#212121',
    fontFamily: 'RobotoSlab-Medium',
  },
  modalContainer: {
    flex: 1,
    marginTop: 70,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
  },
  modalContent: {
    width: '100%',
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'RobotoSlab-SemiBold',
    marginBottom: 20,
    color: '#1D2951',
  },
  modalTotal: {
    fontSize: 16,
    fontFamily: 'RobotoSlab-Regular',
    paddingBottom: 10,
    paddingTop: 10,
    color: '#4a4a4a',
  },
  bookButton: {
    backgroundColor: '#ff4500',
    width: '50%',
    padding: 8,
    alignItems: 'center',
    borderRadius: 10,
    elevation: 5,
  },
  modalButtonText: {
    color: '#ffffff',
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 15,
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
    width: 125,
    height: 105,
    borderRadius: 10,
  },
  loginModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginModalContent: {
    width: '80%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  loginModalTitle: {
    fontSize: 18,
    fontFamily: 'RobotoSlab-Medium',
    color: '#212121',
    marginBottom: 10,
    textAlign: 'center',
  },
  loginModalMessage: {
    fontSize: 14,
    color: '#4a4a4a',
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
    padding: 10,
    backgroundColor: '#A9A9A9',
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
  },
  loginCancelText: {
    color: '#FFFFFF',
    fontFamily: 'RobotoSlab-Medium',
  },
  loginProceedButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#FF4500',
    borderRadius: 10,
    marginLeft: 10,
    alignItems: 'center',
  },
  loginProceedText: {
    color: '#FFFFFF',
    fontFamily: 'RobotoSlab-Medium',
  },
});

export default SingleService;
