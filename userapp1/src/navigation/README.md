# Navigation Structure Documentation

## Overview
Complete navigation system for userapp1 React Native application using React Navigation v6.

## Directory Structure
```
src/navigation/
├── index.js                    # Central export point
├── navigationRef.js            # Programmatic navigation utilities
├── types.ts                    # TypeScript type definitions
├── RootNavigator.js           # Root navigation with auth logic
├── AuthNavigator.js           # Authentication flow screens
├── MainNavigator.js           # Bottom tabs navigation
├── HomeStack.js               # Home and booking flow screens
├── BookingStack.js            # Booking history screens
└── ProfileStack.js            # Profile and account screens
```

## Navigation Hierarchy

```
RootNavigator
├── Auth (AuthNavigator)
│   ├── LanguageSelector
│   ├── OnboardingScreen
│   ├── Login
│   ├── Verification
│   └── SignUp
│
├── Main (MainNavigator - Bottom Tabs)
│   ├── HomeTab (HomeStack)
│   │   ├── Home
│   │   ├── ServiceApp
│   │   ├── SearchItem
│   │   ├── QuickSearch
│   │   ├── ServiceBooking
│   │   ├── serviceCategory
│   │   ├── userLocation
│   │   ├── LocationSearch
│   │   ├── userwaiting
│   │   ├── ServiceInProgress
│   │   ├── ServiceCompletion
│   │   ├── Paymentscreen
│   │   ├── PaymentScreenRazor
│   │   ├── UserNavigation
│   │   └── Notifications
│   │
│   ├── BookingsTab (BookingStack)
│   │   ├── RecentServices
│   │   ├── OrderScreen
│   │   ├── serviceBookingItem
│   │   └── ServiceBookingOngoingItem
│   │
│   ├── TrackingTab
│   │   └── ServiceTrackingListScreen
│   │
│   └── ProfileTab (ProfileStack)
│       ├── ProfileScreen
│       ├── EditProfile
│       ├── AccountDelete
│       ├── ReferralScreen
│       ├── Myrefferals
│       └── LanguageSelector
│
└── Shared Screens (Modals)
    ├── ChatScreen
    ├── HelpScreen
    ├── AboutCS
    ├── LocationSearchModal
    └── ServiceTrackingItem
```

## Navigation Flow

### Authentication Flow
1. **First Time User**
   - LanguageSelector (optional) → OnboardingScreen → Login → Verification → SignUp → Main

2. **Returning User (Not Logged In)**
   - Login → Verification → Main

3. **Returning User (Logged In)**
   - Main (Home Screen)

### Booking Flow
1. Home → ServiceBooking/serviceCategory
2. → userLocation (Select Location)
3. → userwaiting (Finding Service Provider)
4. → ServiceInProgress (Service Active)
5. → ServiceCompletion (Review & Rating)
6. → Paymentscreen/PaymentScreenRazor (Payment)

## Key Features

### 1. **RootNavigator** (`RootNavigator.js`)
- Handles authentication state
- Manages initial route based on onboarding and auth status
- Handles FCM push notifications
- Manages pending notifications when app is not ready
- Provides shared/modal screens

### 2. **AuthNavigator** (`AuthNavigator.js`)
- Language selection
- Onboarding screens
- Login/Signup flow
- OTP verification
- Disabled back gestures for security

### 3. **MainNavigator** (`MainNavigator.js`)
- Bottom tab navigation with 4 tabs:
  - Home: Service browsing and booking
  - Bookings: Order history
  - Tracking: Active service tracking
  - Profile: Account management
- Theme-aware styling
- Icon animations (size changes on focus)
- Badge support for notifications

### 4. **HomeStack** (`HomeStack.js`)
- Complete service booking journey
- Search functionality
- Location selection
- Service tracking
- Payment processing
- Notifications

### 5. **BookingStack** (`BookingStack.js`)
- Booking history
- Order details
- Individual booking views (completed & ongoing)

### 6. **ProfileStack** (`ProfileStack.js`)
- User profile management
- Edit profile
- Account deletion
- Referral system
- Language settings

## Programmatic Navigation

### Using navigationRef
```javascript
import { navigate, goBack, reset, push, pop } from './navigation';

// Navigate to a screen
navigate('Home', { param: 'value' });

// Go back
goBack();

// Reset navigation
reset({
  index: 0,
  routes: [{ name: 'Main' }],
});

// Push onto stack
push('ServiceBooking', { serviceId: '123' });

// Pop from stack
pop(2); // Pop 2 screens
```

