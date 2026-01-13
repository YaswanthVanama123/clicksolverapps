/**
 * GradientHeader.js - Organism Component
 * Animated header with gradient background and scroll-based effects
 */

import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import {getColors} from '../../theme/colors';
import {GradientBackground} from '../../theme/gradients';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {SafeAreaView} from 'react-native-safe-area-context';

/**
 * GradientHeader Component
 * @param {String} title - Header title
 * @param {String} subtitle - Header subtitle (optional)
 * @param {Boolean} showBack - Show back button
 * @param {Function} onBackPress - Back button press callback
 * @param {Object} rightAction - Right action button config {icon, onPress, label}
 * @param {Animated.Value} scrollY - Scroll position for animations
 * @param {String} gradientName - Gradient theme name
 * @param {Boolean} transparent - Make header transparent
 * @param {String} statusBarStyle - Status bar style ('light-content' | 'dark-content')
 */
const GradientHeader = ({
  title,
  subtitle,
  showBack = false,
  onBackPress,
  rightAction,
  scrollY,
  gradientName = 'primaryGradient',
  transparent = false,
  statusBarStyle = 'light-content',
}) => {
  const {width} = useWindowDimensions();
  const {isDarkMode} = useTheme();
  const colors = getColors(isDarkMode);
  const styles = dynamicStyles(width, isDarkMode, colors);

  // Animation refs
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const headerHeight = useRef(new Animated.Value(1)).current;
  const titleScale = useRef(new Animated.Value(1)).current;
  const subtitleOpacity = useRef(new Animated.Value(1)).current;

  // Animate based on scroll position
  useEffect(() => {
    if (!scrollY) return;

    const listener = scrollY.addListener(({value}) => {
      // Header opacity: fade in background as user scrolls
      const opacity = Math.min(value / 100, 1);
      headerOpacity.setValue(transparent ? opacity : 1);

      // Title scale: shrink slightly as user scrolls
      const scale = Math.max(1 - value / 500, 0.9);
      titleScale.setValue(scale);

      // Subtitle opacity: fade out as user scrolls
      const subtitleOp = Math.max(1 - value / 150, 0);
      subtitleOpacity.setValue(subtitleOp);

      // Header height: compress slightly (optional)
      const heightScale = Math.max(1 - value / 1000, 0.9);
      headerHeight.setValue(heightScale);
    });

    return () => scrollY.removeListener(listener);
  }, [scrollY, transparent]);

  // Get interpolated values for animations
  const animatedBackgroundOpacity = scrollY
    ? headerOpacity.interpolate({
        inputRange: [0, 1],
        outputRange: transparent ? [0, 1] : [1, 1],
      })
    : 1;

  const animatedTitleScale = scrollY ? titleScale : 1;
  const animatedSubtitleOpacity = scrollY ? subtitleOpacity : 1;

  return (
    <>
      {/* Status Bar */}
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor="transparent"
        translucent
      />

      {/* Header Container */}
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Animated.View
          style={[
            styles.headerContainer,
            {opacity: animatedBackgroundOpacity},
          ]}>
          <GradientBackground
            gradientName={gradientName}
            isDarkMode={isDarkMode}
            style={styles.gradientBackground}>
            <View style={styles.headerContent}>
              {/* Left Section - Back Button */}
              <View style={styles.leftSection}>
                {showBack && (
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={onBackPress}
                    activeOpacity={0.7}>
                    <MaterialIcons
                      name="arrow-back"
                      size={24}
                      color="#fff"
                    />
                  </TouchableOpacity>
                )}
              </View>

              {/* Center Section - Title & Subtitle */}
              <Animated.View
                style={[
                  styles.centerSection,
                  {
                    transform: [{scale: animatedTitleScale}],
                  },
                ]}>
                <Text style={styles.title} numberOfLines={1}>
                  {title}
                </Text>
                {subtitle && (
                  <Animated.Text
                    style={[
                      styles.subtitle,
                      {opacity: animatedSubtitleOpacity},
                    ]}
                    numberOfLines={1}>
                    {subtitle}
                  </Animated.Text>
                )}
              </Animated.View>

              {/* Right Section - Action Button */}
              <View style={styles.rightSection}>
                {rightAction && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={rightAction.onPress}
                    activeOpacity={0.7}>
                    {rightAction.icon ? (
                      <MaterialIcons
                        name={rightAction.icon}
                        size={24}
                        color="#fff"
                      />
                    ) : rightAction.label ? (
                      <Text style={styles.actionLabel}>{rightAction.label}</Text>
                    ) : null}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </GradientBackground>
        </Animated.View>
      </SafeAreaView>
    </>
  );
};

/**
 * CollapsibleGradientHeader - Header that collapses on scroll
 * Extended version with larger initial size
 */
export const CollapsibleGradientHeader = ({
  title,
  subtitle,
  description,
  showBack = false,
  onBackPress,
  rightAction,
  scrollY,
  gradientName = 'primaryGradient',
  statusBarStyle = 'light-content',
  headerImage,
}) => {
  const {width} = useWindowDimensions();
  const {isDarkMode} = useTheme();
  const colors = getColors(isDarkMode);
  const styles = dynamicStyles(width, isDarkMode, colors);

  const HEADER_MAX_HEIGHT = 250;
  const HEADER_MIN_HEIGHT = 80;
  const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

  const headerTranslate = scrollY
    ? scrollY.interpolate({
        inputRange: [0, HEADER_SCROLL_DISTANCE],
        outputRange: [0, -HEADER_SCROLL_DISTANCE],
        extrapolate: 'clamp',
      })
    : 0;

  const imageOpacity = scrollY
    ? scrollY.interpolate({
        inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
        outputRange: [1, 0.5, 0],
        extrapolate: 'clamp',
      })
    : 1;

  const titleOpacity = scrollY
    ? scrollY.interpolate({
        inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
        outputRange: [0, 0.5, 1],
        extrapolate: 'clamp',
      })
    : 0;

  return (
    <>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor="transparent"
        translucent
      />

      <Animated.View
        style={[
          styles.collapsibleHeader,
          {
            height: HEADER_MAX_HEIGHT,
            transform: [{translateY: headerTranslate}],
          },
        ]}>
        <GradientBackground
          gradientName={gradientName}
          isDarkMode={isDarkMode}
          style={styles.collapsibleGradient}>
          {/* Top Bar with Back and Action */}
          <SafeAreaView edges={['top']} style={styles.topBar}>
            <View style={styles.topBarContent}>
              {showBack && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={onBackPress}>
                  <MaterialIcons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
              )}

              {/* Collapsed Title */}
              <Animated.Text
                style={[
                  styles.collapsedTitle,
                  {opacity: titleOpacity},
                ]}
                numberOfLines={1}>
                {title}
              </Animated.Text>

              {rightAction && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={rightAction.onPress}>
                  <MaterialIcons
                    name={rightAction.icon}
                    size={24}
                    color="#fff"
                  />
                </TouchableOpacity>
              )}
            </View>
          </SafeAreaView>

          {/* Expanded Content */}
          <Animated.View
            style={[
              styles.expandedContent,
              {opacity: imageOpacity},
            ]}>
            {headerImage && (
              <View style={styles.headerImageContainer}>
                {headerImage}
              </View>
            )}
            <Text style={styles.expandedTitle}>{title}</Text>
            {subtitle && (
              <Text style={styles.expandedSubtitle}>{subtitle}</Text>
            )}
            {description && (
              <Text style={styles.expandedDescription}>{description}</Text>
            )}
          </Animated.View>
        </GradientBackground>
      </Animated.View>
    </>
  );
};

