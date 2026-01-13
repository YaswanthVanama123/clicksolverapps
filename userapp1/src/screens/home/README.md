# HomeScreen - Vibrant Home Screen

## Overview
The new vibrant HomeScreen replaces the old SecondPage.js with a modern, colorful, and highly interactive user interface. It serves as the main landing screen for users after login, showcasing services, offers, and booking status in an engaging way.

## Location
`/Users/yaswanthgandhi/Documents/patsource/clicksolverapps/userapp1/src/screens/home/HomeScreen.js`

## Features Implemented

### 1. Gradient Header
- **Component**: `GradientHeader.js`
- User greeting based on time of day (Good morning/afternoon/evening)
- User profile avatar with fallback to initials
- Notification bell icon with badge count
- Animated header that responds to scroll
- Smooth gradient background

### 2. Vibrant Search Bar
- **Component**: `VibrantSearchBar.js`
- Gradient border for visual appeal
- Animated placeholder text cycling through services
- Quick search functionality
- Voice search button with gradient
- Navigates to SearchItem screen on tap

### 3. Quick Actions Section
- **Component**: `QuickActionsSection.js`
- 3-4 circular gradient buttons for frequently used services
- Icon-based visual representation
- Horizontal scrollable list
- One-tap booking for popular services
- Color-coded service categories

### 4. Service Categories Grid
- **Component**: `ServiceGrid.js` + `ServiceCard.js`
- Colorful gradient cards for each service
- Service image with rounded corners
- "Book Now" button with gradient
- Pull-to-refresh support
- Loading skeleton on initial load
- Empty state handling

### 5. Special Offers Carousel
- **Component**: `SpecialOffersCarousel.js`
- Horizontal scrolling offer cards
- Auto-scroll with 4-second interval
- Dots indicator for navigation
- Bold, eye-catching design with gradient backgrounds
- Discount percentage prominently displayed
- Service-specific promotional images

### 6. Recent Bookings
- **Component**: `RecentBookings.js`
- List of recently completed services
- "Book Again" quick action button
- Compact card design with gradient icons
- Easy re-booking functionality

### 7. Floating Action Button (FAB)
- **Component**: `FloatingActionButton.js`
- Large gradient FAB for instant booking
- Positioned at bottom-right corner
- Opens quick booking flow
- Prominent and accessible

### 8. Tracking Banner
- **Component**: `TrackingBanner.js`
- Shows active booking status
- Horizontal scrolling for multiple bookings
- Icon-based status indicators
- Quick navigation to tracking screens
- Positioned above FAB for visibility

### 9. Feedback Modal
- **Component**: `FeedbackModal.js`
- Rating system with star selection
- Comment text box
- Smooth bottom sheet animation
- Handles route parameter for encodedId
- Submits feedback to backend

### 10. Skeleton Loader
- **Component**: `SkeletonLoader.js`
- Animated shimmer effect
- Shows during initial data load
- Matches layout of actual content
- Smooth transition to real content

## Integration

### State Management
- **Zustand**: Uses `bookingStore` for cart management
- **Local State**: React hooks for component state
- **Context**: ThemeContext for dark mode support

### Hooks Used
- `useAuth`: User authentication and profile data
- `useTheme`: Dark mode toggle and theme state
- `useTranslation`: i18n for multi-language support
- `useFocusEffect`: Refresh tracking data on screen focus

### API Services
All API calls use the centralized API client with automatic token injection:
- `getServiceCategories()`: Fetch service list
- `getTrackDetails()`: Fetch booking tracking data
- Special offers endpoint: `/api/special/offers`
- Recent bookings endpoint: `/api/user/recent/bookings`

### Navigation
Handles navigation to:
- `serviceCategory`: Service selection screen
- `SearchItem`: Search screen
- `Notifications`: Notifications list
- `Tabs > Account`: User profile
- Various tracking screens based on booking status

## Migrated Functionality from SecondPage.js

All core functionality has been successfully migrated:
- ✅ Service categories fetching
- ✅ Special offers fetching with backend data
- ✅ User tracking status with screen navigation
- ✅ Firebase notification handling via encodedId
- ✅ Greeting based on time of day
- ✅ User profile display
- ✅ Feedback modal system
- ✅ Permission requests (moved to app initialization)
- ✅ Translation support for user names
- ✅ Navigation to all service screens

## Dark Mode Support

Full dark mode implementation across all components:
- Dynamic color schemes
- Gradient adjustments for dark backgrounds
- Text color contrast optimization
- Skeleton loader theme adaptation

## Performance Optimizations

1. **useCallback**: Memoized event handlers
2. **Pull-to-Refresh**: Only refreshes visible data
3. **Lazy Loading**: Components render conditionally
4. **Animated Scroll**: Uses native driver where possible
5. **Image Optimization**: Proper resize modes

## Component Structure

```
HomeScreen.js (Main Component - 370 lines)
├── GradientHeader.js (120 lines)
├── VibrantSearchBar.js (100 lines)
├── QuickActionsSection.js (90 lines)
├── ServiceGrid.js (70 lines)
│   └── ServiceCard.js (80 lines)
├── SpecialOffersCarousel.js (140 lines)
├── RecentBookings.js (90 lines)
├── FloatingActionButton.js (40 lines)
├── TrackingBanner.js (110 lines)
├── FeedbackModal.js (160 lines)
└── SkeletonLoader.js (120 lines)
```

Total: ~1,490 lines across 12 files (Main component < 400 lines as required)

## Usage

Import and use in navigation:

```javascript
import HomeScreen from './screens/home/HomeScreen';

// In your navigator
<Stack.Screen name="Home" component={HomeScreen} />
```

## Dependencies

Required packages (already in project):
- `react-native-linear-gradient`: Gradient effects
- `react-native-vector-icons`: Icon library
- `lottie-react-native`: Loading animations
- `react-native-encrypted-storage`: Secure storage
- `react-i18next`: Internationalization
- `axios`: HTTP client
- `zustand`: State management

## Testing

To test the HomeScreen:
1. Ensure user is authenticated
2. Navigate to the Home screen
3. Test pull-to-refresh
4. Test service navigation
5. Test search bar tap
6. Test quick actions
7. Test feedback modal (if encodedId in route)
8. Verify dark mode toggle

## Future Enhancements

Potential improvements:
- [ ] Add service filtering
- [ ] Implement service search within HomeScreen
- [ ] Add animation between sections
- [ ] Cache special offers locally
- [ ] Add haptic feedback
- [ ] Implement gesture-based navigation
- [ ] Add A/B testing for offer layouts

## Troubleshooting

Common issues:

1. **Services not loading**: Check API endpoint and token
2. **Gradient not showing**: Ensure `react-native-linear-gradient` is linked
3. **Icons missing**: Run `react-native link react-native-vector-icons`
4. **Dark mode issues**: Verify ThemeContext is provided
5. **Skeleton loader not animating**: Check `react-native-reanimated` setup

## Related Files

- `/screens/SecondPage.js` - Original implementation (can be deprecated)
- `/Components/QuickSearch.js` - Original search component
- `/context/ThemeContext.js` - Theme management
- `/hooks/useAuth.js` - Authentication hook
- `/store/bookingStore.js` - Booking state management
- `/api/services/booking.service.js` - API service layer

## Notes

- The component is fully responsive and works on tablets
- All text is translatable via i18n
- Follows React Native best practices
- Uses TypeScript-ready prop patterns
- Accessibility features can be added per requirement
