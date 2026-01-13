/**
 * Badge Component
 * A colored badge component for status indicators
 *
 * @component
 * @example
 * <Badge variant="success" size="medium">
 *   Active
 * </Badge>
 */

import React, {memo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {getColors} from '../../theme/colors';
import {TYPOGRAPHY} from '../../theme/typography';

/**
 * @typedef {'success' | 'warning' | 'error' | 'info' | 'primary'} BadgeVariant
 * @typedef {'small' | 'medium' | 'large'} BadgeSize
 */

/**
 * @param {Object} props - Component props
 * @param {BadgeVariant} [props.variant='primary'] - Badge color variant
 * @param {BadgeSize} [props.size='medium'] - Badge size
 * @param {boolean} [props.isDarkMode=false] - Dark mode flag
 * @param {object} [props.style] - Additional container styles
 * @param {object} [props.textStyle] - Additional text styles
 * @param {React.ReactNode} props.children - Badge content
 */
const Badge = ({
  variant = 'primary',
  size = 'medium',
  isDarkMode = false,
  style,
  textStyle,
  children,
  ...props
}) => {
  const colors = getColors(isDarkMode);

  // Get badge colors based on variant
  const getBadgeColors = () => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: colors.withOpacity(colors.success, 0.15),
          color: colors.success,
        };
      case 'warning':
        return {
          backgroundColor: colors.withOpacity(colors.warning, 0.15),
          color: colors.warning,
        };
      case 'error':
        return {
          backgroundColor: colors.withOpacity(colors.error, 0.15),
          color: colors.error,
        };
      case 'info':
        return {
          backgroundColor: colors.withOpacity(colors.info, 0.15),
          color: colors.info,
        };
      case 'primary':
      default:
        return {
          backgroundColor: colors.withOpacity(colors.primary, 0.15),
          color: colors.primary,
        };
    }
  };

  // Get size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: 8,
          paddingVertical: 2,
          fontSize: 10,
        };
      case 'large':
        return {
          paddingHorizontal: 16,
          paddingVertical: 6,
          fontSize: 14,
        };
      case 'medium':
      default:
        return {
          paddingHorizontal: 12,
          paddingVertical: 4,
          fontSize: 12,
        };
    }
  };

  const badgeColors = getBadgeColors();
  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: badgeColors.backgroundColor,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
        },
        style,
      ]}
      {...props}>
      <Text
        style={[
          styles.text,
          {
            color: badgeColors.color,
            fontSize: sizeStyles.fontSize,
            fontFamily: TYPOGRAPHY.fontFamily.semibold,
          },
          textStyle,
        ]}>
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
});

export default memo(Badge);
