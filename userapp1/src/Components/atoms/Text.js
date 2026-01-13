/**
 * Text Component
 * A themed text component with predefined typography variants
 *
 * @component
 * @example
 * <Text variant="h1" weight="bold" color="#FF6B35">
 *   Heading Text
 * </Text>
 */

import React, {memo} from 'react';
import {Text as RNText, StyleSheet} from 'react-native';
import {getColors} from '../../theme/colors';
import {TYPOGRAPHY} from '../../theme/typography';

/**
 * @typedef {'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'body1' | 'body2' | 'caption'} TextVariant
 * @typedef {'light' | 'regular' | 'medium' | 'semibold' | 'bold'} TextWeight
 */

/**
 * @param {Object} props - Component props
 * @param {TextVariant} [props.variant='body1'] - Typography variant
 * @param {TextWeight} [props.weight='regular'] - Font weight
 * @param {string} [props.color] - Custom text color (overrides theme)
 * @param {boolean} [props.isDarkMode=false] - Dark mode flag
 * @param {boolean} [props.center=false] - Center align text
 * @param {number} [props.numberOfLines] - Limit number of lines
 * @param {object} [props.style] - Additional styles
 * @param {React.ReactNode} props.children - Text content
 */
const Text = ({
  variant = 'body1',
  weight = 'regular',
  color,
  isDarkMode = false,
  center = false,
  numberOfLines,
  style,
  children,
  ...props
}) => {
  const colors = getColors(isDarkMode);
  const textStyle = TYPOGRAPHY.getTextStyle(variant, weight);

  // Determine text color
  const getTextColor = () => {
    if (color) {
      return color;
    }
    // Default color based on variant
    if (variant.startsWith('h')) {
      return colors.text.primary;
    } else if (variant === 'caption') {
      return colors.text.secondary;
    }
    return colors.text.primary;
  };

  return (
    <RNText
      style={[
        textStyle,
        {
          color: getTextColor(),
        },
        center && styles.center,
        style,
      ]}
      numberOfLines={numberOfLines}
      {...props}>
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  center: {
    textAlign: 'center',
  },
});

export default memo(Text);
