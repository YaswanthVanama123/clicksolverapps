/**
 * Input Component
 * A styled text input with floating labels, icons, and error states
 *
 * @component
 * @example
 * <Input
 *   value={email}
 *   onChangeText={setEmail}
 *   placeholder="Enter email"
 *   leftIcon="email"
 *   error="Invalid email"
 * />
 */

import React, {memo, useState, useRef, useEffect} from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {getColors} from '../../theme/colors';
import {TYPOGRAPHY} from '../../theme/typography';

/**
 * @param {Object} props - Component props
 * @param {string} props.value - Input value
 * @param {Function} props.onChangeText - Change handler
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} [props.error] - Error message
 * @param {string} [props.leftIcon] - Left icon name
 * @param {string} [props.rightIcon] - Right icon name
 * @param {Function} [props.onRightIconPress] - Right icon press handler
 * @param {boolean} [props.isDarkMode=false] - Dark mode flag
 * @param {boolean} [props.secureTextEntry=false] - Hide text for passwords
 * @param {boolean} [props.editable=true] - Enable/disable input
 * @param {string} [props.keyboardType='default'] - Keyboard type
 * @param {boolean} [props.multiline=false] - Enable multiline
 * @param {number} [props.numberOfLines=1] - Number of lines for multiline
 * @param {object} [props.style] - Container style
 * @param {object} [props.inputStyle] - Input style
 */
const Input = ({
  value,
  onChangeText,
  placeholder = '',
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  isDarkMode = false,
  secureTextEntry = false,
  editable = true,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  style,
  inputStyle,
  ...props
}) => {
  const colors = getColors(isDarkMode);
  const [isFocused, setIsFocused] = useState(false);
  const labelAnimation = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(labelAnimation, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value, labelAnimation]);

  const labelStyle = {
    position: 'absolute',
    left: leftIcon ? 48 : 16,
    top: labelAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [20, 4],
    }),
    fontSize: labelAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: error
      ? colors.error
      : isFocused
      ? colors.primary
      : colors.text.tertiary,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  };

  const containerStyle = [
    styles.container,
    {
      borderColor: error
        ? colors.error
        : isFocused
        ? colors.primary
        : colors.divider,
      backgroundColor: isDarkMode ? colors.surface : '#FFFFFF',
    },
    multiline && {height: 100, alignItems: 'flex-start'},
    !editable && styles.disabled,
    style,
  ];

  return (
    <View style={styles.wrapper}>
      <View style={containerStyle}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            <Icon
              name={leftIcon}
              size={20}
              color={error ? colors.error : colors.text.secondary}
            />
          </View>
        )}

        <View style={styles.inputWrapper}>
          {placeholder && (
            <Animated.Text style={labelStyle}>{placeholder}</Animated.Text>
          )}
          <TextInput
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={[
              styles.input,
              {
                color: colors.text.primary,
                fontFamily: TYPOGRAPHY.fontFamily.regular,
                paddingTop: placeholder ? 20 : 0,
              },
              leftIcon && {paddingLeft: 0},
              rightIcon && {paddingRight: 0},
              multiline && {
                height: 80,
                textAlignVertical: 'top',
                paddingTop: placeholder ? 28 : 8,
              },
              inputStyle,
            ]}
            secureTextEntry={secureTextEntry}
            editable={editable}
            keyboardType={keyboardType}
            multiline={multiline}
            numberOfLines={multiline ? numberOfLines : 1}
            placeholderTextColor={colors.text.tertiary}
            {...props}
          />
        </View>

        {rightIcon && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}>
            <Icon
              name={rightIcon}
              size={20}
              color={error ? colors.error : colors.text.secondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={14} color={colors.error} />
          <Text
            style={[
              styles.errorText,
              {
                color: colors.error,
                fontFamily: TYPOGRAPHY.fontFamily.regular,
              },
            ]}>
            {error}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    minHeight: 56,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  leftIconContainer: {
    marginRight: 12,
  },
  rightIconContainer: {
    marginLeft: 12,
  },
  inputWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    paddingVertical: 8,
    minHeight: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 4,
  },
  errorText: {
    fontSize: 12,
    marginLeft: 4,
  },
  disabled: {
    opacity: 0.6,
  },
});

export default memo(Input);
