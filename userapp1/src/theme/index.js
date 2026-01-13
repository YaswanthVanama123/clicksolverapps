/**
 * Theme System - Main Entry Point
 * Vibrant & Gradient-Heavy Design System
 * Urban Company/Dunzo inspired theme
 */

import React, {createContext, useContext, useState, useEffect} from 'react';
import {Appearance} from 'react-native';

// Import all theme modules
import {getColors, COLORS} from './colors';
import GRADIENTS, {
  getGradientColors,
  GradientBackground,
  getGradientCSS,
  getGradientNames,
} from './gradients';
import TYPOGRAPHY, {
  FONT_SIZES,
  FONT_WEIGHTS,
  getTextStyle,
  TEXT_STYLES,
} from './typography';
import SPACING, {
  getSpacing,
  PADDING,
  MARGIN,
  BORDER_RADIUS,
  CONTAINER,
} from './spacing';
import SHADOWS, {
  getShadow,
  getShadowBySize,
  getColoredShadow,
  GRADIENT_SHADOWS,
  CARD_SHADOWS,
  BUTTON_SHADOWS,
} from './shadows';
import ANIMATIONS, {
  TIMING,
  EASING,
  LAYOUT_ANIMATIONS,
  GESTURE_ANIMATIONS,
  TRANSITIONS,
  getAnimation,
  createAnimation,
  createSpring,
} from './animations';

// Create Theme Context
const ThemeContext = createContext();

/**
 * ThemeProvider Component
 * Manages theme state and provides theme values to the entire app
 */
export const ThemeProvider = ({children}) => {
  // Get system color scheme
  const systemIsDark = Appearance.getColorScheme() === 'dark';
  const [themeMode, setThemeMode] = useState('system');
  const [isDarkMode, setIsDarkMode] = useState(systemIsDark);

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (themeMode === 'system') {
      const subscription = Appearance.addChangeListener(({colorScheme}) => {
        setIsDarkMode(colorScheme === 'dark');
      });
      return () => subscription.remove();
    }
  }, [themeMode]);

  // Toggle theme manually
  const toggleTheme = () => {
    if (themeMode === 'system') {
      setThemeMode('manual');
      setIsDarkMode(prev => !prev);
    } else {
      setIsDarkMode(prev => !prev);
    }
  };

  // Use system theme
  const useSystemTheme = () => {
    setThemeMode('system');
    setIsDarkMode(Appearance.getColorScheme() === 'dark');
  };

  // Get current theme object
  const theme = createTheme(isDarkMode);

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        toggleTheme,
        useSystemTheme,
        themeMode,
        theme,
      }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Create complete theme object
 * @param {boolean} isDarkMode - Whether dark mode is active
 * @returns {object} Complete theme configuration
 */
export const createTheme = (isDarkMode = false) => {
  const colors = getColors(isDarkMode);

  return {
    // Core theme values
    isDarkMode,
    colors,
    gradients: GRADIENTS,
    typography: TYPOGRAPHY,
    spacing: SPACING,
    shadows: SHADOWS,
    animations: ANIMATIONS,

    // Utility functions
    getGradientColors: gradientName => getGradientColors(gradientName, isDarkMode),
    getTextStyle,
    getSpacing,
    getShadow,
    getShadowBySize,
    getColoredShadow,
    getAnimation,
    createAnimation,
    createSpring,

    // Pre-defined styles
    textStyles: TEXT_STYLES,
    gradientShadows: GRADIENT_SHADOWS,
    cardShadows: CARD_SHADOWS,
    buttonShadows: BUTTON_SHADOWS,

    // Spacing utilities
    padding: PADDING,
    margin: MARGIN,
    borderRadius: BORDER_RADIUS,
    container: CONTAINER,

    // Font configuration
    fontSizes: FONT_SIZES,
    fontWeights: FONT_WEIGHTS,

    // Animation utilities
    timing: TIMING,
    easing: EASING,
    layoutAnimations: LAYOUT_ANIMATIONS,
    gestureAnimations: GESTURE_ANIMATIONS,
    transitions: TRANSITIONS,
  };
};

/**
 * useTheme Hook
 * Access theme values and functions from any component
 * @returns {object} Theme context value
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * withTheme HOC
 * Inject theme as prop into class components
 * @param {React.Component} Component - Component to wrap
 * @returns {React.Component} Wrapped component with theme prop
 */
export const withTheme = Component => {
  return props => {
    const theme = useTheme();
    return <Component {...props} theme={theme} />;
  };
};

// Export everything for direct imports
export {
  // Colors
  COLORS,
  getColors,

  // Gradients
  GRADIENTS,
  getGradientColors,
  GradientBackground,
  getGradientCSS,
  getGradientNames,

  // Typography
  TYPOGRAPHY,
  FONT_SIZES,
  FONT_WEIGHTS,
  getTextStyle,
  TEXT_STYLES,

  // Spacing
  SPACING,
  getSpacing,
  PADDING,
  MARGIN,
  BORDER_RADIUS,
  CONTAINER,

  // Shadows
  SHADOWS,
  getShadow,
  getShadowBySize,
  getColoredShadow,
  GRADIENT_SHADOWS,
  CARD_SHADOWS,
  BUTTON_SHADOWS,

  // Animations
  ANIMATIONS,
  TIMING,
  EASING,
  LAYOUT_ANIMATIONS,
  GESTURE_ANIMATIONS,
  TRANSITIONS,
  getAnimation,
  createAnimation,
  createSpring,
};

// Default export
export default {
  ThemeProvider,
  useTheme,
  withTheme,
  createTheme,
  COLORS,
  GRADIENTS,
  TYPOGRAPHY,
  SPACING,
  SHADOWS,
  ANIMATIONS,
};
