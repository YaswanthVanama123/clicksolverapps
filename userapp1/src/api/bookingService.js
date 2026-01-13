import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import {Buffer} from 'buffer';

const API_BASE_URL = 'https://backend.clicksolver.com/api';

/**
 * Fetch nearby workers and create booking request
 */
export const fetchNearbyWorkers = async ({
  area,
  city,
  pincode,
  alternateName,
  alternatePhoneNumber,
  serviceBooked,
  discount,
  tipAmount,
  offer,
}) => {
  try {
    const jwtToken = await EncryptedStorage.getItem('cs_token');
    if (!jwtToken) {
      return {success: false, error: 'No authentication token'};
    }

    const response = await axios.post(
      `${API_BASE_URL}/workers-nearby`,
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
      {headers: {Authorization: `Bearer ${jwtToken}`}},
    );

    if (response.status === 200) {
      const encodedData = response.data;

      // If we got a valid encoded ID, create user action
      if (
        encodedData &&
        encodedData !== 'No workers found within 2 km radius' &&
        encodedData !== 'No user found or no worker matches subservices' &&
        encodedData !== 'No Firestore location data for these workers' &&
        encodedData !== 'No workers match the requested subservices'
      ) {
        await axios.post(
          `${API_BASE_URL}/user/action`,
          {
            encodedId: encodedData,
            screen: 'userwaiting',
            serviceBooked,
            area,
            city,
            pincode,
            alternateName,
            alternatePhoneNumber,
            location: null, // Will be set by caller
            discount,
            tipAmount,
            offer,
          },
          {headers: {Authorization: `Bearer ${jwtToken}`}},
        );
      }

      return {success: true, data: encodedData};
    }

    return {success: false, error: 'Unexpected response status'};
  } catch (error) {
    console.error('Error fetching nearby workers:', error);
    return {success: false, error: error.message};
  }
};

/**
 * Check booking status
 */
export const checkBookingStatus = async (userNotificationId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/checking/status`, {
      params: {user_notification_id: userNotificationId},
    });

    return {
      success: true,
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    console.error('Error checking booking status:', error);
    return {success: false, error: error.message};
  }
};

/**
 * Cancel booking with reason
 */
export const cancelBooking = async (userNotificationId, cancellationReason, encodedData, offer) => {
  try {
    // Cancel via notification ID
    await axios.post(`${API_BASE_URL}/user/cancellation`, {
      user_notification_id: userNotificationId,
      cancellation_reason: cancellationReason,
    });

    // Cancel user action
    const cs_token = await EncryptedStorage.getItem('cs_token');
    await axios.post(
      `${API_BASE_URL}/user/action/cancel`,
      {encodedId: encodedData, screen: 'userwaiting', offer},
      {headers: {Authorization: `Bearer ${cs_token}`}},
    );

    return {success: true};
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return {success: false, error: error.message};
  }
};

/**
 * Cancel booking and retry (without reason)
 */
export const cancelAndRetry = async (decodedId, encodedData, offer) => {
  try {
    if (decodedId) {
      await axios.post(`${API_BASE_URL}/user/cancellation`, {
        user_notification_id: decodedId,
      });
    }

    const cs_token = await EncryptedStorage.getItem('cs_token');
    await axios.post(
      `${API_BASE_URL}/user/action/cancel`,
      {encodedId: encodedData, screen: 'userwaiting', offer},
      {headers: {Authorization: `Bearer ${cs_token}`}},
    );

    return {success: true};
  } catch (error) {
    console.error('Error in cancel and retry:', error);
    return {success: false, error: error.message};
  }
};

/**
 * Create user action for navigation screen
 */
export const createUserAction = async (encodedId, screen, serviceBooked, offer) => {
  try {
    const cs_token = await EncryptedStorage.getItem('cs_token');

    await axios.post(
      `${API_BASE_URL}/user/action`,
      {
        encodedId,
        screen,
        serviceBooked,
        offer,
      },
      {headers: {Authorization: `Bearer ${cs_token}`}},
    );

    return {success: true};
  } catch (error) {
    console.error('Error creating user action:', error);
    return {success: false, error: error.message};
  }
};
