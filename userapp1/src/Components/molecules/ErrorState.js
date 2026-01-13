import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from '../../context/ThemeContext';
import {getColors} from '../../theme/colors';

/**
 * ErrorState Component
 * Displays error messages with retry functionality
 * @param {object} props - Component props
 * @param {string|Error} props.error - Error message or Error object
 * @param {function} props.onRetry - Callback for retry button
 * @param {string} props.title - Custom error title
 * @param {string} props.icon - Icon name (default: 'alert-circle')
 */
const ErrorState = ({
  error = 'Something went wrong',
  onRetry = null,
  title = 'Error',
  icon = 'alert-circle',
}) => {
  const {isDarkMode} = useTheme();
  const {width, height} = useWindowDimensions();
  const colors = getColors(isDarkMode);
  const styles = dynamicStyles(width, height, isDarkMode);

  // Extract error message
  let errorMessage = error;
  if (error instanceof Error) {
    errorMessage = error.message || 'Something went wrong';
  }

  // Determine error type and icon
  let displayIcon = icon;
  let displayTitle = title;

  if (errorMessage.toLowerCase().includes('network')) {
    displayIcon = 'wifi-off';
    displayTitle = 'Network Error';
  } else if (errorMessage.toLowerCase().includes('timeout')) {
    displayIcon = 'clock-alert';
    displayTitle = 'Request Timeout';
  } else if (errorMessage.toLowerCase().includes('unauthorized')) {
    displayIcon = 'lock-alert';
    displayTitle = 'Unauthorized';
  } else if (errorMessage.toLowerCase().includes('not found')) {
    displayIcon = 'magnify-close';
    displayTitle = 'Not Found';
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon
            name={displayIcon}
            size={64}
            color="#EF4444"
          />
        </View>

        <Text style={styles.title}>{displayTitle}</Text>

        <View style={styles.messageBox}>
          <Text style={styles.message}>{errorMessage}</Text>
        </View>

        <Text style={styles.helperText}>
          Please try again or contact support if the problem persists.
        </Text>

        {onRetry && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={onRetry}
            activeOpacity={0.7}>
            <Icon name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const dynamicStyles = (width, height, isDarkMode) => {
  const isTablet = width >= 600;

  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: isTablet ? 40 : 20,
      backgroundColor: isDarkMode ? '#0F0F1E' : '#FFFFFF',
      minHeight: 400,
    },
    content: {
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      maxWidth: 400,
    },
    iconContainer: {
      width: isTablet ? 100 : 80,
      height: isTablet ? 100 : 80,
      borderRadius: isTablet ? 50 : 40,
      backgroundColor: isDarkMode ? '#1A1A2E' : '#FEE2E2',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: isTablet ? 24 : 20,
      borderWidth: 2,
      borderColor: '#EF4444',
    },
    title: {
      fontSize: isTablet ? 22 : 18,
      fontWeight: '600',
      color: '#EF4444',
      marginBottom: isTablet ? 16 : 12,
      textAlign: 'center',
      fontFamily: 'RobotoSlab-SemiBold',
    },
    messageBox: {
      backgroundColor: isDarkMode ? '#1A1A2E' : '#F8F9FA',
      borderRadius: 8,
      paddingHorizontal: isTablet ? 16 : 12,
      paddingVertical: isTablet ? 14 : 12,
      marginBottom: isTablet ? 20 : 16,
      borderLeftWidth: 4,
      borderLeftColor: '#EF4444',
      maxHeight: 120,
    },
    message: {
      fontSize: isTablet ? 14 : 13,
      color: isDarkMode ? '#FFFFFF' : '#1A1A1A',
      fontFamily: 'RobotoSlab-Regular',
      lineHeight: 20,
    },
    helperText: {
      fontSize: isTablet ? 14 : 12,
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
      marginBottom: isTablet ? 24 : 20,
      fontFamily: 'RobotoSlab-Regular',
      lineHeight: 18,
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: isTablet ? 32 : 24,
      paddingVertical: isTablet ? 14 : 12,
      borderRadius: 8,
      backgroundColor: '#EF4444',
      elevation: 3,
      shadowColor: '#EF4444',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.25,
      shadowRadius: 3,
      gap: 8,
    },
    retryButtonText: {
      fontSize: isTablet ? 16 : 14,
      fontWeight: '600',
      color: '#FFFFFF',
      fontFamily: 'RobotoSlab-Medium',
    },
  });
};

export default ErrorState;