### From Components
```javascript
import { useNavigation } from '@react-navigation/native';

const Component = () => {
  const navigation = useNavigation();

  navigation.navigate('Home');
  navigation.goBack();
};
```

## Deep Linking Configuration

Deep links are handled in RootNavigator for push notifications:
- `UserNavigation` - Navigate to service provider tracking
- `worktimescreen` - Navigate to service in progress
- `Paymentscreen` - Navigate to payment screen
- `Home` - Navigate to home with feedback modal

## Theme Integration

All navigators support theming through `useTheme()` hook:
```javascript
const { isDarkMode } = useTheme();

// Navigation options with theme
contentStyle: {
  backgroundColor: isDarkMode ? '#121212' : '#F8F9FA',
}
```

## Screen Options

### Common Options
```javascript
screenOptions={{
  headerShown: false,
  animation: 'slide_from_right',
  gestureEnabled: true,
  contentStyle: { backgroundColor: '#F8F9FA' },
}}
```

### Modal Presentation
```javascript
options={{
  presentation: 'modal',
  animation: 'slide_from_bottom',
}}
```

### Disable Gestures (Critical Flows)
```javascript
options={{
  gestureEnabled: false, // For payment, waiting screens
}}
```

## TypeScript Support

Type definitions are available in `types.ts`:
```typescript
import { HomeStackScreenProps } from './navigation/types';

type Props = HomeStackScreenProps<'ServiceBooking'>;

const ServiceBooking = ({ navigation, route }: Props) => {
  // Fully typed navigation and route params
};
```

## Constants

Screen names are defined in `/src/utils/constants.js`:
```javascript
import { SCREEN_NAMES } from '../utils/constants';

navigation.navigate(SCREEN_NAMES.HOME);
navigation.navigate(SCREEN_NAMES.SERVICE_IN_PROGRESS);
```

## Store Integration

Authentication state is managed by `authStore`:
```javascript
import useAuthStore from '../store/authStore';

const { isAuthenticated, checkAuth } = useAuthStore();
```

## Best Practices

1. **Use Stack Navigators for Related Flows**
   - Each tab has its own stack for independent navigation

2. **Shared Screens as Modals**
   - ChatScreen, HelpScreen, AboutCS are modals accessible from anywhere

3. **Prevent Navigation During Critical Operations**
   - Payment screens: `gestureEnabled: false`
   - Waiting screens: `gestureEnabled: false`

4. **Use Screen Names Constants**
   - Always use `SCREEN_NAMES` from constants
   - Prevents typos and makes refactoring easier

5. **Type Safety**
   - Use TypeScript types for screen props
   - Enables autocomplete and error checking

## Migration Notes

### From Old App.tsx
The old App.tsx had:
- Single Stack.Navigator with all screens
- Tab.Navigator inside Stack
- Mixed authentication and main navigation

### New Structure Benefits
- Clear separation of concerns
- Better authentication flow
- Independent tab stacks
- Easier to maintain and test
- Better TypeScript support
- Improved deep linking

## Testing Navigation

```javascript
import { navigationRef } from './navigation';

// Check if navigation is ready
if (navigationRef.isReady()) {
  navigationRef.navigate('Home');
}

// Get current route
const currentRoute = navigationRef.getCurrentRoute();
console.log('Current screen:', currentRoute?.name);
```

## Future Enhancements

1. **Add Loading States**
   - Show skeleton loaders during navigation

2. **Analytics Integration**
   - Track screen views
   - Track navigation patterns

3. **Error Boundaries**
   - Add error boundaries to each navigator

4. **Route Guards**
   - Add permission checks before navigation
   - Implement middleware for authentication

5. **Animation Customization**
   - Custom transitions between screens
   - Shared element transitions

## Troubleshooting

### Navigation Not Working
- Check if navigation is ready: `navigationRef.isReady()`
- Verify screen names match constants
- Check authentication state

### Deep Links Not Working
- Verify FCM message format
- Check notification data structure
- Ensure navigation is ready before handling

### Type Errors
- Import correct types from `./navigation/types`
- Ensure screen names match type definitions

## Support

For issues or questions about navigation:
1. Check this documentation
2. Review React Navigation v6 docs
3. Check constants.js for screen names
4. Review type definitions in types.ts
