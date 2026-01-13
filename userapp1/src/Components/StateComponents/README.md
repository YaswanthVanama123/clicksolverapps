# Loading & Empty State Components

A comprehensive set of production-ready UI components for handling loading, empty, and error states in the ClickSolver user application.

## Overview

This component library provides a unified design system for displaying various application states:

- **Loading States**: Full-screen loaders and skeleton placeholders
- **Empty States**: Contextual messages when no data is available
- **Error States**: Error messages with recovery options
- **Skeleton Components**: Animated loading placeholders

## Quick Start

### Installation

The required dependency has been added to `package.json`:

```bash
npm install react-native-reanimated@^3.6.0
```

### Basic Usage

```javascript
import {
  Skeleton,
  LoadingState,
  EmptyState,
  ErrorState,
  SkeletonServiceCard,
} from '@/components/StateComponents';

// Loading state
<LoadingState message="Loading services..." />

// Empty state
<EmptyState
  icon="search"
  title="No Results"
  message="Try adjusting your search"
  actionLabel="Clear Filters"
  onAction={() => clearFilters()}
/>

// Error state
<ErrorState
  error={error}
  onRetry={handleRetry}
/>

// Skeleton for service card
<SkeletonServiceCard />

// Individual skeleton
<Skeleton width={200} height={100} />
```

## Components

### 1. Skeleton (Atom)

**File**: `atoms/Skeleton.js`

Reusable shimmer loading effect component.

**Props**:
- `width` (number): Width in pixels
- `height` (number): Height in pixels
- `borderRadius` (number): Border radius value (default: 8)
- `variant` (string): 'rect' or 'circle' (default: 'rect')
- `style` (object): Additional styles

**Features**:
- Animated gradient shimmer (1500ms loop)
- Theme-aware colors
- Native driver animations (60fps)
- Multiple variants

### 2. LoadingState (Molecule)

**File**: `molecules/LoadingState.js`

Full-screen loading indicator with gradient background and Lottie animation.

**Props**:
- `message` (string): Loading message to display
- `showLogo` (boolean): Show CS logo (default: true)
- `gradientName` (string): Gradient variant name (default: 'primaryGradient')

**Available Gradients**:
- primaryGradient
- secondaryGradient
- accentGradient
- successGradient
- errorGradient
- oceanGradient
- sunsetGradient

### 3. EmptyState (Molecule)

**File**: `molecules/EmptyState.js`

Displays empty list or data state with icon, message, and optional action.

**Props**:
- `icon` (string): Ionicons icon name (default: 'search')
- `title` (string): Main heading (default: 'No Results')
- `message` (string): Description message
- `actionLabel` (string): Button label (optional)
- `onAction` (function): Button callback (optional)

### 4. ErrorState (Molecule)

**File**: `molecules/ErrorState.js`

Error display with smart error type detection and retry functionality.

**Props**:
- `error` (string|Error): Error message or Error object
- `onRetry` (function): Retry button callback (optional)
- `title` (string): Custom error title
- `icon` (string): Icon name (default: 'alert-circle')

**Auto-Detected Error Types**:
- Network error → wifi-off icon
- Timeout error → clock-alert icon
- Unauthorized → lock-alert icon
- Not found → magnify-close icon

### 5. SkeletonServiceCard (Molecule)

**File**: `molecules/SkeletonServiceCard.js`

Loading skeleton matching the actual ServiceCard component layout.

**Props**: None (self-contained)

**Features**:
- Image placeholder with shimmer
- Title, description, and price skeletons
- Badge and button placeholders
- Responsive dimensions

## Directory Structure

```
src/components/
├── atoms/
│   └── Skeleton.js
├── molecules/
│   ├── LoadingState.js
│   ├── EmptyState.js
│   ├── ErrorState.js
│   └── SkeletonServiceCard.js
└── StateComponents/
    ├── index.js (exports)
    ├── README.md (this file)
    ├── USAGE_GUIDE.md (detailed guide)
    ├── DIRECTORY.md (structure)
    ├── EXAMPLES.js (code examples)
```

## Theme Integration

All components use the app's theme system:

- **Dark Mode Support**: Automatically adapts to `useTheme()` context
- **Color Palette**: Uses theme colors from `theme/colors.js`
- **Gradients**: Uses predefined gradients from `theme/gradients.js`
- **Responsive**: Adapts to tablet (600px+) and mobile layouts

### Color Scheme

