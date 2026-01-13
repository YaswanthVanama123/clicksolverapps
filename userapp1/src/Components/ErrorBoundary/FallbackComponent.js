/**
 * FallbackComponent - Error UI for ErrorBoundary
 *
 * Purpose:
 * - Display user-friendly error message using ErrorState
 * - Show detailed error info in development mode
 * - Provide retry functionality
 * - Use theme system for consistent styling
 *
 * Usage:
 * - Used by ErrorBoundary component
 * - Can be customized with props
 */

import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ErrorState from '../molecules/ErrorState';
import {useTheme} from '../../context/ThemeContext';
import {getColors} from '../../theme/colors';

/**
 * Fallback UI component for ErrorBoundary
 * @param {Object} props
 * @param {Error} props.error - The error object
 * @param {Function} props.resetError - Function to reset error boundary
 * @param {string} props.errorInfo - Component stack trace
 */
const FallbackComponent = ({error, resetError, errorInfo}) => {
  const {isDarkMode} = useTheme();
  const colors = getColors(isDarkMode);
  const [showDetails, setShowDetails] = useState(false);
  const isDev = __DEV__;

  // Extract error details
  const errorMessage =
    error?.message || 'An unexpected error occurred in the application';
  const errorName = error?.name || 'Error';
  const errorStack = error?.stack || 'No stack trace available';
  const componentStack = errorInfo || 'No component stack available';

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Main Error State UI */}
        <ErrorState
          error={error}
          onRetry={resetError}
          title="Something Went Wrong"
          icon="alert-octagon"
        />

        {/* Development Mode: Show Error Details */}
        {isDev && (
          <View style={styles.devSection}>
            <TouchableOpacity
              style={[
                styles.detailsToggle,
                {backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6'},
              ]}
              onPress={() => setShowDetails(!showDetails)}
              activeOpacity={0.7}>
              <Icon
                name={showDetails ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.text}
              />
              <Text style={[styles.detailsToggleText, {color: colors.text}]}>
                {showDetails ? 'Hide' : 'Show'} Developer Details
              </Text>
            </TouchableOpacity>

            {showDetails && (
              <View
                style={[
                  styles.detailsContainer,
                  {
                    backgroundColor: isDarkMode ? '#111827' : '#FFFFFF',
                    borderColor: isDarkMode ? '#374151' : '#E5E7EB',
                  },
                ]}>
                {/* Error Name */}
                <View style={styles.detailBlock}>
                  <Text style={styles.detailLabel}>Error Type:</Text>
                  <View
                    style={[
                      styles.codeBlock,
                      {
                        backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB',
                        borderColor: isDarkMode ? '#4B5563' : '#E5E7EB',
                      },
                    ]}>
                    <Text
                      style={[styles.codeText, {color: colors.text}]}
                      selectable>
                      {errorName}
                    </Text>
                  </View>
                </View>

                {/* Error Message */}
                <View style={styles.detailBlock}>
                  <Text style={styles.detailLabel}>Error Message:</Text>
                  <View
                    style={[
                      styles.codeBlock,
                      {
                        backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB',
                        borderColor: isDarkMode ? '#4B5563' : '#E5E7EB',
                      },
                    ]}>
                    <Text
                      style={[styles.codeText, {color: colors.text}]}
                      selectable>
                      {errorMessage}
                    </Text>
                  </View>
                </View>

                {/* Component Stack */}
                <View style={styles.detailBlock}>
                  <Text style={styles.detailLabel}>Component Stack:</Text>
                  <ScrollView
                    style={[
                      styles.stackScrollView,
                      {
                        backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB',
                        borderColor: isDarkMode ? '#4B5563' : '#E5E7EB',
                      },
                    ]}
                    nestedScrollEnabled>
                    <Text
                      style={[styles.stackText, {color: colors.text}]}
                      selectable>
                      {componentStack}
                    </Text>
                  </ScrollView>
                </View>

                {/* Error Stack */}
                <View style={styles.detailBlock}>
                  <Text style={styles.detailLabel}>Stack Trace:</Text>
                  <ScrollView
                    style={[
                      styles.stackScrollView,
                      {
                        backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB',
                        borderColor: isDarkMode ? '#4B5563' : '#E5E7EB',
                      },
                    ]}
                    nestedScrollEnabled>
                    <Text
                      style={[styles.stackText, {color: colors.text}]}
                      selectable>
                      {errorStack}
                    </Text>
                  </ScrollView>
                </View>

                {/* Platform Info */}
                <View style={styles.detailBlock}>
                  <Text style={styles.detailLabel}>Platform Info:</Text>
                  <View
                    style={[
                      styles.codeBlock,
                      {
                        backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB',
                        borderColor: isDarkMode ? '#4B5563' : '#E5E7EB',
                      },
                    ]}>
                    <Text
                      style={[styles.codeText, {color: colors.text}]}
                      selectable>
                      {`OS: ${Platform.OS}\nVersion: ${Platform.Version}\nDev Mode: ${isDev}`}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Footer Note */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, {color: colors.textSecondary}]}>
            {isDev
              ? 'This error was caught by the Error Boundary'
              : 'We apologize for the inconvenience'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  devSection: {
    marginTop: 20,
    marginHorizontal: 16,
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  detailsToggleText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'RobotoSlab-Medium',
  },
  detailsContainer: {
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  detailBlock: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'RobotoSlab-Bold',
  },
  codeBlock: {
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  codeText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 18,
  },
  stackScrollView: {
    maxHeight: 200,
    borderRadius: 6,
    borderWidth: 1,
    padding: 12,
  },
  stackText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 16,
  },
  footer: {
    marginTop: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'RobotoSlab-Regular',
    fontStyle: 'italic',
  },
});

export default FallbackComponent;
