# Home Screen Components

A collection of modern, performant, and reusable React Native components for the Home screen with vibrant gradients and smooth animations.

## Components Overview

### 1. QuickActions

Displays circular gradient buttons for quick access to services, with horizontal scrolling support.

**Features:**
- Circular gradient buttons with icons
- Horizontal scrollable list
- Fetches user's recent services for suggestions
- Supports 6+ actions with auto-scroll
- React.memo for performance
- Dark mode support

**Usage:**
```jsx
import {QuickActions} from './screens/home/components';

<QuickActions
  actions={[
    {id: 1, label: 'Electrician', key: 'electrician'},
    {id: 2, label: 'Plumber', key: 'plumber'},
    {id: 3, label: 'Cleaning', key: 'cleaning'},
  ]}
  onActionPress={(action) => {
    console.log('Action pressed:', action);
    navigation.navigate('ServiceCategory', {category: action.key});
  }}
/>
```

**Props:**
- `actions` (Array): Array of action objects with id, label, key, and optional data
- `onActionPress` (Function): Callback when an action is pressed

---

### 2. ServiceCategories

Grid layout of service category cards with gradient backgrounds and images.

**Features:**
- 2-column responsive grid
- Gradient cards with overlay images
- Category name and starting price display
- Quick book button on each card
- Skeleton loading states
- Dark mode support

**Usage:**
```jsx
import {ServiceCategories} from './screens/home/components';

<ServiceCategories
  categories={[
    {
      id: 1,
      name: 'Electrical Services',
      imageUrl: 'https://example.com/image.jpg',
      startingPrice: 299,
    },
    // ... more categories
  ]}
  onCategoryPress={(category) => {
    navigation.navigate('ServiceDetails', {category});
  }}
  onQuickBook={(category) => {
    navigation.navigate('BookService', {category});
  }}
  loading={false}
/>
```

**Props:**
- `categories` (Array): Array of category objects with id, name, imageUrl, startingPrice
- `onCategoryPress` (Function): Callback when a category card is tapped
- `onQuickBook` (Function): Callback when quick book button is pressed
- `loading` (Boolean): Show skeleton loading state

---

### 3. OffersCarousel

Horizontal auto-scrolling carousel for displaying offers with vibrant gradients.

**Features:**
- Auto-scroll every 3 seconds
- Dot indicators for navigation
- Vibrant gradient backgrounds
- Snap to interval scrolling
- Pause auto-scroll on interaction
- Manual scroll with dots

**Usage:**
```jsx
import {OffersCarousel} from './screens/home/components';

<OffersCarousel
  offers={[
    {
      id: 1,
      title: 'Summer Sale',
      description: 'Get 50% off on all services',
      discount: '50% OFF',
      badge: 'LIMITED TIME',
      imageUrl: 'https://example.com/offer-image.jpg',
    },
    // ... more offers
  ]}
  onOfferPress={(offer) => {
    navigation.navigate('OfferDetails', {offer});
  }}
/>
```

**Props:**
- `offers` (Array): Array of offer objects with id, title, description, discount, badge, imageUrl
- `onOfferPress` (Function): Callback when an offer is tapped

---

### 4. RecentServicesComponent

Displays a horizontal list of recent bookings with "Book Again" functionality.

**Features:**
- Compact horizontal cards
- Shows service name, date, and worker name
- "Book Again" button with gradient
- Navigate to booking details on tap
- Fetches recent bookings from API
- "See All" link to full list

**Usage:**
```jsx
import {RecentServicesComponent} from './screens/home/components';

<RecentServicesComponent
  onBookAgain={(service) => {
    navigation.navigate('BookService', {
      serviceId: service.service_booked[0].main_service_id,
    });
  }}
/>
```

**Props:**
- `onBookAgain` (Function): Callback when "Book Again" button is pressed

**Note:** This component automatically fetches recent services from the API. Make sure the user is authenticated.

---

### 5. SearchBar

Animated search bar with gradient border on focus and trending search chips.

**Features:**
- Animated gradient border on focus
- Search icon and optional voice search
- Trending searches chips below
- Opens search screen on tap
- Clear button when text is entered
- Smooth animations

**Usage:**
```jsx
import {SearchBar} from './screens/home/components';

<SearchBar
  placeholder="Search for services..."
  onFocus={() => {
    console.log('Search focused');
  }}
  onSearch={(query) => {
    console.log('Search query:', query);
  }}
  showTrendingChips={true}
  showVoiceSearch={true}
/>
```

