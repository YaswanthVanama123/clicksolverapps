/**
 * Avatar Component
 * A circular avatar displaying either an image or user initials with gradient background
 *
 * @component
 * @example
 * <Avatar
 *   source={{uri: 'https://example.com/avatar.jpg'}}
 *   name="John Doe"
 *   size="medium"
 *   gradient="primaryGradient"
 * />
 */

import React, {memo, useState} from 'react';
import {View, Image, Text, StyleSheet, Platform} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {getColors} from '../../theme/colors';
import {GRADIENTS} from '../../theme/gradients';
import {TYPOGRAPHY} from '../../theme/typography';

/**
 * @typedef {'small' | 'medium' | 'large' | 'xlarge'} AvatarSize
 */

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} Initials (max 2 characters)
 */
const getInitials = name => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

/**
 * @param {Object} props - Component props
 * @param {object} [props.source] - Image source object {uri: string}
 * @param {string} [props.name] - User name for initials fallback
 * @param {AvatarSize} [props.size='medium'] - Avatar size
 * @param {string} [props.gradient='primaryGradient'] - Gradient for initials background
 * @param {boolean} [props.isDarkMode=false] - Dark mode flag
 * @param {object} [props.style] - Additional container styles
 * @param {object} [props.imageStyle] - Additional image styles
 * @param {object} [props.textStyle] - Additional text styles
 */
const Avatar = ({
  source,
  name,
  size = 'medium',
  gradient = 'primaryGradient',
  isDarkMode = false,
  style,
  imageStyle,
  textStyle,
  ...props
}) => {
  const colors = getColors(isDarkMode);
  const [imageError, setImageError] = useState(false);

  // Get size dimensions
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          size: 32,
          fontSize: 14,
        };
      case 'large':
        return {
          size: 64,
          fontSize: 24,
        };
      case 'xlarge':
        return {
          size: 96,
          fontSize: 36,
        };
      case 'medium':
      default:
        return {
          size: 48,
          fontSize: 18,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const gradientConfig = GRADIENTS[gradient] || GRADIENTS.primaryGradient;
  const initials = getInitials(name);

  // Show image if source exists and no error
  if (source && source.uri && !imageError) {
    return (
      <View
        style={[
          styles.avatar,
          {
            width: sizeStyles.size,
            height: sizeStyles.size,
            borderRadius: sizeStyles.size / 2,
          },
          style,
        ]}
        {...props}>
        <Image
          source={source}
          style={[
            styles.image,
            {
              width: sizeStyles.size,
              height: sizeStyles.size,
              borderRadius: sizeStyles.size / 2,
            },
            imageStyle,
          ]}
          onError={() => setImageError(true)}
        />
      </View>
    );
  }

  // Show initials with gradient background
  return (
    <View
      style={[
        styles.avatar,
        {
          width: sizeStyles.size,
          height: sizeStyles.size,
          borderRadius: sizeStyles.size / 2,
        },
        style,
      ]}
      {...props}>
      <LinearGradient
        colors={gradientConfig.colors}
        start={gradientConfig.start}
        end={gradientConfig.end}
        style={[
          styles.gradientBackground,
          {
            width: sizeStyles.size,
            height: sizeStyles.size,
            borderRadius: sizeStyles.size / 2,
          },
        ]}>
        <Text
          style={[
            styles.initials,
            {
              fontSize: sizeStyles.fontSize,
              fontFamily: TYPOGRAPHY.fontFamily.semibold,
            },
            textStyle,
          ]}>
          {initials}
        </Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  image: {
    resizeMode: 'cover',
  },
  gradientBackground: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default memo(Avatar);
