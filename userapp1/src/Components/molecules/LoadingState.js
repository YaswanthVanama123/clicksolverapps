import React from 'react';
import {View, Text, StyleSheet, useWindowDimensions} from 'react-native';
import LottieView from 'lottie-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTheme} from '../../context/ThemeContext';
import {getColors} from '../../theme/colors';
import {GRADIENTS} from '../../theme/gradients';

/**
 * LoadingState Component
 * Full-screen loading indicator with Lottie animation
 * @param {object} props - Component props
 * @param {string} props.message - Loading message to display
 * @param {boolean} props.showLogo - Show logo in loading screen (default: true)
 * @param {string} props.gradientName - Gradient variant to use (default: 'primaryGradient')
 */
const LoadingState = ({
  message = 'Loading...',
  showLogo = true,
  gradientName = 'primaryGradient',
}) => {
  const {isDarkMode} = useTheme();
  const {width, height} = useWindowDimensions();
  const colors = getColors(isDarkMode);
  const gradient = GRADIENTS[gradientName] || GRADIENTS.primaryGradient;

  const styles = dynamicStyles(width, height, isDarkMode);

  return (
    <LinearGradient
      colors={gradient.colors}
      start={gradient.start}
      end={gradient.end}
      style={styles.container}>
      <View style={styles.centeredContent}>
        {showLogo && (
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>CS</Text>
          </View>
        )}

        <View style={styles.animationContainer}>
          <LottieView
            source={require('../../assets/animations/loading-spinner.json')}
            autoPlay
            loop
            style={styles.lottieAnimation}
          />
        </View>

        {message && (
          <Text style={styles.loadingMessage}>{message}</Text>
        )}
      </View>
    </LinearGradient>
  );
};

const dynamicStyles = (width, height, isDarkMode) => {
  const isTablet = width >= 600;

  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      height: '100%',
    },
    centeredContent: {
      justifyContent: 'center',
      alignItems: 'center',
      width: width * 0.8,
      maxWidth: 300,
    },
    logoContainer: {
      width: isTablet ? 80 : 60,
      height: isTablet ? 80 : 60,
      borderRadius: isTablet ? 40 : 30,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: isTablet ? 30 : 25,
      backdropFilter: 'blur(10px)',
    },
    logoText: {
      fontSize: isTablet ? 32 : 28,
      fontWeight: 'bold',
      color: '#FFFFFF',
      fontFamily: 'RobotoSlab-SemiBold',
    },
    animationContainer: {
      width: isTablet ? 150 : 120,
      height: isTablet ? 150 : 120,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: isTablet ? 30 : 25,
    },
    lottieAnimation: {
      width: '100%',
      height: '100%',
    },
    loadingMessage: {
      fontSize: isTablet ? 18 : 16,
      color: '#FFFFFF',
      textAlign: 'center',
      fontFamily: 'RobotoSlab-Regular',
      letterSpacing: 0.5,
    },
  });
};

export default LoadingState;
