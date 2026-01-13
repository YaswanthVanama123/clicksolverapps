/**
 * Shadow System - Elevation and depth effects
 * Consistent shadow elevations for cards, buttons, and floating elements
 */

import {Platform} from 'react-native';

/**
 * Get shadow style based on elevation level
 * @param {number} elevation - Shadow elevation (2, 4, 8, 12)
 * @returns {object} Shadow style object for both iOS and Android
 */
export const getShadow = elevation => {
  if (Platform.OS === 'ios') {
    // iOS shadow properties
    switch (elevation) {
      case 2:
        return {
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 1},
          shadowOpacity: 0.1,
          shadowRadius: 2,
        };
      case 4:
        return {
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.15,
          shadowRadius: 4,
        };
      case 8:
        return {
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 4},
          shadowOpacity: 0.2,
          shadowRadius: 8,
        };
      case 12:
        return {
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 6},
          shadowOpacity: 0.25,
          shadowRadius: 12,
        };
      default:
        return {
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.15,
          shadowRadius: 4,
        };
    }
  } else {
    // Android elevation
    return {
      elevation,
    };
  }
};

/**
 * Pre-defined shadow styles
 */
export const SHADOWS = {
  sm: {
    ...getShadow(2),
    name: 'sm',
    elevation: 2,
  },
  md: {
    ...getShadow(4),
    name: 'md',
    elevation: 4,
  },
  lg: {
    ...getShadow(8),
    name: 'lg',
    elevation: 8,
  },
  xl: {
    ...getShadow(12),
    name: 'xl',
    elevation: 12,
  },
  none: {
    shadowColor: 'transparent',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
};

/**
 * Get shadow style by name
 * @param {string} size - Shadow size (sm, md, lg, xl, none)
 * @returns {object} Shadow style object
 */
export const getShadowBySize = (size = 'md') => {
  return SHADOWS[size] || SHADOWS.md;
};

/**
 * Colored shadow for vibrant elements
 * @param {string} color - Hex color for shadow
 * @param {number} elevation - Shadow elevation level
 * @returns {object} Colored shadow style
 */
export const getColoredShadow = (color, elevation = 4) => {
  if (Platform.OS === 'ios') {
    const opacity = elevation === 2 ? 0.2 : elevation === 4 ? 0.3 : elevation === 8 ? 0.4 : 0.5;
    const radius = elevation === 2 ? 3 : elevation === 4 ? 6 : elevation === 8 ? 10 : 14;
    const height = elevation === 2 ? 2 : elevation === 4 ? 4 : elevation === 8 ? 6 : 8;

    return {
      shadowColor: color,
      shadowOffset: {width: 0, height},
      shadowOpacity: opacity,
      shadowRadius: radius,
    };
  } else {
    // Android doesn't support colored shadows well, use standard elevation
    return {
      elevation,
    };
  }
};

/**
 * Gradient shadows for vibrant cards
 */
export const GRADIENT_SHADOWS = {
  primary: getColoredShadow('#FF6B35', 6),
  secondary: getColoredShadow('#8B5CF6', 6),
  accent: getColoredShadow('#FBBF24', 6),
  success: getColoredShadow('#10B981', 6),
  error: getColoredShadow('#EF4444', 6),
  info: getColoredShadow('#3B82F6', 6),
};

/**
 * Card shadow presets
 */
export const CARD_SHADOWS = {
  flat: SHADOWS.sm,
  elevated: SHADOWS.md,
  floating: SHADOWS.lg,
  modal: SHADOWS.xl,
};

/**
 * Button shadow presets
 */
export const BUTTON_SHADOWS = {
  default: SHADOWS.sm,
  pressed: SHADOWS.none,
  floating: SHADOWS.md,
};

export default SHADOWS;
