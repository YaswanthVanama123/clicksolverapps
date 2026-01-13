/**
 * Storage utility functions
 * Higher-level storage operations with caching and expiry support
 */

import EncryptedStorage from 'react-native-encrypted-storage';
import { STORAGE_KEYS } from './constants';

/**
 * Retrieves data from encrypted storage
 * @param {string} key - Storage key
 * @returns {Promise<any>} Stored data or null if not found
 */
export const getStorageData = async (key) => {
  try {
    const data = await EncryptedStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn(`Error retrieving storage data for key ${key}:`, error);
    return null;
  }
};

/**
 * Saves data to encrypted storage
 * @param {string} key - Storage key
 * @param {any} data - Data to store
 * @returns {Promise<boolean>} True if successful
 */
export const setStorageData = async (key, data) => {
  try {
    await EncryptedStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.warn(`Error setting storage data for key ${key}:`, error);
    return false;
  }
};

/**
 * Removes data from encrypted storage
 * @param {string} key - Storage key
 * @returns {Promise<boolean>} True if successful
 */
export const removeStorageData = async (key) => {
  try {
    await EncryptedStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Error removing storage data for key ${key}:`, error);
    return false;
  }
};

/**
 * Retrieves cached data with expiry check
 * @param {string} key - Cache key
 * @param {number} expiryMinutes - Cache validity in minutes
 * @returns {Promise<any>} Cached data if valid and not expired, null otherwise
 */
export const getCachedData = async (key, expiryMinutes = 60) => {
  try {
    const cachedData = await EncryptedStorage.getItem(key);
    if (!cachedData) return null;

    const expiryKey = `${STORAGE_KEYS.CACHE_EXPIRY}${key}`;
    const expiryTime = await EncryptedStorage.getItem(expiryKey);

    if (!expiryTime) {
      // No expiry data, return cached data
      return JSON.parse(cachedData);
    }

    const now = Date.now();
    const expiry = JSON.parse(expiryTime);

    if (now > expiry) {
      // Cache expired, remove it
      await removeStorageData(key);
      await removeStorageData(expiryKey);
      return null;
    }

    return JSON.parse(cachedData);
  } catch (error) {
    console.warn(`Error retrieving cached data for key ${key}:`, error);
    return null;
  }
};

/**
 * Saves data to cache with expiry
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} expiryMinutes - Cache validity in minutes (default: 60)
 * @returns {Promise<boolean>} True if successful
 */
export const setCachedData = async (key, data, expiryMinutes = 60) => {
  try {
    const success = await setStorageData(key, data);
    if (!success) return false;

    const expiryTime = Date.now() + expiryMinutes * 60 * 1000;
    const expiryKey = `${STORAGE_KEYS.CACHE_EXPIRY}${key}`;
    await setStorageData(expiryKey, expiryTime);

    return true;
  } catch (error) {
    console.warn(`Error setting cached data for key ${key}:`, error);
    return false;
  }
};

/**
 * Clears all expired cache entries
 * @returns {Promise<number>} Number of expired entries cleared
 */
export const clearExpiredCache = async () => {
  try {
    let clearedCount = 0;
    const now = Date.now();

    // Get all keys from encrypted storage by attempting to retrieve common cache keys
    // Note: EncryptedStorage doesn't have getAllKeys(), so we clear known expired entries
    const keys = Object.values(STORAGE_KEYS).filter(k => k.startsWith('cache_expiry_'));

    for (const expiryKey of keys) {
      const expiryTime = await EncryptedStorage.getItem(expiryKey);
      if (expiryTime) {
        const expiry = JSON.parse(expiryTime);
        if (now > expiry) {
          const dataKey = expiryKey.replace(STORAGE_KEYS.CACHE_EXPIRY, '');
          await removeStorageData(dataKey);
          await removeStorageData(expiryKey);
          clearedCount++;
        }
      }
    }

    return clearedCount;
  } catch (error) {
    console.warn('Error clearing expired cache:', error);
    return 0;
  }
};

/**
 * Clears all storage data
 * @returns {Promise<boolean>} True if successful
 */
export const clearAllStorage = async () => {
  try {
    // Remove all known keys
    for (const key of Object.values(STORAGE_KEYS)) {
      await removeStorageData(key);
    }
    return true;
  } catch (error) {
    console.warn('Error clearing all storage:', error);
    return false;
  }
};

/**
 * Retrieves authentication token
 * @returns {Promise<string|null>} Token or null if not found
 */
export const getAuthToken = async () => {
  try {
    return await EncryptedStorage.getItem(STORAGE_KEYS.CS_TOKEN);
  } catch (error) {
    console.warn('Error retrieving auth token:', error);
    return null;
  }
};

/**
 * Saves authentication token
 * @param {string} token - Token to save
 * @returns {Promise<boolean>} True if successful
 */
export const setAuthToken = async (token) => {
  try {
    if (!token || typeof token !== 'string') return false;
    await EncryptedStorage.setItem(STORAGE_KEYS.CS_TOKEN, token);
    return true;
  } catch (error) {
    console.warn('Error saving auth token:', error);
    return false;
  }
};

/**
 * Removes authentication token
 * @returns {Promise<boolean>} True if successful
 */
export const clearAuthToken = async () => {
  try {
    await removeStorageData(STORAGE_KEYS.CS_TOKEN);
    return true;
  } catch (error) {
    console.warn('Error clearing auth token:', error);
    return false;
  }
};

/**
 * Retrieves user preferences
 * @returns {Promise<object|null>} User preferences or null
 */
export const getUserPreferences = async () => {
  try {
    return await getCachedData(STORAGE_KEYS.USER_PREFERENCES);
  } catch (error) {
    console.warn('Error retrieving user preferences:', error);
    return null;
  }
};

/**
 * Saves user preferences
 * @param {object} preferences - User preferences
 * @param {number} expiryMinutes - Cache validity in minutes
 * @returns {Promise<boolean>} True if successful
 */
export const setUserPreferences = async (preferences, expiryMinutes = 1440) => {
  try {
    return await setCachedData(STORAGE_KEYS.USER_PREFERENCES, preferences, expiryMinutes);
  } catch (error) {
    console.warn('Error saving user preferences:', error);
    return false;
  }
};

/**
 * Checks if storage contains a key
 * @param {string} key - Storage key
 * @returns {Promise<boolean>} True if key exists
 */
export const hasStorageKey = async (key) => {
  try {
    const data = await EncryptedStorage.getItem(key);
    return data !== null;
  } catch (error) {
    console.warn(`Error checking storage key ${key}:`, error);
    return false;
  }
};

export default {
  getStorageData,
  setStorageData,
  removeStorageData,
  getCachedData,
  setCachedData,
  clearExpiredCache,
  clearAllStorage,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  getUserPreferences,
  setUserPreferences,
  hasStorageKey,
};
