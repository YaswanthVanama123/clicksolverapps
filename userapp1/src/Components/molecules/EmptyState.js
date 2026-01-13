import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../context/ThemeContext';
import {getColors} from '../../theme/colors';
import {GRADIENTS} from '../../theme/gradients';

/**
 * EmptyState Component
 * Displays an empty list/data state with icon, message, and optional action
 * @param {object} props - Component props
 * @param {string} props.icon - Icon name from Ionicons
 * @param {string} props.title - Title text
 * @param {string} props.message - Description message
 * @param {string} props.actionLabel - Label for action button
 * @param {function} props.onAction - Callback for action button press
 * @param {string} props.gradientName - Gradient variant (optional)
 */
const EmptyState = ({
  icon = 'search',
  title = 'No Results',
  message = 'Try adjusting your search or filters',
  actionLabel = null,
  onAction = null,
  gradientName = null,
}) => {
  const {isDarkMode} = useTheme();
  const {width, height} = useWindowDimensions();
  const colors = getColors(isDarkMode);
  const styles = dynamicStyles(width, height, isDarkMode);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon
            name={icon}
            size={60}
            color={isDarkMode ? '#8B5CF6' : '#FF6B35'}
          />
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        {actionLabel && onAction && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onAction}
            activeOpacity={0.7}>
            <Text style={styles.actionButtonText}>{actionLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const dynamicStyles = (width, height, isDarkMode) => {
  const isTablet = width >= 600;

  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: isTablet ? 40 : 20,
      backgroundColor: isDarkMode ? '#0F0F1E' : '#FFFFFF',
      minHeight: 300,
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
      backgroundColor: isDarkMode ? '#1A1A2E' : '#F8F9FA',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: isTablet ? 24 : 20,
      borderWidth: 2,
      borderColor: isDarkMode ? '#8B5CF6' : '#FF6B35',
    },
    title: {
      fontSize: isTablet ? 22 : 18,
      fontWeight: '600',
      color: isDarkMode ? '#FFFFFF' : '#1A1A1A',
      marginBottom: isTablet ? 12 : 8,
      textAlign: 'center',
      fontFamily: 'RobotoSlab-SemiBold',
    },
    message: {
      fontSize: isTablet ? 16 : 14,
      color: isDarkMode ? '#B4B4B4' : '#6B7280',
      textAlign: 'center',
      marginBottom: isTablet ? 24 : 20,
      lineHeight: 22,
      fontFamily: 'RobotoSlab-Regular',
    },
    actionButton: {
      paddingHorizontal: isTablet ? 32 : 24,
      paddingVertical: isTablet ? 14 : 12,
      borderRadius: 8,
      backgroundColor: isDarkMode ? '#8B5CF6' : '#FF6B35',
      elevation: 3,
      shadowColor: isDarkMode ? '#8B5CF6' : '#FF6B35',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.25,
      shadowRadius: 3,
    },
    actionButtonText: {
      fontSize: isTablet ? 16 : 14,
      fontWeight: '600',
      color: '#FFFFFF',
      textAlign: 'center',
      fontFamily: 'RobotoSlab-Medium',
    },
  });
};

export default EmptyState;
