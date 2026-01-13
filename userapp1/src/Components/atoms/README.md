# Atomic Components Library

A collection of reusable, theme-aware atomic UI components for the React Native application. These components follow the Atomic Design methodology and are designed to be the building blocks for more complex UI elements.

## Components Overview

### 1. GradientButton
A versatile button component with gradient backgrounds and multiple variants.

**Props:**
- `variant` (string): Button style variant - 'primary', 'secondary', 'icon', 'outline' (default: 'primary')
- `onPress` (function): Press handler (required)
- `title` (string): Button text
- `icon` (string): Icon name from MaterialCommunityIcons
- `loading` (boolean): Show loading spinner (default: false)
- `disabled` (boolean): Disable button interaction (default: false)
- `size` (string): Button size - 'small', 'medium', 'large' (default: 'medium')
- `isDarkMode` (boolean): Dark mode flag (default: false)
- `style` (object): Additional styles
- `textStyle` (object): Additional text styles

**Usage:**
```javascript
import { GradientButton } from '@/components/atoms';

<GradientButton
  variant="primary"
  title="Click Me"
  onPress={() => console.log('Pressed')}
  icon="check"
  loading={false}
  size="medium"
/>

// Icon button
<GradientButton
  variant="icon"
  icon="plus"
  onPress={() => console.log('Add')}
/>

// Outline button
<GradientButton
  variant="outline"
  title="Cancel"
  onPress={() => console.log('Cancel')}
/>
```

---

### 2. Input
A styled text input with floating labels, icons, and error states.

**Props:**
- `value` (string): Input value (required)
- `onChangeText` (function): Change handler (required)
- `placeholder` (string): Placeholder text
- `error` (string): Error message
- `leftIcon` (string): Left icon name
- `rightIcon` (string): Right icon name
- `onRightIconPress` (function): Right icon press handler
- `isDarkMode` (boolean): Dark mode flag (default: false)
- `secureTextEntry` (boolean): Hide text for passwords (default: false)
- `editable` (boolean): Enable/disable input (default: true)
- `keyboardType` (string): Keyboard type (default: 'default')
- `multiline` (boolean): Enable multiline (default: false)
- `numberOfLines` (number): Number of lines for multiline (default: 1)
- `style` (object): Container style
- `inputStyle` (object): Input style

**Usage:**
```javascript
import { Input } from '@/components/atoms';

<Input
  value={email}
  onChangeText={setEmail}
  placeholder="Enter email"
  leftIcon="email"
  keyboardType="email-address"
/>

// With error
<Input
  value={password}
  onChangeText={setPassword}
  placeholder="Password"
  leftIcon="lock"
  rightIcon="eye"
  onRightIconPress={() => setShowPassword(!showPassword)}
  secureTextEntry={!showPassword}
  error="Password must be at least 8 characters"
/>

// Multiline
<Input
  value={description}
  onChangeText={setDescription}
  placeholder="Description"
  multiline
  numberOfLines={4}
/>
```

---

### 3. Text
A themed text component with predefined typography variants.

**Props:**
- `variant` (string): Typography variant - 'h1', 'h2', 'h3', 'h4', 'h5', 'body1', 'body2', 'caption' (default: 'body1')
- `weight` (string): Font weight - 'light', 'regular', 'medium', 'semibold', 'bold' (default: 'regular')
- `color` (string): Custom text color (overrides theme)
- `isDarkMode` (boolean): Dark mode flag (default: false)
- `center` (boolean): Center align text (default: false)
- `numberOfLines` (number): Limit number of lines
- `style` (object): Additional styles
- `children` (node): Text content (required)

**Usage:**
```javascript
import { Text } from '@/components/atoms';

<Text variant="h1" weight="bold">
  Heading Text
</Text>

<Text variant="body1" color="#FF6B35">
  Body text with custom color
</Text>

<Text variant="caption" center numberOfLines={2}>
  Caption text centered with max 2 lines
</Text>
```

---

### 4. Icon
A versatile icon wrapper with support for gradients and multiple icon libraries.

**Props:**
- `name` (string): Icon name (required)
- `library` (string): Icon library - 'MaterialCommunityIcons', 'MaterialIcons', 'FontAwesome', 'FontAwesome5', 'Ionicons', 'Feather', 'AntDesign' (default: 'MaterialCommunityIcons')
- `size` (number): Icon size (default: 24)
- `color` (string): Icon color
- `gradient` (string): Gradient name for gradient icon
- `isDarkMode` (boolean): Dark mode flag (default: false)
- `style` (object): Additional styles

**Usage:**
```javascript
import { Icon } from '@/components/atoms';

<Icon
  name="check"
  size={24}
  color="#FF6B35"
/>

// With gradient
<Icon
  name="heart"
  size={32}
  gradient="primaryGradient"
/>

// Different library
<Icon
  name="home"
  library="Ionicons"
  size={28}
/>
```

---

### 5. Badge
A colored badge component for status indicators.

**Props:**
- `variant` (string): Badge color variant - 'success', 'warning', 'error', 'info', 'primary' (default: 'primary')
- `size` (string): Badge size - 'small', 'medium', 'large' (default: 'medium')
- `isDarkMode` (boolean): Dark mode flag (default: false)
- `style` (object): Additional container styles
- `textStyle` (object): Additional text styles
- `children` (node): Badge content (required)

