/**
 * InputField - Complete form input with label and error
 * Includes floating label, error message display, and uses custom styling
 */

import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {getColors} from '../../theme/colors';
import {GRADIENTS} from '../../theme/gradients';
import {SPACING, BORDER_RADIUS} from '../../theme/spacing';

const InputField = ({
  label = '',
  value = '',
  onChange,
  error = '',
  required = false,
  placeholder = '',
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  maxLength,
  editable = true,
  leftIcon,
  rightIcon,
  onRightIconPress,
  isDarkMode = false,
  style,
  inputStyle,
  ...inputProps
}) => {
  const colors = getColors(isDarkMode);
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.spring(labelAnim, {
      toValue: 1,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!value) {
      Animated.spring(labelAnim, {
        toValue: 0,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleChangeText = text => {
    if (onChange) {
      onChange(text);
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const labelTop = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [multiline ? 18 : 20, 0],
  });

  const labelFontSize = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 12],
  });

  const getBorderColor = () => {
    if (error) return colors.error;
    if (isFocused) return colors.primary;
    return colors.divider;
  };

  return (
    <View style={[styles.container, style]}>
      {/* Floating Label */}
      {label && (
        <Animated.View
          style={[
            styles.labelContainer,
            {
              top: labelTop,
            },
          ]}>
          <Animated.Text
            style={[
              styles.label,
              {
                color: error
                  ? colors.error
                  : isFocused
                  ? colors.primary
                  : colors.text.secondary,
                fontSize: labelFontSize,
              },
            ]}>
            {label}
            {required && <Text style={{color: colors.error}}> *</Text>}
          </Animated.Text>
        </Animated.View>
      )}

      {/* Input Container */}
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: getBorderColor(),
            backgroundColor: editable ? colors.surface : colors.divider,
          },
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
        ]}>
        {/* Gradient Border on Focus */}
        {isFocused && !error && (
          <LinearGradient
            colors={GRADIENTS.primaryGradient.colors}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={styles.gradientBorder}
          />
        )}

        {/* Left Icon */}
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            <Icon
              name={leftIcon}
              size={20}
              color={isFocused ? colors.primary : colors.text.secondary}
            />
          </View>
        )}

        {/* Text Input */}
        <TextInput
          value={value}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={isFocused || !label ? placeholder : ''}
          placeholderTextColor={colors.text.tertiary}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          maxLength={maxLength}
          editable={editable}
          style={[
            styles.input,
            {
              color: colors.text.primary,
              paddingTop: label && (value || isFocused) ? SPACING.lg : SPACING.md,
            },
            multiline && styles.inputMultiline,
            leftIcon && styles.inputWithLeftIcon,
            (rightIcon || secureTextEntry) && styles.inputWithRightIcon,
            inputStyle,
          ]}
          {...inputProps}
        />

        {/* Right Icon / Password Toggle */}
        {(rightIcon || secureTextEntry) && (
          <TouchableOpacity
            onPress={
              secureTextEntry ? togglePasswordVisibility : onRightIconPress
            }
            style={styles.rightIconContainer}
            activeOpacity={0.7}>
            <Icon
              name={
                secureTextEntry
                  ? isPasswordVisible
                    ? 'eye-off'
                    : 'eye'
                  : rightIcon
              }
              size={20}
              color={isFocused ? colors.primary : colors.text.secondary}
            />
          </TouchableOpacity>
        )}

        {/* Character Count */}
        {maxLength && isFocused && (
          <View style={styles.charCountContainer}>
            <Text
              style={[
                styles.charCount,
                {
                  color:
                    value.length >= maxLength
                      ? colors.error
                      : colors.text.tertiary,
                },
              ]}>
              {value.length}/{maxLength}
            </Text>
          </View>
        )}
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={14} color={colors.error} />
          <Text style={[styles.errorText, {color: colors.error}]}>{error}</Text>
        </View>
      )}

      {/* Helper Text (if no error and input is focused) */}
      {!error && isFocused && inputProps.helperText && (
        <View style={styles.helperContainer}>
          <Icon name="information" size={14} color={colors.text.tertiary} />
          <Text style={[styles.helperText, {color: colors.text.tertiary}]}>
            {inputProps.helperText}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.base,
  },
  labelContainer: {
    position: 'absolute',
    left: SPACING.base,
    zIndex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: SPACING.xs,
  },
  label: {
    fontWeight: '600',
  },
  inputContainer: {
    position: 'relative',
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  inputContainerFocused: {
    borderWidth: 2,
  },
  inputContainerError: {
    borderWidth: 2,
  },
  gradientBorder: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: BORDER_RADIUS.md,
    zIndex: -1,
  },
  input: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    fontSize: 16,
    fontWeight: '500',
    minHeight: 56,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputWithLeftIcon: {
    paddingLeft: SPACING.xxxl + SPACING.xs,
  },
  inputWithRightIcon: {
    paddingRight: SPACING.xxxl + SPACING.xs,
  },
  leftIconContainer: {
    position: 'absolute',
    left: SPACING.base,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  rightIconContainer: {
    position: 'absolute',
    right: SPACING.base,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  charCountContainer: {
    position: 'absolute',
    right: SPACING.base,
    bottom: SPACING.xs,
  },
  charCount: {
    fontSize: 11,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.xs,
    gap: SPACING.xs / 2,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
  },
  helperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.xs,
    gap: SPACING.xs / 2,
  },
  helperText: {
    fontSize: 12,
    fontWeight: '400',
  },
});

export default InputField;
