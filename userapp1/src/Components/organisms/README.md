# Organism Components

Complex, fully-functional components that compose molecules and atoms into complete UI sections.

## Components Overview

### 1. ServiceGrid.js
**Purpose**: Grid layout for displaying service categories

**Features**:
- Responsive grid (2-3 columns based on screen size)
- Pull-to-refresh functionality
- Loading skeleton states
- Empty state with helpful message
- Service card with image, name, rating, and price
- Quick book button for each service

**Props**:
```javascript
{
  services: Array,           // Array of service objects
  onServicePress: Function,  // Callback when service card is pressed
  onQuickBook: Function,     // Callback for quick booking
  numColumns: Number,        // Optional: force specific column count
  loading: Boolean,          // Show loading skeleton
  onRefresh: Function,       // Pull-to-refresh callback
  refreshing: Boolean        // Refreshing state
}
```

**Usage Example**:
```javascript
import { ServiceGrid } from '@/components/organisms';

<ServiceGrid
  services={services}
  onServicePress={(service) => navigation.navigate('ServiceDetail', { service })}
  onQuickBook={(service) => setQuickBookService(service)}
  onRefresh={fetchServices}
  refreshing={isRefreshing}
  loading={isLoading}
/>
```

---

### 2. QuickBookingSheet.js
**Purpose**: Combined booking flow in a bottom sheet with progressive disclosure

**Features**:
- Multi-step booking flow (Service → Address → Confirmation)
- Animated step transitions
- Progressive disclosure pattern
- Background worker matching simulation
- Success animation with Lottie
- Bottom sheet with backdrop

**Props**:
```javascript
{
  visible: Boolean,              // Sheet visibility
  onClose: Function,             // Close callback
  preSelectedService: Object,    // Pre-selected service (optional)
  services: Array,               // Available services
  savedAddresses: Array,         // User's saved addresses
  onConfirm: Function            // Booking confirmation callback
}
```

**Usage Example**:
```javascript
import { QuickBookingSheet } from '@/components/organisms';

<QuickBookingSheet
  visible={showBookingSheet}
  onClose={() => setShowBookingSheet(false)}
  preSelectedService={selectedService}
  services={availableServices}
  savedAddresses={userAddresses}
  onConfirm={handleBookingConfirm}
/>
```

---

### 3. AddressSelector.js
**Purpose**: Location picker with multiple options and search

**Features**:
- Current location auto-detect with permissions
- Saved addresses list with different types (home, work, other)
- Search/filter functionality
- Add new address option
- Map preview (optional)
- Default address badge

**Props**:
```javascript
{
  onSelect: Function,            // Address selection callback
  showCurrentLocation: Boolean,  // Show current location option
  savedAddresses: Array,         // User's saved addresses
  selectedAddress: Object,       // Currently selected address
  showSearch: Boolean,           // Show search bar
  showMap: Boolean               // Show map preview
}
```

**Usage Example**:
```javascript
import { AddressSelector } from '@/components/organisms';

<AddressSelector
  onSelect={(address) => setSelectedAddress(address)}
  showCurrentLocation={true}
  savedAddresses={userAddresses}
  selectedAddress={selectedAddress}
  showSearch={true}
  showMap={false}
/>
```

---

### 4. BookingSummary.js
**Purpose**: Order summary with pricing breakdown and animations

**Features**:
- Service list with icons
- Address display
- Offer/coupon application
- Tip selector (preset amounts + custom)
- Pricing breakdown (subtotal, tax, discount, tip, total)
- Animated price updates
- Gradient confirm button

**Props**:
```javascript
{
  services: Array,          // Selected services
  address: Object,          // Selected address
  offer: Object,            // Applied offer/coupon
  tip: Number,              // Selected tip amount
  onConfirm: Function,      // Confirmation callback
  onApplyOffer: Function,   // Apply offer callback
  onRemoveOffer: Function,  // Remove offer callback
  onChangeTip: Function,    // Tip change callback
  loading: Boolean          // Loading state
}
```

