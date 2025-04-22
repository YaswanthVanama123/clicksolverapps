import React, { useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import Swiper from 'react-native-swiper';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import EncryptedStorage from 'react-native-encrypted-storage';
import {
  useNavigation,
  CommonActions,
  useFocusEffect,
} from '@react-navigation/native';
import {
  requestNotifications,
  PERMISSIONS,
  request,
  RESULTS,
} from 'react-native-permissions';

const OnboardingScreen = () => {
  const swiperRef = useRef(null);
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();
  const styles = dynamicStyles(width, height);

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

  const handleNextPress = async (index) => {
    // slide 2: notifications permission
    if (index === 1) {
      const { status } = await requestNotifications(['alert', 'sound']);
      if (status === RESULTS.GRANTED) {
        swiperRef.current.scrollBy(1);
      } else {
        Alert.alert(
          'Permission Needed',
          'Notification permission is required to keep you informed.'
        );
      }
      return;
    }

    // slide 3: location permission
    if (index === 2) {
      const permission =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
          : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
      const result = await request(permission);
      if (result === RESULTS.GRANTED) {
        // on the last slide, finish onboarding
        return finishOnboarding();
      } else {
        Alert.alert(
          'Permission Needed',
          'Location permission is required to book services near you.'
        );
      }
      return;
    }

    // default: go to next slide
    swiperRef.current.scrollBy(1);
  };

  const handleSkipPress = async () => {
    await finishOnboarding();
  };

  const finishOnboarding = async () => {
    try {
      await EncryptedStorage.setItem('onboarded', 'true');
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }],
          })
        );
    } catch (error) {
      console.error('Error setting onboarded key:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
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
                  >
                    <Text style={styles.skipButtonText}>Skip</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.button, styles.nextButton]}
                  onPress={() => handleNextPress(index)}
                >
                  <Text style={styles.buttonText}>
                    {index === slides.length - 1 ? 'Get Started' : 'Next'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </Swiper>
      </ScrollView>
    </SafeAreaView>
  );
};

const dynamicStyles = (width, height) =>
  StyleSheet.create({
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
    },
    image: {
      width: '80%',
      height: '80%',
    },
    onboardingContent: {
      flex: 1,
      justifyContent: 'center',
      padding: width > 600 ? 40 : 25,
    },
    title: {
      fontSize: width > 600 ? 26 : 22,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 15,
      color: '#1B1D21',
    },
    text: {
      fontSize: width > 600 ? 16 : 14,
      lineHeight: width > 600 ? 28 : 22,
      textAlign: 'center',
      color: 'rgba(0, 0, 0, 0.5)',
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
    },
    button: {
      borderRadius: 45,
      paddingVertical: width > 600 ? 16 : 13,
      paddingHorizontal: 25,
      alignItems: 'center',
      justifyContent: 'center',
    },
    nextButton: {
      backgroundColor: '#333333',
      flex: 1,
      marginLeft: 10,
    },
    skipButton: {
      backgroundColor: '#e6e6e6',
      flex: 1,
      marginRight: 10,
    },
    buttonText: {
      color: '#fff',
      fontSize: width > 600 ? 16 : 14,
      fontWeight: 'bold',
    },
    skipButtonText: {
      color: '#333',
      fontSize: width > 600 ? 16 : 14,
      fontWeight: 'bold',
    },
  });

export default OnboardingScreen;
