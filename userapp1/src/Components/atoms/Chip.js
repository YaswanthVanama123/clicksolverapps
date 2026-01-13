/**
 * Chip Component
 * A selectable chip component with gradient active state
 *
 * @component
 * @example
 * <Chip
 *   label="Category"
 *   selected={true}
 *   onPress={() => console.log('Selected')}
 *   icon="tag"
 * />
 */

import React, {memo} from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Animated,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {getColors} from '../../theme/colors';
import {GRADIENTS} from '../../theme/gradients';
import {TYPOGRAPHY} from '../../theme/typography';

/**
 * @param {Object} props - Component props
 * @param {string} props.label - Chip label text
 * @param {boolean} [props.selected=false] - Selected state
 * @param {Function} [props.onPress] - Press handler
 * @param {string} [props.icon] - Icon name from MaterialCommunityIcons
 * @param {boolean} [props.isDarkMode=false] - Dark mode flag
 * @param {string} [props.size='medium'] - Chip size (small, medium, large)
 * @param {object} [props.style] - Additional container styles
 * @param {object} [props.textStyle] - Additional text styles
 */
const Chip = ({
  label,
  selected = false,
  onPress,
  icon,
  isDarkMode = false,
  size = 'medium',
  style,
  textStyle,
  ...props
}) => {
  const colors = getColors(isDarkMode);
  const gradient = GRADIENTS.primaryGradient;

  // Get size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          height: 28,
          paddingHorizontal: 12,
          fontSize: 12,
          iconSize: 14,
        };
      case 'large':
        return {
          height: 44,
          paddingHorizontal: 20,
          fontSize: 16,
          iconSize: 20,
        };
      case 'medium':
      default:
        return {
          height: 36,
          paddingHorizontal: 16,
          fontSize: 14,
          iconSize: 16,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  // Render selected chip with gradient
  if (selected) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[styles.chipContainer, style]}
        {...props}>
        <LinearGradient
          colors={gradient.colors}
          start={gradient.start}
          end={gradient.end}
          style={[
            styles.chip,
            {
              height: sizeStyles.height,
              paddingHorizontal: sizeStyles.paddingHorizontal,
            },
          ]}>
          <View style={styles.content}>
            {icon && (
              <Icon
                name={icon}
                size={sizeStyles.iconSize}
                color="#FFFFFF"
                style={styles.icon}
              />
            )}
            <Text
              style={[
                styles.selectedText,
                {
                  fontSize: sizeStyles.fontSize,
                  fontFamily: TYPOGRAPHY.fontFamily.semibold,
                },
                textStyle,
              ]}>
              {label}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Render unselected chip
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.chip,
        {
          height: sizeStyles.height,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          backgroundColor: isDarkMode ? colors.surface : '#F3F4F6',
          borderColor: colors.divider,
        },
        style,
      ]}
      {...props}>
      <View style={styles.content}>
        {icon && (
          <Icon
            name={icon}
            size={sizeStyles.iconSize}
            color={colors.text.secondary}
            style={styles.icon}
          />
        )}
        <Text
          style={[
            styles.text,
            {
              color: colors.text.primary,
              fontSize: sizeStyles.fontSize,
              fontFamily: TYPOGRAPHY.fontFamily.medium,
            },
            textStyle,
          ]}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chipContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontWeight: '500',
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default memo(Chip);
