# Quick Book Feature - One-Tap Booking

## Overview

The Quick Book feature enables users to instantly book frequent services with a single tap, eliminating the need for multiple confirmation screens. It uses saved preferences (default address, tip amount) and automatically applies the best available offer.

## Features

- **One-Tap Booking**: Instant booking without confirmation dialogs
- **Smart Defaults**: Uses saved address and tip preferences
- **Auto-Apply Offers**: Automatically finds and applies best discount
- **Recent Services**: Shows quick book buttons for last 5 booked services
- **Beautiful UI**: Gradient buttons with service icons
- **Real-time Price**: Shows estimated price with applied discounts
- **Error Handling**: Comprehensive error handling with retry option
- **Background Worker Matching**: Starts worker search in background
- **Direct Tracking**: Navigates directly to tracking screen

## File Structure

```
userapp1/src/
├── screens/
│   ├── home/
│   │   └── components/
│   │       ├── QuickBookButton.js          # Main quick book component
│   │       └── QuickBookButton.example.js  # Integration examples
│   └── profile/
│       └── QuickBookPreferences.js         # Preferences management screen
├── api/
│   ├── endpoints.js                        # Updated with quick book endpoints
│   └── services/
│       ├── booking.service.js              # Quick book API method
│       └── offer.service.js                # Offer validation service
├── store/
│   └── userStore.js                        # Extended with quick book preferences
└── hooks/
    └── useBooking.js                       # Booking operations hook (existing)
```

## Components

### 1. QuickBookButton.js

Main component that renders the quick book button.

**Props:**
```javascript
{
  service: {
    id: string,              // Service ID
    name: string,            // Service name
    price: number,           // Service price
    icon: string,            // MaterialCommunityIcons icon name
    gradientColors: array    // Optional: ['#color1', '#color2']
  },
  savedPreferences: object,  // Optional: Saved preferences for this service
  onBookingComplete: func    // Callback when booking completes
}
```

**Features:**
- Vibrant gradient background
- Service icon and name display
- Shows saved location name
- Displays estimated price with discount badge
- Loading state during API call
- One-tap instant booking
- Validates default address
- Auto-applies best offer

### 2. QuickBookPreferences.js

Screen for managing quick book preferences.

**Features:**
- Enable/disable quick book
- Set default address
- Configure default tip amount
- Auto-apply offers toggle
- Show confirmation toggle
- View recent services (max 5)
- Tip presets (Rs 0, 10, 20, 50)

## Store Extensions

### userStore.js

Added methods:
```javascript
// Quick book preferences
updateQuickBookPreferences(quickBookPrefs)
setDefaultTip(tipAmount)
getDefaultAddress()

// Recent services limited to 5
addRecentService(service)
```

State:
```javascript
{
  preferences: {
    defaultTip: number,
    quickBook: {
      enabled: boolean,
      autoApplyOffers: boolean,
      confirmationRequired: boolean
    }
  },
  recentServices: array  // Max 5 services
}
```

## API Services

### booking.service.js

**quickBook(bookingData)**
```javascript
// Instantly books a service with saved preferences
const response = await quickBook({
  serviceId: '123',
  serviceName: 'Plumbing',
  serviceBooked: [{id, name, price, quantity}],
  area: 'Area Name',
  city: 'City Name',
  pincode: '123456',
  location: [longitude, latitude],
  alternateName: 'Contact Name',
  alternatePhoneNumber: '+1234567890',
  tipAmount: 0,
  discount: 0,
  offer: null
});
```

### offer.service.js

**validateOffer(offerData)**
```javascript
// Validates and returns best offer
const response = await validateOffer({
  serviceId: '123',
  servicePrice: 299,
  offerCode: 'OPTIONAL'
});
```

**getBestOffer(serviceId, servicePrice)**
```javascript
// Gets best available offer
const offer = await getBestOffer('123', 299);
```

## API Endpoints

Added to `endpoints.js`:

```javascript
BOOKING: {
  QUICK_BOOK: '/api/booking/quick-book',
  // ... existing endpoints
},

USER: {
  GET_QUICK_BOOK_PREFERENCES: '/api/user/quick-book/preferences',
  UPDATE_QUICK_BOOK_PREFERENCES: '/api/user/quick-book/preferences',
  SET_DEFAULT_ADDRESS: '/api/user/addresses/default',
  // ... existing endpoints
},

OFFERS: {
  GET_USER_OFFERS: '/api/user/offers',
  VALIDATE_OFFER: '/api/user/validate-offer',
}
```

## Integration Guide

### Step 1: Import Components

```javascript
import QuickBookButton from './screens/home/components/QuickBookButton';
import useUserStore from './store/userStore';
```

### Step 2: Get Recent Services

```javascript
const {recentServices} = useUserStore();
```

### Step 3: Add Quick Book Buttons

```javascript
{recentServices.map(service => (
  <QuickBookButton
    key={service.id}
    service={service}
    onBookingComplete={(booking) => {
      navigation.navigate('Tracking', {
        bookingId: booking.bookingId,
        encodedId: booking.encodedId
      });
    }}
  />
))}
```

### Step 4: Add Preferences Screen to Navigation

```javascript
import QuickBookPreferences from './screens/profile/QuickBookPreferences';

// In your navigation stack:
<Stack.Screen
  name="QuickBookPreferences"
  component={QuickBookPreferences}
  options={{title: 'Quick Book Settings'}}
/>
```

### Step 5: Navigate to Preferences

```javascript
// From Profile screen or Settings
navigation.navigate('QuickBookPreferences');
```

## Usage Example

