import messaging from '@react-native-firebase/messaging';
import EncryptedStorage from 'react-native-encrypted-storage';

/**
 * FCM Token Service
 * Handles Firebase Cloud Messaging token management for admin app
 */

const FCM_TOKEN_KEY = 'admin_fcm_token';
const BASE_URL = 'https://backend.clicksolver.com';

class FCMTokenService {
  /**
   * Request FCM permission and get token
   * @returns {Promise<string|null>} FCM token or null if permission denied
   */
  async requestPermissionAndGetToken(): Promise<string | null> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        const token = await messaging().getToken();
        if (token) {
          await this.saveToken(token);
          console.log('FCM Token obtained:', token);
          return token;
        }
      } else {
        console.log('FCM permission denied');
      }
      return null;
    } catch (error) {
      console.error('Error requesting FCM permission:', error);
      return null;
    }
  }

  /**
   * Get current FCM token
   * @returns {Promise<string|null>} Stored FCM token
   */
  async getToken(): Promise<string | null> {
    try {
      const token = await EncryptedStorage.getItem(FCM_TOKEN_KEY);
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Save FCM token to encrypted storage
   * @param {string} token - FCM token to save
   */
  async saveToken(token: string): Promise<void> {
    try {
      await EncryptedStorage.setItem(FCM_TOKEN_KEY, token);
      console.log('FCM token saved successfully');
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }

  /**
   * Sync FCM token with backend
   * @param {string} token - FCM token to sync
   * @returns {Promise<boolean>} Success status
   */
  async syncTokenWithBackend(token: string): Promise<boolean> {
    try {
      const adminToken = await EncryptedStorage.getItem('acs_token');
      if (!adminToken) {
        console.error('Admin auth token not found');
        return false;
      }

      const response = await fetch(`${BASE_URL}/admin/fcm-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          fcmToken: token,
          platform: 'android', // or detect platform
          deviceInfo: {
            // Add device info if needed
          },
        }),
      });

      if (response.ok) {
        console.log('FCM token synced with backend');
        return true;
      } else {
        console.error('Failed to sync FCM token:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Error syncing FCM token with backend:', error);
      return false;
    }
  }

  /**
   * Refresh FCM token
   * @returns {Promise<string|null>} New FCM token
   */
  async refreshToken(): Promise<string | null> {
    try {
      const newToken = await messaging().getToken();
      if (newToken) {
        await this.saveToken(newToken);
        await this.syncTokenWithBackend(newToken);
        return newToken;
      }
      return null;
    } catch (error) {
      console.error('Error refreshing FCM token:', error);
      return null;
    }
  }

  /**
   * Delete FCM token (logout scenario)
   */
  async deleteToken(): Promise<void> {
    try {
      await messaging().deleteToken();
      await EncryptedStorage.removeItem(FCM_TOKEN_KEY);
      console.log('FCM token deleted');
    } catch (error) {
      console.error('Error deleting FCM token:', error);
    }
  }

  /**
   * Setup token refresh listener
   * @param {(token: string) => void} callback - Callback when token refreshes
   * @returns {() => void} Unsubscribe function
   */
  setupTokenRefreshListener(callback: (token: string) => void): () => void {
    const unsubscribe = messaging().onTokenRefresh(async token => {
      console.log('FCM token refreshed:', token);
      await this.saveToken(token);
      await this.syncTokenWithBackend(token);
      callback(token);
    });

    return unsubscribe;
  }
}

const fcmTokenService = new FCMTokenService();
export default fcmTokenService;
