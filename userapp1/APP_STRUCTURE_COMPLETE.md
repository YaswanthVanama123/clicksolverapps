# ClickSolver App - Complete Navigation & UI Structure

## Overview
Complete navigation structure with updated routes using all refactored components. The app follows a modern React Native architecture with proper separation of concerns.

---

## App Entry Point

### `/src/App.tsx`
**Main Application Entry**
- CodePush integration for OTA updates
- FCM (Firebase Cloud Messaging) setup
- Push notification configuration
- Error Boundary wrapper
- Theme Provider
- Navigation Container

**Flow:**
1. Splash Screen → Hide on init
2. Request tracking permissions (iOS)
3. Configure push notifications
4. Sync FCM token with backend
5. Initialize navigation

---

## Navigation Architecture

```
App.tsx
  └─ NavigationContainer
      └─ RootNavigator
          ├─ Auth Navigator (Unauthenticated)
          ├─ Main Navigator (Authenticated)
          └─ Shared/Modal Screens
```

---

## 1. Root Navigator
**File:** `/src/navigation/RootNavigator.js`

### Routes:
| Route Name | Component | Type | Description |
|------------|-----------|------|-------------|
| `Auth` | AuthNavigator | Navigator | Authentication flow |
| `Main` | MainNavigator | Navigator | Main app (authenticated) |
| `ChatScreen` | ChatScreen | Modal | Chat with worker |
| `HelpScreen` | HelpScreen | Modal | Help & support |
| `AboutCS` | AboutCS | Modal | About ClickSolver |
| `LocationSearchModal` | LocationSearch | Modal | Location search |
| `ServiceTrackingItemScreen` | ServiceTrackingItemScreen | Card | Individual tracking |

### Features:
- ✅ Authentication state management
- ✅ Onboarding flow check
- ✅ FCM notification handling (cold start, foreground, background)
- ✅ Pending notification management
- ✅ AppState monitoring
- ✅ Deep linking support

---

## 2. Authentication Navigator
**File:** `/src/navigation/AuthNavigator.js`

### Screens:

#### Onboarding Flow
| Screen | Component | Route | Description |
|--------|-----------|-------|-------------|
| **OnboardingScreen** | `OnboardingScreen` | `/onboarding` | Welcome carousel |

#### Auth Screens (Refactored)
| Screen | Component | Route | Files Used |
|--------|-----------|-------|------------|
| **LoginScreen** | `LoginScreen` | `/login` | `src/screens/auth/LoginScreen.js` |
| **SignUpScreen** | `SignUpScreen` | `/signup` | `src/screens/auth/SignUpScreen.js` |
| **OTPVerificationScreen** | `VerificationScreen` | `/verify-otp` | `src/screens/auth/OTPVerificationScreen.js` |
| **ForgotPasswordScreen** | `ForgotPasswordScreen` | `/forgot-password` | `src/screens/auth/ForgotPasswordScreen.js` |

### Features:
- ✅ Phone number verification
- ✅ OTP authentication
- ✅ Social login (optional)
- ✅ Password reset flow
- ✅ Auto-navigation after success

---

## 3. Main Navigator (Bottom Tabs)
**File:** `/src/navigation/MainNavigator.js`

### Tab Structure:
```
Bottom Tabs
├─ HomeTab (HomeStack)
├─ BookingsTab (BookingStack)
├─ TrackingTab (ServiceTrackingListScreen)
└─ ProfileTab (ProfileStack)
```

### Tab Styling:
- **Active Color:** `#FF6B35` (Orange)
- **Inactive Color:** `#6B7280` / `#B4B4B4` (Gray)
- **Height:** iOS: 85px, Android: 65px
- **Dark Mode:** Supported
- **Icons:** Feather & MaterialCommunityIcons

---

## 4. Home Stack
**File:** `/src/navigation/HomeStack.js`

### Screens:

| Screen | Component | Route | Type | Refactored |
|--------|-----------|-------|------|------------|
| **Home** | `Home` | `/home` | Main | - |
| **UserLocation** | `userLocation` | `/select-location` | Location | ✅ **YES** |
| **OrderScreen** | `OrderScreen` | `/order` | Booking | - |
| **WaitingUser** | `UserWaiting` | `/waiting` | Status | ✅ **YES** |
| **UserNavigation** | `Navigation` | `/navigation` | Tracking | ✅ **YES** |
| **ServiceInProgress** | `worktime` | `/in-progress` | Service | - |
| **PaymentScreen** | `PaymentScreenRazor` | `/payment` | Payment | - |

