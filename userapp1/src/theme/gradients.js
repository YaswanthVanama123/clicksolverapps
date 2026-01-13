/**
 * Gradient System - Vibrant & Eye-catching Gradients
 * Urban Company/Dunzo style gradient definitions
 */

import React from 'react';
import LinearGradient from 'react-native-linear-gradient';

// Gradient definitions
export const GRADIENTS = {
  primaryGradient: {
    colors: ['#FF6B35', '#FF4D00'],
    start: {x: 0, y: 0},
    end: {x: 1, y: 1},
  },
  secondaryGradient: {
    colors: ['#8B5CF6', '#EC4899'],
    start: {x: 0, y: 0},
    end: {x: 1, y: 1},
  },
  accentGradient: {
    colors: ['#FBBF24', '#F59E0B'],
    start: {x: 0, y: 0},
    end: {x: 1, y: 1},
  },
  successGradient: {
    colors: ['#10B981', '#34D399'],
    start: {x: 0, y: 0},
    end: {x: 1, y: 1},
  },
  errorGradient: {
    colors: ['#EF4444', '#DC2626'],
    start: {x: 0, y: 0},
    end: {x: 1, y: 1},
  },
  warningGradient: {
    colors: ['#F59E0B', '#FBBF24'],
    start: {x: 0, y: 0},
    end: {x: 1, y: 1},
  },
  infoGradient: {
    colors: ['#3B82F6', '#60A5FA'],
    start: {x: 0, y: 0},
    end: {x: 1, y: 1},
  },
  darkGradient: {
    colors: ['#6366F1', '#8B5CF6'],
    start: {x: 0, y: 0},
    end: {x: 1, y: 1},
  },
  // Additional vibrant gradients for variety
  sunsetGradient: {
    colors: ['#FF6B35', '#FBBF24', '#EC4899'],
    start: {x: 0, y: 0},
    end: {x: 1, y: 1},
  },
  oceanGradient: {
    colors: ['#3B82F6', '#8B5CF6'],
    start: {x: 0, y: 0},
    end: {x: 1, y: 1},
  },
  forestGradient: {
    colors: ['#10B981', '#34D399', '#6EE7B7'],
    start: {x: 0, y: 0},
    end: {x: 1, y: 1},
  },
  purpleHazeGradient: {
    colors: ['#8B5CF6', '#A78BFA', '#EC4899'],
    start: {x: 0, y: 0},
    end: {x: 1, y: 1},
  },
};

/**
 * Get gradient colors based on gradient name and theme mode
 * @param {string} gradientName - Name of the gradient (e.g., 'primaryGradient')
 * @param {boolean} isDarkMode - Whether dark mode is active
 * @returns {object} Gradient configuration with colors, start, and end points
 */
export const getGradientColors = (gradientName, isDarkMode = false) => {
  // For dark mode, you can adjust gradient intensity or use specific dark gradients
  const gradient = GRADIENTS[gradientName] || GRADIENTS.primaryGradient;

  if (isDarkMode && gradientName === 'primaryGradient') {
    // Optionally return a darker version for dark mode
    return GRADIENTS.darkGradient;
  }

  return gradient;
};

/**
 * GradientBackground - Reusable gradient wrapper component
 * @param {object} props - Component props
 * @param {string} props.gradientName - Name of gradient to use
 * @param {boolean} props.isDarkMode - Dark mode flag
 * @param {object} props.style - Additional styles
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} LinearGradient component
 */
export const GradientBackground = ({
  gradientName = 'primaryGradient',
  isDarkMode = false,
  style = {},
  children,
  ...props
}) => {
  const gradient = getGradientColors(gradientName, isDarkMode);

  return (
    <LinearGradient
      colors={gradient.colors}
      start={gradient.start}
      end={gradient.end}
      style={style}
      {...props}>
      {children}
    </LinearGradient>
  );
};

/**
 * Get gradient as CSS string for web or text shadows
 * @param {string} gradientName - Name of gradient
 * @returns {string} CSS gradient string
 */
export const getGradientCSS = gradientName => {
  const gradient = GRADIENTS[gradientName] || GRADIENTS.primaryGradient;
  const colorStops = gradient.colors.join(', ');
  return `linear-gradient(135deg, ${colorStops})`;
};

/**
 * Get array of gradient names for selection
 * @returns {string[]} Array of gradient names
 */
export const getGradientNames = () => {
  return Object.keys(GRADIENTS);
};

export default GRADIENTS;