**Light Mode**:
- Background: #FFFFFF
- Surface: #F8F9FA
- Text Primary: #1A1A1A
- Dividers: #E5E7EB

**Dark Mode**:
- Background: #0F0F1E
- Surface: #1A1A2E
- Text Primary: #FFFFFF
- Dividers: #2A2A3E

**Semantic Colors**:
- Primary: #FF6B35
- Secondary: #8B5CF6
- Error: #EF4444
- Success: #10B981

## Common Use Cases

### 1. Services List

```javascript
if (loading && !data) return <LoadingState />;
if (error && !data) return <ErrorState error={error} onRetry={retry} />;
if (!data?.length) return <EmptyState title="No Services" />;
return <FlatList data={data} renderItem={renderService} />;
```

### 2. Search Results

```javascript
if (loading) return <Skeleton width="100%" height={80} />;
if (error) return <ErrorState error={error} onRetry={search} />;
if (!results.length) return <EmptyState icon="search-off" title="No Results" />;
return <ResultsList results={results} />;
```

### 3. Pull-to-Refresh

```javascript
<FlatList
  data={items}
  renderItem={renderItem}
  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
  ListHeaderComponent={refreshing && <SkeletonServiceCard />}
/>
```

### 4. Lazy Loading Sections

```javascript
return (
  <ScrollView>
    {profileLoading ? <Skeleton variant="circle" width={80} /> : <Profile />}
    {statsLoading ? <Skeleton width="100%" height={100} /> : <Stats />}
    {reviewsLoading ? <SkeletonServiceCard /> : <Reviews />}
  </ScrollView>
);
```

## Performance Considerations

1. **Native Animations**: Uses react-native-reanimated for 60fps animations
2. **Lightweight**: Minimal component overhead
3. **No Network Requests**: Pure UI components
4. **Theme Caching**: Theme context is memoized at app level
5. **Lazy Loading**: Use Lottie animations on-demand

## Customization

### Change Skeleton Color

Edit `src/theme/colors.js`:
```javascript
const LIGHT_COLORS = {
  // ...
};
```

### Change Animation Duration

Edit `src/components/atoms/Skeleton.js`:
```javascript
const animatedValue = useSharedValue(0);
animatedValue.value = withRepeat(
  withTiming(1, {
    duration: 1500, // Change this
    // ...
  })
);
```

### Add Custom Gradient

Edit `src/theme/gradients.js`:
```javascript
export const GRADIENTS = {
  customGradient: {
    colors: ['#FF6B35', '#FBBF24'],
    start: {x: 0, y: 0},
    end: {x: 1, y: 1},
  },
  // ...
};
```

## Testing

Components are theme-aware and work with both light and dark modes.

```javascript
// Test with dark mode
<ThemeProvider isDarkMode={true}>
  <EmptyState title="No Data" />
</ThemeProvider>

// Test with light mode
<ThemeProvider isDarkMode={false}>
  <EmptyState title="No Data" />
</ThemeProvider>
```

## Dependencies

- **react-native-reanimated**: ^3.6.0 (animations)
- **react-native-linear-gradient**: ^2.8.3 (gradients)
- **lottie-react-native**: ^6.7.2 (LoadingState animation)
- **react-native-vector-icons**: ^10.1.0 (icons)

## Browser/Platform Support

- ✅ React Native (iOS & Android)
- ✅ Dark mode
- ✅ Tablets (600px+)
- ✅ Multiple screen sizes

## Best Practices

1. **Use LoadingState** for initial page loading only
2. **Use SkeletonServiceCard** for list item placeholders during refresh
3. **Use individual Skeleton atoms** for specific content areas
4. **Always provide error retry** for network failures
5. **Include helpful messages** in empty states
6. **Test with slow networks** to verify skeleton loading

## Troubleshooting

### Skeleton animation not working

Ensure `react-native-reanimated` is installed:
```bash
npm install react-native-reanimated@^3.6.0
```

### LoadingState animation not showing

Check that Lottie animation file exists at:
```
src/assets/animations/loading-spinner.json
```

### Theme colors not applying

Verify `ThemeContext` is properly set up and wraps your app.

## Documentation Files

- **USAGE_GUIDE.md**: Comprehensive API and integration guide
- **DIRECTORY.md**: Component structure and organization
- **EXAMPLES.js**: Copy-paste ready code examples

## License

Part of the ClickSolver application.

## Version

- **Version**: 1.0.0
- **Created**: 2026-01-13
- **Updated**: 2026-01-13