**Usage:**
```javascript
import { Badge } from '@/components/atoms';

<Badge variant="success" size="medium">
  Active
</Badge>

<Badge variant="error" size="small">
  Failed
</Badge>

<Badge variant="warning">
  Pending
</Badge>
```

---

### 6. Chip
A selectable chip component with gradient active state.

**Props:**
- `label` (string): Chip label text (required)
- `selected` (boolean): Selected state (default: false)
- `onPress` (function): Press handler
- `icon` (string): Icon name from MaterialCommunityIcons
- `isDarkMode` (boolean): Dark mode flag (default: false)
- `size` (string): Chip size - 'small', 'medium', 'large' (default: 'medium')
- `style` (object): Additional container styles
- `textStyle` (object): Additional text styles

**Usage:**
```javascript
import { Chip } from '@/components/atoms';

<Chip
  label="Category"
  selected={true}
  onPress={() => console.log('Selected')}
  icon="tag"
/>

<Chip
  label="Filter"
  selected={false}
  onPress={() => console.log('Filter')}
  size="small"
/>
```

---

### 7. Divider
A simple horizontal or vertical divider line.

**Props:**
- `color` (string): Custom divider color
- `thickness` (number): Divider thickness (default: 1)
- `margin` (number): Margin around divider (default: 0)
- `orientation` (string): Divider orientation - 'horizontal', 'vertical' (default: 'horizontal')
- `isDarkMode` (boolean): Dark mode flag (default: false)
- `style` (object): Additional styles

**Usage:**
```javascript
import { Divider } from '@/components/atoms';

<Divider margin={16} />

<Divider
  color="#FF6B35"
  thickness={2}
  margin={20}
/>

<Divider
  orientation="vertical"
  thickness={1}
/>
```

---

### 8. Avatar
A circular avatar displaying either an image or user initials with gradient background.

**Props:**
- `source` (object): Image source object {uri: string}
- `name` (string): User name for initials fallback
- `size` (string): Avatar size - 'small', 'medium', 'large', 'xlarge' (default: 'medium')
- `gradient` (string): Gradient for initials background (default: 'primaryGradient')
- `isDarkMode` (boolean): Dark mode flag (default: false)
- `style` (object): Additional container styles
- `imageStyle` (object): Additional image styles
- `textStyle` (object): Additional text styles

**Usage:**
```javascript
import { Avatar } from '@/components/atoms';

// With image
<Avatar
  source={{uri: 'https://example.com/avatar.jpg'}}
  name="John Doe"
  size="medium"
/>

// With initials
<Avatar
  name="Jane Smith"
  size="large"
  gradient="secondaryGradient"
/>

// Small avatar
<Avatar
  name="AB"
  size="small"
/>
```

---

### 9. Skeleton
A shimmer loading animation component for content placeholders (already exists).

**Props:**
- `width` (number): Width of the skeleton (default: 100)
- `height` (number): Height of the skeleton (default: 20)
- `borderRadius` (number): Border radius (default: 8)
- `variant` (string): Shape variant - 'rect', 'circle' (default: 'rect')
- `style` (object): Additional styles

**Usage:**
```javascript
import { Skeleton } from '@/components/atoms';

<Skeleton width={200} height={20} borderRadius={8} />

<Skeleton variant="circle" width={48} height={48} />
```

---

## Features

All atomic components include:

- **Theme Integration**: Automatically use colors, typography, and gradients from the theme system
- **Dark Mode Support**: Respond to dark mode changes with appropriate styling
- **TypeScript-style JSDoc**: Comprehensive documentation in code
- **Default Props**: Sensible defaults for all optional props
- **React.memo**: Performance optimization through memoization
- **Gradient Support**: Native gradient styling where appropriate
- **Accessibility**: Proper prop spreading for accessibility features

## Theme System Integration

Components use the following theme modules:
- `/src/theme/colors.js` - Color palette for light and dark modes
- `/src/theme/gradients.js` - Gradient definitions
- `/src/theme/typography.js` - Typography system with Poppins font
- `/src/theme/spacing.js` - Spacing utilities

## Dependencies

The atomic components require the following packages:
- `react-native-linear-gradient` - For gradient backgrounds
- `react-native-vector-icons` - For icon support
- `react-native-paper` - UI component library
- `@react-native-masked-view/masked-view` - For gradient icons
- `react-native-reanimated` - For animations (Skeleton component)

## Installation

All dependencies have been added to package.json:
```json
{
  "dependencies": {
    "react-native-linear-gradient": "^2.8.3",
    "react-native-vector-icons": "^10.1.0",
    "react-native-paper": "^5.12.0",
    "@react-native-masked-view/masked-view": "^0.3.0",
    "react-native-reanimated": "^3.6.0"
  }
}
```

Run `npm install` or `yarn install` to install new dependencies.

## Import All Components

```javascript
import {
  GradientButton,
  Input,
  Text,
  Icon,
  Badge,
  Chip,
  Divider,
  Avatar,
  Skeleton,
} from '@/components/atoms';
```

## Best Practices

1. **Use theme colors**: Pass `isDarkMode` prop or use theme colors instead of hardcoded colors
2. **Consistent sizing**: Use predefined size props ('small', 'medium', 'large') for consistency
3. **Accessibility**: Always provide meaningful labels and test with screen readers
4. **Performance**: Components are memoized, but avoid unnecessary re-renders by using useCallback for handlers
5. **Gradients**: Use gradients from the theme system for brand consistency

## Examples

See the individual component sections above for detailed usage examples.
