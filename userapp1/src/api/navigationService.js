import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';

const BASE_URL = 'https://backend.clicksolver.com/api';

/**
 * Fetch worker details for navigation screen
 * @param {string} notificationId - Decoded notification ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const fetchWorkerDetails = async notificationId => {
  try {
    const jwtToken = await EncryptedStorage.getItem('cs_token');
    const response = await axios.post(
      `${BASE_URL}/worker/navigation/details`,
      {notificationId},
      {headers: {Authorization: `Bearer ${jwtToken}`}},
    );

    if (response.status === 404) {
      return {success: false, error: 'Worker not found', status: 404};
    }

    const {
      name,
      phone_number,
      pin,
      profile,
      pincode,
      area,
      city,
      service_booked,
      average_rating,
      service_counts,
    } = response.data;

    return {
      success: true,
      data: {
        name,
        phoneNumber: phone_number,
        pin: String(pin),
        profile,
        pincode,
        area,
        city,
        serviceBooked: service_booked,
        rating: average_rating,
        serviceCounts: service_counts,
      },
    };
  } catch (error) {
    console.error('Error fetching worker details:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Check worker verification status
 * @param {string} notificationId - Decoded notification ID
 * @returns {Promise<{success: boolean, isVerified: boolean, error?: string}>}
 */
export const checkVerificationStatus = async notificationId => {
  try {
    const response = await axios.get(
      `${BASE_URL}/worker/verification/status`,
      {params: {notification_id: notificationId}},
    );

    return {
      success: true,
      isVerified: response.data === 'true',
    };
  } catch (error) {
    console.error('Error checking verification status:', error);
    return {
      success: false,
      isVerified: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Fetch location details (start and end points)
 * @param {string} notificationId - Decoded notification ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const fetchLocationDetails = async notificationId => {
  try {
    const response = await axios.get(`${BASE_URL}/user/location/navigation`, {
      params: {notification_id: notificationId},
    });

    const {startPoint, endPoint} = response.data;
    // Reverse from [lat, lng] to [lng, lat]
    const reversedStart = startPoint.map(parseFloat).reverse();
    const reversedEnd = endPoint.map(parseFloat).reverse();

    return {
      success: true,
      data: {
        startPoint: reversedStart,
        endPoint: reversedEnd,
      },
    };
  } catch (error) {
    console.error('Error fetching location details:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Fetch route from Ola Maps API
 * @param {Array} startPoint - [lng, lat]
 * @param {Array} endPoint - [lng, lat]
 * @param {Array} waypoints - Optional waypoints [[lng, lat], ...]
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const fetchOlaRoute = async (startPoint, endPoint, waypoints = []) => {
  try {
    const apiKey = 'iN1RT7PQ41Z0DVxin6jlf7xZbmbIZPtb9CyNwtlT';
    let url = `https://api.olamaps.io/routing/v1/directions?origin=${startPoint[1]},${startPoint[0]}&destination=${endPoint[1]},${endPoint[0]}&api_key=${apiKey}`;

    if (waypoints.length > 0) {
      const waypointParams = waypoints
        .map(point => `${point[1]},${point[0]}`)
        .join('|');
      url += `&waypoints=${encodeURIComponent(waypointParams)}`;
    }

    const response = await axios.post(
      url,
      {},
      {
        headers: {
          'X-Request-Id': 'unique-request-id',
        },
      },
    );

    if (!response.data.routes || response.data.routes.length === 0) {
      return {success: false, error: 'No routes returned by Ola Maps'};
    }

    const routeEncoded = response.data.routes[0].overview_polyline;
    if (!routeEncoded) {
      return {success: false, error: 'No overview_polyline in Ola route'};
    }

    return {success: true, data: routeEncoded};
  } catch (error) {
    console.error('Error fetching route from Ola Maps:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Cancel booking on navigation screen
 * @param {string} notificationId - Decoded notification ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const cancelNavigationBooking = async notificationId => {
  try {
    const response = await axios.post(`${BASE_URL}/user/work/cancel`, {
      notification_id: notificationId,
    });

    if (response.status === 200) {
      return {success: true};
    } else {
      return {
        success: false,
        error: 'Your cancellation time of 2 minutes is over.',
      };
    }
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Error processing cancellation',
    };
  }
};

/**
 * Get worker phone number for calling
 * @param {string} decodedId - Decoded notification ID
 * @returns {Promise<{success: boolean, phoneNumber?: string, error?: string}>}
 */
export const getWorkerPhoneNumber = async decodedId => {
  try {
    const response = await axios.post(`${BASE_URL}/worker/call`, {decodedId});

    if (response.status === 200 && response.data.mobile) {
      return {success: true, phoneNumber: response.data.mobile};
    } else {
      return {success: false, error: 'Failed to get phone number'};
    }
  } catch (error) {
    console.error('Error getting worker phone:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};
