/**
 * LoadingState Component
 * Displays a loading indicator with optional message
 */

import React from 'react';
import {View, ActivityIndicator, Text, StyleSheet} from 'react-native';
import {useTheme} from '../../../theme';

/**
 * LoadingState Component
 * @param {Object} props - Component props
 * @param {string} props.message - Optional loading message
 * @param {string} props.size - Size of the loading indicator ('small' | 'large')
 * @param {string} props.color - Color of the loading indicator
 */
const LoadingState = ({message = 'Loading...', size = 'large', color}) => {
  const {theme} = useTheme();
  const styles = getStyles(theme);
  const indicatorColor = color || theme.colors.primary;

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={indicatorColor} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const getStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      padding: theme.spacing.lg,
    },
    message: {
      marginTop: theme.spacing.md,
      fontSize: theme.fontSizes.md,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
  });

export default LoadingState;
