# API Service Layer Documentation

This directory contains the complete API service layer for userapp1, providing a centralized and organized way to interact with the backend API.

## Structure

```
api/
├── client.js              # Axios instance with interceptors
├── endpoints.js           # All API endpoint constants
├── index.js              # Central export point
└── services/
    ├── auth.service.js    # Authentication services
    ├── booking.service.js # Booking and service management
    ├── worker.service.js  # Worker-related services
    └── user.service.js    # User profile and data services
```

## Features

### 1. Axios Client (`client.js`)
- **Base URL**: `https://backend.clicksolver.com`
- **Automatic JWT Token Injection**: Automatically attaches JWT token from EncryptedStorage to all requests
- **Request Interceptor**: Retrieves token from encrypted storage before each request
- **Response Interceptor**: Handles common errors (401, 403, 404, 500) and performs automatic cleanup on authentication failure

### 2. API Endpoints (`endpoints.js`)
Organized endpoint constants grouped by feature:
- Authentication & User Management
- User Profile
- Services & Categories
- Booking & Workers
- Offers & Referrals
- Feedback
- Translation
- Notifications
- Payment
- Chat
- Location Search
- Help & Support

### 3. Service Files
Each service file provides clean, async/await methods with proper error handling:

#### **auth.service.js**
- `login(phoneNumber)` - Login with phone number
- `sendOTP(mobileNumber)` - Send OTP for verification
- `verifyOTP(mobileNumber, verificationId, otpCode)` - Verify OTP code
- `signup(userData)` - Register new user
- `logout(fcmToken)` - Logout and clear tokens
- `storeFCMToken(fcmToken)` - Store FCM token for notifications

#### **booking.service.js**
- `getServices()` - Get all available services
- `getServiceCategories()` - Get service categories
- `getSingleService(serviceName)` - Get specific service details
- `findWorkersNearby(bookingData)` - Find available workers
- `checkBookingStatus(encodedId)` - Check booking status
- `cancelBooking(cancellationData)` - Cancel a booking
- `createUserAction(actionData)` - Create user action for tracking
- `cancelUserAction(cancelData)` - Cancel user action
- `getTrackDetails()` - Get tracking details

#### **worker.service.js**
- `getWorkerNavigationDetails(navigationData)` - Get worker navigation info
- `getWorkerVerificationStatus(encodedId)` - Check worker verification
- `initiateWorkerCall(callData)` - Initiate call to worker

#### **user.service.js**
- `getUserProfile()` - Get user profile
- `getUser()` - Get user basic data
- `updateUserProfile(profileData)` - Update profile information
- `updateProfileImage(profileImageUrl)` - Update profile image
- `deleteUserAccount(deleteData)` - Delete user account
- `storeUserLocation(locationData)` - Store user location
- `getUserOffers()` - Get available offers
- `validateOffer(offerData)` - Validate offer code
- `getUserReferrals()` - Get user referrals
- `submitFeedback(feedbackData)` - Submit feedback
- `translateText(translationData)` - Translate text

## Usage Examples

### Basic Import

```javascript
// Import specific service
import { authService } from '../api';

// Or import individual functions
import { login, sendOTP } from '../api/services/auth.service';

// Or import everything
import apiServices from '../api';
```

### Authentication Example

```javascript
import { authService } from '../api';

// Login
const handleLogin = async (phoneNumber) => {
  try {
    const response = await authService.login(phoneNumber);
    const { token } = response;
    await EncryptedStorage.setItem('cs_token', token);
    console.log('Login successful');
  } catch (error) {
    console.error('Login failed:', error);
  }
};

// Send and verify OTP
const handleOTPFlow = async (phoneNumber) => {
  try {
    // Send OTP
    const { verificationId } = await authService.sendOTP(phoneNumber);

    // Later, verify OTP
    const otpCode = '1234'; // from user input
    const result = await authService.verifyOTP(phoneNumber, verificationId, otpCode);

    if (result.message === 'OTP Verified') {
      console.log('OTP verified successfully');
    }
  } catch (error) {
    console.error('OTP flow error:', error);
  }
};
```

