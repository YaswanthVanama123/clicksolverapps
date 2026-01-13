import apiClient from '../client';
import API_ENDPOINTS from '../endpoints';

/**
 * Offer Service
 * Handles offer validation and management
 */

/**
 * Get all available offers for user
 * @returns {Promise<Array>} - List of available offers
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
 * Validate and get best offer for a service
 * Automatically finds the best applicable offer
 * @param {Object} offerData - Offer validation data
 * @param {string} offerData.serviceId - Service ID to check offers for
 * @param {number} offerData.servicePrice - Service price
 * @param {string} offerData.offerCode - Optional specific offer code to validate
 * @returns {Promise<Object>} - Best offer details or validation result
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
 * Get best available offer for quick booking
 * @param {string} serviceId - Service ID
 * @param {number} servicePrice - Service price
 * @returns {Promise<Object>} - Best offer or null
 */
export const getBestOffer = async (serviceId, servicePrice) => {
  try {
    const response = await validateOffer({
      serviceId,
      servicePrice,
    });

    if (response.success && response.offer) {
      return response.offer;
    }
    return null;
  } catch (error) {
    console.log('No best offer available:', error);
    return null;
  }
};

export default {
  getUserOffers,
  validateOffer,
  getBestOffer,
};
