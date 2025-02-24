import React, {useRef} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
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

  const slides = [
    {
      key: '1',
      title: 'Instant Help in 15 Minutes!',
      text: 'Need quick assistance? ClickSolver connects you with skilled professionals within 15 minutes for urgent tasks.',
      image: 'https://i.postimg.cc/BbPghn6t/boarding1-1-removebg-preview.png',
      backgroundColorPrimary: '#FF4500',
      backgroundColorSecondary: '#FF6347',
    },
    {
      key: '2',
      title: 'Wide Range of Expert Services',
      text: 'From electricians to salon specialists, plumbers, and more—find the right professional for every need, all in one place.',
      image: 'https://i.postimg.cc/3rvmxz2Y/Screenshot-165-removebg-preview.png',
      backgroundColorPrimary: '#FF4500',
      backgroundColorSecondary: '#FFA07A',
    },
    {
      key: '3',
      title: 'Trusted & Verified Professionals',
      text: 'Every worker on ClickSolver is background-checked and verified to ensure high-quality service, safety, and reliability.',
      image: 'https://i.postimg.cc/Y06xGPGn/Screenshot-166-removebg-preview.png',
      backgroundColorPrimary: '#FF4500',
      backgroundColorSecondary: '#E84B00',
    },
  ];

  const handleNextPress = async index => {
    if (index < slides.length - 1) {
      swiperRef.current.scrollBy(1);
    } else {
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
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Swiper
        ref={swiperRef}
        showsButtons={false}
        loop={false}
        dotStyle={styles.dotStyle}
        activeDotStyle={styles.activeDotStyle}
      >
        {slides.map((slide, index) => (
          <View key={slide.key} style={styles.slide}>
            <LinearGradient
              colors={[slide.backgroundColorPrimary, slide.backgroundColorSecondary]}
              style={styles.innerCard}
            >
              <Image
                source={{uri: slide.image}}
                style={styles.image}
                resizeMode="stretch"
              />
            </LinearGradient>
            <View style={styles.Onboardingcontent}>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.text}>{slide.text}</Text>
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.button}
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
    </SafeAreaView>
  );
};

/**
 * 2) A helper function to return a StyleSheet that adapts based on screen size.
 *    For example, if width > 600, we assume it's a tablet and scale up certain sizes.
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
    Onboardingcontent: {
      // Increase padding if on a wider screen
      padding: width > 600 ? 40 : 25,
    },
    innerCard: {
      // 40% of screen height for the top gradient area
      height: '40%',
      padding: width > 600 ? 30 : 20,
      display: 'flex',
      justifyContent: 'center',
      borderBottomRightRadius: 25,
      borderBottomLeftRadius: 25,
    },
    image: {
      // If it's a tablet (width > 600), we use 50% of the width, else 100%
      width: width > 600 ? '50%' : '100%',
      // Increase height if on a wider screen
      height: width > 600 ? 400 : 200,
      alignSelf: 'center',
      marginBottom: 40,
    },
    title: {
      fontSize: width > 600 ? 26 : 22,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 20,
      color: '#1B1D21',
    },
    text: {
      fontSize: width > 600 ? 16 : 14,
      lineHeight: width > 600 ? 28 : 26,
      textAlign: 'center',
      marginBottom: 20,
      color: 'rgba(0, 0, 0, 0.5)',
    },
    buttonContainer: {
      display: 'flex',
      flexDirection: 'row',
      width: '100%',
      justifyContent: 'center',
    },
    button: {
      backgroundColor: '#333333',
      padding: width > 600 ? 16 : 13,
      borderRadius: 45,
      width: width > 600 ? '40%' : '60%',
      alignItems: 'center',
    },
    buttonText: {
      color: '#fff',
      fontSize: width > 600 ? 16 : 14,
      fontWeight: 'bold',
    },
    dotStyle: {
      backgroundColor: '#C0C0C0',
      width: 10,
      height: 10,
      borderRadius: 5,
      marginHorizontal: 5,
    },
    activeDotStyle: {
      backgroundColor: '#000',
      width: 20,
      height: 10,
      borderRadius: 10,
      marginHorizontal: 5,
    },
  });

export default OnboardingScreen;
