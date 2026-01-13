/**
 * OnboardingScreen Component
 * Welcome screen with app introduction slides and permission requests
 * Features: Swipeable slides, permission handling, first-time user experience
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
  Alert,
} from 'react-native';
import Swiper from 'react-native-swiper';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import EncryptedStorage from 'react-native-encrypted-storage';
import {
  useNavigation,
  CommonActions,
} from '@react-navigation/native';
import {
  requestNotifications,
  PERMISSIONS,
  request,
  RESULTS,
} from 'react-native-permissions';

/**
 * OnboardingScreen - First-time user onboarding experience
 * Displays introduction slides and requests necessary permissions
 * @returns {JSX.Element}
 */
const OnboardingScreen = () => {
  const swiperRef = useRef(null);
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();
  const styles = dynamicStyles(width, height);

  /**
   * Onboarding slides data
   */
  const slides = [
    {
      key: '1',
      title: 'Instant Help in 15 Minutes!',
      text: 'Need quick assistance? ClickSolver connects you with skilled professionals within 15 minutes for urgent tasks.',
      image: 'https://i.postimg.cc/g0hxsQ9g/Electrician-Onboarding-removebg-preview.png',
      backgroundColorPrimary: '#FF4500',
      backgroundColorSecondary: '#FF6347',
    },
    {
      key: '2',
      title: 'Stay Updated with Notifications',
      text: 'We need permission to send you updates on your service status.',
      image: 'https://i.postimg.cc/zXhWxsJN/Project-186-15-generated-1.jpg',
      backgroundColorPrimary: '#4A90E2',
      backgroundColorSecondary: '#50A7F9',
    },
    {
      key: '3',
      title: 'Enable Your Location',
      text: 'Allow location access so we can book services near you.',
      image: 'https://i.postimg.cc/8zBvSLJn/vecteezy-isometric-illustration-concept-location-finder-map-5638544-1-1.jpg',
      backgroundColorPrimary: '#34C759',
      backgroundColorSecondary: '#5FD78A',
    },
  ];

  /**
   * Requests notification permission based on platform
   * @returns {Promise<void>}
   */
  const requestNotificationPermission = async () => {
    try {
      if (Platform.OS === 'ios') {
        const { status } = await requestNotifications(['alert', 'sound']);
        console.log('[OnboardingScreen] iOS Notification permission:', status);
      } else {
        const result = await request(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
        console.log('[OnboardingScreen] Android Notification permission:', result);
      }
    } catch (error) {
      console.error('[OnboardingScreen] Error requesting notification permission:', error);
    }
  };

  /**
   * Requests location permission based on platform
   * @returns {Promise<void>}
   */
  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'ios') {
        const result = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        console.log('[OnboardingScreen] iOS Location permission:', result);

        if (result === RESULTS.DENIED) {
          Alert.alert(
            'Location Permission',
            'Location access is needed to find nearby service providers. You can enable it later in Settings.',
            [{ text: 'OK' }]
          );
        }
      } else {
        const result = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
        console.log('[OnboardingScreen] Android Location permission:', result);

        if (result === RESULTS.DENIED) {
          Alert.alert(
            'Location Permission',
            'Location access is needed to find nearby service providers. You can enable it later in Settings.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('[OnboardingScreen] Error requesting location permission:', error);
    }
  };

  /**
   * Handles next button press for each slide
   * @param {number} index - Current slide index
   */
  const handleNextPress = async (index) => {
    // Slide 2: Request notification permission
    if (index === 1) {
      await requestNotificationPermission();
      swiperRef.current?.scrollBy(1);
      return;
    }

    // Slide 3: Request location permission and finish onboarding
    if (index === 2) {
      await requestLocationPermission();
      await finishOnboarding();
      return;
    }

    // Default: Go to next slide
    swiperRef.current?.scrollBy(1);
  };

  /**
   * Skips onboarding and navigates to main app
   */
  const handleSkipPress = async () => {
    await finishOnboarding();
  };

  /**
   * Marks onboarding as complete and navigates to main app
   * @returns {Promise<void>}
   */
  const finishOnboarding = async () => {
    try {
      await EncryptedStorage.setItem('onboarded', 'true');
      console.log('[OnboardingScreen] Onboarding completed');

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }],
        })
      );
    } catch (error) {
      console.error('[OnboardingScreen] Error setting onboarded key:', error);
      Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Swiper
        ref={swiperRef}
        loop={false}
        dotStyle={styles.dotStyle}
        activeDotStyle={styles.activeDotStyle}
        paginationStyle={styles.paginationStyle}
        showsButtons={false}
      >
        {slides.map((slide, index) => (
          <View key={slide.key} style={styles.slide}>
            <LinearGradient
              colors={[
                slide.backgroundColorPrimary,
                slide.backgroundColorSecondary,
              ]}
              style={styles.innerCard}
            >
              <Image
                source={{ uri: slide.image }}
                style={styles.image}
                resizeMode="contain"
              />
            </LinearGradient>

            <View style={styles.onboardingContent}>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.text}>{slide.text}</Text>
            </View>

            <View style={styles.buttonContainer}>
              {index < slides.length - 1 && (
                <TouchableOpacity
                  style={[styles.button, styles.skipButton]}
                  onPress={handleSkipPress}
                  activeOpacity={0.7}
                >
                  <Text style={styles.skipButtonText}>Skip</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.button, styles.nextButton]}
                onPress={() => handleNextPress(index)}
                activeOpacity={0.7}
              >
                <Text style={styles.buttonText}>
                  {index === slides.length - 1 ? 'Get Started' : 'Next'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </Swiper>
    </SafeAreaView>
  );
};

/**
 * Dynamic styles based on screen dimensions
 * @param {number} width - Screen width
 * @param {number} height - Screen height
 * @returns {object} StyleSheet object
 */
const dynamicStyles = (width, height) => {
  const isTablet = width >= 600;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    slide: {
      flex: 1,
    },
    innerCard: {
      height: '40%',
      borderBottomRightRadius: 25,
      borderBottomLeftRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
    },
    image: {
      width: '80%',
      height: '80%',
    },
    onboardingContent: {
      flex: 1,
      justifyContent: 'center',
      padding: isTablet ? 40 : 25,
    },
    title: {
      fontSize: isTablet ? 26 : 22,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 15,
      color: '#1B1D21',
      fontFamily: 'RobotoSlab-Bold',
    },
    text: {
      fontSize: isTablet ? 16 : 14,
      lineHeight: isTablet ? 28 : 22,
      textAlign: 'center',
      color: 'rgba(0, 0, 0, 0.5)',
      fontFamily: 'RobotoSlab-Regular',
    },
    paginationStyle: {
      bottom: 100,
    },
    dotStyle: {
      backgroundColor: '#C0C0C0',
      width: 8,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 3,
    },
    activeDotStyle: {
      backgroundColor: '#000',
      width: 16,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 3,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginHorizontal: 25,
      marginBottom: 20,
      gap: 10,
    },
    button: {
      borderRadius: 45,
      paddingVertical: isTablet ? 16 : 13,
      paddingHorizontal: 25,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    nextButton: {
      backgroundColor: '#333333',
      flex: 1,
    },
    skipButton: {
      backgroundColor: '#e6e6e6',
      flex: 1,
    },
    buttonText: {
      color: '#fff',
      fontSize: isTablet ? 16 : 14,
      fontWeight: 'bold',
      fontFamily: 'RobotoSlab-Bold',
    },
    skipButtonText: {
      color: '#333',
      fontSize: isTablet ? 16 : 14,
      fontWeight: 'bold',
      fontFamily: 'RobotoSlab-Bold',
    },
  });
};

export default OnboardingScreen;
