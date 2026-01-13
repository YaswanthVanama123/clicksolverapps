import apiClient from '../client';
import API_ENDPOINTS from '../endpoints';

/**
 * User Service
 * Handles user profile management, location, offers, and referrals
 */

/**
 * Get user profile details
 * @returns {Promise<Object>} - User profile data
 */
export const getUserProfile = async () => {
  try {
    const response = await apiClient.post(API_ENDPOINTS.USER.PROFILE, {});
    return response.data;
  } catch (error) {
    console.error('Get user profile error:', error);
    throw error;
  }
};

/**
 * Get user data
 * @returns {Promise<Object>} - User data including phone and name
 */
export const getUser = async () => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.USER.GET_USER);
    return response.data;
  } catch (error) {
    console.error('Get user error:', error);
    throw error;
  }
};

/**
 * Update user profile
 * @param {Object} profileData - Updated profile data
 * @param {string} profileData.name - User's name
 * @param {string} profileData.email - User's email
 * @param {string} profileData.phone - User's phone number
 * @returns {Promise<Object>} - Update confirmation
 */
export const updateUserProfile = async profileData => {
  try {
    const response = await apiClient.post(
      API_ENDPOINTS.USER.UPDATE_PROFILE,
      profileData,
    );
    return response.data;
  } catch (error) {
    console.error('Update user profile error:', error);
    throw error;
  }
};

/**
 * Update user profile image
 * @param {string} profileImageUrl - URL of the uploaded profile image
 * @returns {Promise<Object>} - Update confirmation
 */
export const updateProfileImage = async profileImageUrl => {
  try {
    const response = await apiClient.post(
      API_ENDPOINTS.USER.UPDATE_PROFILE_IMAGE,
      {profileImage: profileImageUrl},
    );
    return response.data;
  } catch (error) {
    console.error('Update profile image error:', error);
    throw error;
  }
};

/**
 * Delete user account
 * @param {Object} deleteData - Account deletion data
 * @param {string} deleteData.name - User's name
 * @param {string} deleteData.email - User's email
 * @param {string} deleteData.phone - User's phone number
 * @returns {Promise<Object>} - Deletion confirmation
 */
export const deleteUserAccount = async deleteData => {
  try {
    const response = await apiClient.post(
      API_ENDPOINTS.USER.DELETE_ACCOUNT,
      deleteData,
    );
    return response.data;
  } catch (error) {
    console.error('Delete user account error:', error);
    throw error;
  }
};

/**
 * Store user location
 * @param {Object} locationData - Location coordinates
 * @param {string} locationData.longitude - Longitude coordinate
 * @param {string} locationData.latitude - Latitude coordinate
 * @returns {Promise<Object>} - Location storage confirmation
 */
export const storeUserLocation = async locationData => {
  try {
    const response = await apiClient.post(
      API_ENDPOINTS.USER.LOCATION,
      locationData,
    );
    return response.data;
  } catch (error) {
    console.error('Store user location error:', error);
    throw error;
  }
};

/**
 * Get user offers
 * @returns {Promise<Object>} - List of available offers
 */
export const getUserOffers = async () => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.OFFERS.GET_USER_OFFERS);
    return response.data;
  } catch (error) {
    console.error('Get user offers error:', error);
    throw error;
  }
};

/**
 * Validate offer code
 * @param {Object} offerData - Offer validation data
 * @param {string} offerData.offer_code - Offer code to validate
 * @param {number} offerData.totalAmount - Total booking amount
 * @returns {Promise<Object>} - Validation result with discount details
 */
export const validateOffer = async offerData => {
  try {
    const response = await apiClient.post(
      API_ENDPOINTS.OFFERS.VALIDATE_OFFER,
      offerData,
    );
    return response.data;
  } catch (error) {
    console.error('Validate offer error:', error);
    throw error;
  }
};

/**
 * Get user referrals
 * @returns {Promise<Array>} - List of user referrals
 */
export const getUserReferrals = async () => {
  try {
    const response = await apiClient.get(
      API_ENDPOINTS.REFERRALS.GET_REFERRALS,
    );
    return response.data;
  } catch (error) {
    console.error('Get user referrals error:', error);
    throw error;
  }
};

/**
 * Submit user feedback
 * @param {Object} feedbackData - Feedback details
 * @param {number} feedbackData.rating - Rating (1-5)
 * @param {string} feedbackData.comment - Feedback comment
 * @param {string} feedbackData.notification_id - Related notification ID
 * @returns {Promise<Object>} - Feedback submission confirmation
 */
export const submitFeedback = async feedbackData => {
  try {
    const response = await apiClient.post(
      API_ENDPOINTS.FEEDBACK.SUBMIT_FEEDBACK,
      feedbackData,
    );
    return response.data;
  } catch (error) {
    console.error('Submit feedback error:', error);
    throw error;
  }
};

/**
 * Translate text
 * @param {Object} translationData - Translation request data
 * @param {string} translationData.text - Text to translate
 * @param {string} translationData.fromLang - Source language code
 * @param {string} translationData.toLang - Target language code
 * @returns {Promise<Object>} - Translated text
 */
export const translateText = async translationData => {
  try {
    const response = await apiClient.post(
      API_ENDPOINTS.TRANSLATION.TRANSLATE,
      translationData,
    );
    return response.data;
  } catch (error) {
    console.error('Translate text error:', error);
    throw error;
  }
};

export default {
  getUserProfile,
  getUser,
  updateUserProfile,
  updateProfileImage,
  deleteUserAccount,
  storeUserLocation,
  getUserOffers,
  validateOffer,
  getUserReferrals,
  submitFeedback,
  translateText,
};
