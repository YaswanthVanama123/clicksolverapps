/**
 * GradientButton Component
 * A versatile button component with gradient backgrounds and multiple variants
 *
 * @component
 * @example
 * <GradientButton
 *   variant="primary"
 *   title="Click Me"
 *   onPress={() => console.log('Pressed')}
 *   icon="check"
 *   loading={false}
 * />
 */

import React, {memo} from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {GRADIENTS} from '../../theme/gradients';
import {getColors} from '../../theme/colors';
import {TYPOGRAPHY} from '../../theme/typography';

/**
 * @typedef {'primary' | 'secondary' | 'icon' | 'outline'} ButtonVariant
 * @typedef {'small' | 'medium' | 'large'} ButtonSize
 */

/**
 * @param {Object} props - Component props
 * @param {ButtonVariant} [props.variant='primary'] - Button style variant
 * @param {Function} props.onPress - Press handler
 * @param {string} [props.title] - Button text (required for non-icon variants)
 * @param {string} [props.icon] - Icon name from MaterialCommunityIcons
 * @param {boolean} [props.loading=false] - Show loading spinner
 * @param {boolean} [props.disabled=false] - Disable button interaction
 * @param {ButtonSize} [props.size='medium'] - Button size
 * @param {boolean} [props.isDarkMode=false] - Dark mode flag
 * @param {object} [props.style] - Additional styles
 * @param {object} [props.textStyle] - Additional text styles
 */
const GradientButton = ({
  variant = 'primary',
  onPress,
  title,
  icon,
  loading = false,
  disabled = false,
  size = 'medium',
  isDarkMode = false,
  style,
  textStyle,
  ...props
}) => {
  const colors = getColors(isDarkMode);

  // Get gradient based on variant
  const getGradient = () => {
    switch (variant) {
      case 'secondary':
        return GRADIENTS.secondaryGradient;
      case 'primary':
      default:
        return GRADIENTS.primaryGradient;
    }
  };

  // Get size dimensions
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          height: 36,
          paddingHorizontal: 16,
          iconSize: 18,
          fontSize: 14,
        };
      case 'large':
        return {
          height: 56,
          paddingHorizontal: 32,
          iconSize: 24,
          fontSize: 18,
        };
      case 'medium':
      default:
        return {
          height: 48,
          paddingHorizontal: 24,
          iconSize: 20,
          fontSize: 16,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const gradient = getGradient();

  // Render icon-only button
  if (variant === 'icon') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.7}
        style={[styles.iconButtonContainer, style]}
        {...props}>
        <LinearGradient
          colors={gradient.colors}
          start={gradient.start}
          end={gradient.end}
          style={[
            styles.iconButton,
            {
              width: sizeStyles.height,
              height: sizeStyles.height,
            },
            disabled && styles.disabled,
          ]}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Icon name={icon || 'plus'} size={sizeStyles.iconSize} color="#FFFFFF" />
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Render outline button
  if (variant === 'outline') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.7}
        style={[
          styles.outlineButton,
          {
            height: sizeStyles.height,
            paddingHorizontal: sizeStyles.paddingHorizontal,
            borderColor: colors.primary,
          },
          disabled && styles.disabledOutline,
          style,
        ]}
        {...props}>
        <View style={styles.buttonContent}>
          {loading ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <>
              {icon && (
                <Icon
                  name={icon}
                  size={sizeStyles.iconSize}
                  color={colors.primary}
                  style={title && styles.iconMargin}
                />
              )}
              {title && (
                <Text
                  style={[
                    styles.outlineButtonText,
                    {
                      color: colors.primary,
                      fontSize: sizeStyles.fontSize,
                      fontFamily: TYPOGRAPHY.fontFamily.semibold,
                    },
                    textStyle,
                  ]}>
                  {title}
                </Text>
              )}
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // Render gradient button (primary/secondary)
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[styles.buttonContainer, style]}
      {...props}>
      <LinearGradient
        colors={gradient.colors}
        start={gradient.start}
        end={gradient.end}
        style={[
          styles.gradientButton,
          {
            height: sizeStyles.height,
            paddingHorizontal: sizeStyles.paddingHorizontal,
          },
          disabled && styles.disabled,
        ]}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <View style={styles.buttonContent}>
            {icon && (
              <Icon
                name={icon}
                size={sizeStyles.iconSize}
                color="#FFFFFF"
                style={title && styles.iconMargin}
              />
            )}
            {title && (
              <Text
                style={[
                  styles.buttonText,
                  {
                    fontSize: sizeStyles.fontSize,
                    fontFamily: TYPOGRAPHY.fontFamily.semibold,
                  },
                  textStyle,
                ]}>
                {title}
              </Text>
            )}
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  gradientButton: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  iconMargin: {
    marginRight: 8,
  },
  iconButtonContainer: {
    borderRadius: 50,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  iconButton: {
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineButton: {
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  outlineButtonText: {
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
  disabledOutline: {
    opacity: 0.4,
  },
});

export default memo(GradientButton);
