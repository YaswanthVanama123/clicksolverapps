# Vibrant Gradient Theme System

A comprehensive, vibrant, and gradient-heavy design system inspired by Urban Company and Dunzo, featuring bold colors, smooth animations, and eye-catching gradients.

## Overview

This theme system provides a complete set of design tokens and utilities for building consistent, visually striking React Native applications.

## Features

- Vibrant color palette with dark mode support
- Bold gradient system with pre-defined gradient combinations
- Poppins font family typography scale
- Consistent spacing (8-point grid system)
- Elevation-based shadow system
- Comprehensive animation configurations
- TypeScript-ready (can be converted)

## Installation

The theme system is already set up in `/src/theme/`. Make sure you have the required dependencies:

```bash
npm install react-native-linear-gradient
# or
yarn add react-native-linear-gradient
```

For iOS, link the native module:
```bash
cd ios && pod install && cd ..
```

## Usage

### 1. Wrap your app with ThemeProvider

```javascript
import {ThemeProvider} from './src/theme';

const App = () => {
  return (
    <ThemeProvider>
      <YourApp />
    </ThemeProvider>
  );
};
```

### 2. Use the theme in components

```javascript
import {useTheme} from './src/theme';

const MyComponent = () => {
  const {theme, isDarkMode, toggleTheme} = useTheme();

  return (
    <View style={{backgroundColor: theme.colors.background}}>
      <Text style={[theme.textStyles.h1Bold, {color: theme.colors.text.primary}]}>
        Hello World
      </Text>
    </View>
  );
};
```

### 3. Using Gradients

```javascript
import {GradientBackground} from './src/theme';

const MyCard = () => {
  return (
    <GradientBackground
      gradientName="primaryGradient"
      style={{
        padding: 16,
        borderRadius: 12,
      }}>
      <Text style={{color: '#fff'}}>Vibrant Card</Text>
    </GradientBackground>
  );
};
```

## Theme Structure

### Colors

```javascript
// Access colors
const {theme} = useTheme();

// Background colors
theme.colors.background
theme.colors.surface

// Text colors
theme.colors.text.primary
theme.colors.text.secondary
theme.colors.text.tertiary

// Semantic colors
theme.colors.primary    // #FF6B35
theme.colors.secondary  // #8B5CF6
theme.colors.accent     // #FBBF24
theme.colors.success    // #10B981
theme.colors.warning    // #F59E0B
theme.colors.error      // #EF4444
theme.colors.info       // #3B82F6

// Divider
theme.colors.divider
```

### Gradients

Available gradients:
- `primaryGradient` - Orange to deep orange
- `secondaryGradient` - Purple to pink
- `accentGradient` - Yellow to amber
- `successGradient` - Green to light green
- `errorGradient` - Red to dark red
- `warningGradient` - Amber to yellow
- `infoGradient` - Blue to light blue
- `darkGradient` - Indigo to purple
- `sunsetGradient` - Multi-color sunset
- `oceanGradient` - Blue to purple
- `forestGradient` - Green gradient
- `purpleHazeGradient` - Purple to pink

```javascript
// Use gradient background component
<GradientBackground gradientName="primaryGradient">
  {/* Your content */}
</GradientBackground>

// Or get gradient colors directly
const gradient = theme.getGradientColors('primaryGradient');
```

### Typography

```javascript
// Font sizes
theme.fontSizes.h1      // 32
theme.fontSizes.h2      // 28
theme.fontSizes.h3      // 24
theme.fontSizes.h4      // 20
theme.fontSizes.h5      // 18
theme.fontSizes.body1   // 16
theme.fontSizes.body2   // 14
theme.fontSizes.caption // 12
theme.fontSizes.small   // 10

// Pre-defined text styles
theme.textStyles.h1Bold
theme.textStyles.h2Semibold
theme.textStyles.body1Regular
theme.textStyles.captionMedium

// Or create custom styles
const customStyle = theme.getTextStyle('h3', 'bold');
```

### Spacing

```javascript
// Base spacing values
theme.spacing.xs    // 4
theme.spacing.sm    // 8
theme.spacing.md    // 12
theme.spacing.base  // 16
theme.spacing.lg    // 20
theme.spacing.xl    // 24
theme.spacing.xxl   // 32
theme.spacing.xxxl  // 48

// Padding utilities
theme.padding.horizontal.base  // {paddingHorizontal: 16}
theme.padding.vertical.lg      // {paddingVertical: 20}
theme.padding.all.md           // {padding: 12}

// Margin utilities
theme.margin.horizontal.base   // {marginHorizontal: 16}
theme.margin.top.lg            // {marginTop: 20}
theme.margin.bottom.xl         // {marginBottom: 24}

// Border radius
theme.borderRadius.sm   // 8
theme.borderRadius.md   // 12
theme.borderRadius.lg   // 20
theme.borderRadius.full // 9999
```

