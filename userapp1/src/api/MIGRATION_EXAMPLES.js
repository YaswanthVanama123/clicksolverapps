/**
 * Migration Examples
 * Shows how to convert existing direct axios calls to use the API service layer
 */

// ============================================================================
// BEFORE: Direct axios calls scattered throughout components
// ============================================================================

// LoginScreen.js - BEFORE
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';

const requestOtp = async () => {
  try {
    const loginResponse = await axios.post(
      'https://backend.clicksolver.com/api/user/login',
      {phone_number: phoneNumber}
    );
    if (loginResponse.status === 200) {
      const {token} = loginResponse.data;
      await EncryptedStorage.setItem('cs_token', token);
      // Navigate...
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// ============================================================================
// AFTER: Using the API service layer
// ============================================================================

// LoginScreen.js - AFTER
import { authService } from '../api';
import EncryptedStorage from 'react-native-encrypted-storage';

const requestOtp = async () => {
  try {
    const response = await authService.login(phoneNumber);
    const {token} = response;
    await EncryptedStorage.setItem('cs_token', token);
    // Navigate...
  } catch (error) {
    console.error('Error:', error);
  }
};

// ============================================================================
// BEFORE: Profile fetching with manual token handling
// ============================================================================

// ProfileScreen.js - BEFORE
const fetchProfileDetails = async () => {
  try {
    const jwtToken = await EncryptedStorage.getItem('cs_token');
    if (!jwtToken) {
      setIsLoggedIn(false);
      return;
    }
    const response = await axios.post(
      'https://backend.clicksolver.com/api/user/profile',
      {},
      {headers: {Authorization: `Bearer ${jwtToken}`}}
    );
    const {name, email, phone_number, profile} = response.data;
    setAccount({name, email, phoneNumber: phone_number, profile});
  } catch (err) {
    console.error('Error:', err);
  }
};

// ============================================================================
// AFTER: Automatic token injection
// ============================================================================

// ProfileScreen.js - AFTER
import { userService } from '../api';

const fetchProfileDetails = async () => {
  try {
    const profile = await userService.getUserProfile();
    const {name, email, phone_number, profile: profileImage} = profile;
    setAccount({name, email, phoneNumber: phone_number, profile: profileImage});
  } catch (err) {
    console.error('Error:', err);
    if (err.response?.status === 401) {
      setIsLoggedIn(false); // Token automatically cleared by interceptor
    }
  }
};

// ============================================================================
// BEFORE: Services fetching
// ============================================================================

// Home.js - BEFORE
const fetchServices = async () => {
  try {
    setLoading(true);
    const response = await axios.get(
      'https://backend.clicksolver.com/api/home/services'
    );
    setServices(response.data);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setLoading(false);
  }
};

// ============================================================================
// AFTER: Clean service call
// ============================================================================

// Home.js - AFTER
import { bookingService } from '../api';

const fetchServices = async () => {
  try {
    setLoading(true);
    const services = await bookingService.getServices();
    setServices(services);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setLoading(false);
  }
};

// ============================================================================
// BEFORE: Complex booking with multiple parameters
// ============================================================================

// UserWaiting.js - BEFORE
const fetchData = async () => {
  try {
    const jwtToken = await EncryptedStorage.getItem('cs_token');
    if (!jwtToken) return;

    const response = await axios.post(
      'https://backend.clicksolver.com/api/workers-nearby',
      {
        area,
        city,
        pincode,
        alternateName,
        alternatePhoneNumber,
        serviceBooked,
        discount,
        tipAmount,
        offer,
      },
      {headers: {Authorization: `Bearer ${jwtToken}`}}
    );

    if (response.status === 200) {
      const encode = response.data;
      setEncodedData(encode);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// ============================================================================
// AFTER: Clean and organized
// ============================================================================

// UserWaiting.js - AFTER
import { bookingService } from '../api';

const fetchData = async () => {
  try {
    const bookingData = {
      area,
      city,
      pincode,
      alternateName,
      alternatePhoneNumber,
      serviceBooked,
      discount,
      tipAmount,
      offer,
    };

    const result = await bookingService.findWorkersNearby(bookingData);
    setEncodedData(result);
  } catch (error) {
    console.error('Error:', error);
  }
};

// ============================================================================
// BEFORE: Offer validation
// ============================================================================

// OrderScreen.js - BEFORE
const validateAndApplyOffer = async (offerCode, currentTotal) => {
  try {
    const token = await EncryptedStorage.getItem('cs_token');
    if (!token) {
      showErrorModal('Authentication Error', 'User not logged in.');
      return;
    }

    const response = await axios.post(
      'https://backend.clicksolver.com/api/user/validate-offer',
      {offer_code: offerCode, totalAmount: currentTotal},
      {headers: {Authorization: `Bearer ${token}`}}
    );

    const {valid, discountAmount, newTotal, error} = response.data;
    if (!valid) {
      showErrorModal('Offer Not Valid', error);
      return;
    }

    setDiscountedPrice(newTotal);
    setSavings(discountAmount);
  } catch (error) {
    console.error('Error:', error);
  }
};

// ============================================================================
// AFTER: Simplified with automatic token handling
// ============================================================================

// OrderScreen.js - AFTER
import { userService } from '../api';

const validateAndApplyOffer = async (offerCode, currentTotal) => {
  try {
    const offerData = {
      offer_code: offerCode,
      totalAmount: currentTotal,
    };

    const result = await userService.validateOffer(offerData);
    const {valid, discountAmount, newTotal, error} = result;

    if (!valid) {
      showErrorModal('Offer Not Valid', error);
      return;
    }

    setDiscountedPrice(newTotal);
    setSavings(discountAmount);
  } catch (error) {
    console.error('Error:', error);
    if (error.response?.status === 401) {
      showErrorModal('Authentication Error', 'Please login again.');
    }
  }
};

// ============================================================================
// Migration Checklist
// ============================================================================

/*
1. ✅ Replace direct axios imports with service imports
   - Before: import axios from 'axios';
   - After:  import { authService, userService, bookingService } from '../api';

2. ✅ Remove manual token retrieval (handled by interceptor)
   - Before: const token = await EncryptedStorage.getItem('cs_token');
   - After:  (not needed - automatic)

3. ✅ Remove manual Authorization headers (handled by interceptor)
   - Before: {headers: {Authorization: `Bearer ${token}`}}
   - After:  (not needed - automatic)

4. ✅ Use service methods instead of direct API calls
   - Before: await axios.post('https://backend.clicksolver.com/api/...', data)
   - After:  await userService.methodName(data)

5. ✅ Error handling improvements
   - Interceptor handles 401 automatically
   - Consistent error structure across all calls
   - Better error logging and tracking

6. ✅ Benefits
   - Centralized API logic
   - Consistent error handling
   - Automatic token management
   - Easier testing and mocking
   - Better code organization
   - Type safety with JSDoc
   - Reduced code duplication
*/

export default {
  // This file is for documentation purposes only
  // See actual implementation in components
};
