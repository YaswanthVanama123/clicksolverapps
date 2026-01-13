import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';

// Base URL for all API requests
const BASE_URL = 'https://backend.clicksolver.com';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * Automatically attaches JWT token from EncryptedStorage to all requests
 */
apiClient.interceptors.request.use(
  async config => {
    try {
      // Get JWT token from encrypted storage
      const token = await EncryptedStorage.getItem('cs_token');

      // If token exists, add it to the Authorization header
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    } catch (error) {
      console.error('Error retrieving token from storage:', error);
      return config;
    }
  },
  error => {
    return Promise.reject(error);
  },
);

/**
 * Response Interceptor
 * Handles common response errors and performs automatic token cleanup on 401
 */
apiClient.interceptors.response.use(
  response => {
    // Return successful response
    return response;
  },
  async error => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response && error.response.status === 401) {
      try {
        // Clear all authentication data
        await EncryptedStorage.removeItem('cs_token');
        await EncryptedStorage.removeItem('user_fcm_token');
        await EncryptedStorage.removeItem('notifications');
        await EncryptedStorage.removeItem('messageBox');

        console.log('Unauthorized access - Token cleared');

        // You can dispatch a navigation action here if needed
        // Example: NavigationService.navigate('Login');
      } catch (storageError) {
        console.error('Error clearing storage on 401:', storageError);
      }
    }

    // Handle 403 Forbidden
    if (error.response && error.response.status === 403) {
      console.error('Forbidden access - insufficient permissions');
    }

    // Handle 404 Not Found
    if (error.response && error.response.status === 404) {
      console.error('Resource not found');
    }

    // Handle 500 Internal Server Error
    if (error.response && error.response.status === 500) {
      console.error('Internal server error - Please try again later');
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error - Please check your internet connection');
    }

    return Promise.reject(error);
  },
);

export default apiClient;
export {BASE_URL};