```javascript
import React from 'react';
import {ScrollView} from 'react-native';
import QuickBookButton from './screens/home/components/QuickBookButton';
import useUserStore from './store/userStore';

const HomeScreen = ({navigation}) => {
  const {recentServices} = useUserStore();

  const services = [
    {
      id: '1',
      name: 'Plumbing',
      price: 299,
      icon: 'wrench',
      gradientColors: ['#667eea', '#764ba2']
    },
    {
      id: '2',
      name: 'Electrician',
      price: 399,
      icon: 'flash',
      gradientColors: ['#f093fb', '#f5576c']
    }
  ];

  return (
    <ScrollView>
      {/* Show recent services first */}
      {recentServices.map(service => (
        <QuickBookButton
          key={service.id}
          service={service}
          onBookingComplete={(booking) => {
            navigation.navigate('Tracking', {
              bookingId: booking.bookingId
            });
          }}
        />
      ))}

      {/* Show all services */}
      {services.map(service => (
        <QuickBookButton
          key={service.id}
          service={service}
        />
      ))}
    </ScrollView>
  );
};
```

## User Flow

1. **First Time Setup:**
   - User adds an address in Profile
   - Sets it as default
   - Optionally sets default tip
   - Books a service normally

2. **Quick Book:**
   - Service appears in recent services (max 5)
   - Quick book button shows on home screen
   - User taps button
   - System validates default address
   - Fetches best available offer
   - Creates booking instantly
   - Shows success alert
   - Navigates to tracking screen

3. **Error Handling:**
   - No default address: Prompt to add one
   - Booking fails: Show error with retry option
   - Network error: Clear error message
   - API error: Display server message

## Dependencies

Required packages (should already be installed):
- `react-native-linear-gradient`: For gradient buttons
- `react-native-vector-icons`: For icons
- `zustand`: State management
- `axios`: API calls
- `react-native-encrypted-storage`: Secure storage
- `@react-navigation/native`: Navigation

## Backend Requirements

### POST /api/booking/quick-book

**Request:**
```json
{
  "serviceId": "123",
  "serviceName": "Plumbing",
  "serviceBooked": [{
    "id": "123",
    "name": "Plumbing",
    "price": 299,
    "quantity": 1
  }],
  "area": "Area Name",
  "city": "City",
  "pincode": "123456",
  "location": [longitude, latitude],
  "alternateName": "John Doe",
  "alternatePhoneNumber": "+1234567890",
  "tipAmount": 0,
  "discount": 0,
  "offer": null,
  "quickBook": true
}
```

**Response:**
```json
{
  "success": true,
  "bookingId": "booking_123",
  "encodedId": "encoded_id_123",
  "message": "Booking created successfully"
}
```

### POST /api/user/validate-offer

**Request:**
```json
{
  "serviceId": "123",
  "servicePrice": 299,
  "offerCode": "OPTIONAL"
}
```

**Response:**
```json
{
  "success": true,
  "offer": {
    "id": "offer_123",
    "type": "percentage",
    "value": 20,
    "maxDiscount": 100,
    "code": "FIRST20"
  }
}
```

## Customization

### Gradient Colors

Define custom gradients for service categories:

```javascript
const serviceGradients = {
  plumbing: ['#667eea', '#764ba2'],
  electrical: ['#f093fb', '#f5576c'],
  cleaning: ['#4facfe', '#00f2fe'],
  repair: ['#43e97b', '#38f9d7'],
  carpentry: ['#fa709a', '#fee140'],
};

// Apply to service object:
const service = {
  ...serviceData,
  gradientColors: serviceGradients[category]
};
```

### Service Icons

Use MaterialCommunityIcons names:
- Plumbing: `wrench`, `pipe`, `water-pump`
- Electrical: `flash`, `lightbulb`, `power-plug`
- Cleaning: `broom`, `spray-bottle`, `vacuum`
- AC: `snowflake`, `air-conditioner`, `fan`
- Carpentry: `hammer`, `saw-blade`, `toolbox`

## Testing

### Test Scenarios

1. **Happy Path:**
   - User has default address
   - Offer available
   - Quick book succeeds
   - Navigate to tracking

2. **No Default Address:**
   - Show alert
   - Navigate to address screen

3. **API Error:**
   - Show error message
   - Offer retry option

4. **Network Error:**
   - Handle gracefully
   - Show appropriate message

5. **No Offers:**
   - Book without discount
   - Show regular price

## Performance

- Offer validation happens in background
- Async operations with loading states
- Optimistic UI updates
- Cached recent services (EncryptedStorage)
- Efficient state management with Zustand

## Security

- JWT token auto-attached to requests
- Address data encrypted in storage
- Secure API endpoints
- Input validation on backend
- Token refresh handling

## Future Enhancements

- [ ] Schedule quick bookings
- [ ] Multiple service quick book
- [ ] Quick book widgets
- [ ] Voice-activated quick book
- [ ] Smart suggestions based on time/location
- [ ] Quick book from notifications
- [ ] Favorite services
- [ ] Quick rebook from history

## Troubleshooting

**Issue: Button not showing**
- Check if user has booked services (recentServices populated)
- Verify service object has required fields
- Check if quickBook is enabled in preferences

**Issue: Booking fails**
- Verify default address is set
- Check API endpoint configuration
- Validate service data structure
- Check backend logs

**Issue: Offers not applying**
- Verify offer validation endpoint
- Check offer eligibility criteria
- Ensure service price is correct
- Validate offer object structure

## Support

For issues or questions:
1. Check console logs for errors
2. Verify API responses
3. Test with sample data
4. Review integration steps

## License

Proprietary - ClickSolver Apps
