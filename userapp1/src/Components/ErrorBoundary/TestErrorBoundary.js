/**
 * ErrorBoundary Test Component
 *
 * Purpose:
 * - Test component to verify ErrorBoundary is working correctly
 * - Use this in development to see how errors are caught and displayed
 *
 * Usage:
 * Import this component in a screen and tap the button to trigger an error:
 *
 * import TestErrorBoundary from './Components/ErrorBoundary/TestErrorBoundary';
 *
 * function MyScreen() {
 *   return (
 *     <View>
 *       <TestErrorBoundary />
 *     </View>
 *   );
 * }
 */

import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from '../../context/ThemeContext';
import {getColors} from '../../theme/colors';

/**
 * Component that throws an error when button is pressed
 */
const ErrorThrower = ({shouldThrow}) => {
  if (shouldThrow) {
    // This will trigger the ErrorBoundary
    throw new Error('Test error: ErrorBoundary is working correctly!');
  }
  return null;
};

/**
 * Test component with button to trigger errors
 */
const TestErrorBoundary = () => {
  const [throwError, setThrowError] = useState(false);
  const {isDarkMode} = useTheme();
  const colors = getColors(isDarkMode);

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Icon name="test-tube" size={48} color="#FF6B35" />
        </View>

        <Text style={[styles.title, {color: colors.text}]}>
          Test ErrorBoundary
        </Text>

        <Text style={[styles.description, {color: colors.textSecondary}]}>
          Tap the button below to trigger a test error. The ErrorBoundary
          should catch it and display the fallback UI.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => setThrowError(true)}
          activeOpacity={0.7}>
          <Icon name="alert-octagon" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Throw Test Error</Text>
        </TouchableOpacity>

        <View style={styles.note}>
          <Icon name="information" size={16} color={colors.textSecondary} />
          <Text style={[styles.noteText, {color: colors.textSecondary}]}>
            In dev mode, you'll see detailed error information
          </Text>
        </View>
      </View>

      {/* This will throw the error when state changes */}
      <ErrorThrower shouldThrow={throwError} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    fontFamily: 'RobotoSlab-Bold',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'RobotoSlab-Regular',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    shadowColor: '#EF4444',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'RobotoSlab-SemiBold',
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  noteText: {
    fontSize: 12,
    fontFamily: 'RobotoSlab-Regular',
    fontStyle: 'italic',
  },
});

export default TestErrorBoundary;
