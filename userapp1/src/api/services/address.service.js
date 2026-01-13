import apiClient from '../client';
import API_ENDPOINTS from '../endpoints';

/**
 * Address Service
 * Handles all address-related API operations
 */
const AddressService = {
  /**
   * Get all saved addresses for the user
   * @returns {Promise<Array>} Array of address objects
   */
  getAddresses: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.USER.ADDRESSES);
      return {
        success: true,
        data: response.data.addresses || [],
      };
    } catch (error) {
      console.error('Error fetching addresses:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch addresses',
      };
    }
  },

  /**
   * Add a new address
   * @param {Object} addressData - Address details
   * @returns {Promise<Object>} Created address object
   */
  addAddress: async addressData => {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.USER.ADDRESSES,
        addressData,
      );
      return {
        success: true,
        data: response.data.address,
      };
    } catch (error) {
      console.error('Error adding address:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to add address',
      };
    }
  },

  /**
   * Update an existing address
   * @param {string} addressId - Address ID
   * @param {Object} addressData - Updated address details
   * @returns {Promise<Object>} Updated address object
   */
  updateAddress: async (addressId, addressData) => {
    try {
      const response = await apiClient.put(
        `${API_ENDPOINTS.USER.ADDRESSES}/${addressId}`,
        addressData,
      );
      return {
        success: true,
        data: response.data.address,
      };
    } catch (error) {
      console.error('Error updating address:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update address',
      };
    }
  },

  /**
   * Delete an address
   * @param {string} addressId - Address ID
   * @returns {Promise<Object>} Success status
   */
  deleteAddress: async addressId => {
    try {
      const response = await apiClient.delete(
        `${API_ENDPOINTS.USER.ADDRESSES}/${addressId}`,
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error deleting address:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete address',
      };
    }
  },

  /**
   * Set an address as default
   * @param {string} addressId - Address ID
   * @returns {Promise<Object>} Success status
   */
  setDefaultAddress: async addressId => {
    try {
      const response = await apiClient.patch(
        `${API_ENDPOINTS.USER.ADDRESSES}/${addressId}/default`,
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error setting default address:', error);
      return {
        success: false,
        error:
          error.response?.data?.message || 'Failed to set default address',
      };
    }
  },

  /**
   * Validate if an address is within service area (geofence check)
   * @param {Object} coordinates - {latitude, longitude}
   * @returns {Promise<Object>} Validation result
   */
  validateServiceArea: async coordinates => {
    try {
      const response = await apiClient.post(
        `${API_ENDPOINTS.USER.VALIDATE_SERVICE_AREA}`,
        coordinates,
      );
      return {
        success: true,
        data: response.data,
        isServiceable: response.data.isServiceable,
      };
    } catch (error) {
      console.error('Error validating service area:', error);
      return {
        success: false,
        error:
          error.response?.data?.message || 'Failed to validate service area',
      };
    }
  },

  /**
   * Send reminder for future service expansion
   * @param {Object} data - {city, area, coordinates}
   * @returns {Promise<Object>} Success status
   */
  sendServiceReminder: async data => {
    try {
      const response = await apiClient.post(
        `${API_ENDPOINTS.USER.SERVICE_REMINDER}`,
        data,
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error sending service reminder:', error);
      return {
        success: false,
        error:
          error.response?.data?.message || 'Failed to send service reminder',
      };
    }
  },
};

export default AddressService;
