import React, {useRef} from 'react';
import {View, Text, Image, StyleSheet, TouchableOpacity} from 'react-native';
import Swiper from 'react-native-swiper';
import LinearGradient from 'react-native-linear-gradient';
import {SafeAreaView} from 'react-native-safe-area-context';
import EncryptedStorage from 'react-native-encrypted-storage';
import {useNavigation, CommonActions} from '@react-navigation/native';

const OnboardingScreen = () => {
  const swiperRef = useRef(null); // Create a ref for the Swiper
  const navigation = useNavigation();
  const slides = [
    {
      key: '1',
      title: 'Welcome to ClickSolver',
      text: 'Connect with skilled pros in your neighborhood—electricians, salon specialists, plumbers, and more—all in a few taps.',
      image: 'https://i.postimg.cc/BbPghn6t/boarding1-1-removebg-preview.png',
      backgroundColorPrimary: '#FF4500',
      backgroundColorSecondary: '#FF6347',
    },
    {
      key: '2',
      title: 'Quick & Easy Booking',
      text: 'Browse our wide range of services, select what you need, and instantly schedule a visit from a verified expert.',
      image:
        'https://i.postimg.cc/3rvmxz2Y/Screenshot-165-removebg-preview.png',
      backgroundColorPrimary: '#FF4500',
      backgroundColorSecondary: '#FFA07A',
    },
    {
      key: '3',
      title: 'Trusted & Reliable',
      text: 'Every professional on ClickSolver is thoroughly vetted. Your safety, comfort, and satisfaction are always our top priorities.',
      image:
        'https://i.postimg.cc/Y06xGPGn/Screenshot-166-removebg-preview.png',
      backgroundColorPrimary: '#FF4500',
      backgroundColorSecondary: '#E84B00',
    },
  ];
  const handleNextPress = async index => {
    if (index < slides.length - 1) {
      swiperRef.current.scrollBy(1); // Move to the next slide
    } else {
      try {
        // Store the onboarded flag
        await EncryptedStorage.setItem('onboarded', 'true');

        // Navigate to the main Tabs screen (Home)
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
        activeDotStyle={styles.activeDotStyle}>
        {slides.map((slide, index) => (
          <View key={slide.key} style={[styles.slide]}>
            <LinearGradient
              colors={[
                slide.backgroundColorPrimary,
                slide.backgroundColorSecondary,
              ]}
              style={styles.innerCard}>
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
                onPress={() => handleNextPress(index)}>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  slide: {
    flex: 1,
  },
  Onboardingcontent: {
    padding: 25,
  },
  image: {
    width: '100%',
    height: 200,
    marginBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1B1D21',
  },
  text: {
    fontSize: 14,
    lineHeight: 26,
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
  innerCard: {
    height: '40%',
    padding: 20,
    display: 'flex',
    justifyContent: 'center',
    borderBottomRightRadius: 25,
    borderBottomLeftRadius: 25,
  },
  button: {
    backgroundColor: '#333333',
    padding: 13,
    borderRadius: 45,
    width: '60%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dotStyle: {
    backgroundColor: '#C0C0C0', // Default dot color (light gray)
    width: 10,
    height: 10,
    borderRadius: 5, // To make it a circle
    marginHorizontal: 5,
  },
  activeDotStyle: {
    backgroundColor: '#000', // Active dot color (black)
    width: 20, // Wider for the active dot
    height: 10,
    borderRadius: 10, // Rounded corners
    marginHorizontal: 5,
  },
});

export default OnboardingScreen;
