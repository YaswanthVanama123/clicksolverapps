import { useState, useCallback } from 'react';
import EncryptedStorage from 'react-native-encrypted-storage';

/**
 * Custom hook providing abstraction over EncryptedStorage
 * Handles encrypted storage operations with loading states and error handling
 *
 * @returns {Object} Storage methods and state
 * @property {Function} getItem - Retrieve item from storage
 * @property {Function} setItem - Store item in storage
 * @property {Function} removeItem - Remove item from storage
 * @property {Function} clear - Clear all storage
 * @property {boolean} loading - Loading state
 * @property {Error|null} error - Error object if operation failed
 */
const useStorage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Get item from encrypted storage
   * @param {string} key - Storage key
   * @param {boolean} parse - Whether to JSON.parse the value (default: true)
   * @returns {Promise<any>} The stored value
   */
  const getItem = useCallback(async (key, parse = true) => {
    try {
      setLoading(true);
      setError(null);

      const value = await EncryptedStorage.getItem(key);

      if (value && parse) {
        try {
          return JSON.parse(value);
        } catch (parseError) {
          // If JSON.parse fails, return raw value
          console.warn(`Failed to parse value for key "${key}", returning raw value`);
          return value;
        }
      }

      return value;
    } catch (err) {
      const errorMessage = `Failed to get item "${key}": ${err.message}`;
      console.error(errorMessage, err);
      setError({ message: errorMessage, originalError: err });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Set item in encrypted storage
   * @param {string} key - Storage key
   * @param {any} value - Value to store (will be JSON.stringified if object)
   * @returns {Promise<boolean>} Success status
   */
  const setItem = useCallback(async (key, value) => {
    try {
      setLoading(true);
      setError(null);

      const stringValue = typeof value === 'string'
        ? value
        : JSON.stringify(value);

      await EncryptedStorage.setItem(key, stringValue);
      return true;
    } catch (err) {
      const errorMessage = `Failed to set item "${key}": ${err.message}`;
      console.error(errorMessage, err);
      setError({ message: errorMessage, originalError: err });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Remove item from encrypted storage
   * @param {string} key - Storage key
   * @returns {Promise<boolean>} Success status
   */
  const removeItem = useCallback(async (key) => {
    try {
      setLoading(true);
      setError(null);

      await EncryptedStorage.removeItem(key);
      return true;
    } catch (err) {
      const errorMessage = `Failed to remove item "${key}": ${err.message}`;
      console.error(errorMessage, err);
      setError({ message: errorMessage, originalError: err });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear all items from encrypted storage
   * @returns {Promise<boolean>} Success status
   */
  const clear = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await EncryptedStorage.clear();
      return true;
    } catch (err) {
      const errorMessage = `Failed to clear storage: ${err.message}`;
      console.error(errorMessage, err);
      setError({ message: errorMessage, originalError: err });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get multiple items from storage at once
   * @param {string[]} keys - Array of storage keys
   * @param {boolean} parse - Whether to JSON.parse values (default: true)
   * @returns {Promise<Object>} Object with keys and their values
   */
  const getMultipleItems = useCallback(async (keys, parse = true) => {
    try {
      setLoading(true);
      setError(null);

      const results = {};

      await Promise.all(
        keys.map(async (key) => {
          const value = await EncryptedStorage.getItem(key);

          if (value && parse) {
            try {
              results[key] = JSON.parse(value);
            } catch (parseError) {
              results[key] = value;
            }
          } else {
            results[key] = value;
          }
        })
      );

      return results;
    } catch (err) {
      const errorMessage = `Failed to get multiple items: ${err.message}`;
      console.error(errorMessage, err);
      setError({ message: errorMessage, originalError: err });
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Set multiple items in storage at once
   * @param {Object} items - Object with key-value pairs to store
   * @returns {Promise<boolean>} Success status
   */
  const setMultipleItems = useCallback(async (items) => {
    try {
      setLoading(true);
      setError(null);

      await Promise.all(
        Object.entries(items).map(([key, value]) => {
          const stringValue = typeof value === 'string'
            ? value
            : JSON.stringify(value);
          return EncryptedStorage.setItem(key, stringValue);
        })
      );

      return true;
    } catch (err) {
      const errorMessage = `Failed to set multiple items: ${err.message}`;
      console.error(errorMessage, err);
      setError({ message: errorMessage, originalError: err });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reset error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    getItem,
    setItem,
    removeItem,
    clear,
    getMultipleItems,
    setMultipleItems,
    loading,
    error,
    clearError,
  };
};

export default useStorage;
