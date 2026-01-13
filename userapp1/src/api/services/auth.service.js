import apiClient from '../client';
import API_ENDPOINTS from '../endpoints';
import EncryptedStorage from 'react-native-encrypted-storage';

/**
 * Authentication Service
 * Handles user authentication, OTP verification, and session management
 */

/**
 * Login user with phone number
 * @param {string} phoneNumber - User's phone number
 * @returns {Promise<Object>} - Login response with token
 */
export const login = async phoneNumber => {
  try {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
      phone_number: phoneNumber,
    });
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Send OTP to user's phone number
 * @param {string} mobileNumber - User's mobile number
 * @returns {Promise<Object>} - OTP send response with verificationId
 */
export const sendOTP = async mobileNumber => {
  try {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.SEND_OTP, {
      mobileNumber,
    });
    return response.data;
  } catch (error) {
    console.error('Send OTP error:', error);
    throw error;
  }
};

/**
 * Verify OTP code
 * @param {string} mobileNumber - User's mobile number
 * @param {string} verificationId - Verification ID from sendOTP
 * @param {string} otpCode - OTP code entered by user
 * @returns {Promise<Object>} - Verification response
 */
export const verifyOTP = async (mobileNumber, verificationId, otpCode) => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.AUTH.VALIDATE_OTP, {
      params: {
        mobileNumber,
        verificationId,
        otpCode,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Verify OTP error:', error);
    throw error;
  }
};

/**
 * Signup new user
 * @param {Object} userData - User signup data
 * @param {string} userData.fullName - User's full name
 * @param {string} userData.email - User's email
 * @param {string} userData.phoneNumber - User's phone number
 * @param {string} userData.referralCode - Optional referral code
 * @returns {Promise<Object>} - Signup response with token
 */
export const signup = async userData => {
  try {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.SIGNUP, userData);
    return response.data;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

/**
 * Logout user and clear FCM token
 * @param {string} fcmToken - User's FCM token
 * @returns {Promise<Object>} - Logout response
 */
export const logout = async fcmToken => {
  try {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, {
      user_fcm_token: fcmToken,
    });

    // Clear all stored tokens
    await EncryptedStorage.removeItem('cs_token');
    await EncryptedStorage.removeItem('user_fcm_token');
    await EncryptedStorage.removeItem('notifications');
    await EncryptedStorage.removeItem('messageBox');

    return response.data;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

/**
 * Store FCM token for push notifications
 * @param {string} fcmToken - Firebase Cloud Messaging token
 * @returns {Promise<Object>} - Response confirmation
 */
export const storeFCMToken = async fcmToken => {
  try {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.STORE_FCM_TOKEN, {
      fcm_token: fcmToken,
    });
    return response.data;
  } catch (error) {
    console.error('Store FCM token error:', error);
    throw error;
  }
};

export default {
  login,
  sendOTP,
  verifyOTP,
  signup,
  logout,
  storeFCMToken,
};