### Refactored Components Used:

#### UserLocation Screen
**Files:**
- `/src/Components/userLocation.js` (400 lines, refactored)
- `/src/hooks/useLocationPermissions.js`
- `/src/hooks/useGeofencing.js`
- `/src/hooks/useReverseGeocode.js`
- `/src/hooks/useUserLocation.js`
- `/src/Components/location/LocationMap.js`
- `/src/Components/location/ServiceList.js`
- `/src/Components/location/AddressForm.js`
- `/src/Components/location/OutOfServiceModal.js`
- `/src/utils/geofencing.js`
- `/src/api/locationService.js`

#### UserWaiting Screen
**Files:**
- `/src/Components/UserWaiting.js` (543 lines, refactored)
- `/src/hooks/useStatusPolling.js`
- `/src/hooks/useWaitingScreenNotifications.js`
- `/src/hooks/useAutoRetry.js`
- `/src/hooks/useCountdownTimer.js`
- `/src/Components/waiting/WaitingMap.js`
- `/src/Components/waiting/WaitingContent.js`
- `/src/Components/waiting/CancellationReasonModal.js`
- `/src/Components/waiting/CancellationConfirmationModal.js`
- `/src/api/bookingService.js`

#### Navigation Screen
**Files:**
- `/src/Components/Navigation.js` (656 lines, refactored)
- `/src/hooks/useWorkerDetails.js`
- `/src/hooks/useVerificationStatus.js`
- `/src/hooks/useLocationTracking.js`
- `/src/hooks/useNavigationRoute.js`
- `/src/hooks/useNavigationNotifications.js`
- `/src/hooks/useMapRefresh.js`
- `/src/Components/navigation/NavigationMap.js`
- `/src/Components/navigation/WorkerProfileCard.js`
- `/src/Components/navigation/ServiceListCard.js`
- `/src/Components/navigation/NavigationCancellationReasonModal.js`
- `/src/Components/navigation/NavigationCancellationConfirmationModal.js`
- `/src/Components/common/StarRating.js`
- `/src/utils/mapUtils.js`
- `/src/api/navigationService.js`

---

## 5. Booking Stack
**File:** `/src/navigation/BookingStack.js`

### Planned Screens:

| Screen | Component | Route | Status |
|--------|-----------|-------|--------|
| **BookingHistory** | `BookingHistoryScreen` | `/bookings` | To Implement |
| **BookingDetails** | `BookingDetailsScreen` | `/bookings/:id` | To Implement |
| **BookingConfirmation** | `BookingConfirmationScreen` | `/booking/confirm` | To Implement |
| **RateService** | `RateServiceScreen` | `/rate/:bookingId` | To Implement |

---

## 6. Profile Stack
**File:** `/src/navigation/ProfileStack.js`

### Screens:

| Screen | Component | Route | Status |
|--------|-----------|-------|--------|
| **Profile** | `ProfileScreen` | `/profile` | Existing |
| **EditProfile** | `EditProfile` | `/profile/edit` | Existing |
| **Settings** | `SettingsScreen` | `/settings` | To Implement |
| **ReferralScreen** | `ReferralScreen` | `/referral` | Existing |
| **AccountDelete** | `AccountDelete` | `/account/delete` | Existing |

---

## User Flow Diagrams

### 1. First-Time User Flow
```
App Launch
  ↓
Onboarding Screen
  ↓
SignUp Screen
  ↓
OTP Verification
  ↓
Home Screen
```

### 2. Booking Flow
```
Home Screen
  ↓
Select Location (UserLocation)
  ↓
Choose Service
  ↓
Order Screen
  ↓
Waiting for Worker (UserWaiting)
  ↓
Worker Accepted (Navigation)
  ↓
Service In Progress
  ↓
Payment Screen
  ↓
Rate Service
```