### Shadows

```javascript
// Shadow by size
theme.shadows.sm   // Subtle shadow
theme.shadows.md   // Medium shadow
theme.shadows.lg   // Large shadow
theme.shadows.xl   // Extra large shadow

// Card shadows
theme.cardShadows.flat
theme.cardShadows.elevated
theme.cardShadows.floating
theme.cardShadows.modal

// Button shadows
theme.buttonShadows.default
theme.buttonShadows.pressed
theme.buttonShadows.floating

// Gradient shadows (colored)
theme.gradientShadows.primary
theme.gradientShadows.secondary
theme.gradientShadows.accent

// Apply shadows
<View style={[styles.card, theme.shadows.md]}>
  {/* Content */}
</View>
```

### Animations

```javascript
// Timing constants
theme.timing.fast     // 150ms
theme.timing.normal   // 300ms
theme.timing.slow     // 500ms

// Animation configs
theme.animations.spring
theme.animations.timing
theme.animations.fast
theme.animations.slow
theme.animations.bouncySpring

// Use with Animated API
Animated.timing(animatedValue, {
  toValue: 1,
  ...theme.animations.timing,
  useNativeDriver: true,
}).start();

// Easing functions
theme.easing.easeInOut
theme.easing.bounce
theme.easing.elastic
```

## Examples

### Vibrant Button with Gradient

```javascript
import {GradientBackground} from './src/theme';

const VibrantButton = ({onPress, title}) => {
  const {theme} = useTheme();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <GradientBackground
        gradientName="primaryGradient"
        style={[
          {
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.xl,
            borderRadius: theme.borderRadius.md,
          },
          theme.gradientShadows.primary,
        ]}>
        <Text style={[theme.textStyles.body1Bold, {color: '#FFFFFF'}]}>
          {title}
        </Text>
      </GradientBackground>
    </TouchableOpacity>
  );
};
```

### Card with Theme

```javascript
const ThemedCard = ({children}) => {
  const {theme} = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.md,
          padding: theme.spacing.base,
        },
        theme.cardShadows.elevated,
      ]}>
      {children}
    </View>
  );
};
```

### Animated Component

```javascript
const AnimatedComponent = () => {
  const {theme} = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      ...theme.animations.timing,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{opacity: fadeAnim}}>
      {/* Content */}
    </Animated.View>
  );
};
```

## Theme Modes

### Toggle Theme
```javascript
const {toggleTheme} = useTheme();

// Toggle between light and dark mode
<Button title="Toggle Theme" onPress={toggleTheme} />
```

### Use System Theme
```javascript
const {useSystemTheme, themeMode} = useTheme();

// Revert to system theme
<Button
  title="Use System Theme"
  onPress={useSystemTheme}
  disabled={themeMode === 'system'}
/>
```

## Font Setup

The theme uses Poppins font family. Make sure to:

1. Download Poppins fonts from Google Fonts
2. Add font files to your project:
   - iOS: Add to `ios/[ProjectName]/Fonts/` and update Info.plist
   - Android: Add to `android/app/src/main/assets/fonts/`

3. Link fonts using react-native-asset or manually

Required Poppins weights:
- Poppins-Light (300)
- Poppins-Regular (400)
- Poppins-Medium (500)
- Poppins-SemiBold (600)
- Poppins-Bold (700)

## Migration from Old Theme

If you have an existing ThemeContext in `/src/context/ThemeContext.js`, you can:

1. Replace it with the new theme system
2. Update imports throughout your app:
   ```javascript
   // Old
   import {useTheme} from './context/ThemeContext';

   // New
   import {useTheme} from './theme';
   ```

3. Update theme usage to access the full theme object:
   ```javascript
   // Old
   const {isDarkMode} = useTheme();

   // New
   const {theme, isDarkMode} = useTheme();
   ```

## Best Practices

1. Always use theme values instead of hardcoded colors/spacing
2. Prefer gradient backgrounds for primary actions and hero sections
3. Use semantic colors (success, error, warning) consistently
4. Apply appropriate shadows to create depth hierarchy
5. Use pre-defined text styles for consistency
6. Leverage animation configs for smooth transitions
7. Test both light and dark modes

## Support

For issues or questions about the theme system, refer to the individual theme files:
- `/src/theme/colors.js` - Color palette
- `/src/theme/gradients.js` - Gradient definitions
- `/src/theme/typography.js` - Typography scale
- `/src/theme/spacing.js` - Spacing system
- `/src/theme/shadows.js` - Shadow elevations
- `/src/theme/animations.js` - Animation configs
- `/src/theme/index.js` - Main theme provider

---

Built with vibrant energy for a dynamic user experience.
