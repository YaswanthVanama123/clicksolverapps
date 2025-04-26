import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  useWindowDimensions,
  Button,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Foundation from 'react-native-vector-icons/Foundation';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import LottieView from 'lottie-react-native';
import crashlytics from '@react-native-firebase/crashlytics';
import EncryptedStorage from 'react-native-encrypted-storage';
import QuickSearch from '../Components/QuickSearch';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

// 1. Import i18n (this initializes translation)
import '../i18n/i18n';
// 2. Import the helper to change language
import { changeAppLanguage } from '../i18n/languageChange';
// 3. Import useTranslation hook from react-i18next
import { useTranslation } from 'react-i18next';

function Home({ navigation, route }) { 
  const { width, height } = useWindowDimensions();
  const { isDarkMode } = useTheme();
  const { t, i18n } = useTranslation();
  const styles = dynamicStyles(width, height, isDarkMode);

  // State variables for backend data and feedback
  const [profile, setProfile] = useState("");
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [greetingIcon, setGreetingIcon] = useState(null);
  const [messageBoxDisplay, setMessageBoxDisplay] = useState(false);
  const [trackScreen, setTrackScreen] = useState([]);
  const [name, setName] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [decodedId, setDecodedId] = useState(null);

  const scrollViewRef = useRef(null);

  // Sample special offers (with translations)
  const specialOffers = useMemo(
    () => [
      {
        id: '1',
        title: '20%',
        subtitle: t('new_user_special') || 'New User Special',
        description:
          t('new_user_special_description') ||
          'New users get a 20% discount on their first booking across any service category.',
        imageBACKENDAP:
          'https://i.postimg.cc/HsGnL9F1/58d3ebe039b0649cfcabe95ae59f4328.png',
        backgroundColor: '#FFF4E6',
        color: '#F24E1E',
      },
      {
        id: '2',
        title: '50%',
        subtitle: t('summer_sale') || 'Summer Sale',
        description:
          t('summer_sale_description') ||
          'Get a 50% discount on all services booked during the summer season.',
        imageBACKENDAP:
          'https://i.postimg.cc/rwtnJ3vB/b08a4579e19f4587bc9915bc0f7502ee.png',
        backgroundColor: isDarkMode ? '#FFFFFF' : '#E8F5E9',
        color: '#4CAF50',
      },
      {
        id: '3',
        title: '30%',
        subtitle: t('refer_a_friend') || 'Refer a Friend',
        description:
          t('refer_a_friend_description') ||
          'Refer a friend and get 30% off on your next service booking.',
        imageBACKENDAP:
          'https://i.postimg.cc/Kzwh9wZC/4c63fba81d3b7ef9ca889096ad629283.png',
        backgroundColor: '#E3F2FD',
        color: '#2196F3',
      },
    ],
    [isDarkMode, t],
  );


    // NEW: Function to translate user name if target language is not English
    const translateUserName = async (userName, targetLang) => {
      if (targetLang.toLowerCase() === 'en') {
        return userName;
      }
      try {
        const response = await axios.post('https://backend.clicksolver.com/api/translate', {
          text: userName,
          fromLang: 'en',
          toLang: targetLang  // send as "toLang" instead of "targetLang"
        });
        if (response.data && response.data.translatedText) {
          return response.data.translatedText;
        }
      } catch (error) {
        console.error('Translation error:', error);
      }
      return userName;
    };
    
    

  // useEffect(() => {
  //   crashlytics.log('ServiceApp component mounted');
  // }, []);

  useEffect(() => {
    const { encodedId } = route.params || {};
    if (encodedId) {
      try {
        const decoded = atob(encodedId);
        setDecodedId(decoded);
        setModalVisible(true);
      } catch (error) {
        console.error('Failed to decode encodedId:', error);
      }
    }
  }, [route.params]);

  useEffect(() => {
    fetchServices();
    setGreetingBasedOnTime();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTrackDetails();
    }, [])
  );

  // Fetch tracking details from the backend 
  // When fetching tracking details, send the user's name for translation if needed.
  const fetchTrackDetails = async () => {
    try {
      const cs_token = await EncryptedStorage.getItem('cs_token');
      // console.log('cs_token:', cs_token);
      if (cs_token) {
        const response = await axios.get(
          'https://backend.clicksolver.com/api/user/track/details',
          {
            headers: { Authorization: `Bearer ${cs_token}` }, 
          }
        ); 
        const track = response?.data?.track || [];
        // console.log(track)
        const { user, profile } = response.data;
        // console.log("Track response:", response.data);
        // Get the target language from your app settings (assuming i18n.language holds the code)
        const targetLang = i18n.language || 'en';
        // Translate the user's name if needed
        const translatedName = await translateUserName(user || response.data, targetLang);
        setName(translatedName);
        setProfile(profile);
        setMessageBoxDisplay(track.length > 0);
        setTrackScreen(track);
      }
    } catch (error) {
      console.error('Error fetching track details:', error);
    }
  };


  // Fetch available service categories from the backend
  const fetchServices = async () => {
    try {
      setLoading(true);
      // log('Attempting to fetch services from API');
      const response = await axios.get(
        'https://backend.clicksolver.com/api/home/services'
      );
      setServices(response.data);
    } catch (error) {
      recordError(error);
      console.error('Detailed Error:', error.toJSON ? error.toJSON() : error);
    } finally {
      setLoading(false); 
    }
  };

  const handleNotification = () => {
    navigation.push('Notifications');
  };

  const handleHelp = () => {
    navigation.push('Help');
  };

  const handleBookCommander = (serviceId,id) => {
    navigation.push('serviceCategory', { serviceObject: serviceId ,id});
  };

  // Set greeting text and icon based on time of day, using translations
  const setGreetingBasedOnTime = () => {
    const currentHour = new Date().getHours();
    let greetingMessage = t('good_day') || 'Good Day';
    let icon = <Icon name="sunny-sharp" size={14} color="#F24E1E" />;
    if (currentHour < 12) {
      greetingMessage = t('good_morning') || 'Good Morning';
      icon = <Icon name="sunny-sharp" size={16} color="#F24E1E" />;
    } else if (currentHour < 17) {
      greetingMessage = t('good_afternoon') || 'Good Afternoon';
      icon = <Feather name="sunset" size={16} color="#F24E1E" />;
    } else {
      greetingMessage = t('good_evening') || 'Good Evening';
      icon = <MaterialIcons name="nights-stay" size={16} color={isDarkMode ? "#fff" : "#000"} />;
    }
    setGreeting(greetingMessage);
    setGreetingIcon(icon);
  };

  // Render special offers
  const renderSpecialOffers = () => {
    return specialOffers.map(offer => (
      <View
        key={offer.id}
        style={[styles.offerCard, { backgroundColor: offer.backgroundColor }]}>
        <View style={styles.offerDetails}>
          <Text style={[styles.offerTitle, { color: '#ff4500' }]}>
            {offer.title}
          </Text>
          <Text style={[styles.offerSubtitle, { color: isDarkMode ? '#4a4a4a' : '#4a4a4a' }]}>
            {offer.subtitle}
          </Text>
          <Text style={[styles.offerDescription, { color: isDarkMode ? '#4a4a4a' : '#4a4a4a' }]}>
            {offer.description}
          </Text>
        </View>
        <Image source={{ uri: offer.imageBACKENDAP }} style={styles.offerImg} />
      </View>
    ));
  };

  // Render service cards from backend data
