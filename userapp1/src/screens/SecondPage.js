import React, { useEffect, useRef, useState, useMemo } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from "@react-navigation/native";
import EncryptedStorage from 'react-native-encrypted-storage';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import axios from 'axios';
import uuid from 'react-native-uuid';
import QuickSearch from '../Components/QuickSearch';
import LottieView from 'lottie-react-native';

function ServiceApp() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [greetingIcon, setGreetingIcon] = useState(null);
  const [messageBoxDisplay, setMessageBoxDisplay] = useState(false);
  const [trackScreen, setTrackScreen] = useState([]);
  const [name, setName] = useState('');

  const screenWidth = Dimensions.get('window').width;
  const scrollViewRef = useRef(null);
  const itemWidth = screenWidth * 0.95; 
  const navigation = useNavigation();

  const specialOffers = useMemo(() => [
    {
      id: '1',
      title: '20%',
      subtitle: 'New User Special',
      description: 'New users get a 20% discount on their first booking across any service category.',
      imageBACKENDAP: 'https://i.postimg.cc/HsGnL9F1/58d3ebe039b0649cfcabe95ae59f4328.png',
      backgroundColor: '#FFF4E6',
      color: '#F24E1E'
    },
    {
      id: '2',
      title: '50%',
      subtitle: 'Summer Sale',
      description: 'Get a 50% discount on all services booked during the summer season.',
      imageBACKENDAP: 'https://i.postimg.cc/rwtnJ3vB/b08a4579e19f4587bc9915bc0f7502ee.png',
      backgroundColor: '#E8F5E9',
      color: '#4CAF50'
    },
    {
      id: '3',
      title: '30%',
      subtitle: 'Refer a Friend',
      description: 'Refer a friend and get 30% off on your next service booking.',
      imageBACKENDAP: 'https://i.postimg.cc/Kzwh9wZC/4c63fba81d3b7ef9ca889096ad629283.png',
      backgroundColor: '#E3F2FD',
      color:'#2196F3'
    },
  ], []);

  useEffect(() => {
    fetchServices();
    fetchTrackDetails();
    setGreetingBasedOnTime();
  }, []);

  const fetchTrackDetails = async () => {
    try {
      const cs_token = await EncryptedStorage.getItem('cs_token');
      if (cs_token) {
        const response = await axios.get(`${process.env.BACKENDAIPD}/api/user/track/details`, {
          headers: { Authorization: `Bearer ${cs_token}` },
        });
    
        const track = response?.data?.track || [];
        const { user } = response.data;
     
        setName(user || response.data);
        setMessageBoxDisplay(track.length > 0);
        setTrackScreen(track);
      }
    } catch (error) {
      console.error('Error fetching track details:', error);
    }
  };

  const setGreetingBasedOnTime = () => {
    const currentHour = new Date().getHours();
    let greetingMessage = 'Good Day';
    let icon = <Icon name="sunny-sharp" size={14} color="#F24E1E" />;

    if (currentHour < 12) {
      greetingMessage = 'Good Morning';
      icon = <Icon name="sunny-sharp" size={16} color="#F24E1E" />;
    } else if (currentHour < 17) {
      greetingMessage = 'Good Afternoon';
      icon = <Feather name="sunset" size={16} color="#F24E1E" />;
    } else {
      greetingMessage = 'Good Evening';
      icon = <MaterialIcons name="nights-stay" size={16} color="#000" />;
    }

    setGreeting(greetingMessage);
    setGreetingIcon(icon);
  };

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.BACKENDAIPD}/api/servicecategories`);
      const servicesWithIds = response.data.map(service => ({ ...service, id: uuid.v4() }));
      setServices(servicesWithIds);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotification = () => {
    navigation.push('Tabs', { screen: 'Notification' });
  };

  const handleHelp = () => {
    navigation.push('Help');
  };

  const handleBookCommander = (serviceId) => {
    navigation.push('serviceCategory', { serviceObject: serviceId });
  };

  const renderSpecialOffers = () => {
    return specialOffers.map(offer => (
      <View key={offer.id} style={[styles.offerCard, { backgroundColor: offer.backgroundColor }]}>
        <View style={styles.offerDetails}>
          <Text style={[styles.offerTitle, { color: '#ff4500' }]}>{offer.title}</Text>
          <Text style={[styles.offerSubtitle, { color: '#4a4a4a' }]}>{offer.subtitle}</Text>
          <Text style={[styles.offerDescription, { color: '#4a4a4a' }]}>{offer.description}</Text>
        </View>
        <Image source={{ uri: offer.imageBACKENDAP }} style={styles.offerImg} />
      </View>
    ));
  };

  const renderServices = () => {
    if (loading) {
      return (
        <LottieView
          source={require('../assets/cardsLoading.json')}
          autoPlay
          loop
          style={styles.loadingAnimation}
        />
      );
    }

    return services.map(service => (
      <View key={service.id} style={styles.serviceCard}>
        <Image source={{ uri: service.service_urls || 'https://via.placeholder.com/100x100' }} style={styles.serviceImg} resizeMode="stretch" />
        <View style={styles.serviceDetails}>
          <Text style={styles.serviceTitle}>{service.service_name}</Text>
          <TouchableOpacity style={styles.bookButton} onPress={() => handleBookCommander(service.service_name)}>
            <Text style={styles.bookButtonText}>Book Now ➔</Text>
          </TouchableOpacity>
        </View>
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.userInitialCircle}>
            <Text style={styles.userInitialText}>{name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.greeting}>
            <Text style={styles.greetingText}>
              {greeting} <Text style={styles.greetingIcon}>{greetingIcon}</Text>
            </Text>
            <Text style={styles.userName}>{name}</Text>
          </View>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={handleNotification}>
            <Icon name="notifications-outline" size={23} color="#212121" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleHelp}>
            <Feather name="help-circle" size={23} color="#212121" />
          </TouchableOpacity>
        </View>
      </View>

      <QuickSearch />

      <ScrollView contentContainerStyle={styles.scrollViewContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Special Offers</Text>
            <Text style={styles.seeAll}>See All</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.offersScrollView}>
            {renderSpecialOffers()}
          </ScrollView>
        </View>

        <View style={styles.Servicessection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Services</Text>
            <Text style={styles.seeAll}>See All</Text>
          </View>
          {renderServices()}
        </View>
      </ScrollView>

      {messageBoxDisplay && (
        <ScrollView
          horizontal
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollViewHorizontal}
          showsHorizontalScrollIndicator={false}
          style={styles.absoluteMessageBox}
        >
          {trackScreen.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.messageBoxContainer, { width: itemWidth }]}
              onPress={() =>
                navigation.replace(item.screen, {
                  encodedId: item.encodedId,
                  area: item.area,
                  city: item.city,
                  pincode: item.pincode,
                  alternateName: item.alternateName,
                  alternatePhoneNumber: item.alternatePhoneNumber,
                  serviceBooked: item.serviceBooked,
                  location: item.location,
                })
              }
            >
              <View style={styles.messageBox}>
                {/* Icon Container */}
                {console.log(item.serviceBooked)}
                <View style={styles.iconContainer}>
                  <Image
                    source={{ uri: 'https://i.postimg.cc/jSJS7rDH/1727646707169dp7gkvhw.png' }}
                    style={styles.iconImage}
                  />
                </View>

                {/* Service Info Container */}
                <View style={styles.serviceInfoContainer}>
                  <Text style={styles.serviceTitle}>
                    {item.serviceBooked && item.serviceBooked.length > 0
                      ? item.serviceBooked.map(service => service.serviceName).join(', ')
                      : 'Switch board & Socket repairing'}
                  </Text>
                  <Text style={styles.waitingText}>
                    {item.screen === 'userwaiting'
                      ? 'Looking for commander for your problem'
                      : item.screen === 'worktimescreen'
                      ? 'Commander on progress'
                      : item.screen === 'Paymentscreen'
                      ? 'Payment in progress'
                      : item.screen === 'UserNavigation'
                      ? 'Commander on the way'
                      : 'User is waiting for your help'}
                  </Text>
                </View>

                {/* Arrow Icon */}
                <View style={styles.rightIcon}>
                  <Feather name="chevrons-right" size={18} color="#9e9e9e" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}





    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingBottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  Servicessection: {
    marginBottom: 20,
  },
  offersScrollView: {
    display: 'flex',
    gap: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInitialCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  loadingAnimation: {
    width: '100%',
    height: '100%',
  },
  userInitialText: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  greeting: {
    flexDirection: 'column',
    color: '#333',
  },
  greetingText: {
    fontSize: 14,
    fontFamily: 'Roboto',
    lineHeight: 18.75,
    fontStyle: 'italic',
    color: '#808080',
    fontWeight: 'bold',
  },
  greetingIcon: {
    fontSize: 17,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4A4A4A',
    lineHeight: 21.09,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 15,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D2951',
  },
  seeAll: {
    fontSize: 14,
    color: '#4a4a4a',
  },
  offerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 300,
    borderRadius: 10,
  },
  offerDetails: {
    width: '60%',
    padding: 15,
  },
  offerTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    fontFamily: 'Roboto',
  },
  offerSubtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 16.41,
    fontFamily: 'Roboto',
  },
  offerDescription: {
    fontSize: 12,
    fontFamily: 'Roboto',
    opacity: 0.8,
    lineHeight: 14.06,
    fontWeight: '400',
  },
  offerImg: {
    width: 119,
    height: 136,
    alignSelf: 'flex-end',
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  serviceImg: {
    width: 181,
    height: 115,
    borderRadius: 10,
  },
  serviceDetails: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 10,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4a4a4a',
    lineHeight: 21.09,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF4500',
    borderRadius: 15,
    marginTop: 10,
    width: 110,
    height: 31,
    opacity: 0.88,
  },
  bookButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
  },
  absoluteMessageBox: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
  },
  scrollViewHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageBoxContainer: {
    marginHorizontal: 5,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth:1.5,
    borderColor:'#EFDCCB',
    shadowColor: '#ff4500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 1,
  },
  messageBox: {
    flexDirection: 'row',
    width:'100%',
    alignItems: 'center',
    justifyContent:'center',
    padding: 10,
  },
  iconContainer: {
    marginRight: 10,
  },
  iconImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  serviceInfoContainer: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  rightIcon:{
    marginLeft:8
  },
  waitingText: {
    fontSize: 12,
    color: '#1D2951',
  },
});

export default ServiceApp;
