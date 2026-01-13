import apiClient from '../client';
import API_ENDPOINTS from '../endpoints';

/**
 * Worker Service
 * Handles worker-related operations
 */

/**
 * Get worker navigation details
 * @param {Object} navigationData - Navigation request data
 * @param {string} navigationData.workerId - Worker ID
 * @param {string} navigationData.bookingId - Booking ID
 * @returns {Promise<Object>} - Worker navigation details
 */
export const getWorkerNavigationDetails = async navigationData => {
  try {
    const response = await apiClient.post(
      API_ENDPOINTS.WORKER.NAVIGATION_DETAILS,
      navigationData,
    );
    return response.data;
  } catch (error) {
    console.error('Get worker navigation details error:', error);
    throw error;
  }
};

/**
 * Get worker verification status
 * @param {string} encodedId - Encoded worker/booking ID
 * @returns {Promise<Object>} - Worker verification status
 */
export const getWorkerVerificationStatus = async encodedId => {
  try {
    const response = await apiClient.get(
      API_ENDPOINTS.WORKER.VERIFICATION_STATUS,
      {
        params: {encodedId},
      },
    );
    return response.data;
  } catch (error) {
    console.error('Get worker verification status error:', error);
    throw error;
  }
};

/**
 * Initiate call to worker
 * @param {Object} callData - Call initiation data
 * @param {string} callData.workerId - Worker ID
 * @param {string} callData.bookingId - Booking ID
 * @returns {Promise<Object>} - Call initiation response
 */
export const initiateWorkerCall = async callData => {
  try {
    const response = await apiClient.post(
      API_ENDPOINTS.WORKER.INITIATE_CALL,
      callData,
    );
    return response.data;
  } catch (error) {
    console.error('Initiate worker call error:', error);
    throw error;
  }
};

export default {
  getWorkerNavigationDetails,
  getWorkerVerificationStatus,
  initiateWorkerCall,
};