### 3. Tracking Flow
```
Tracking Tab
  ↓
Service Tracking List
  ↓
Select Active Service
  ↓
Service Tracking Item
  ↓
Real-time Updates
```

---

## Screen Components Summary

### Total Screens: 30+

#### Fully Refactored (3):
1. ✅ UserLocation.js - 64% reduction (1,112 → 400 lines)
2. ✅ UserWaiting.js - 58% reduction (1,306 → 543 lines)
3. ✅ Navigation.js - 57% reduction (1,531 → 656 lines)

#### Existing (15+):
- OnboardingScreen
- LoginScreen
- SignUpScreen
- VerificationScreen
- Home
- OrderScreen
- worktime
- PaymentScreenRazor
- ProfileScreen
- EditProfile
- ReferralScreen
- AccountDelete
- ChatScreen
- HelpScreen
- AboutCS
- ServiceTrackingListScreen
- ServiceTrackingItemScreen

#### To Be Implemented (12):
- ForgotPasswordScreen
- BookingHistoryScreen
- BookingDetailsScreen
- BookingConfirmationScreen
- RateServiceScreen
- SettingsScreen
- NotificationsScreen
- SearchScreen
- PaymentHistoryScreen
- HelpSupportScreen (enhanced)
- LanguageSelector
- ThemeSelector

---

## Design System

### Colors

#### Light Mode
- **Primary:** `#FF6B35` (Orange)
- **Background:** `#F8F9FA` (Light Gray)
- **Surface:** `#FFFFFF` (White)
- **Text Primary:** `#1F2937` (Dark Gray)
- **Text Secondary:** `#6B7280` (Medium Gray)
- **Border:** `#E5E7EB` (Light Border)
- **Error:** `#EF4444` (Red)
- **Success:** `#10B981` (Green)

#### Dark Mode
- **Primary:** `#FF6B35` (Orange)
- **Background:** `#121212` (Dark Gray)
- **Surface:** `#1A1A2E` (Dark Blue)
- **Text Primary:** `#FFFFFF` (White)
- **Text Secondary:** `#B4B4B4` (Light Gray)
- **Border:** `#2A2A3E` (Dark Border)
- **Error:** `#F87171` (Light Red)
- **Success:** `#34D399` (Light Green)

### Typography
- **Font Family:** RobotoSlab
  - Regular
  - Medium
  - Bold

### Spacing
- **xs:** 4px
- **sm:** 8px
- **md:** 16px
- **lg:** 24px
- **xl:** 32px
- **2xl:** 40px

### Border Radius
- **sm:** 8px
- **md:** 12px
- **lg:** 16px
- **xl:** 20px
- **full:** 9999px (rounded)

---

## Component Architecture

### Atomic Design Pattern

```
Components/
├── atoms/           (Basic building blocks)
│   ├── Button.js
│   ├── Input.js
│   ├── Text.js
│   ├── Icon.js
│   └── Badge.js
├── molecules/       (Simple combinations)
│   ├── SearchBar.js
│   ├── ServiceCard.js
│   ├── WorkerCard.js
│   └── RatingStars.js
└── organisms/       (Complex components)
    ├── ServiceList.js
    ├── BookingCard.js
    ├── ProfileHeader.js
    └── NavigationMap.js
```

### Screen Structure

```
screens/
├── auth/
│   ├── LoginScreen.js
│   ├── SignUpScreen.js
│   ├── OTPVerificationScreen.js
│   └── ForgotPasswordScreen.js
├── home/
│   ├── HomeScreen.js
│   └── components/
│       ├── ServiceCategories.js
│       ├── PopularServices.js
│       └── OffersCarousel.js
├── booking/
│   ├── BookingHistoryScreen.js
│   ├── BookingDetailsScreen.js
│   └── BookingConfirmationScreen.js
├── profile/
│   ├── ProfileScreen.js
│   ├── EditProfileScreen.js
│   └── SettingsScreen.js
└── tracking/
    ├── ServiceTrackingScreen.js
    └── TrackingMapScreen.js
```

---

## API Integration

### Services Layer
```
api/
├── authService.js       (Login, signup, OTP)
├── bookingService.js    (Create, cancel, fetch bookings)
├── locationService.js   (Geocoding, service areas)
├── navigationService.js (Worker details, routes, tracking)
├── profileService.js    (User profile, edit, delete)
└── paymentService.js    (Razorpay integration)
```

