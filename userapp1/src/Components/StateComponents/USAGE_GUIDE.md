/**
 * LOADING & EMPTY STATE COMPONENTS GUIDE
 *
 * This document provides usage examples and guidelines for the new state components
 */

/**
 * 1. SKELETON COMPONENT
 * =====================
 * Shimmer loading effect for placeholder content
 *
 * Usage:
 * ------
 * import { Skeleton } from '@/components/StateComponents';
 *
 * // Basic rectangular skeleton
 * <Skeleton width={200} height={100} />
 *
 * // Circular skeleton (avatar)
 * <Skeleton width={60} height={60} variant="circle" />
 *
 * // With custom border radius
 * <Skeleton width={300} height={150} borderRadius={12} />
 *
 * Props:
 * ------
 * - width (number): Width of skeleton in pixels
 * - height (number): Height of skeleton in pixels
 * - borderRadius (number): Border radius value (default: 8)
 * - variant (string): 'rect' or 'circle' (default: 'rect')
 * - style (StyleSheet): Additional React Native styles
 *
 * Features:
 * - Theme-aware (respects dark mode)
 * - Animated shimmer gradient effect
 * - Smooth opacity animation using react-native-reanimated
 * - Lightweight and performant
 */

/**
 * 2. LOADING STATE COMPONENT
 * ===========================
 * Full-screen loading indicator with gradient background
 *
 * Usage:
 * ------
 * import { LoadingState } from '@/components/StateComponents';
 *
 * // Basic usage
 * {isLoading && <LoadingState message="Loading services..." />}
 *
 * // With custom gradient and logo
 * <LoadingState
 *   message="Fetching your bookings..."
 *   showLogo={true}
 *   gradientName="primaryGradient"
 * />
 *
 * // Without logo
 * <LoadingState message="Loading..." showLogo={false} />
 *
 * Props:
 * ------
 * - message (string): Loading text to display
 * - showLogo (boolean): Show "CS" logo (default: true)
 * - gradientName (string): Gradient variant (default: 'primaryGradient')
 *
 * Available Gradients:
 * - primaryGradient (orange gradient)
 * - secondaryGradient (purple-pink)
 * - accentGradient (yellow gradient)
 * - successGradient (green gradient)
 * - errorGradient (red gradient)
 * - oceanGradient (blue-purple)
 * - sunsetGradient (multi-color)
 *
 * Features:
 * - Lottie animation support
 * - Gradient background matching theme
 * - Centered layout
 * - Responsive design for tablets
 * - Smooth animations
 *
 * Note:
 * Requires Lottie animation file at:
 * src/assets/animations/loading-spinner.json
 */

/**
 * 3. EMPTY STATE COMPONENT
 * =========================
 * Displays empty list/data state
 *
 * Usage:
 * ------
 * import { EmptyState } from '@/components/StateComponents';
 *
 * // Search results empty state
 * <EmptyState
 *   icon="search"
 *   title="No Services Found"
 *   message="Try adjusting your search or filters"
 *   actionLabel="Clear Filters"
 *   onAction={() => clearFilters()}
 * />
 *
 * // Empty bookings
 * {bookings.length === 0 && (
 *   <EmptyState
 *     icon="folder-open"
 *     title="No Bookings Yet"
 *     message="You haven't made any service bookings yet"
 *     actionLabel="Browse Services"
 *     onAction={() => navigation.navigate('Services')}
 *   />
 * )}
 *
 * // Without action button
 * <EmptyState
 *   icon="heart"
 *   title="No Favorites"
 *   message="You haven't added any favorites yet"
 * />
 *
 * Props:
 * ------
 * - icon (string): Ionicons icon name (default: 'search')
 * - title (string): Main heading (default: 'No Results')
 * - message (string): Description text
 * - actionLabel (string): Button label (optional)
 * - onAction (function): Button press callback (optional)
 * - gradientName (string): Gradient variant (optional)
 *
 * Features:
 * - Theme-aware styling
 * - Bordered icon container
 * - Optional action button
 * - Responsive typography and spacing
 * - Vibrant color scheme
 *
 * Common Ionicons:
 * - search, folder-open, heart, star, clock, map, filter, etc.
 */

/**
 * 4. ERROR STATE COMPONENT
 * =========================
 * Error display with retry functionality
 *
 * Usage:
 * ------
 * import { ErrorState } from '@/components/StateComponents';
 *
 * // Basic error
 * {error && (
 *   <ErrorState
 *     error={error}
 *     onRetry={() => fetchData()}
 *     title="Something Went Wrong"
 *   />
 * )}
 *
 * // With Error object
 * try {
 *   await fetchServices();
 * } catch (err) {
 *   <ErrorState error={err} onRetry={handleRetry} />
 * }
 *
 * // Network error (auto-detected)
 * <ErrorState
 *   error="Network request failed"
 *   onRetry={retry}
 * />
 *
 * // Timeout error
 * <ErrorState
 *   error="Request timeout after 30s"
 *   onRetry={retry}
 * />
 *
 * Props:
 * ------
 * - error (string|Error): Error message or Error object
 * - onRetry (function): Retry button callback (optional)
 * - title (string): Custom error title
 * - icon (string): Icon name (default: 'alert-circle')
 *
 * Auto-Detected Error Types:
 * - Network error → shows wifi-off icon
 * - Timeout error → shows clock-alert icon
 * - Unauthorized → shows lock-alert icon
 * - Not found → shows magnify-close icon
 *
 * Features:
 * - Smart error type detection
 * - Scrollable error message
 * - Styled error box
 * - Retry button with icon
 * - Helper text with suggestions
 * - Theme-aware colors
 */

