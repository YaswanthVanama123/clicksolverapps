import { useState, useEffect, useCallback } from 'react';
import EncryptedStorage from 'react-native-encrypted-storage';
import axios from 'axios';

/**
 * Custom hook for authentication management
 * Handles token persistence, user state, and authentication checks
 *
 * @returns {Object} Authentication state and methods
 * @property {boolean} isAuthenticated - Whether user is authenticated
 * @property {Object|null} user - Current user data
 * @property {boolean} loading - Loading state during auth checks
 * @property {Function} login - Login function that saves token and user data
 * @property {Function} logout - Logout function that clears auth data
 * @property {Function} checkAuth - Manually trigger auth check
 * @property {Function} updateUser - Update user data in storage
 */
const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Check authentication status on mount
   * Retrieves token and user data from EncryptedStorage
   */
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await EncryptedStorage.getItem('cs_token');
      const userData = await EncryptedStorage.getItem('user_data');

      if (token) {
        setIsAuthenticated(true);
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (err) {
      console.error('checkAuth error:', err);
      setError(err.message || 'Failed to check authentication');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Login function - stores token and user data
   * @param {string} token - Authentication token
   * @param {Object} userData - User information
   */
  const login = useCallback(async (token, userData) => {
    try {
      setLoading(true);
      setError(null);

      await EncryptedStorage.setItem('cs_token', token);
      if (userData) {
        await EncryptedStorage.setItem('user_data', JSON.stringify(userData));
        setUser(userData);
      }

      setIsAuthenticated(true);
    } catch (err) {
      console.error('login error:', err);
      setError(err.message || 'Failed to save authentication data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Logout function - clears all auth data
   */
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await EncryptedStorage.removeItem('cs_token');
      await EncryptedStorage.removeItem('user_data');
      await EncryptedStorage.removeItem('user_fcm_token');

      setIsAuthenticated(false);
      setUser(null);
    } catch (err) {
      console.error('logout error:', err);
      setError(err.message || 'Failed to logout');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update user data without changing token
   * @param {Object} userData - Updated user information
   */
  const updateUser = useCallback(async (userData) => {
    try {
      setError(null);
      await EncryptedStorage.setItem('user_data', JSON.stringify(userData));
      setUser(userData);
    } catch (err) {
      console.error('updateUser error:', err);
      setError(err.message || 'Failed to update user data');
      throw err;
    }
  }, []);

  /**
   * Get current auth token
   * @returns {Promise<string|null>} The authentication token
   */
  const getToken = useCallback(async () => {
    try {
      return await EncryptedStorage.getItem('cs_token');
    } catch (err) {
      console.error('getToken error:', err);
      return null;
    }
  }, []);

  // Auto-check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    isAuthenticated,
    user,
    loading,
    error,
    login,
    logout,
    checkAuth,
    updateUser,
    getToken,
  };
};

export default useAuth;