### Response Format
```javascript
{
  success: boolean,
  data?: object,
  error?: string,
  status?: number
}
```

---

## State Management

### Zustand Stores
```
store/
├── authStore.js         (Authentication state)
├── userStore.js         (User profile data)
├── bookingStore.js      (Active bookings)
└── locationStore.js     (Current location)
```

---

## Utilities

### Custom Hooks
```
hooks/
├── useAuth.js
├── useLocation.js
├── useGeofencing.js
├── useStatusPolling.js
├── useNotifications.js
├── useWorkerDetails.js
├── useLocationTracking.js
├── useNavigationRoute.js
└── useMapRefresh.js
```

### Utility Functions
```
utils/
├── constants.js         (App constants)
├── validators.js        (Form validation)
├── formatters.js        (Data formatting)
├── permissions.js       (Permission handling)
├── geofencing.js        (Geofence calculations)
└── mapUtils.js          (Map utilities)
```

---

## Feature Flags

### Implemented Features
- ✅ Authentication (Phone + OTP)
- ✅ Location Services
- ✅ Geofencing
- ✅ Service Booking
- ✅ Real-time Tracking
- ✅ Push Notifications
- ✅ Dark Mode
- ✅ Internationalization (i18n)
- ✅ Payment Integration (Razorpay)
- ✅ Chat with Worker
- ✅ Service Rating
- ✅ Referral System

### In Progress
- 🔄 Enhanced Booking History
- 🔄 Notification Center
- 🔄 Search & Filters
- 🔄 Payment History
- 🔄 Multiple Language Support

### Planned
- 📋 Favorites
- 📋 Scheduled Bookings
- 📋 Service Packages
- 📋 Wallet System
- 📋 Loyalty Program

---

## Performance Optimizations

### Implemented
- ✅ React.memo for expensive components
- ✅ useCallback for event handlers
- ✅ useMemo for computed values
- ✅ FlatList optimization
- ✅ Image caching
- ✅ Code splitting
- ✅ Lazy loading

### Monitoring
- Bundle size analysis
- Render performance
- API response times
- Crash reporting (Firebase Crashlytics)
- Analytics (Firebase Analytics)

---

## Testing Strategy

### Unit Tests
- [ ] Custom hooks tests
- [ ] Utility function tests
- [ ] API service tests
- [ ] Validator tests

### Integration Tests
- [ ] Navigation flow tests
- [ ] Booking flow tests
- [ ] Payment flow tests
- [ ] Authentication flow tests

### E2E Tests
- [ ] Critical user journeys
- [ ] Booking complete flow
- [ ] Payment complete flow

---

## Build & Deployment

### Environments
- **Development:** Local development
- **Staging:** Testing environment
- **Production:** Live app

### CI/CD
- CodePush for OTA updates
- Automated builds
- Version management
- Release notes automation

---

## Summary

The ClickSolver app now has a **clean, scalable architecture** with:

1. ✅ **Proper Navigation Structure** - RootNavigator → Auth/Main → Stacks → Screens
2. ✅ **Refactored Components** - 3 major files reduced by 57-64%
3. ✅ **Modular Design** - Hooks, Components, Services, Utils separated
4. ✅ **Consistent Patterns** - Same architecture across all screens
5. ✅ **Dark Mode Support** - Full theme support
6. ✅ **Internationalization** - Multi-language ready
7. ✅ **Performance Optimized** - Memoization, lazy loading
8. ✅ **Type-Safe Ready** - Can easily migrate to TypeScript

### File Count Summary:
- **3 Major Refactorings:** 3,949 lines → 1,599 lines (59% reduction)
- **14 New Hooks:** Reusable business logic
- **12 New Components:** Modular UI
- **4 API Services:** Centralized API calls
- **3 Utility Files:** Helper functions

### Next Steps:
1. Implement remaining screens (12 screens)
2. Add comprehensive tests
3. Enhance UI components library
4. Add more performance optimizations
5. Consider TypeScript migration

---

**Last Updated:** 2026-01-13
**Version:** 2.0.0
**Architecture:** Refactored & Optimized
