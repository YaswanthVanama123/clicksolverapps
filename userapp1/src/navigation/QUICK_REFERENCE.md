# Navigation Quick Reference

## File Structure
```
src/navigation/
├── index.js              # Exports
├── navigationRef.js      # Programmatic navigation
├── types.ts             # TypeScript types
├── RootNavigator.js     # Root + Auth logic
├── AuthNavigator.js     # Auth screens
├── MainNavigator.js     # Bottom tabs
├── HomeStack.js         # Home + Booking flow
├── BookingStack.js      # Booking history
└── ProfileStack.js      # Profile screens
```

## Common Navigation Tasks

### Navigate to Screen
```javascript
// From component
navigation.navigate('Home');
navigation.navigate('ServiceBooking', { serviceId: '123' });

// From anywhere
import { navigate } from './navigation';
navigate('Home', { params });
```

### Navigate to Nested Screen
```javascript
// Navigate to Home screen in HomeTab
navigation.navigate('Main', {
  screen: 'HomeTab',
  params: { screen: 'Home' }
});
```

### Go Back
```javascript
navigation.goBack();
// or
import { goBack } from './navigation';
goBack();
```

### Reset Navigation
```javascript
import { reset } from './navigation';

reset({
  index: 0,
  routes: [{ name: 'Main' }],
});
```

## Screen Names Reference

### Auth Screens
- `LanguageSelector`
- `OnboardingScreen`
- `Login`
- `Verification`
- `SignUp`

### Home Stack
- `Home` - Main home screen
- `SearchItem` - Search services
- `ServiceBooking` - Book a service
- `serviceCategory` - Service category
- `userLocation` - Select location
- `userwaiting` - Finding provider
- `ServiceInProgress` - Service active
- `Paymentscreen` - Payment
- `Notifications` - User notifications

### Booking Stack
- `RecentServices` - Booking list
- `OrderScreen` - Order details
- `serviceBookingItem` - Booking details
- `ServiceBookingOngoingItem` - Active booking

### Profile Stack
- `ProfileScreen` - Main profile
- `EditProfile` - Edit profile
- `AccountDelete` - Delete account
- `ReferralScreen` - Referrals
- `Myrefferals` - My referrals

### Shared Screens
- `ChatScreen` - Chat with provider
- `HelpScreen` - Help & support
- `AboutCS` - About app

## TypeScript Usage

```typescript
import { HomeStackScreenProps } from './navigation/types';

type Props = HomeStackScreenProps<'ServiceBooking'>;

const ServiceBooking = ({ navigation, route }: Props) => {
  const { serviceId } = route.params;

  navigation.navigate('userLocation', {
    serviceId,
    serviceName: 'Plumbing'
  });
};
```

## Using Constants

```javascript
import { SCREEN_NAMES } from '../utils/constants';

navigation.navigate(SCREEN_NAMES.HOME);
navigation.navigate(SCREEN_NAMES.SERVICE_IN_PROGRESS);
```

## Check Auth State

```javascript
import useAuthStore from '../store/authStore';

const { isAuthenticated, checkAuth } = useAuthStore();

// Check auth
await checkAuth();

// Navigate based on auth
if (isAuthenticated) {
  navigation.navigate('Main');
} else {
  navigation.navigate('Auth');
}
```

## Theme Support

```javascript
import { useTheme } from '../context/ThemeContext';

const { isDarkMode } = useTheme();

// Use in screen options
screenOptions={{
  contentStyle: {
    backgroundColor: isDarkMode ? '#121212' : '#F8F9FA'
  }
}}
```

## Deep Linking

Handled automatically in RootNavigator for FCM notifications:
```javascript
// FCM message format
{
  data: {
    notification_id: '123',
    screen: 'ServiceInProgress' // or 'Paymentscreen', 'UserNavigation', 'Home'
  }
}
```

## Adding New Screen

### 1. Add to appropriate stack
```javascript
// In HomeStack.js
<Stack.Screen
  name="NewScreen"
  component={NewScreenComponent}
  options={{
    title: 'New Screen',
  }}
/>
```

### 2. Add to types.ts
```typescript
export type HomeStackParamList = {
  // ... existing screens
  NewScreen: { param1: string; param2?: number };
};
```

### 3. Add to constants.js (optional)
```javascript
export const SCREEN_NAMES = {
  // ... existing names
  NEW_SCREEN: 'NewScreen',
};
```

## Troubleshooting

### Navigation not working?
```javascript
import { isReady } from './navigation';

if (!isReady()) {
  console.log('Navigation not ready');
}
```

### Wrong screen showing?
- Check authentication state
- Check onboarding status
- Verify screen names

### Type errors?
- Import correct types from `./navigation/types`
- Ensure params match type definition

## Performance Tips

1. **Use Stack.Screen, not conditional rendering**
   ```javascript
   // Good
   <Stack.Screen name="Home" component={Home} />

   // Bad - don't conditionally render screens
   {showHome && <Stack.Screen name="Home" component={Home} />}
   ```

2. **Avoid deep navigation**
   ```javascript
   // Good - reset navigation
   reset({ routes: [{ name: 'Main' }] })

   // Bad - multiple nested navigates
   navigate('A');
   navigate('B');
   navigate('C');
   ```

3. **Clean up listeners**
   ```javascript
   useEffect(() => {
     const unsubscribe = navigation.addListener('focus', () => {
       // do something
     });

     return unsubscribe;
   }, [navigation]);
   ```

## Common Patterns

### Tab to Tab Navigation
```javascript
// From HomeTab to ProfileTab
navigation.navigate('Main', {
  screen: 'ProfileTab',
  params: {
    screen: 'ProfileScreen'
  }
});
```

### Modal Presentation
```javascript
// Already configured for ChatScreen, HelpScreen, AboutCS
navigation.navigate('ChatScreen', {
  workerId: '123'
});
```

### Blocking Back Navigation
```javascript
useEffect(() => {
  const beforeRemove = (e) => {
    if (!canLeave) {
      e.preventDefault();
      // Show confirmation
    }
  };

  navigation.addListener('beforeRemove', beforeRemove);

  return () => {
    navigation.removeListener('beforeRemove', beforeRemove);
  };
}, [navigation, canLeave]);
```

## Resources

- Full Documentation: `/src/navigation/README.md`
- Implementation Details: `/NAVIGATION_IMPLEMENTATION.md`
- Screen Constants: `/src/utils/constants.js`
- Type Definitions: `/src/navigation/types.ts`
- React Navigation Docs: https://reactnavigation.org/
