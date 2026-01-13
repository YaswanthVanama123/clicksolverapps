# Molecule Components

Composed UI components built using atomic design principles. These molecules combine atoms and provide rich, reusable UI elements with vibrant gradients and smooth animations.

## Components Overview

### 1. ServiceCard
Vibrant gradient card for displaying service information.

**Props:**
- `service` (object): Service data including image, title, price, rating, etc.
- `onPress` (function): Callback when card is pressed
- `onQuickBook` (function): Callback for quick book button
- `isDarkMode` (boolean): Dark mode flag
- `style` (object): Additional styles

**Features:**
- Image with gradient overlay
- Discount badge
- Quick book button with gradient
- Rating and reviews display
- Price display with gradient background
- Animated press effect
- Category tag

**Usage:**
```javascript
import { ServiceCard } from '../components/molecules';

<ServiceCard
  service={{
    image: 'https://...',
    title: 'Home Cleaning',
    price: 499,
    rating: 4.5,
    reviews: 123,
    category: 'Cleaning',
    discount: 20
  }}
  onPress={(service) => console.log('Service pressed', service)}
  onQuickBook={(service) => console.log('Quick book', service)}
  isDarkMode={false}
/>
```

---

### 2. QuickActionButton
Large circular button with gradient and ripple animation.

**Props:**
- `icon` (string): MaterialCommunityIcons icon name
- `label` (string): Button label text
- `onPress` (function): Callback when pressed
- `gradient` (string): Gradient name from theme
- `size` (string): 'small', 'medium', or 'large'
- `disabled` (boolean): Disabled state
- `isDarkMode` (boolean): Dark mode flag
- `style` (object): Additional styles

**Features:**
- Gradient background
- Ripple animation on press
- Elevated shadow
- Three size variants
- Icon + label layout

**Usage:**
```javascript
import { QuickActionButton } from '../components/molecules';

<QuickActionButton
  icon="calendar-clock"
  label="Book Now"
  onPress={() => console.log('Pressed')}
  gradient="primaryGradient"
  size="medium"
/>
```

---

### 3. AddressCard
Card displaying saved address with swipe-to-delete gesture.

**Props:**
- `address` (object): Address data
- `onSelect` (function): Callback when address is selected
- `onEdit` (function): Callback for edit action
- `onDelete` (function): Callback for delete action
- `isDefault` (boolean): Is default address
- `isDarkMode` (boolean): Dark mode flag
- `style` (object): Additional styles

**Features:**
- Swipe-to-delete gesture
- Edit/delete action buttons
- Default address badge
- Icon based on address type
- Landmark display
- Swipe indicator

**Usage:**
```javascript
import { AddressCard } from '../components/molecules';

<AddressCard
  address={{
    type: 'Home',
    title: 'My Home',
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    landmark: 'Near Central Park'
  }}
  onSelect={(addr) => console.log('Selected', addr)}
  onEdit={(addr) => console.log('Edit', addr)}
  onDelete={(addr) => console.log('Delete', addr)}
  isDefault={true}
/>
```

---

### 4. OfferCard
Promotional offer card with bold styling and countdown timer.

**Props:**
- `offer` (object): Offer data
- `onApply` (function): Callback when apply is pressed
- `isDarkMode` (boolean): Dark mode flag
- `style` (object): Additional styles

**Features:**
- Gradient background
- Discount percentage highlight
- Expiry countdown timer
- Apply button
- Decorative pattern
- Terms and conditions display
- Applied state overlay

**Usage:**
```javascript
import { OfferCard } from '../components/molecules';

<OfferCard
  offer={{
    code: 'SAVE20',
    title: 'Special Discount',
    description: 'Get 20% off on all services',
    discount: 20,
    discountType: 'percentage',
    minAmount: 500,
    maxDiscount: 200,
    expiresAt: '2026-02-01T00:00:00Z'
  }}
  onApply={(offer) => console.log('Apply', offer)}
/>
```

---

### 5. WorkerCard
Worker profile display card with contact actions.

**Props:**
- `worker` (object): Worker data
- `showRating` (boolean): Show rating section
- `showContact` (boolean): Show contact buttons
- `onPress` (function): Callback when card is pressed
- `onCall` (function): Callback for call action
- `onChat` (function): Callback for chat action
- `isDarkMode` (boolean): Dark mode flag
- `style` (object): Additional styles

