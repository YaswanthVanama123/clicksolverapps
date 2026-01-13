/**
 * LOADING & EMPTY STATE COMPONENTS
 * Directory Structure & Component Overview
 */

/**
 * File Structure:
 * ===============
 *
 * src/components/
 * ├── atoms/
 * │   └── Skeleton.js                    // Shimmer loading effect
 * │
 * ├── molecules/
 * │   ├── LoadingState.js                // Full-screen loading indicator
 * │   ├── EmptyState.js                  // Empty list/data state
 * │   ├── ErrorState.js                  // Error display with retry
 * │   └── SkeletonServiceCard.js         // Service card loading skeleton
 * │
 * └── StateComponents/
 *     ├── index.js                       // Central export file
 *     ├── USAGE_GUIDE.md                 // Comprehensive usage documentation
 *     └── DIRECTORY.md                   // This file
 */

/**
 * COMPONENT OVERVIEW
 * ==================
 */

/**
 * 1. Skeleton (Atom)
 * File: /atoms/Skeleton.js
 * Purpose: Reusable shimmer loading placeholder
 * Features:
 *   - Animated gradient shimmer effect
 *   - Theme-aware (dark/light mode)
 *   - Supports multiple variants (rect, circle)
 *   - Custom border radius and dimensions
 *   - Uses react-native-reanimated for smooth 60fps animations
 *
 * Example:
 *   <Skeleton width={200} height={100} borderRadius={8} />
 *   <Skeleton width={60} height={60} variant="circle" />
 */

/**
 * 2. LoadingState (Molecule)
 * File: /molecules/LoadingState.js
 * Purpose: Full-screen loading indicator with gradient background
 * Features:
 *   - Lottie animation support
 *   - Vibrant gradient backgrounds
 *   - Centered logo (CS badge)
 *   - Customizable loading message
 *   - Responsive tablet support
 *
 * Example:
 *   <LoadingState
 *     message="Loading services..."
 *     showLogo={true}
 *     gradientName="primaryGradient"
 *   />
 */

/**
 * 3. EmptyState (Molecule)
 * File: /molecules/EmptyState.js
 * Purpose: Display empty list/data state
 * Features:
 *   - Icon and message display
 *   - Optional action button
 *   - Theme-aware styling
 *   - Bordered icon container
 *   - Responsive typography
 *
 * Example:
 *   <EmptyState
 *     icon="search"
 *     title="No Services"
 *     message="Try adjusting your filters"
 *     actionLabel="Clear Filters"
 *     onAction={() => clearFilters()}
 *   />
 */

/**
 * 4. ErrorState (Molecule)
 * File: /molecules/ErrorState.js
 * Purpose: Display error messages with retry functionality
 * Features:
 *   - Smart error type detection
 *   - Scrollable error messages
 *   - Retry button with icon
 *   - Helper text and suggestions
 *   - Themed error styling
 *   - Supports Error objects and strings
 *
 * Example:
 *   <ErrorState
 *     error={error}
 *     onRetry={() => fetchData()}
 *     title="Network Error"
 *   />
 */

/**
 * 5. SkeletonServiceCard (Molecule)
 * File: /molecules/SkeletonServiceCard.js
 * Purpose: Loading skeleton matching ServiceCard layout
 * Features:
 *   - Matches actual ServiceCard dimensions
 *   - Image, title, badge, description placeholders
 *   - Price and button skeleton rows
 *   - Card styling with shadows
 *   - Theme-aware colors
 *
 * Example:
 *   {isLoading && (
 *     <FlatList
 *       data={[1, 2, 3]}
 *       renderItem={() => <SkeletonServiceCard />}
 *     />
 *   )}
 */

/**
 * EXPORT FILE
 * ===========
 * File: /StateComponents/index.js
 *
 * Provides centralized exports for all state components:
 *
 * import {
 *   Skeleton,
 *   LoadingState,
 *   EmptyState,
 *   ErrorState,
 *   SkeletonServiceCard,
 * } from '@/components/StateComponents';
 */