/**
 * 5. SKELETON SERVICE CARD
 * =========================
 * Loading skeleton matching ServiceCard dimensions
 *
 * Usage:
 * ------
 * import { SkeletonServiceCard } from '@/components/StateComponents';
 *
 * // Display while loading
 * {isLoading ? (
 *   <FlatList
 *     data={[1, 2, 3]}
 *     renderItem={() => <SkeletonServiceCard />}
 *   />
 * ) : (
 *   <ServicesList data={services} />
 * )}
 *
 * // Multiple skeletons in a scroll view
 * <ScrollView>
 *   {[1, 2, 3, 4].map((i) => <SkeletonServiceCard key={i} />)}
 * </ScrollView>
 *
 * Props:
 * ------
 * None - Component is self-contained and responsive
 *
 * Features:
 * - Matches actual ServiceCard layout
 * - Image placeholder with shimmer
 * - Title, description, and price skeletons
 * - Badge and button placeholders
 * - Responsive dimensions
 * - Card styling with shadows
 * - Theme-aware colors
 */

/**
 * INTEGRATION EXAMPLES
 * ====================
 */

/**
 * Example 1: Services List with Loading States
 *
 * import {
 *   LoadingState,
 *   EmptyState,
 *   ErrorState,
 *   SkeletonServiceCard
 * } from '@/components/StateComponents';
 *
 * export const ServicesList = () => {
 *   const [services, setServices] = useState([]);
 *   const [loading, setLoading] = useState(true);
 *   const [error, setError] = useState(null);
 *
 *   useEffect(() => {
 *     fetchServices();
 *   }, []);
 *
 *   const fetchServices = async () => {
 *     try {
 *       setLoading(true);
 *       const response = await API.getServices();
 *       setServices(response.data);
 *       setError(null);
 *     } catch (err) {
 *       setError(err);
 *     } finally {
 *       setLoading(false);
 *     }
 *   };
 *
 *   // Loading state - show full screen
 *   if (loading && services.length === 0) {
 *     return <LoadingState message="Loading services..." />;
 *   }
 *
 *   // Error state
 *   if (error && services.length === 0) {
 *     return <ErrorState error={error} onRetry={fetchServices} />;
 *   }
 *
 *   // Empty state
 *   if (services.length === 0) {
 *     return (
 *       <EmptyState
 *         icon="search"
 *         title="No Services Available"
 *         message="Check back soon for more services"
 *       />
 *     );
 *   }
 *
 *   // Success - show list with refresh loading
 *   return (
 *     <FlatList
 *       data={services}
 *       renderItem={({item}) => <ServiceCard service={item} />}
 *       ListHeaderComponent={loading && (
 *         <FlatList
 *           scrollEnabled={false}
 *           data={[1, 2]}
 *           renderItem={() => <SkeletonServiceCard />}
 *         />
 *       )}
 *     />
 *   );
 * };
 */

/**
 * Example 2: Search Results with Multiple States
 *
 * import { EmptyState, ErrorState, Skeleton } from '@/components/StateComponents';
 *
 * export const SearchResults = ({ query }) => {
 *   const [results, setResults] = useState([]);
 *   const [loading, setLoading] = useState(false);
 *   const [error, setError] = useState(null);
 *
 *   useEffect(() => {
 *     if (query.length > 2) {
 *       searchServices();
 *     }
 *   }, [query]);
 *
 *   const searchServices = async () => {
 *     try {
 *       setLoading(true);
 *       const response = await API.search(query);
 *       setResults(response.data);
 *       setError(null);
 *     } catch (err) {
 *       setError(err);
 *     } finally {
 *       setLoading(false);
 *     }
 *   };
 *
 *   if (loading) {
 *     return (
 *       <View>
 *         {[1, 2, 3].map((i) => (
 *           <Skeleton key={i} width="100%" height={80} />
 *         ))}
 *       </View>
 *     );
 *   }
 *
 *   if (error) {
 *     return <ErrorState error={error} onRetry={searchServices} />;
 *   }
 *
 *   if (results.length === 0) {
 *     return (
 *       <EmptyState
 *         icon="search-off"
 *         title="No Results for '{query}'"
 *         message="Try different keywords or filters"
 *         actionLabel="Clear Search"
 *         onAction={() => setQuery('')}
 *       />
 *     );
 *   }
 *
 *   return <ServicesList services={results} />;
 * };
 */

/**
 * BEST PRACTICES
 * ==============
 *
 * 1. Loading States:
 *    - Use LoadingState for initial data loading
 *    - Use SkeletonServiceCard for list items during refresh
 *    - Use individual Skeleton atoms for specific content areas
 *
 * 2. Empty States:
 *    - Provide clear, actionable messages
 *    - Include action button when possible
 *    - Use appropriate icons that relate to the context
 *
 * 3. Error States:
 *    - Always provide a retry option for recoverable errors
 *    - Show specific error messages when available
 *    - Guide users on what to do next
 *
 * 4. Performance:
 *    - Use react-native-reanimated animations (60fps)
 *    - Preload Lottie animations for LoadingState
 *    - Cache Skeleton layouts when possible
 *
 * 5. UX Considerations:
 *    - Keep loading messages brief and friendly
 *    - Use consistent visual language
 *    - Test with different network speeds
 *    - Provide feedback on long operations
 */

export default {
  title: 'Loading & Empty State Components Guide',
  version: '1.0.0',
  components: [
    'Skeleton',
    'LoadingState',
    'EmptyState',
    'ErrorState',
    'SkeletonServiceCard',
  ],
};
