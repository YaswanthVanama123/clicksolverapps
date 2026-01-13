/**
 * AboutCS Component
 * Displays information about ClickSolver company and mission
 * Features: Multi-language support, dark mode, company logo
 */

import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../theme/colors';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

const LOGO_URL = 'https://i.postimg.cc/hjjpy2SW/Button-1.png';

/**
 * AboutCS - About ClickSolver screen
 * Displays company information, mission, and founder details
 * @returns {JSX.Element}
 */
const AboutCS = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const { width } = useWindowDimensions();
  const colors = getColors(isDarkMode);
  const { t } = useTranslation();
  const styles = dynamicStyles(width, isDarkMode, colors);

  /**
   * Company information sections
   */
  const aboutSections = [
    {
      key: 'intro',
      text: t('about_description_1') ||
        'Welcome to Clicksolver! We are dedicated to delivering innovative solutions that streamline your digital experience. Our platform is designed to empower you to solve complex challenges with simple clicks, enhancing productivity and driving success.',
    },
    {
      key: 'mission',
      text: t('about_description_2') ||
        'At Clicksolver, our mission is to simplify tasks and transform the way you work. With a focus on intuitive design and cutting-edge technology, we strive to provide tools that are both powerful and user-friendly.',
    },
    {
      key: 'commitment',
      text: t('about_description_3') ||
        'Thank you for choosing Clicksolver as your trusted partner in navigating the digital world. We are committed to continuous improvement and excellence, ensuring that your journey with us is as smooth and rewarding as possible.',
    },
    {
      key: 'founder',
      text: t('about_founded') || 'Founded in 2025 by Yaswanth Vanama.',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header with back arrow */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Icon
              name="arrow-back"
              size={24}
              color={colors.text.primary}
            />
          </TouchableOpacity>
          <Text style={styles.headerText}>{t('about_us') || 'About Us'}</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {aboutSections.map((section, index) => (
            <View key={section.key} style={styles.sectionContainer}>
              <Text style={styles.description}>{section.text}</Text>
              {index < aboutSections.length - 1 && (
                <View style={styles.divider} />
              )}
            </View>
          ))}

          {/* Company values */}
          <View style={styles.valuesContainer}>
            <Text style={styles.valuesTitle}>
              {t('our_values') || 'Our Values'}
            </Text>
            <View style={styles.valueItem}>
              <Icon name="check-circle" size={20} color={colors.success} />
              <Text style={styles.valueText}>
                {t('value_innovation') || 'Innovation & Excellence'}
              </Text>
            </View>
            <View style={styles.valueItem}>
              <Icon name="check-circle" size={20} color={colors.success} />
              <Text style={styles.valueText}>
                {t('value_customer') || 'Customer-First Approach'}
              </Text>
            </View>
            <View style={styles.valueItem}>
              <Icon name="check-circle" size={20} color={colors.success} />
              <Text style={styles.valueText}>
                {t('value_reliability') || 'Reliability & Trust'}
              </Text>
            </View>
          </View>
        </View>

        {/* Logo at the bottom center */}
        <View style={styles.logoContainer}>
          <Image
            source={{ uri: LOGO_URL }}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.logoCaption}>ClickSolver</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

/**
 * Dynamic styles based on theme and screen size
 * @param {number} width - Screen width
 * @param {boolean} isDarkMode - Theme mode
 * @param {object} colors - Color palette
 * @returns {object} StyleSheet object
 */
const dynamicStyles = (width, isDarkMode, colors) => {
  const isTablet = width >= 600;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flexGrow: 1,
      padding: isTablet ? 24 : 20,
      backgroundColor: colors.background,
      justifyContent: 'space-between',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: isTablet ? 30 : 20,
    },
    backButton: {
      padding: 5,
      marginRight: 10,
    },
    headerText: {
      fontSize: isTablet ? 28 : 26,
      fontWeight: 'bold',
      color: colors.text.primary,
      fontFamily: 'RobotoSlab-Bold',
    },
    content: {
      flex: 1,
    },
    sectionContainer: {
      marginBottom: isTablet ? 20 : 15,
    },
    description: {
      fontSize: isTablet ? 17 : 16,
      lineHeight: isTablet ? 28 : 24,
      color: colors.text.secondary,
      textAlign: 'justify',
      fontFamily: 'RobotoSlab-Regular',
    },
    divider: {
      height: 1,
      backgroundColor: colors.divider,
      marginTop: isTablet ? 20 : 15,
    },
    valuesContainer: {
      marginTop: isTablet ? 30 : 25,
      padding: isTablet ? 20 : 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    valuesTitle: {
      fontSize: isTablet ? 20 : 18,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginBottom: isTablet ? 16 : 12,
      fontFamily: 'RobotoSlab-Bold',
    },
    valueItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: isTablet ? 12 : 10,
      gap: 12,
    },
    valueText: {
      fontSize: isTablet ? 16 : 15,
      color: colors.text.secondary,
      fontFamily: 'RobotoSlab-Regular',
    },
    logoContainer: {
      alignItems: 'center',
      marginTop: isTablet ? 40 : 30,
      marginBottom: isTablet ? 20 : 10,
    },
    logo: {
      width: isTablet ? 70 : 50,
      height: isTablet ? 70 : 50,
    },
    logoCaption: {
      marginTop: 8,
      fontSize: isTablet ? 16 : 14,
      color: colors.text.tertiary,
      fontFamily: 'RobotoSlab-Regular',
    },
  });
};

export default AboutCS;