/**
 * THEME INTEGRATION
 * =================
 *
 * All components are theme-aware and use:
 * - useTheme() hook for dark mode detection
 * - getColors() function for color palette
 * - GRADIENTS object for gradient styles
 *
 * Color Scheme:
 * Light Mode:
 *   - Background: #FFFFFF
 *   - Surface: #F8F9FA
 *   - Text Primary: #1A1A1A
 *   - Text Secondary: #6B7280
 *
 * Dark Mode:
 *   - Background: #0F0F1E
 *   - Surface: #1A1A2E
 *   - Text Primary: #FFFFFF
 *   - Text Secondary: #B4B4B4
 *
 * Accent Colors:
 *   - Primary: #FF6B35 (Orange)
 *   - Secondary: #8B5CF6 (Purple)
 *   - Error: #EF4444 (Red)
 *   - Success: #10B981 (Green)
 */

/**
 * DEPENDENCIES
 * =============
 *
 * New dependency added to package.json:
 * - react-native-reanimated: ^3.6.0
 *   (For high-performance animations)
 *
 * Existing dependencies used:
 * - react-native-linear-gradient (for shimmer and gradients)
 * - lottie-react-native (for LoadingState animation)
 * - react-native-vector-icons (for icons)
 * - Context API (for theme management)
 */

/**
 * USAGE PATTERNS
 * ==============
 *
 * Pattern 1: Initial Page Loading
 * --------------------------------
 * if (loading && !data) {
 *   return <LoadingState message="Loading..." />;
 * }
 *
 * Pattern 2: Error Handling
 * --------------------------
 * if (error && !data) {
 *   return <ErrorState error={error} onRetry={retry} />;
 * }
 *
 * Pattern 3: Empty State
 * ----------------------
 * if (!loading && (!data || data.length === 0)) {
 *   return <EmptyState icon="search" title="No Results" />;
 * }
 *
 * Pattern 4: Refresh Loading
 * ---------------------------
 * <FlatList
 *   data={data}
 *   renderItem={({item}) => <Card item={item} />}
 *   ListHeaderComponent={refreshing && <SkeletonServiceCard />}
 * />
 *
 * Pattern 5: Inline Skeleton
 * ---------------------------
 * <View>
 *   {loading && <Skeleton width="100%" height={100} />}
 *   {!loading && <Content />}
 * </View>
 */

/**
 * RESPONSIVE DESIGN
 * =================
 *
 * All components use dynamicStyles function that:
 * - Detects tablet layout (width >= 600)
 * - Adjusts font sizes and spacing accordingly
 * - Maintains visual hierarchy across screen sizes
 * - Uses useWindowDimensions for responsive sizing
 *
 * Breakpoints:
 * - Mobile: width < 600px
 * - Tablet: width >= 600px
 */

/**
 * ANIMATION SPECS
 * ===============
 *
 * Skeleton Shimmer:
 * - Duration: 1500ms
 * - Easing: inOut(ease)
 * - Opacity range: 0.4 to 1
 * - Loop: infinite with reverse
 * - Driver: Native (60fps)
 *
 * No additional animations needed for other components,
 * but Lottie can be added to LoadingState for custom animations.
 */

/**
 * PERFORMANCE NOTES
 * =================
 *
 * Optimizations:
 * 1. Skeleton uses react-native-reanimated for native driver animations
 * 2. Components are lightweight and re-render only on prop changes
 * 3. No unnecessary state management
 * 4. Theme context is memoized at app level
 * 5. LinearGradient components are native code based
 *
 * Best Practices:
 * - Memoize components if rendering in lists
 * - Use ScrollView or FlatList for large skeleton lists
 * - Preload Lottie animations before displaying LoadingState
 * - Cache theme colors to avoid recalculation
 */

/**
 * CUSTOMIZATION GUIDE
 * ====================
 *
 * To customize colors, modify:
 * - src/theme/colors.js (color palette)
 * - src/theme/gradients.js (gradient definitions)
 *
 * To customize animations:
 * - Modify duration in Skeleton.js (currently 1500ms)
 * - Add/change Lottie animation in LoadingState.js
 *
 * To add new states:
 * - Create new component in molecules/
 * - Follow same naming and structure pattern
 * - Export from StateComponents/index.js
 * - Update USAGE_GUIDE.md
 */

export default {
  title: 'Loading & Empty State Components Directory',
  version: '1.0.0',
  created: '2026-01-13',
  location: 'src/components/',
  components: {
    atoms: ['Skeleton'],
    molecules: ['LoadingState', 'EmptyState', 'ErrorState', 'SkeletonServiceCard'],
  },
};
