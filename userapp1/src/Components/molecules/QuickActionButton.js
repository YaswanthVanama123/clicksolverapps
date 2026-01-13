/**
 * QuickActionButton - Large circular button with gradient
 * Includes icon, label, elevated shadow, and ripple animation
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {getColors} from '../../theme/colors';
import {GRADIENTS, getGradientColors} from '../../theme/gradients';
import {getColoredShadow} from '../../theme/shadows';
import {SPACING, BORDER_RADIUS} from '../../theme/spacing';

const QuickActionButton = ({
  icon = 'plus',
  label = 'Action',
  onPress,
  gradient = 'primaryGradient',
  size = 'medium', // small, medium, large
  disabled = false,
  isDarkMode = false,
  style,
}) => {
  const colors = getColors(isDarkMode);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const rippleAnim = React.useRef(new Animated.Value(0)).current;

  const gradientConfig = getGradientColors(gradient, isDarkMode);

  // Size configurations
  const sizeConfig = {
    small: {
      buttonSize: 56,
      iconSize: 24,
      fontSize: 12,
    },
    medium: {
      buttonSize: 72,
      iconSize: 32,
      fontSize: 14,
    },
    large: {
      buttonSize: 88,
      iconSize: 40,
      fontSize: 16,
    },
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
      }),
      Animated.timing(rippleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(rippleAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    if (!disabled && onPress) {
      onPress();
    }
  };

  const rippleScale = rippleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  const rippleOpacity = rippleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 0.3, 0],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {transform: [{scale: scaleAnim}]},
        style,
      ]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}>
        <View style={styles.buttonWrapper}>
          {/* Ripple Effect */}
          <Animated.View
            style={[
              styles.ripple,
              {
                width: config.buttonSize,
                height: config.buttonSize,
                borderRadius: config.buttonSize / 2,
                transform: [{scale: rippleScale}],
                opacity: rippleOpacity,
              },
            ]}>
            <LinearGradient
              colors={gradientConfig.colors}
              start={gradientConfig.start}
              end={gradientConfig.end}
              style={styles.rippleGradient}
            />
          </Animated.View>

          {/* Main Button */}
          <LinearGradient
            colors={
              disabled ? ['#D1D5DB', '#9CA3AF'] : gradientConfig.colors
            }
            start={gradientConfig.start}
            end={gradientConfig.end}
            style={[
              styles.button,
              {
                width: config.buttonSize,
                height: config.buttonSize,
                borderRadius: config.buttonSize / 2,
              },
              getColoredShadow(gradientConfig.colors[0], 8),
              disabled && styles.disabledButton,
            ]}>
            <Icon
              name={icon}
              size={config.iconSize}
              color="#FFFFFF"
            />
          </LinearGradient>
        </View>

        {/* Label */}
        <Text
          style={[
            styles.label,
            {
              color: disabled ? colors.text.tertiary : colors.text.primary,
              fontSize: config.fontSize,
            },
          ]}
          numberOfLines={2}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  buttonWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  ripple: {
    position: 'absolute',
  },
  rippleGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
  label: {
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 90,
    lineHeight: 18,
  },
});

export default QuickActionButton;
