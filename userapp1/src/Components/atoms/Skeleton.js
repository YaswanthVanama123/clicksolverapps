import React, {useEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import {useTheme} from '../../context/ThemeContext';
import {getColors} from '../../theme/colors';

/**
 * Skeleton Component
 * Displays a shimmer loading animation for content placeholders
 * @param {object} props - Component props
 * @param {number} props.width - Width of the skeleton
 * @param {number} props.height - Height of the skeleton
 * @param {number} props.borderRadius - Border radius (default: 8)
 * @param {string} props.variant - Shape variant: 'rect', 'circle' (default: 'rect')
 * @param {string} props.style - Additional styles
 */
const Skeleton = ({
  width = 100,
  height = 20,
  borderRadius = 8,
  variant = 'rect',
  style,
}) => {
  const {isDarkMode} = useTheme();
  const colors = getColors(isDarkMode);
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withRepeat(
      withTiming(1, {
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [animatedValue]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(animatedValue.value, [0, 1], [0.4, 1]),
    };
  });

  const isCircle = variant === 'circle';
  const circleSize = Math.min(width, height);

  const baseColors = isDarkMode
    ? ['#2A2A3E', '#3A3A4E', '#2A2A3E']
    : ['#E5E7EB', '#F3F4F6', '#E5E7EB'];

  return (
    <Animated.View
      style={[
        animatedStyle,
        isCircle && {
          width: circleSize,
          height: circleSize,
          borderRadius: circleSize / 2,
          overflow: 'hidden',
        },
        !isCircle && {
          width,
          height,
          borderRadius,
          overflow: 'hidden',
        },
        style,
      ]}>
      <LinearGradient
        colors={baseColors}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={[
          isCircle && {
            width: circleSize,
            height: circleSize,
          },
          !isCircle && {
            width,
            height,
          },
        ]}
      />
    </Animated.View>
  );
};

export default Skeleton;
