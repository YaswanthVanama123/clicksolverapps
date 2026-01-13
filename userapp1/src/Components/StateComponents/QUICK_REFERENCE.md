/**
 * QUICK REFERENCE - State Components Integration
 * ===============================================
 * Fast lookup for common tasks
 */

// ============================================================================
// IMPORTS
// ============================================================================

// Option 1: Import everything
import {
  Skeleton,
  LoadingState,
  EmptyState,
  ErrorState,
  SkeletonServiceCard,
} from '@/components/StateComponents';

// Option 2: Import specific components
import Skeleton from '@/components/atoms/Skeleton';
import LoadingState from '@/components/molecules/LoadingState';
import EmptyState from '@/components/molecules/EmptyState';
import ErrorState from '@/components/molecules/ErrorState';
import SkeletonServiceCard from '@/components/molecules/SkeletonServiceCard';

// ============================================================================
// SKELETON COMPONENT
// ============================================================================

// Rectangular skeleton
<Skeleton width={200} height={100} borderRadius={8} />

// Circular skeleton (avatar)
<Skeleton width={60} height={60} variant="circle" />

// Full width skeleton
<Skeleton width="100%" height={80} borderRadius={8} style={{ marginVertical: 8 }} />

// Multiple skeletons for list
{[1, 2, 3].map((i) => (
  <Skeleton key={i} width="100%" height={60} />
))}

// ============================================================================
// LOADING STATE COMPONENT
// ============================================================================

// Basic loading with message
<LoadingState message="Loading services..." />

// Without logo
<LoadingState message="Please wait..." showLogo={false} />

// With custom gradient
<LoadingState
  message="Discovering services..."
  gradientName="oceanGradient"
  showLogo={true}
/>

// Gradient options:
// - primaryGradient (default, orange)
// - secondaryGradient (purple-pink)
// - accentGradient (yellow)
// - successGradient (green)
// - errorGradient (red)
// - oceanGradient (blue-purple)
// - sunsetGradient (multi-color)

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

// Search empty state
<EmptyState
  icon="search"
  title="No Services Found"
  message="Try adjusting your search or filters"
  actionLabel="Clear Filters"
  onAction={() => clearFilters()}
/>

// Bookings empty state
<EmptyState
  icon="calendar"
  title="No Bookings Yet"
  message="You haven't made any service bookings"
  actionLabel="Browse Services"
  onAction={() => navigation.navigate('Services')}
/>

// Favorites empty state (without action)
<EmptyState
  icon="heart"
  title="No Favorites"
  message="You haven't added any favorites yet"
/>

// Common icons:
// search, calendar, heart, folder-open, star, clock, map, filter,
// trash, bookmark, list, grid, user, users, settings, etc.

// ============================================================================
// ERROR STATE COMPONENT
// ============================================================================

// Basic error
<ErrorState
  error="Failed to load services"
  onRetry={() => fetchServices()}
/>

// With Error object
<ErrorState
  error={error}
  onRetry={handleRetry}
  title="Something Went Wrong"
/>

// Network error (auto-detected)
<ErrorState
  error="Network request failed"
  onRetry={retry}
  // Will show wifi-off icon automatically
/>

// Timeout error (auto-detected)
<ErrorState
  error="Request timeout after 30 seconds"
  onRetry={retry}
  // Will show clock-alert icon automatically
/>

// Unauthorized error (auto-detected)
<ErrorState
  error="Unauthorized access"
  onRetry={() => reLogin()}
  // Will show lock-alert icon automatically
/>

// Custom icon
<ErrorState
  error={error}
  onRetry={retry}
  icon="alert-circle"
/>

// ============================================================================
// SKELETON SERVICE CARD COMPONENT
// ============================================================================

// Single skeleton card
<SkeletonServiceCard />

// Multiple in a scroll view
<ScrollView>
  {[1, 2, 3, 4].map((i) => (
    <SkeletonServiceCard key={i} />
  ))}
</ScrollView>

// In a FlatList during loading
{isLoading && (
  <FlatList
    scrollEnabled={false}
    data={[1, 2]}
    renderItem={() => <SkeletonServiceCard />}
    keyExtractor={(item) => item.toString()}
  />
)}

// ============================================================================
// COMMON PATTERNS
// ============================================================================

// Pattern 1: Full page state management
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

if (loading && !data.length) return <LoadingState message="Loading..." />;
if (error && !data.length) return <ErrorState error={error} onRetry={fetchData} />;
if (!data.length) return <EmptyState title="No Data" />;
return <DataList data={data} />;

// Pattern 2: Pull-to-refresh
<FlatList
  data={data}
  renderItem={renderItem}
  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
  ListHeaderComponent={refreshing && <SkeletonServiceCard />}
/>

// Pattern 3: Search with states
const [query, setQuery] = useState('');
const [results, setResults] = useState([]);
const [searching, setSearching] = useState(false);

if (query.length < 3) {
  return <EmptyState title="Start Searching" />;
}
if (searching) {
  return <View>{[1, 2, 3].map(() => <Skeleton />)}</View>;
}
if (!results.length) {
  return <EmptyState title="No Results" actionLabel="Clear" onAction={() => setQuery('')} />;
}
return <ResultsList results={results} />;

