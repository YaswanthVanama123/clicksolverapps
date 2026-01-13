import apiClient from '../client';
import API_ENDPOINTS from '../endpoints';

/**
 * Booking Service
 * Handles service booking, worker search, and booking management
 */

/**
 * Get all available services for home screen
 * @returns {Promise<Array>} - List of available services
 */
export const getServices = async () => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.SERVICES.HOME_SERVICES);
    return response.data;
  } catch (error) {
    console.error('Get services error:', error);
    throw error;
  }
};

/**
 * Get service categories
 * @returns {Promise<Array>} - List of service categories
 */
export const getServiceCategories = async () => {
  try {
    const response = await apiClient.get(
      API_ENDPOINTS.SERVICES.SERVICE_CATEGORIES,
    );
    return response.data;
  } catch (error) {
    console.error('Get service categories error:', error);
    throw error;
  }
};

/**
 * Get single service details by service name
 * @param {string} serviceName - Name of the service
 * @returns {Promise<Object>} - Service details with related services
 */
export const getSingleService = async serviceName => {
  try {
    const response = await apiClient.post(
      API_ENDPOINTS.SERVICES.SINGLE_SERVICE,
      {serviceName},
    );
    return response.data;
  } catch (error) {
    console.error('Get single service error:', error);
    throw error;
  }
};

/**
 * Find workers nearby based on location and service requirements
 * @param {Object} bookingData - Booking details
 * @param {string} bookingData.area - Service area
 * @param {string} bookingData.city - Service city
 * @param {string} bookingData.pincode - Service pincode
 * @param {string} bookingData.alternateName - Alternate contact name
 * @param {string} bookingData.alternatePhoneNumber - Alternate phone number
 * @param {Array} bookingData.serviceBooked - List of services booked
 * @param {number} bookingData.discount - Discount amount
 * @param {number} bookingData.tipAmount - Tip amount
 * @param {Object} bookingData.offer - Offer object if any
 * @returns {Promise<Object>} - Encoded worker data or error message
 */
export const findWorkersNearby = async bookingData => {
  try {
    const response = await apiClient.post(
      API_ENDPOINTS.BOOKING.FIND_WORKERS_NEARBY,
      bookingData,
    );
    return response.data;
  } catch (error) {
    console.error('Find workers nearby error:', error);
    throw error;
  }
};

/**
 * Check booking status
 * @param {string} userNotificationId - Encoded notification ID
 * @returns {Promise<Object>} - Booking status information
 */
export const checkBookingStatus = async userNotificationId => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.BOOKING.CHECK_STATUS, {
      params: {user_notification_id: userNotificationId},
    });
    return response.data;
  } catch (error) {
    console.error('Check booking status error:', error);
    throw error;
  }
};

/**
 * Cancel booking
 * @param {Object} cancellationData - Cancellation details
 * @param {string} cancellationData.user_notification_id - Notification ID
 * @param {string} cancellationData.cancellation_reason - Reason for cancellation
 * @returns {Promise<Object>} - Cancellation confirmation
 */
export const cancelBooking = async cancellationData => {
  try {
    const response = await apiClient.post(
      API_ENDPOINTS.BOOKING.CANCEL_BOOKING,
      cancellationData,
    );
    return response.data;
  } catch (error) {
    console.error('Cancel booking error:', error);
    throw error;
  }
};

/**
 * Create user action for tracking
 * @param {Object} actionData - Action details
 * @param {string} actionData.encodedId - Encoded booking ID
 * @param {string} actionData.screen - Current screen name
 * @param {Array} actionData.serviceBooked - Services booked
 * @param {string} actionData.area - Service area
 * @param {string} actionData.city - Service city
 * @param {string} actionData.pincode - Service pincode
 * @param {string} actionData.alternateName - Alternate contact name
 * @param {string} actionData.alternatePhoneNumber - Alternate phone number
 * @param {Array} actionData.location - Location coordinates [longitude, latitude]
 * @param {number} actionData.discount - Discount amount
 * @param {number} actionData.tipAmount - Tip amount
 * @param {Object} actionData.offer - Offer object if any
 * @returns {Promise<Object>} - Action creation confirmation
 */
export const createUserAction = async actionData => {
  try {
    const response = await apiClient.post(
      API_ENDPOINTS.BOOKING.CREATE_USER_ACTION,
      actionData,
    );
    return response.data;
  } catch (error) {
    console.error('Create user action error:', error);
    throw error;
  }
};

/**
 * Cancel user action
 * @param {Object} cancelData - Cancel action data
 * @param {string} cancelData.encodedId - Encoded booking ID
 * @param {string} cancelData.screen - Screen name
 * @param {Object} cancelData.offer - Offer object if any
 * @returns {Promise<Object>} - Cancel action confirmation
 */
export const cancelUserAction = async cancelData => {
  try {
    const response = await apiClient.post(
      API_ENDPOINTS.BOOKING.CANCEL_USER_ACTION,
      cancelData,
    );
    return response.data;
  } catch (error) {
    console.error('Cancel user action error:', error);
    throw error;
  }
};

/**
 * Get track details for user
 * @returns {Promise<Object>} - Track details with user info and bookings
 */
export const getTrackDetails = async () => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.BOOKING.TRACK_DETAILS);
    return response.data;
  } catch (error) {
    console.error('Get track details error:', error);
    throw error;
  }
};

/**
 * Quick book service with saved preferences
 * Instantly books a service without confirmation screens
 * @param {Object} bookingData - Quick booking details
 * @param {string} bookingData.serviceId - Service ID
 * @param {string} bookingData.serviceName - Service name
 * @param {Array} bookingData.serviceBooked - List of services to book
 * @param {string} bookingData.area - Service area
 * @param {string} bookingData.city - Service city
 * @param {string} bookingData.pincode - Service pincode
 * @param {Array} bookingData.location - Location coordinates [longitude, latitude]
 * @param {string} bookingData.alternateName - Contact name
 * @param {string} bookingData.alternatePhoneNumber - Contact phone
 * @param {number} bookingData.tipAmount - Tip amount (default 0)
 * @param {number} bookingData.discount - Discount amount
 * @param {Object} bookingData.offer - Applied offer object
 * @returns {Promise<Object>} - Quick booking response with bookingId and encodedId
 */
export const quickBook = async bookingData => {
  try {
    // Use the existing findWorkersNearby endpoint for quick booking
    // The backend will handle immediate booking and worker search in background
    const response = await apiClient.post(
      API_ENDPOINTS.BOOKING.QUICK_BOOK,
      {
        ...bookingData,
        quickBook: true, // Flag to indicate this is a quick book
      },
    );
    return response.data;
  } catch (error) {
    console.error('Quick book error:', error);
    throw error;
  }
};

export default {
  getServices,
  getServiceCategories,
  getSingleService,
  findWorkersNearby,
  checkBookingStatus,
  cancelBooking,
  createUserAction,
  cancelUserAction,
  getTrackDetails,
  quickBook,
};
