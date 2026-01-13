import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';

const API_BASE_URL = 'https://backend.clicksolver.com/api';

/**
 * Send user location to backend
 * @param {number} longitude
 * @param {number} latitude
 * @returns {Promise<Object>}
 */
export const sendUserLocation = async (longitude, latitude) => {
  try {
    const token = await EncryptedStorage.getItem('cs_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.post(
      `${API_BASE_URL}/user/location`,
      {
        longitude: String(longitude),
        latitude: String(latitude),
      },
      {
        headers: {Authorization: `Bearer ${token}`},
      },
    );

    return {success: true, data: response.data};
  } catch (error) {
    console.error('Failed to send user location:', error);
    return {success: false, error: error.message};
  }
};

/**
 * Fetch user data from backend
 * @returns {Promise<Object>}
 */
export const fetchUserData = async () => {
  try {
    const token = await EncryptedStorage.getItem('cs_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.get(`${API_BASE_URL}/get/user`, {
      headers: {Authorization: `Bearer ${token}`},
    });

    if (response.status === 200) {
      return {
        success: true,
        data: {
          phoneNumber: response.data.phone_number || '',
          name: response.data.name || '',
        },
      };
    }

    return {success: false, error: 'Unexpected response'};
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    return {success: false, error: error.message};
  }
};

/**
 * Send reminder request for out-of-service location
 * @param {string} area
 * @param {string} city
 * @returns {Promise<Object>}
 */
export const sendReminder = async (area, city) => {
  try {
    const token = await EncryptedStorage.getItem('cs_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.post(
      `${API_BASE_URL}/send/reminder`,
      {area, city},
      {
        headers: {Authorization: `Bearer ${token}`},
      },
    );

    return {success: true, data: response.data};
  } catch (error) {
    console.error('Failed to send reminder:', error);
    return {success: false, error: error.message};
  }
};
