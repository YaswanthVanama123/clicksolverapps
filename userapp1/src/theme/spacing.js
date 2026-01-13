/**
 * Spacing System - Consistent spacing scale
 * 8-point grid system for uniform spacing
 */

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

/**
 * Get spacing value by multiplier
 * @param {number} multiplier - Multiplier for base spacing (16)
 * @returns {number} Calculated spacing value
 */
export const getSpacing = (multiplier = 1) => {
  return SPACING.base * multiplier;
};

/**
 * Padding utilities
 */
export const PADDING = {
  horizontal: {
    xs: {paddingHorizontal: SPACING.xs},
    sm: {paddingHorizontal: SPACING.sm},
    md: {paddingHorizontal: SPACING.md},
    base: {paddingHorizontal: SPACING.base},
    lg: {paddingHorizontal: SPACING.lg},
    xl: {paddingHorizontal: SPACING.xl},
    xxl: {paddingHorizontal: SPACING.xxl},
    xxxl: {paddingHorizontal: SPACING.xxxl},
  },
  vertical: {
    xs: {paddingVertical: SPACING.xs},
    sm: {paddingVertical: SPACING.sm},
    md: {paddingVertical: SPACING.md},
    base: {paddingVertical: SPACING.base},
    lg: {paddingVertical: SPACING.lg},
    xl: {paddingVertical: SPACING.xl},
    xxl: {paddingVertical: SPACING.xxl},
    xxxl: {paddingVertical: SPACING.xxxl},
  },
  all: {
    xs: {padding: SPACING.xs},
    sm: {padding: SPACING.sm},
    md: {padding: SPACING.md},
    base: {padding: SPACING.base},
    lg: {padding: SPACING.lg},
    xl: {padding: SPACING.xl},
    xxl: {padding: SPACING.xxl},
    xxxl: {padding: SPACING.xxxl},
  },
};

/**
 * Margin utilities
 */
export const MARGIN = {
  horizontal: {
    xs: {marginHorizontal: SPACING.xs},
    sm: {marginHorizontal: SPACING.sm},
    md: {marginHorizontal: SPACING.md},
    base: {marginHorizontal: SPACING.base},
    lg: {marginHorizontal: SPACING.lg},
    xl: {marginHorizontal: SPACING.xl},
    xxl: {marginHorizontal: SPACING.xxl},
    xxxl: {marginHorizontal: SPACING.xxxl},
  },
  vertical: {
    xs: {marginVertical: SPACING.xs},
    sm: {marginVertical: SPACING.sm},
    md: {marginVertical: SPACING.md},
    base: {marginVertical: SPACING.base},
    lg: {marginVertical: SPACING.lg},
    xl: {marginVertical: SPACING.xl},
    xxl: {marginVertical: SPACING.xxl},
    xxxl: {marginVertical: SPACING.xxxl},
  },
  all: {
    xs: {margin: SPACING.xs},
    sm: {margin: SPACING.sm},
    md: {margin: SPACING.md},
    base: {margin: SPACING.base},
    lg: {margin: SPACING.lg},
    xl: {margin: SPACING.xl},
    xxl: {margin: SPACING.xxl},
    xxxl: {margin: SPACING.xxxl},
  },
  top: {
    xs: {marginTop: SPACING.xs},
    sm: {marginTop: SPACING.sm},
    md: {marginTop: SPACING.md},
    base: {marginTop: SPACING.base},
    lg: {marginTop: SPACING.lg},
    xl: {marginTop: SPACING.xl},
    xxl: {marginTop: SPACING.xxl},
    xxxl: {marginTop: SPACING.xxxl},
  },
  bottom: {
    xs: {marginBottom: SPACING.xs},
    sm: {marginBottom: SPACING.sm},
    md: {marginBottom: SPACING.md},
    base: {marginBottom: SPACING.base},
    lg: {marginBottom: SPACING.lg},
    xl: {marginBottom: SPACING.xl},
    xxl: {marginBottom: SPACING.xxl},
    xxxl: {marginBottom: SPACING.xxxl},
  },
  left: {
    xs: {marginLeft: SPACING.xs},
    sm: {marginLeft: SPACING.sm},
    md: {marginLeft: SPACING.md},
    base: {marginLeft: SPACING.base},
    lg: {marginLeft: SPACING.lg},
    xl: {marginLeft: SPACING.xl},
    xxl: {marginLeft: SPACING.xxl},
    xxxl: {marginLeft: SPACING.xxxl},
  },
  right: {
    xs: {marginRight: SPACING.xs},
    sm: {marginRight: SPACING.sm},
    md: {marginRight: SPACING.md},
    base: {marginRight: SPACING.base},
    lg: {marginRight: SPACING.lg},
    xl: {marginRight: SPACING.xl},
    xxl: {marginRight: SPACING.xxl},
    xxxl: {marginRight: SPACING.xxxl},
  },
};

/**
 * Border radius scale
 */
export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  full: 9999, // Fully rounded
};

/**
 * Container widths and constraints
 */
export const CONTAINER = {
  maxWidth: 1200,
  padding: SPACING.base,
  paddingLarge: SPACING.xl,
};

export default SPACING;
