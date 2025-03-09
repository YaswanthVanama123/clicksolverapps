import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
// Import theme hook for dark mode support
import { useTheme } from '../context/ThemeContext';

const LOGO_URL = 'https://i.postimg.cc/hjjpy2SW/Button-1.png';

const AboutCS = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(isDarkMode);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header with back arrow */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={isDarkMode ? '#fff' : "#333"} />
        </TouchableOpacity>
        <Text style={styles.headerText}>About Us</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.description}>
          Welcome to Clicksolver! We are dedicated to delivering innovative solutions that streamline your digital experience.
          Our platform is designed to empower you to solve complex challenges with simple clicks, enhancing productivity
          and driving success.
        </Text>
        <Text style={styles.description}>
          At Clicksolver, our mission is to simplify tasks and transform the way you work. With a focus on intuitive design
          and cutting-edge technology, we strive to provide tools that are both powerful and user-friendly.
        </Text>
        <Text style={styles.description}>
          Thank you for choosing Clicksolver as your trusted partner in navigating the digital world. We are committed to
          continuous improvement and excellence, ensuring that your journey with us is as smooth and rewarding as possible.
        </Text>
      </View>

      {/* Logo at the bottom center */}
      <View style={styles.logoContainer}>
        <Image source={{ uri: LOGO_URL }} style={styles.logo} resizeMode="contain" />
      </View>
    </ScrollView>
  );
};

const dynamicStyles = (isDarkMode) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      padding: 20,
      backgroundColor: isDarkMode ? '#121212' : '#ffffff',
      justifyContent: 'space-between',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    backButton: {
      padding: 5,
    },
    headerText: {
      fontSize: 26,
      fontWeight: 'bold',
      marginLeft: 10,
      color: isDarkMode ? '#fff' : '#333333',
    },
    content: {
      flex: 1,
    },
    description: {
      fontSize: 16,
      lineHeight: 24,
      color: isDarkMode ? '#ccc' : '#666666',
      marginBottom: 15,
      textAlign: 'justify',
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 10,
    },
    logo: {
      width: 50,
      height: 50,
    },
  });

export default AboutCS;