//   const renderServices = () => {
//     if (loading) {
//       return (
//         <View style={styles.fullScreenLoader}>
//           <LottieView
//             source={require('../assets/cardsLoading.json')}
//             autoPlay
//             loop
//             style={styles.loadingAnimation}
//           />
//         </View>
//       );
//     }
//     return services.map(service => (
//       <View key={service.service_id} style={styles.serviceCard}>
//         <Image
//           source={{
//             uri: service.service_urls || 'https://via.placeholder.com/100x100',
//           }}
//           style={styles.serviceImg}
//           resizeMode="stretch"
//         />
//         <View style={styles.serviceDetails}>
//           <Text style={styles.serviceTitle}> { t(`service_${service.service_id}`) || service.service_name }</Text>
//           <TouchableOpacity
//             style={styles.bookButton}
//             onPress={() => handleBookCommander(service.service_name,service.service_id)}>
//             <Text style={styles.bookButtonText}>{t('book_now') || 'Book Now ➔'}</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     ));
//   };


    // Render each service_title section with a horizontal scroll of its items
    const renderServiceSections = () => {
        if (loading) {
          return (
            <View style={styles.fullScreenLoader}>
              <LottieView
                source={require('../assets/cardsLoading.json')}
                autoPlay
                loop
                style={styles.loadingAnimation}
              />
            </View>
          );
        }
    
        return services.map(section => (
          <View key={section.service_title} style={styles.section}>
            {/* Section header */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.service_title}</Text>
                <TouchableOpacity
                    onPress={() => {
                    // navigate to a full list screen, passing the section
                    navigation.push('ServiceList', { title: section.service_title, items: section });
                    }}
                >
                    <Text style={styles.seeAllText}>{t('see_all') || 'See All'}</Text>
                </TouchableOpacity>
                </View>

    
            {/* Horizontal scroll of items */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {section.service_ids.map((id, idx) => (
                <TouchableOpacity
                  key={id}
                  style={styles.serviceCard}
                  onPress={() => handleBookCommander(section.service_names[idx], id)}
                >
                  <Image
                    source={{ uri: section.service_urls[idx] }}
                    style={styles.serviceImg}
                    resizeMode="cover"
                  />
                  <Text style={styles.serviceNameText}>
                    {t(`IndivService_${id}`) || section.service_names[idx]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ));
      };
    
    

  // Submit user feedback
  const submitFeedback = async () => {
    try {
      const response = await axios.post(
        'https://backend.clicksolver.com/api/user/feedback',
        {
          rating,
          comment,
          notification_id: decodedId,
        },
        {
          headers: {
            Authorization: `Bearer ${await EncryptedStorage.getItem('cs_token')}`,
          },
        },
      );
      // console.log('Feedback submitted successfully:', response.data);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      closeModal();
    }
  };

  const closeModal = () => {
    setRating(0);
    setComment('');
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Language Selector Button – navigates to a dedicated LanguageSelector screen */}
        {/* <View style={{ alignSelf: 'flex-end', margin: 10 }}>
          <Button
            title={t('change_language') || "Change Language"}
            onPress={() => navigation.navigate('LanguageSelector')}
          />
        </View> */}

        {/* Header Row */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <TouchableOpacity onPress={() =>
              navigation.navigate('Tabs', { screen: 'Account' })
            }>
              {profile ? 
                <View>
                  <Image source={{ uri: profile }} style={styles.image} />
                </View>
              :
                <View style={styles.userInitialCircle}>
                  <Text style={styles.userInitialText}>
                    {name?.charAt?.(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>  
              }
            </TouchableOpacity>
            <View style={styles.greeting}>
              <Text style={styles.greetingText}>
                {greeting}{' '}
                <Text style={styles.greetingIcon}>{greetingIcon}</Text>
              </Text>
              <Text style={styles.userName}>{name}</Text>
            </View>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={handleNotification}>
              <Icon name="notifications-outline" size={23} color={isDarkMode ? '#fff' : "#212121"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleHelp}>
              <Feather name="help-circle" size={23} color={isDarkMode ? '#fff' : "#212121"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Search */}
        <QuickSearch />

        {/* Main Scrollable Content */}
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}>
          {/* Special Offers */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('special_offers') || 'Special Offers'}</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.offersScrollView}>
              {renderSpecialOffers()}
            </ScrollView>
          </View>

          {/* Services */}
          <View style={styles.section}>
            {/* <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('services') || 'Services'}</Text>
            </View> */}
            {renderServiceSections()}
          </View>
        </ScrollView>

        {/* Tracking Message Box */}  
        {messageBoxDisplay && (
          <ScrollView
            horizontal
            ref={scrollViewRef}
            style={styles.messageBoxWrapper}
            showsHorizontalScrollIndicator={false}>
            {trackScreen.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.messageBoxContainer,
                  {
                    width: trackScreen.length > 1 ? width * 0.8 : width * 0.88,
                    marginRight: trackScreen.length > 1 ? 10 : 0,
                  },
                ]}
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
                    offer: item.offer,
                  })
                }>
                <View style={styles.messageBox1}>
                  <View style={styles.startingContainer}>
                    <View style={styles.timeContainer}>
                      {item.screen === 'Paymentscreen' ? (
                        <Foundation name="paypal" size={24} color="#ffffff" />
                      ) : item.screen === 'UserNavigation' ? (
                        <MaterialCommunityIcons name="truck" size={24} color="#ffffff" />
                      ) : item.screen === 'userwaiting' ? (
                        <Feather name="search" size={24} color="#ffffff" />
                      ) : item.screen === 'OtpVerification' ? (
                        <Feather name="shield" size={24} color="#ffffff" />
                      ) : item.screen === 'worktimescreen' ? (
                        <MaterialCommunityIcons name="hammer" size={24} color="#ffffff" />
                      ) : (
                        <Feather name="alert-circle" size={24} color={isDarkMode ? "#fff" : "#000"} />
                      )}
                    </View>

                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.serviceBookedText} numberOfLines={1} ellipsizeMode="tail">
                        {item.serviceBooked && item.serviceBooked.length > 0
                          ? item.serviceBooked
                              .slice(0, 2)
                              .map(service =>  t(`singleService_${service.main_service_id}`) || service.serviceName )
                              .join(', ') + (item.serviceBooked.length > 2 ? '...' : '')
                          : t('service_booked', 'Service Booked')}
                      </Text>

                      <Text style={styles.textContainerTextCommander}>
                        {item.screen === 'Paymentscreen'
                          ? t('payment_in_progress', 'Payment in progress')
                          : item.screen === 'UserNavigation'
                          ? t('commander_on_the_way', 'Commander is on the way')
                          : item.screen === 'OtpVerification'
                          ? t('user_waiting_for_help', 'User is waiting for your help')
                          : item.screen === 'worktimescreen'
                          ? t('work_in_progress', 'Work in progress')
                          : t('nothing', 'Nothing')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.rightIcon}>
                    <Feather name="chevrons-right" size={18} color="#9e9e9e" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        {/* Rating Modal */}
        <Modal visible={isModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <Icon name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {t('feedback_modal_title') || 'How was the quality of your Service?'}
              </Text>
              <Text style={styles.modalSubtitle}>
                {t('feedback_modal_subtitle') ||
                  'Your answer is anonymous. This helps us improve our service.'}
              </Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map(star => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    style={styles.starButton}>
                    <MaterialCommunityIcons
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={30}
                      color={star <= rating ? '#FFD700' : '#A9A9A9'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.commentBox}
                placeholder={t('feedback_placeholder') || 'Write your comment here...'}
                placeholderTextColor={isDarkMode ? '#A9A9A9' : '#A9A9A9'}
                multiline
                value={comment}
                onChangeText={setComment}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={closeModal} style={styles.notNowButton}>
                  <Text style={styles.notNowText}>
                    {t('feedback_not_now') || 'Not now'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={submitFeedback} style={styles.submitButton}>
                  <Text style={styles.submitText}>
                    {t('feedback_submit') || 'Submit'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

const dynamicStyles = (width, height, isDarkMode) => {
  const isTablet = width > 600;
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
    },
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
      padding: isTablet ? 30 : 20,
      paddingBottom: 0,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: isTablet ? 30 : 20,
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    image:{
      width:30,
      height:30,
      borderRadius:15
    }, 
    userInitialCircle: {
      width: isTablet ? 50 : 40,
      height: isTablet ? 50 : 40,
      borderRadius: 25,
      backgroundColor: isDarkMode ? '#333' : '#f0f0f0',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    userInitialText: {
      fontSize: isTablet ? 20 : 18,
      color: isDarkMode ? '#fff' : '#333',
      fontFamily: 'RobotoSlab-Bold',
    },
    greeting: {
      flexDirection: 'column',
    },
    greetingText: {
      fontSize: isTablet ? 16 : 14,
      lineHeight: 18.75,
      fontStyle: 'italic',
      color: isDarkMode ? '#ccc' : '#808080',
      fontFamily: 'RobotoSlab-ExtraBold',
    },
    greetingIcon: {
      fontSize: isTablet ? 19 : 17,
    },
    userName: {
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'RobotoSlab-Bold',
      color: isDarkMode ? '#ddd' : '#4A4A4A',
      lineHeight: 21.09,
    },
    headerIcons: {
      flexDirection: 'row',
      gap: 15,
    },
    scrollViewContent: {
      paddingBottom: 10,
    },
    section: {
      marginBottom: isTablet ? 25 : 20,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: isTablet ? 18 : 16,
      color: isDarkMode ? '#fff' : '#1D2951',
      fontFamily: 'RobotoSlab-Bold',
    },
    offersScrollView: {
      display: 'flex',
      gap: 10,
    },
    offerCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: isTablet ? 330 : 300,
      borderRadius: 10,
    },
    offerDetails: {
      width: '60%',
      padding: 15,
    },
    offerTitle: {
      fontSize: isTablet ? 34 : 30,
      fontFamily: 'RobotoSlab-Bold',
      color: '#ff4500',
    },
    offerSubtitle: {
      fontSize: isTablet ? 16 : 14,
      lineHeight: 16.41,
      fontFamily: 'RobotoSlab-SemiBold',
      color: isDarkMode ? '#ccc' : '#4a4a4a',
    },
    offerDescription: {
      fontSize: isTablet ? 14 : 12,
      fontFamily: 'RobotoSlab-Regular',
      opacity: 0.8,
      lineHeight: 14.06,
      fontWeight: '400',
      color: isDarkMode ? '#ccc' : '#4a4a4a',
    },
    offerImg: {
      width: isTablet ? 140 : 119,
      height: isTablet ? 150 : 136,
      alignSelf: 'flex-end',
    },
    fullScreenLoader: {
      flex: 1,
    },
    // container for each card in the horizontal list
    serviceCard: {
        width: isTablet ? 140 : 120,    // fixed square width
        marginRight: 12,
        alignItems: 'center',           // center image and text
      },
      // square image
      serviceImg: {
        width: '100%',
        aspectRatio: 1,                 // makes height = width
        borderRadius: 10,
        backgroundColor: '#eee',        // placeholder bg
      },
      // text under the image
      serviceNameText: {
        marginTop: 8,
        textAlign: 'center',
        fontSize: isTablet ? 14 : 12,
        fontFamily: 'RobotoSlab-Bold',
        color: isDarkMode ? '#fff' : '#333',
      },
      // horizontal list container
      horizontalList: {
        paddingLeft: 10,
        paddingRight: 10,
      },
  
    messageBoxWrapper: {
      marginTop: 10,
    },
    messageBoxContainer: {
      backgroundColor: isDarkMode ? '#333' : '#ffffff',
      borderRadius: 10,
      flexDirection: 'row',
      padding: 15,
      justifyContent: 'space-between',
      alignItems: 'center',
      elevation: 1,
    },
    messageBox1: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flex: 1,
    },
    startingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    timeContainer: {
      width: isTablet ? 50 : 45,
      height: isTablet ? 50 : 45,
      backgroundColor: '#ff5722',
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    textContainerText: {
      fontSize: isTablet ? 15 : 13,
      fontFamily: 'RobotoSlab-Bold',
      color: isDarkMode ? '#fff' : '#212121',
      marginLeft: 10,
      width: '80%',
    },
    serviceBookedText: {
      fontSize: isTablet ? 14 : 12,
      color: isDarkMode ? '#fff' : '#9e9e9e',
      fontFamily: 'RobotoSlab-Regular',
      marginLeft: 10,
    },
    textContainerTextCommander: {
      fontSize: isTablet ? 14 : 12,
      color: isDarkMode ? '#fff' : '#9e9e9e',
      fontFamily: 'RobotoSlab-Regular',
      marginLeft: 10,
    },
    rightIcon: {
      marginLeft: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: isDarkMode ? '#333' : '#FFFFFF',
      borderTopLeftRadius: 15,
      borderTopRightRadius: 15,
      padding: 20,
      alignItems: 'center',
    },
    closeButton: {
      alignSelf: 'flex-end',
      backgroundColor: '#FF4500',
      borderRadius: 15,
      padding: 5,
    },
    modalTitle: {
      fontSize: isTablet ? 20 : 18,
      fontFamily: 'RobotoSlab-Medium',
      color: isDarkMode ? '#fff' : '#212121',
      marginTop: 10,
      textAlign: 'center',
    },
    modalSubtitle: {
      fontSize: isTablet ? 15 : 13,
      color: isDarkMode ? '#ccc' : '#9e9e9e',
      marginVertical: 10,
      textAlign: 'center',
      fontFamily: 'RobotoSlab-Regular',
    },
    starsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginVertical: 20,
    },
    starButton: {
      marginHorizontal: 5,
    },
    commentBox: {
      width: '100%',
      height: 80,
      borderWidth: 1,
      borderColor: '#A9A9A9',
      borderRadius: 10,
      backgroundColor: isDarkMode ? '#444' : '#FFFFFF',
      padding: 10,
      color: isDarkMode ? '#fff' : '#000',
      fontSize: 14,
      fontFamily: 'RobotoSlab-Regular',
      marginBottom: 20,
      textAlignVertical: 'top',
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      marginTop: 20,
    },
    notNowButton: {
      padding: 10,
      backgroundColor: '#A9A9A9',
      borderRadius: 5,
    },
    notNowText: {
      color: '#FFFFFF',
      fontFamily: 'RobotoSlab-Medium',
    },
    submitButton: {
      padding: 10,
      backgroundColor: '#FF4500',
      borderRadius: 5,
    },
    submitText: {
      color: '#FFFFFF',
      fontFamily: 'RobotoSlab-Medium',
    },
    loadingAnimation: {
      width: 150,
      height: 150,
    },
    horizontalList: {
        paddingLeft: 10,
        paddingRight: 10,
        // optional gap if you want space between cards:
        // gap: 10,
      }, 
  
  });
};

export default Home;
