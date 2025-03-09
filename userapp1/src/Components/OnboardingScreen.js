import React, {useRef} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import Swiper from 'react-native-swiper';
import LinearGradient from 'react-native-linear-gradient';
import {SafeAreaView} from 'react-native-safe-area-context';
import EncryptedStorage from 'react-native-encrypted-storage';
import {useNavigation, CommonActions} from '@react-navigation/native';

const OnboardingScreen = () => {
  const swiperRef = useRef(null);
  const navigation = useNavigation();

  // 1) Grab width & height from useWindowDimensions
  const {width, height} = useWindowDimensions();

  // 2) Dynamically generate styles based on current width & height
  const styles = dynamicStyles(width, height);

  /**
   * Slides data to display.
   * - You can replace the "image" URLs with your own local or remote images.
   * - The background gradients can also be customized.
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
      title: 'Wide Range of Expert Services',
      text: 'From electricians to salon specialists, plumbers, and more—find the right professional for every need, all in one place.',
      image: 'https://i.postimg.cc/fbWs9dmm/Plumbing-services-removebg-preview.png',
      backgroundColorPrimary: '#FF4500',
      backgroundColorSecondary: '#FFA07A',
    },
    {
      key: '3',
      title: 'Trusted & Verified Professionals',
      text: 'Every worker on ClickSolver is background-checked and verified to ensure high-quality service, safety, and reliability.',
      image: 'https://i.postimg.cc/ZqcgyBhj/trusted-removebg-preview.png',
      backgroundColorPrimary: '#FF4500',
      backgroundColorSecondary: '#E84B00',
    },
  ];

  // Handle "Next" button press
  const handleNextPress = async index => {
    if (index < slides.length - 1) {
      // Move to the next slide
      swiperRef.current.scrollBy(1);
    } else {
      // Last slide -> mark onboarded and navigate
      await finishOnboarding();
    }
  };

  // Handle "Skip" button press
  const handleSkipPress = async () => {
    await finishOnboarding();
  };

  // Common function to mark onboarded and navigate to main app
  const finishOnboarding = async () => {
    try {
      await EncryptedStorage.setItem('onboarded', 'true');
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{name: 'Tabs', state: {routes: [{name: 'Home'}]}}],
        }),
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
        // You can adjust the position of the pagination (the dots) with paginationStyle
        paginationStyle={styles.paginationStyle}
        showsButtons={false}
      >
        {slides.map((slide, index) => (
          <View key={slide.key} style={styles.slide}>
            {/* Top Gradient with Image */}
            <LinearGradient
              colors={[slide.backgroundColorPrimary, slide.backgroundColorSecondary]}
              style={styles.innerCard}
            >
              <Image
                source={{uri: slide.image}}
                style={styles.image}
                resizeMode="contain"
              />
            </LinearGradient>

            {/* Text Content */}
            <View style={styles.onboardingContent}>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.text}>{slide.text}</Text>
            </View>

            {/* Bottom Buttons: Skip (except last slide) + Next (or Get Started) */}
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

/**
 * Styles that adapt based on screen width/height.
 * You can customize padding, font sizes, etc. for a more polished look.
 */
const dynamicStyles = (width, height) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    slide: {
      flex: 1,
    },
    // The top gradient section with the image
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
    // Middle text content
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
    // Swiper dots
    paginationStyle: {
      // You can move the dots above the buttons by adjusting bottom or top
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
    // Bottom buttons container
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
