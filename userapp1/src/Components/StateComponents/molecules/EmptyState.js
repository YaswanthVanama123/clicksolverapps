/**
 * EmptyState Component
 * Displays an empty state with optional icon, message, and action button
 */

import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useTheme} from '../../../theme';

/**
 * EmptyState Component
 * @param {Object} props - Component props
 * @param {string} props.title - Main title text
 * @param {string} props.message - Descriptive message
 * @param {string} props.actionText - Text for action button
 * @param {Function} props.onAction - Callback when action button is pressed
 * @param {React.ReactNode} props.icon - Optional icon component
 */
const EmptyState = ({
  title = 'No Data Found',
  message = 'There is nothing to display here yet.',
  actionText,
  onAction,
  icon,
}) => {
  const {theme} = useTheme();
  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionText && onAction && (
        <TouchableOpacity style={styles.button} onPress={onAction}>
          <Text style={styles.buttonText}>{actionText}</Text>
        </TouchableOpacity>
      )}
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
      padding: theme.spacing.xl,
    },
    iconContainer: {
      marginBottom: theme.spacing.lg,
    },
    title: {
      fontSize: theme.fontSizes.xl,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text.primary,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    message: {
      fontSize: theme.fontSizes.md,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
    button: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      borderRadius: theme.borderRadius.md,
      marginTop: theme.spacing.md,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: theme.fontSizes.md,
      fontWeight: theme.fontWeights.semibold,
    },
  });

export default EmptyState;