const dynamicStyles = (width, isDarkMode, colors) => {
  const isTablet = width >= 768;

  return StyleSheet.create({
    // Standard Header
    safeArea: {
      backgroundColor: 'transparent',
    },
    headerContainer: {
      width: '100%',
    },
    gradientBackground: {
      width: '100%',
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      minHeight: 56,
    },
    leftSection: {
      width: 44,
      alignItems: 'flex-start',
    },
    centerSection: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    rightSection: {
      width: 44,
      alignItems: 'flex-end',
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: isTablet ? 22 : 18,
      fontWeight: '700',
      color: '#fff',
      textAlign: 'center',
    },
    subtitle: {
      fontSize: isTablet ? 15 : 13,
      fontWeight: '500',
      color: 'rgba(255, 255, 255, 0.9)',
      marginTop: 2,
      textAlign: 'center',
    },
    actionButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: '#fff',
    },

    // Collapsible Header
    collapsibleHeader: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      overflow: 'hidden',
      zIndex: 10,
    },
    collapsibleGradient: {
      flex: 1,
      paddingBottom: 20,
    },
    topBar: {
      backgroundColor: 'transparent',
    },
    topBarContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    collapsedTitle: {
      flex: 1,
      fontSize: isTablet ? 20 : 16,
      fontWeight: '700',
      color: '#fff',
      textAlign: 'center',
      marginHorizontal: 16,
    },
    expandedContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 20,
    },
    headerImageContainer: {
      marginBottom: 16,
    },
    expandedTitle: {
      fontSize: isTablet ? 32 : 26,
      fontWeight: '800',
      color: '#fff',
      textAlign: 'center',
      marginBottom: 8,
    },
    expandedSubtitle: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.95)',
      textAlign: 'center',
      marginBottom: 8,
    },
    expandedDescription: {
      fontSize: isTablet ? 15 : 14,
      fontWeight: '400',
      color: 'rgba(255, 255, 255, 0.85)',
      textAlign: 'center',
      lineHeight: 20,
    },
  });
};

export default GradientHeader;