### Booking Example

```javascript
import { bookingService } from '../api';

// Get all services
const fetchServices = async () => {
  try {
    const services = await bookingService.getServices();
    setServices(services);
  } catch (error) {
    console.error('Failed to fetch services:', error);
  }
};

// Book a service
const bookService = async () => {
  try {
    const bookingData = {
      area: 'Downtown',
      city: 'Mumbai',
      pincode: '400001',
      alternateName: 'John Doe',
      alternatePhoneNumber: '9876543210',
      serviceBooked: [
        { serviceName: 'Plumbing', quantity: 1, cost: 500 }
      ],
      discount: 50,
      tipAmount: 20,
      offer: { offer_code: 'SAVE20', discountAmount: 50 }
    };

    const result = await bookingService.findWorkersNearby(bookingData);
    console.log('Booking created:', result);
  } catch (error) {
    console.error('Booking failed:', error);
  }
};
```

### User Profile Example

```javascript
import { userService } from '../api';

// Get profile
const fetchProfile = async () => {
  try {
    const profile = await userService.getUserProfile();
    console.log('Profile:', profile);
  } catch (error) {
    console.error('Failed to fetch profile:', error);
  }
};

// Update profile
const updateProfile = async () => {
  try {
    const profileData = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '9876543210'
    };

    await userService.updateUserProfile(profileData);
    console.log('Profile updated successfully');
  } catch (error) {
    console.error('Profile update failed:', error);
  }
};
```

### Using the Axios Client Directly

```javascript
import { apiClient, API_ENDPOINTS } from '../api';

// Make a custom API call
const customApiCall = async () => {
  try {
    const response = await apiClient.post(API_ENDPOINTS.CUSTOM.ENDPOINT, {
      data: 'value'
    });
    return response.data;
  } catch (error) {
    console.error('Custom API call failed:', error);
    throw error;
  }
};
```

## Error Handling

All services include proper error handling:

```javascript
try {
  const result = await authService.login(phoneNumber);
  // Success handling
} catch (error) {
  // error.response.status - HTTP status code
  // error.response.data - Error data from server
  // error.message - Error message

  if (error.response) {
    // Server responded with error
    console.error('Server error:', error.response.status, error.response.data);
  } else if (error.request) {
    // Request made but no response
    console.error('Network error:', error.message);
  } else {
    // Other errors
    console.error('Error:', error.message);
  }
}
```

## Automatic Token Management

The axios client automatically:
1. Retrieves JWT token from EncryptedStorage before each request
2. Attaches token to Authorization header
3. Handles 401 errors by clearing authentication data
4. Logs users out on authentication failures

## Best Practices

1. **Always use try-catch blocks** when calling API services
2. **Import only what you need** to keep bundle size small
3. **Handle errors gracefully** with user-friendly messages
4. **Use TypeScript/JSDoc** for better IDE support
5. **Don't store sensitive data** in plain text
6. **Always validate user input** before making API calls

## Adding New Services

To add a new service:

1. Create a new file in `services/` (e.g., `payment.service.js`)
2. Add endpoints to `endpoints.js`
3. Import and export in `index.js`
4. Follow the existing patterns for consistency

```javascript
// Example: payment.service.js
import apiClient from '../client';
import API_ENDPOINTS from '../endpoints';

export const createPayment = async (paymentData) => {
  try {
    const response = await apiClient.post(
      API_ENDPOINTS.PAYMENT.CREATE,
      paymentData
    );
    return response.data;
  } catch (error) {
    console.error('Create payment error:', error);
    throw error;
  }
};

export default {
  createPayment,
};
```

## Testing

Always test API services with:
- Valid data
- Invalid data
- Network errors
- Authentication errors
- Edge cases

## Support

For issues or questions, please contact the development team.