**Features:**
- Gradient border
- Avatar with gradient border
- Verified badge
- Availability indicator
- Rating and services count
- Call/chat quick actions
- Experience display

**Usage:**
```javascript
import { WorkerCard } from '../components/molecules';

<WorkerCard
  worker={{
    name: 'John Doe',
    avatar: 'https://...',
    rating: 4.8,
    totalReviews: 256,
    servicesCompleted: 1234,
    specialization: 'Plumbing Expert',
    isVerified: true,
    isAvailable: true,
    experience: 5,
    phone: '+1234567890'
  }}
  onPress={(worker) => console.log('Worker pressed', worker)}
  onCall={(worker) => console.log('Call', worker)}
  onChat={(worker) => console.log('Chat', worker)}
  showRating={true}
  showContact={true}
/>
```

---

### 6. InputField
Complete form input with floating label and error handling.

**Props:**
- `label` (string): Input label
- `value` (string): Input value
- `onChange` (function): Callback when value changes
- `error` (string): Error message
- `required` (boolean): Required field indicator
- `placeholder` (string): Placeholder text
- `secureTextEntry` (boolean): Password field
- `keyboardType` (string): Keyboard type
- `multiline` (boolean): Multi-line input
- `numberOfLines` (number): Number of lines for multiline
- `maxLength` (number): Maximum character length
- `editable` (boolean): Editable state
- `leftIcon` (string): Left icon name
- `rightIcon` (string): Right icon name
- `onRightIconPress` (function): Right icon press callback
- `isDarkMode` (boolean): Dark mode flag
- `helperText` (string): Helper text displayed when focused

**Features:**
- Floating label animation
- Error message display
- Character counter
- Left/right icons
- Password visibility toggle
- Gradient border on focus
- Helper text
- Multi-line support

**Usage:**
```javascript
import { InputField } from '../components/molecules';

<InputField
  label="Email Address"
  value={email}
  onChange={setEmail}
  error={emailError}
  required={true}
  placeholder="Enter your email"
  keyboardType="email-address"
  leftIcon="email"
  helperText="We'll never share your email"
/>
```

---

### 7. BottomSheet
Modern bottom sheet modal with drag gestures.

**Props:**
- `visible` (boolean): Modal visibility
- `onClose` (function): Callback when closed
- `children` (ReactNode): Sheet content
- `height` (number): Sheet height
- `snapPoints` (array): Snap point heights
- `title` (string): Sheet title
- `showHandle` (boolean): Show drag handle
- `closeOnBackdropPress` (boolean): Close on backdrop press
- `closeOnSwipeDown` (boolean): Close on swipe down
- `isDarkMode` (boolean): Dark mode flag
- `headerComponent` (ReactNode): Custom header
- `footerComponent` (ReactNode): Custom footer

**Features:**
- Drag handle
- Backdrop with blur effect
- Animated slide up/down
- Swipe to close
- Custom header/footer
- Multiple snap points support
- Smooth animations

**Usage:**
```javascript
import { BottomSheet } from '../components/molecules';

<BottomSheet
  visible={isVisible}
  onClose={() => setIsVisible(false)}
  title="Select Options"
  height={400}
  showHandle={true}
  closeOnBackdropPress={true}
  closeOnSwipeDown={true}
>
  <View>
    {/* Your content here */}
  </View>
</BottomSheet>
```

---

## Design System Integration

All molecule components integrate with the theme system:

- **Colors**: `/src/theme/colors.js`
- **Gradients**: `/src/theme/gradients.js`
- **Shadows**: `/src/theme/shadows.js`
- **Spacing**: `/src/theme/spacing.js`
- **Typography**: `/src/theme/typography.js`

## Animation Libraries

Components use:
- `react-native-reanimated` for complex animations
- React Native's `Animated` API for simpler animations
- `PanResponder` for gesture handling

## Icons

All components use `react-native-vector-icons/MaterialCommunityIcons`.

## Best Practices

1. Always pass the `isDarkMode` prop for theme support
2. Use proper error handling for callbacks
3. Provide meaningful default values for optional props
4. Test components in both light and dark modes
5. Ensure proper accessibility labels
6. Handle loading and error states appropriately

## Notes

- Components require placeholder images in `/src/assets/`:
  - `placeholder.png` - For ServiceCard
  - `placeholder-user.png` - For WorkerCard
- All components support custom styling via `style` prop
- Animations use native driver for better performance