**Usage Example**:
```javascript
import { BookingSummary } from '@/components/organisms';

<BookingSummary
  services={selectedServices}
  address={selectedAddress}
  offer={appliedOffer}
  tip={tipAmount}
  onConfirm={handleConfirmBooking}
  onApplyOffer={(code) => applyOfferCode(code)}
  onRemoveOffer={removeOffer}
  onChangeTip={(amount) => setTipAmount(amount)}
  loading={isProcessing}
/>
```

---

### 5. GradientHeader.js
**Purpose**: Animated header with gradient background and scroll effects

**Features**:
- Gradient background (customizable)
- Back button (optional)
- Right action button/icon (optional)
- Scroll-based animations (opacity, scale, fade)
- Status bar handling
- Two variants: Standard and Collapsible

**Props**:
```javascript
{
  title: String,                // Header title
  subtitle: String,             // Header subtitle (optional)
  showBack: Boolean,            // Show back button
  onBackPress: Function,        // Back button callback
  rightAction: Object,          // Right action config {icon, onPress, label}
  scrollY: Animated.Value,      // Scroll position for animations
  gradientName: String,         // Gradient theme name
  transparent: Boolean,         // Transparent background
  statusBarStyle: String        // 'light-content' | 'dark-content'
}
```

**Usage Example**:
```javascript
import GradientHeader, { CollapsibleGradientHeader } from '@/components/organisms';
import { Animated } from 'react-native';

const scrollY = useRef(new Animated.Value(0)).current;

// Standard Header
<GradientHeader
  title="Home Services"
  subtitle="Find trusted professionals"
  showBack={true}
  onBackPress={() => navigation.goBack()}
  rightAction={{
    icon: 'notifications',
    onPress: () => navigation.navigate('Notifications')
  }}
  scrollY={scrollY}
  gradientName="primaryGradient"
/>

// Collapsible Header
<CollapsibleGradientHeader
  title="Service Details"
  subtitle="Professional Cleaning"
  description="Get your home sparkling clean with our expert cleaners"
  showBack={true}
  onBackPress={() => navigation.goBack()}
  scrollY={scrollY}
  gradientName="primaryGradient"
/>
```

---

## Design Patterns

### Composition
Organisms compose molecules and atoms:
- Use existing atom/molecule components when possible
- Build complex interactions from simpler pieces
- Maintain single responsibility

### State Management
- Each organism manages its own internal state
- Communicate with parent via callback props
- Support controlled/uncontrolled modes where appropriate

### Animations
- Use React Native Animated API for performance
- Support scroll-based animations via Animated.Value
- Provide smooth transitions and feedback

### Theming
- All organisms use theme context for colors
- Support both light and dark modes
- Use gradient system for visual appeal

### Responsiveness
- Adapt to different screen sizes (phone/tablet)
- Use useWindowDimensions for dynamic layouts
- Support landscape orientation

## File Structure
```
organisms/
├── index.js                  # Export all organisms
├── ServiceGrid.js            # Service grid with cards
├── QuickBookingSheet.js      # Multi-step booking flow
├── AddressSelector.js        # Location picker
├── BookingSummary.js         # Order summary and pricing
├── GradientHeader.js         # Animated header
└── README.md                 # This file
```

## Dependencies
- react-native-linear-gradient (gradients)
- react-native-vector-icons (icons)
- lottie-react-native (animations)
- @react-native-community/geolocation (location)
- react-native-safe-area-context (safe areas)

## Best Practices

1. **Performance**: Use FlatList for long lists, memoize expensive calculations
2. **Accessibility**: Add proper labels, testID props, and touch targets
3. **Error Handling**: Show loading/error states, handle edge cases
4. **Customization**: Support style overrides via props
5. **Testing**: Write unit tests for complex logic and interactions

## Contributing
When adding new organism components:
1. Follow atomic design principles
2. Document all props with JSDoc comments
3. Include usage examples
4. Support theming and responsiveness
5. Add to index.js exports
6. Update this README