**Props:**
- `onFocus` (Function): Callback when search bar is focused
- `onSearch` (Function): Callback when search query changes
- `placeholder` (String): Placeholder text for search input
- `showTrendingChips` (Boolean): Show trending searches chips (default: true)
- `showVoiceSearch` (Boolean): Show voice search button (default: true)

---

## Integration Example

Here's how to integrate all components into your Home screen:

```jsx
import React from 'react';
import {ScrollView, View, StyleSheet} from 'react-native';
import {
  QuickActions,
  ServiceCategories,
  OffersCarousel,
  RecentServicesComponent,
  SearchBar,
} from './screens/home/components';

const HomeScreen = ({navigation}) => {
  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <SearchBar
        onFocus={() => navigation.navigate('SearchItem')}
        onSearch={(query) => console.log(query)}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <QuickActions
          actions={quickActionsData}
          onActionPress={(action) => handleQuickAction(action)}
        />

        {/* Offers Carousel */}
        <OffersCarousel
          offers={offersData}
          onOfferPress={(offer) => handleOfferPress(offer)}
        />

        {/* Service Categories */}
        <ServiceCategories
          categories={categoriesData}
          onCategoryPress={(category) => handleCategoryPress(category)}
          onQuickBook={(category) => handleQuickBook(category)}
          loading={loading}
        />

        {/* Recent Services */}
        <RecentServicesComponent
          onBookAgain={(service) => handleBookAgain(service)}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
});

export default HomeScreen;
```

---

## Common Features Across All Components

### 1. Dark Mode Support
All components support dark mode through the `useTheme` context:
```jsx
const {isDarkMode} = useTheme();
```

### 2. Responsive Design
Components adapt to tablet and phone screen sizes:
```jsx
const {width} = useWindowDimensions();
const isTablet = width >= 600;
```

### 3. Performance Optimization
All components use `React.memo` to prevent unnecessary re-renders:
```jsx
export default memo(ComponentName);
```

### 4. Gradient System
Components use the centralized gradient system:
```jsx
import {GRADIENTS} from '../../../theme/gradients';
```

### 5. Color System
Components use the centralized color system:
```jsx
import {getColors} from '../../../theme/colors';
const colors = getColors(isDarkMode);
```

---

## API Integration

### Authentication
Most components that fetch data require the user to be authenticated. They use `EncryptedStorage` to retrieve the auth token:

```jsx
const token = await EncryptedStorage.getItem('cs_token');
```

### API Endpoints Used
- **QuickActions**: `GET /api/user/recent-services`
- **RecentServicesComponent**: `GET /api/user/bookings`

Make sure these endpoints are available and return the expected data format.

---

## Customization

### Changing Gradients
You can customize gradients in `/src/theme/gradients.js`:

```jsx
export const GRADIENTS = {
  primaryGradient: {
    colors: ['#FF6B35', '#FF4D00'],
    start: {x: 0, y: 0},
    end: {x: 1, y: 1},
  },
  // ... add more gradients
};
```

### Changing Colors
Customize colors in `/src/theme/colors.js`:

```jsx
const SEMANTIC_COLORS = {
  primary: '#FF6B35',
  secondary: '#8B5CF6',
  // ... add more colors
};
```

---

## Dependencies

These components require the following dependencies:

```json
{
  "react-native-linear-gradient": "^2.8.0",
  "react-native-vector-icons": "^10.0.0",
  "react-native-encrypted-storage": "^4.0.3",
  "axios": "^1.6.0",
  "@react-navigation/native": "^6.1.0"
}
```

---

## Troubleshooting

### Issue: Gradients not displaying
**Solution**: Make sure `react-native-linear-gradient` is properly installed and linked.

### Issue: Icons not showing
**Solution**: Ensure `react-native-vector-icons` is properly installed and fonts are linked.

### Issue: API calls failing
**Solution**: Check that the user is authenticated and the auth token is valid.

### Issue: Navigation errors
**Solution**: Ensure all navigation routes referenced in the components exist in your navigation stack.

---

## Contributing

When adding new components or modifying existing ones:

1. Follow the existing code structure
2. Use React.memo for performance
3. Support dark mode
4. Make components responsive
5. Add proper TypeScript types (if using TypeScript)
6. Test on both iOS and Android
7. Update this README with any changes

---

## License

MIT License - See LICENSE file for details
