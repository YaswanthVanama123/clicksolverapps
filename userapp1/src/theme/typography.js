/**
 * Typography System - Poppins Font Family
 * Vibrant and modern typography scale
 */

import {Platform} from 'react-native';

// Font family configuration
const FONT_FAMILY = {
  base: Platform.select({
    ios: 'Poppins',
    android: 'Poppins-Regular',
    default: 'Poppins',
  }),
  light: Platform.select({
    ios: 'Poppins-Light',
    android: 'Poppins-Light',
    default: 'Poppins-Light',
  }),
  regular: Platform.select({
    ios: 'Poppins-Regular',
    android: 'Poppins-Regular',
    default: 'Poppins-Regular',
  }),
  medium: Platform.select({
    ios: 'Poppins-Medium',
    android: 'Poppins-Medium',
    default: 'Poppins-Medium',
  }),
  semibold: Platform.select({
    ios: 'Poppins-SemiBold',
    android: 'Poppins-SemiBold',
    default: 'Poppins-SemiBold',
  }),
  bold: Platform.select({
    ios: 'Poppins-Bold',
    android: 'Poppins-Bold',
    default: 'Poppins-Bold',
  }),
};

// Font sizes
export const FONT_SIZES = {
  h1: 32,
  h2: 28,
  h3: 24,
  h4: 20,
  h5: 18,
  body1: 16,
  body2: 14,
  caption: 12,
  small: 10,
  // Aliases for easier access
  '3xl': 32,
  '2xl': 28,
  xl: 24,
  lg: 20,
  md: 16,
  sm: 14,
  xs: 12,
};

// Font weights
export const FONT_WEIGHTS = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

// Line heights (multipliers of font size)
const LINE_HEIGHTS = {
  h1: 1.3,
  h2: 1.35,
  h3: 1.4,
  h4: 1.4,
  h5: 1.45,
  body1: 1.5,
  body2: 1.5,
  caption: 1.4,
  small: 1.4,
};

/**
 * Get text style based on variant and weight
 * @param {string} variant - Typography variant (h1, h2, body1, etc.)
 * @param {string} weight - Font weight (light, regular, medium, semibold, bold)
 * @returns {object} Text style object with fontSize, fontFamily, lineHeight
 */
export const getTextStyle = (variant = 'body1', weight = 'regular') => {
  const fontSize = FONT_SIZES[variant] || FONT_SIZES.body1;
  const lineHeight = (LINE_HEIGHTS[variant] || 1.5) * fontSize;

  let fontFamily;
  switch (weight) {
    case 'light':
      fontFamily = FONT_FAMILY.light;
      break;
    case 'medium':
      fontFamily = FONT_FAMILY.medium;
      break;
    case 'semibold':
      fontFamily = FONT_FAMILY.semibold;
      break;
    case 'bold':
      fontFamily = FONT_FAMILY.bold;
      break;
    case 'regular':
    default:
      fontFamily = FONT_FAMILY.regular;
      break;
  }

  return {
    fontSize,
    fontFamily,
    lineHeight,
    fontWeight: FONT_WEIGHTS[weight] || FONT_WEIGHTS.regular,
  };
};

/**
 * Pre-defined text styles for common use cases
 */
export const TEXT_STYLES = {
  // Headers
  h1Bold: getTextStyle('h1', 'bold'),
  h1Semibold: getTextStyle('h1', 'semibold'),
  h1Regular: getTextStyle('h1', 'regular'),

  h2Bold: getTextStyle('h2', 'bold'),
  h2Semibold: getTextStyle('h2', 'semibold'),
  h2Regular: getTextStyle('h2', 'regular'),

  h3Bold: getTextStyle('h3', 'bold'),
  h3Semibold: getTextStyle('h3', 'semibold'),
  h3Regular: getTextStyle('h3', 'regular'),

  h4Bold: getTextStyle('h4', 'bold'),
  h4Semibold: getTextStyle('h4', 'semibold'),
  h4Regular: getTextStyle('h4', 'regular'),

  h5Bold: getTextStyle('h5', 'bold'),
  h5Semibold: getTextStyle('h5', 'semibold'),
  h5Regular: getTextStyle('h5', 'regular'),

  // Body text
  body1Bold: getTextStyle('body1', 'bold'),
  body1Semibold: getTextStyle('body1', 'semibold'),
  body1Medium: getTextStyle('body1', 'medium'),
  body1Regular: getTextStyle('body1', 'regular'),
  body1Light: getTextStyle('body1', 'light'),

  body2Bold: getTextStyle('body2', 'bold'),
  body2Semibold: getTextStyle('body2', 'semibold'),
  body2Medium: getTextStyle('body2', 'medium'),
  body2Regular: getTextStyle('body2', 'regular'),
  body2Light: getTextStyle('body2', 'light'),

  // Caption & Small text
  captionBold: getTextStyle('caption', 'bold'),
  captionSemibold: getTextStyle('caption', 'semibold'),
  captionMedium: getTextStyle('caption', 'medium'),
  captionRegular: getTextStyle('caption', 'regular'),

  smallBold: getTextStyle('small', 'bold'),
  smallSemibold: getTextStyle('small', 'semibold'),
  smallRegular: getTextStyle('small', 'regular'),
};

/**
 * Export typography configuration
 */
export const TYPOGRAPHY = {
  fontFamily: FONT_FAMILY,
  fontSize: FONT_SIZES,
  fontWeight: FONT_WEIGHTS,
  lineHeight: LINE_HEIGHTS,
  getTextStyle,
  styles: TEXT_STYLES,
};

export default TYPOGRAPHY;
