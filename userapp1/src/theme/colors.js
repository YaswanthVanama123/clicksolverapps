/**
 * Color Palette - Vibrant & Gradient-Heavy Design System
 * Urban Company/Dunzo inspired color scheme
 */

const LIGHT_COLORS = {
  background: '#FFFFFF',
  surface: '#F8F9FA',
  text: {
    primary: '#1A1A1A',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
  },
  divider: '#E5E7EB',
};

const DARK_COLORS = {
  background: '#0F0F1E',
  surface: '#1A1A2E',
  text: {
    primary: '#FFFFFF',
    secondary: '#B4B4B4',
    tertiary: '#888888',
  },
  divider: '#2A2A3E',
};

// Semantic colors - same for both light and dark modes
const SEMANTIC_COLORS = {
  primary: '#FF6B35',
  secondary: '#8B5CF6',
  accent: '#FBBF24',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

/**
 * Get colors based on theme mode
 * @param {boolean} isDarkMode - Whether dark mode is active
 * @returns {object} Complete color palette for the current theme
 */
export const getColors = (isDarkMode = false) => {
  const baseColors = isDarkMode ? DARK_COLORS : LIGHT_COLORS;

  return {
    ...baseColors,
    ...SEMANTIC_COLORS,
    // Helper function to get color with opacity
    withOpacity: (color, opacity) => {
      // Convert hex to rgba
      const hex = color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    },
  };
};

// Export individual color objects for direct access
export const COLORS = {
  light: LIGHT_COLORS,
  dark: DARK_COLORS,
  semantic: SEMANTIC_COLORS,
};

export default COLORS;