// Pattern 4: Lazy loading sections
<ScrollView>
  {profileLoading ? <Skeleton variant="circle" width={80} /> : <Profile />}
  {settingsLoading ? <Skeleton width="100%" height={100} /> : <Settings />}
  {reviewsLoading ? <SkeletonServiceCard /> : <Reviews />}
</ScrollView>

// Pattern 5: Error handling
try {
  const data = await fetchAPI();
  setData(data);
  setError(null);
} catch (err) {
  setError(err);
  console.error('API Error:', err);
}

// ============================================================================
// THEME COLORS
// ============================================================================

// Light mode (default)
background: '#FFFFFF'
surface: '#F8F9FA'
text.primary: '#1A1A1A'
text.secondary: '#6B7280'
text.tertiary: '#9CA3AF'

// Dark mode
background: '#0F0F1E'
surface: '#1A1A2E'
text.primary: '#FFFFFF'
text.secondary: '#B4B4B4'
text.tertiary: '#888888'

// Semantic colors (both modes)
primary: '#FF6B35' (orange)
secondary: '#8B5CF6' (purple)
error: '#EF4444' (red)
success: '#10B981' (green)
warning: '#F59E0B' (amber)
accent: '#FBBF24' (yellow)

// ============================================================================
// RESPONSIVE BREAKPOINTS
// ============================================================================

// Mobile (< 600px)
- Smaller fonts
- Standard padding (16px)
- Single column layouts

// Tablet (>= 600px)
- Larger fonts (+2-4px)
- More padding (20-24px)
- Multi-column layouts

// All components automatically adapt using useWindowDimensions

// ============================================================================
// CUSTOMIZATION
// ============================================================================

// Change skeleton animation speed
// File: src/components/atoms/Skeleton.js
// Find: duration: 1500
// Change: duration: 2000 (slower) or 1000 (faster)

// Change colors
// File: src/theme/colors.js
// Modify LIGHT_COLORS or DARK_COLORS objects

// Add new gradient
// File: src/theme/gradients.js
// Add to GRADIENTS object:
// myGradient: {
//   colors: ['#FF0000', '#0000FF'],
//   start: {x: 0, y: 0},
//   end: {x: 1, y: 1},
// }

// ============================================================================
// TROUBLESHOOTING
// ============================================================================

// Skeleton not animating?
// - Check react-native-reanimated is installed
// - Verify native driver is enabled
// - Run: npm install react-native-reanimated@^3.6.0

// LoadingState animation missing?
// - Check Lottie animation file exists
// - Path: src/assets/animations/loading-spinner.json
// - Verify Lottie package installed

// Colors not applying?
// - Verify ThemeContext wraps your app
// - Check isDarkMode state
// - Verify theme/colors.js exports properly

// Responsive layout wrong?
// - Use useWindowDimensions not Dimensions.get()
// - Check tablet breakpoint (600px)
// - Test on actual device

// ============================================================================
// PERFORMANCE TIPS
// ============================================================================

1. Memoize components in lists
   const MemoSkeleton = React.memo(SkeletonServiceCard);

2. Use FlatList/VirtualizedList for many skeletons
   <FlatList data={[1,2,3]} renderItem={() => <SkeletonServiceCard />} />

3. Preload Lottie animations
   import animation from '@/assets/animations/loading-spinner.json';

4. Use conditional rendering, not visibility
   {loading ? <LoadingState /> : <Content />}

5. Cache theme colors at app level
   const colors = useMemo(() => getColors(isDarkMode), [isDarkMode]);

// ============================================================================
// ACCESSIBILITY
// ============================================================================

// Add accessibility labels to buttons
<TouchableOpacity accessibilityRole="button" onPress={onAction}>
  <Text>{actionLabel}</Text>
</TouchableOpacity>

// Loading state hint
<LoadingState
  message="Loading content"
  testID="loadingState"
/>

// Error state with announce
<ErrorState
  error={error}
  onRetry={retry}
  accessible={true}
  accessibilityLabel="Error occurred, retry available"
/>

// ============================================================================
// TESTING
// ============================================================================

// Test Skeleton component
import { render } from '@testing-library/react-native';
import Skeleton from '@/components/atoms/Skeleton';

test('renders skeleton', () => {
  const { getByTestId } = render(<Skeleton width={100} height={50} />);
  expect(getByTestId('skeleton')).toBeTruthy();
});

// Test LoadingState
test('displays loading message', () => {
  const { getByText } = render(<LoadingState message="Loading..." />);
  expect(getByText('Loading...')).toBeTruthy();
});

// Test EmptyState with action
test('calls action callback', () => {
  const mockAction = jest.fn();
  const { getByText } = render(
    <EmptyState
      actionLabel="Retry"
      onAction={mockAction}
    />
  );
  fireEvent.press(getByText('Retry'));
  expect(mockAction).toHaveBeenCalled();
});

// ============================================================================
// DOCUMENTATION
// ============================================================================

For more information, see:
- README.md - Overview and quick start
- USAGE_GUIDE.md - Detailed API documentation
- DIRECTORY.md - Component structure
- EXAMPLES.js - Working code examples
- CHECKLIST.md - Implementation status

Location: /src/components/StateComponents/
