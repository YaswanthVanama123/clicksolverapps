import axios from 'axios';
import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
} from 'react-native';
import Swiper from 'react-native-swiper';
import {useNavigation, useRoute} from '@react-navigation/native';
import Entypo from 'react-native-vector-icons/Entypo';
import Icon from 'react-native-vector-icons/Ionicons';
import EncryptedStorage from 'react-native-encrypted-storage';

const SingleService = () => {
  const navigation = useNavigation();
  const [services, setServices] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [bookedServices, setBookedServices] = useState([]);
  const [totalAmount, setTotalAmount] = useState(10);
  const [originalTotal, setOriginalAmount] = useState(0);
  const route = useRoute();
  const {serviceName} = route.params;

  const fetchDetails = useCallback(async () => {
    try {
      const response = await axios.post(
        `${process.env.BACKENDAIPG}/api/single/service`,
        {
          serviceName,
        },
      );
      const {relatedServices} = response.data;
      setServices(relatedServices);
      setQuantities(
        relatedServices.reduce(
          (acc, service) => ({...acc, [service.main_service_id]: 0}),
          {},
        ),
      );
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  }, [serviceName]);

  useEffect(() => {
    const fetchStoredCart = async () => {
      try {
        const storedCart = await EncryptedStorage.getItem(serviceName);
        // console.log("stored", storedCart);
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
    };

    fetchDetails().then(fetchStoredCart);
  }, [fetchDetails, serviceName]);

  useEffect(() => {
    const total = services.reduce((acc, service) => {
      const quantity = quantities[service.main_service_id] || 0;
      const cost = parseFloat(service.cost) || 0;
      return acc + calculateDiscount(cost, quantity);
    }, 0);

    const originalTotal = services.reduce((acc, service) => {
      const quantity = quantities[service.main_service_id] || 0;
      const cost = parseFloat(service.cost) || 0;
      return acc + cost * quantity;
    }, 0);

    setTotalAmount(total);
    setOriginalAmount(originalTotal);

    const booked = services
      .map(service => {
        const quantity = quantities[service.main_service_id];
        if (quantity > 0) {
          return {
            serviceName: service.service_tag,
            quantity,
            cost: calculateDiscount(parseFloat(service.cost), quantity),
            originalCost: parseFloat(service.cost) * quantity,
            url: service.service_details.urls,
            description: service.service_details.about,
            main_service_id: service.main_service_id,
          };
        }
        return null;
      })
      .filter(Boolean);

    setBookedServices(booked);

    // Store the updated booked services in EncryptedStorage only if there are items to store
    if (booked.length > 0) {
      const storeCart = async () => {
        try {
          await EncryptedStorage.setItem(serviceName, JSON.stringify(booked));
          // console.log("Cart stored successfully:", booked);
        } catch (error) {
          console.error('Error storing cart:', error);
        }
      };
      storeCart();
    }
  }, [quantities, services, serviceName]);

  const handleQuantityChange = (id, delta) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta),
    }));
  };

  const calculateDiscount = (cost, quantity) => {
    if (quantity === 1) return cost;
    if (quantity === 2) return cost * quantity * 0.85;
    if (quantity === 3) return cost * quantity * 0.8;
    return cost * quantity * 0.7;
  };

  const handleBookNow = () => {
    setModalVisible(true);
  };

  const bookService = () => {
    setModalVisible(false);
    navigation.push('UserLocation', {serviceName: bookedServices});
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity style={styles.imageIcons} onPress={handleBackPress}>
            <Icon name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.imageIcons}>
            <Icon name="search" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.carouselContainer}>
          <Swiper
            style={styles.wrapper}
            autoplay
            autoplayTimeout={3}
            showsPagination={false}>
            {services.map(service => (
              <View key={service.main_service_id}>
                <Image
                  source={{uri: service.service_urls[0]}}
                  style={styles.carouselImage}
                  resizeMode="cover"
                />
              </View>
            ))}
          </Swiper>
        </View>

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

        <View style={styles.recomendedContainer}>
          {services.map(service => (
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
                  source={{uri: service.service_details.urls}}
                  style={styles.recomendedImage}
                  resizeMode="stretch"
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {totalAmount > 0 && (
        <View style={styles.cartContainer}>
          <View>
            {bookedServices.some(
              service => service.originalCost !== service.cost,
            ) && (
              <Text style={styles.originalAmount}>
                <Text style={styles.crossedText}>₹{originalTotal}</Text>
              </Text>
            )}
            <Text style={styles.ammount}>Total: ₹{totalAmount}</Text>
          </View>
          <TouchableOpacity
            onPress={handleBookNow}
            style={styles.buttonContainer}>
            <Text style={styles.buttonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      )}

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
            <ScrollView>
              <View style={styles.itemContainers}>
                {bookedServices.map((service, index) => (
                  <View key={index} style={styles.itemContainer}>
                    {service.url ? (
                      <Image
                        source={{uri: service.url}}
                        style={styles.recomendedModalImage}
                        resizeMode="stretch"
                      />
                    ) : (
                      <Image
                        source={{uri: 'https://postimage.png'}}
                        style={styles.recomendedModalImage}
                        resizeMode="stretch"
                      />
                    )}
                    <View style={styles.descriptionContainer}>
                      <Text style={styles.recomendedCardDetailsHead}>
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
            <TouchableOpacity style={styles.bookButton} onPress={bookService}>
              <Text style={styles.modalButtonText}>Book Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 0,
    backgroundColor: '#FFFFFF',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
    width: '100%',
  },
  scrollContainer: {
    flex: 1,
    marginBottom: 80,
  },
  itemContainers: {
    flexDirection: 'column',
    width: '100%',
    gap: 20,
  },
  descriptionContainer: {
    width: '45%',
  },
  originalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  crossedText: {
    textDecorationLine: 'line-through',
    color: 'red',
    marginRight: 5,
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
  },
  recomendedCardDetailsRating: {
    color: '#212121',
    fontSize: 15,
    paddingBottom: 10,
    paddingTop: 5,
  },
  recomendedCardDetailsDescription: {
    color: '#4a4a4a',
    fontSize: 12,
    lineHeight: 15,
  },
  recomendedCardDetailsHead: {
    color: '#212121',
    fontWeight: '500',
    fontSize: 16,
    paddingBottom: 5,
  },
  recomendedCardDetails: {
    width: '55%',
  },
  recomendedImage: {
    width: 105,
    height: 105,
    borderRadius: 10,
  },
  recomendedModalImage: {
    width: 125,
    height: 105,
    borderRadius: 10,
  },
  recomendedCard: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 25,
  },
  recomendedContainer: {
    padding: 20,
    marginBottom: 50,
    paddingTop: 0,
  },
  serviceDetails: {
    padding: 20,
    paddingTop: 5,
  },
  horizantalLine: {
    width: '100%',
    height: 5,
    backgroundColor: '#f5f5f5',
  },
  priceContainer: {
    marginTop: 5,
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
  headerIcons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 80,
  },
  imageIcons: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrapper: {
    height: 250,
  },
  carouselContainer: {
    marginTop: 0,
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
  serviceTitle: {
    fontSize: 22,
    color: '#212121',
    fontWeight: '600',
    width: '90%',
    lineHeight: 25,
  },
  crossIcon: {
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
  },
  crossIconContainer: {
    marginRight: 10,
    marginBottom: 10,
  },
  ammount: {
    color: '#212121',
  },
  cartContainer: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: 15,
    paddingHorizontal: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
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
    fontWeight: '500',
  },
  bookButton: {
    backgroundColor: '#ff4500',
    width: '50%',
    padding: 8,
    alignItems: 'center',
    borderRadius: 10,
    elevation: 5,
  },
  Sparetext: {
    color: '#4a4a4a',
    opacity: 0.8,
    fontSize: 14,
    width: '90%',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '100%',
    height: '85%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1D2951',
  },
  modalTotal: {
    fontSize: 16,
    fontWeight: '500',
    paddingBottom: 10,
    paddingTop: 10,
    color: '#4a4a4a',
  },
  modalButtonText: {
    color: '#ffffff',
    fontWeight: '500',
    fontSize: 15,
  },
});

export default SingleService;
