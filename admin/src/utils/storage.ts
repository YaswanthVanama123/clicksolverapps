import EncryptedStorage from 'react-native-encrypted-storage';

/**
 * Secure Storage Utility
 * Provides encrypted storage methods for admin app
 */

export class SecureStorage {
  /**
   * Store item securely
   * @param {string} key - Storage key
   * @param {string} value - Value to store
   * @returns {Promise<boolean>} Success status
   */
  static async setItem(key: string, value: string): Promise<boolean> {
    try {
      await EncryptedStorage.setItem(key, value);
      console.log(`Securely stored item with key: ${key}`);
      return true;
    } catch (error) {
      console.error(`Error storing item with key ${key}:`, error);
      return false;
    }
  }

  /**
   * Retrieve item from secure storage
   * @param {string} key - Storage key
   * @returns {Promise<string|null>} Retrieved value or null
   */
  static async getItem(key: string): Promise<string | null> {
    try {
      const value = await EncryptedStorage.getItem(key);
      if (value !== null) {
        console.log(`Retrieved item with key: ${key}`);
        return value;
      }
      console.log(`No value found for key: ${key}`);
      return null;
    } catch (error) {
      console.error(`Error retrieving item with key ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove item from secure storage
   * @param {string} key - Storage key
   * @returns {Promise<boolean>} Success status
   */
  static async removeItem(key: string): Promise<boolean> {
    try {
      await EncryptedStorage.removeItem(key);
      console.log(`Removed item with key: ${key}`);
      return true;
    } catch (error) {
      console.error(`Error removing item with key ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all items from secure storage
   * @returns {Promise<boolean>} Success status
   */
  static async clear(): Promise<boolean> {
    try {
      await EncryptedStorage.clear();
      console.log('Cleared all secure storage');
      return true;
    } catch (error) {
      console.error('Error clearing secure storage:', error);
      return false;
    }
  }

  /**
   * Store object securely (JSON stringified)
   * @param {string} key - Storage key
   * @param {object} value - Object to store
   * @returns {Promise<boolean>} Success status
   */
  static async setObject(key: string, value: any): Promise<boolean> {
    try {
      const jsonValue = JSON.stringify(value);
      await EncryptedStorage.setItem(key, jsonValue);
      console.log(`Securely stored object with key: ${key}`);
      return true;
    } catch (error) {
      console.error(`Error storing object with key ${key}:`, error);
      return false;
    }
  }

  /**
   * Retrieve object from secure storage (JSON parsed)
   * @param {string} key - Storage key
   * @returns {Promise<any|null>} Retrieved object or null
   */
  static async getObject(key: string): Promise<any | null> {
    try {
      const jsonValue = await EncryptedStorage.getItem(key);
      if (jsonValue !== null) {
        const value = JSON.parse(jsonValue);
        console.log(`Retrieved object with key: ${key}`);
        return value;
      }
      console.log(`No object found for key: ${key}`);
      return null;
    } catch (error) {
      console.error(`Error retrieving object with key ${key}:`, error);
      return null;
    }
  }

  /**
   * Check if key exists in storage
   * @param {string} key - Storage key
   * @returns {Promise<boolean>} Existence status
   */
  static async hasItem(key: string): Promise<boolean> {
    try {
      const value = await EncryptedStorage.getItem(key);
      return value !== null;
    } catch (error) {
      console.error(`Error checking existence of key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get all keys from secure storage
   * @returns {Promise<string[]>} Array of keys
   */
  static async getAllKeys(): Promise<string[]> {
    try {
      const keys = await EncryptedStorage.getAllKeys();
      console.log(`Retrieved ${keys.length} keys from secure storage`);
      return keys;
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  }

  /**
   * Get multiple items from secure storage
   * @param {string[]} keys - Array of storage keys
   * @returns {Promise<{[key: string]: string}>} Object with key-value pairs
   */
  static async getMultiple(keys: string[]): Promise<{[key: string]: string}> {
    try {
      const results: {[key: string]: string} = {};
      for (const key of keys) {
        const value = await EncryptedStorage.getItem(key);
        if (value !== null) {
          results[key] = value;
        }
      }
      console.log(`Retrieved ${Object.keys(results).length} items from secure storage`);
      return results;
    } catch (error) {
      console.error('Error getting multiple items:', error);
      return {};
    }
  }

  /**
   * Set multiple items in secure storage
   * @param {Array<{key: string, value: string}>} items - Array of key-value pairs
   * @returns {Promise<boolean>} Success status
   */
  static async setMultiple(items: Array<{key: string; value: string}>): Promise<boolean> {
    try {
      for (const item of items) {
        await EncryptedStorage.setItem(item.key, item.value);
      }
      console.log(`Stored ${items.length} items in secure storage`);
      return true;
    } catch (error) {
      console.error('Error setting multiple items:', error);
      return false;
    }
  }

  /**
   * Remove multiple items from secure storage
   * @param {string[]} keys - Array of storage keys
   * @returns {Promise<boolean>} Success status
   */
  static async removeMultiple(keys: string[]): Promise<boolean> {
    try {
      for (const key of keys) {
        await EncryptedStorage.removeItem(key);
      }
      console.log(`Removed ${keys.length} items from secure storage`);
      return true;
    } catch (error) {
      console.error('Error removing multiple items:', error);
      return false;
    }
  }
}

// Storage keys constants
export const STORAGE_KEYS = {
  ADMIN_TOKEN: 'acs_token',
  FCM_TOKEN: 'admin_fcm_token',
  USER_DATA: 'admin_user_data',
  SETTINGS: 'admin_settings',
  THEME: 'admin_theme',
  ORDERS_CACHE: 'admin_orders_cache',
  WORKERS_CACHE: 'admin_workers_cache',
};

export default SecureStorage;
