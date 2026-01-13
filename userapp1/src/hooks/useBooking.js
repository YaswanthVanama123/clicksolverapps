import { useState, useCallback } from 'react';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import useAuth from './useAuth';

const API_BASE_URL = 'https://backend.clicksolver.com/api';

/**
 * Custom hook for booking operations
 * Provides high-level booking functions that handle API calls and state management
 *
 * @returns {Object} Booking state and methods
 * @property {Array} bookings - List of bookings
 * @property {Object|null} currentBooking - Currently active booking
 * @property {boolean} loading - Loading state
 * @property {Error|null} error - Error object if operation failed
 * @property {Function} quickBook - Quick booking for a service
 * @property {Function} instantBook - Book using saved preference
 * @property {Function} cancelBooking - Cancel a booking
 * @property {Function} getBookingDetails - Get details of a specific booking
 * @property {Function} getBookingHistory - Get user's booking history
 * @property {Function} rateBooking - Rate a completed booking
 * @property {Function} refreshBookings - Refresh bookings list
 */
const useBooking = () => {
  const { getToken } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Get authorization headers
   * @returns {Promise<Object>} Headers object with authorization
   */
  const getAuthHeaders = useCallback(async () => {
    const token = await getToken();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }, [getToken]);

  /**
   * Quick book a service
   * @param {string|number} serviceId - Service ID to book
   * @param {string|number} addressId - Address ID for service location
   * @param {Object} additionalData - Additional booking data (time, date, notes, etc.)
   * @returns {Promise<Object>} Booking confirmation data
   */
  const quickBook = useCallback(
    async (serviceId, addressId, additionalData = {}) => {
      try {
        setLoading(true);
        setError(null);

        const headers = await getAuthHeaders();
        const bookingData = {
          service_id: serviceId,
          address_id: addressId,
          ...additionalData,
        };

        const response = await axios.post(
          `${API_BASE_URL}/bookings/quick-book`,
          bookingData,
          { headers }
        );

        const newBooking = response.data.booking || response.data;
        setCurrentBooking(newBooking);

        // Add to bookings list
        setBookings((prev) => [newBooking, ...prev]);

        return newBooking;
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || err.message || 'Failed to create booking';
        console.error('quickBook error:', errorMessage, err);

        const errorObject = {
          message: errorMessage,
          status: err.response?.status,
          data: err.response?.data,
          originalError: err,
        };

        setError(errorObject);
        throw errorObject;
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders]
  );

  /**
   * Instant book using saved preference
   * @param {string|number} preferenceId - Saved booking preference ID
   * @returns {Promise<Object>} Booking confirmation data
   */
  const instantBook = useCallback(
    async (preferenceId) => {
      try {
        setLoading(true);
        setError(null);

        const headers = await getAuthHeaders();

        const response = await axios.post(
          `${API_BASE_URL}/bookings/instant-book`,
          { preference_id: preferenceId },
          { headers }
        );

        const newBooking = response.data.booking || response.data;
        setCurrentBooking(newBooking);

        // Add to bookings list
        setBookings((prev) => [newBooking, ...prev]);

        return newBooking;
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || err.message || 'Failed to instant book';
        console.error('instantBook error:', errorMessage, err);

        const errorObject = {
          message: errorMessage,
          status: err.response?.status,
          data: err.response?.data,
          originalError: err,
        };

        setError(errorObject);
        throw errorObject;
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders]
  );

  /**
   * Cancel a booking
   * @param {string|number} bookingId - Booking ID to cancel
   * @param {string} reason - Cancellation reason (optional)
   * @returns {Promise<boolean>} Success status
   */
  const cancelBooking = useCallback(
    async (bookingId, reason = '') => {
      try {
        setLoading(true);
        setError(null);

        const headers = await getAuthHeaders();

        await axios.post(
          `${API_BASE_URL}/bookings/${bookingId}/cancel`,
          { reason },
          { headers }
        );

        // Update bookings list
        setBookings((prev) =>
          prev.map((booking) =>
            booking.id === bookingId
              ? { ...booking, status: 'cancelled' }
              : booking
          )
        );

        // Clear current booking if it's the one being cancelled
        if (currentBooking?.id === bookingId) {
          setCurrentBooking(null);
        }

        return true;
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || err.message || 'Failed to cancel booking';
        console.error('cancelBooking error:', errorMessage, err);

        const errorObject = {
          message: errorMessage,
          status: err.response?.status,
          data: err.response?.data,
          originalError: err,
        };

        setError(errorObject);
        throw errorObject;
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders, currentBooking]
  );

  /**
   * Get booking details
   * @param {string|number} bookingId - Booking ID
   * @returns {Promise<Object>} Booking details
   */
  const getBookingDetails = useCallback(
    async (bookingId) => {
      try {
        setLoading(true);
        setError(null);

        const headers = await getAuthHeaders();

        const response = await axios.get(
          `${API_BASE_URL}/bookings/${bookingId}`,
          { headers }
        );

        const booking = response.data.booking || response.data;
        setCurrentBooking(booking);

        return booking;
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || err.message || 'Failed to get booking details';
        console.error('getBookingDetails error:', errorMessage, err);

        const errorObject = {
          message: errorMessage,
          status: err.response?.status,
          data: err.response?.data,
          originalError: err,
        };

        setError(errorObject);
        throw errorObject;
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders]
  );

  /**
   * Get booking history
   * @param {Object} filters - Filter options (status, page, limit, etc.)
   * @returns {Promise<Array>} List of bookings
   */
  const getBookingHistory = useCallback(
    async (filters = {}) => {
      try {
        setLoading(true);
        setError(null);

        const headers = await getAuthHeaders();

        const response = await axios.get(`${API_BASE_URL}/bookings`, {
          headers,
          params: filters,
        });

        const bookingsList = response.data.bookings || response.data || [];
        setBookings(bookingsList);

        return bookingsList;
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || err.message || 'Failed to get booking history';
        console.error('getBookingHistory error:', errorMessage, err);

        const errorObject = {
          message: errorMessage,
          status: err.response?.status,
          data: err.response?.data,
          originalError: err,
        };

        setError(errorObject);
        throw errorObject;
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders]
  );

  /**
   * Rate a completed booking
   * @param {string|number} bookingId - Booking ID
   * @param {number} rating - Rating value (1-5)
   * @param {string} review - Review text (optional)
   * @returns {Promise<boolean>} Success status
   */
  const rateBooking = useCallback(
    async (bookingId, rating, review = '') => {
      try {
        setLoading(true);
        setError(null);

        const headers = await getAuthHeaders();

        await axios.post(
          `${API_BASE_URL}/bookings/${bookingId}/rate`,
          { rating, review },
          { headers }
        );

        // Update bookings list
        setBookings((prev) =>
          prev.map((booking) =>
            booking.id === bookingId
              ? { ...booking, rating, review }
              : booking
          )
        );

        return true;
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || err.message || 'Failed to rate booking';
        console.error('rateBooking error:', errorMessage, err);

        const errorObject = {
          message: errorMessage,
          status: err.response?.status,
          data: err.response?.data,
          originalError: err,
        };

        setError(errorObject);
        throw errorObject;
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders]
  );

  /**
   * Refresh bookings list
   * @returns {Promise<Array>} Updated list of bookings
   */
  const refreshBookings = useCallback(async () => {
    return getBookingHistory();
  }, [getBookingHistory]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset booking state
   */
  const reset = useCallback(() => {
    setBookings([]);
    setCurrentBooking(null);
    setError(null);
  }, []);

  return {
    bookings,
    currentBooking,
    loading,
    error,
    quickBook,
    instantBook,
    cancelBooking,
    getBookingDetails,
    getBookingHistory,
    rateBooking,
    refreshBookings,
    clearError,
    reset,
  };
};

export default useBooking;
