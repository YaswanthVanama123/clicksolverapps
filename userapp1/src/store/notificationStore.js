import {create} from 'zustand';
import {devtools} from 'zustand/middleware';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';

const useNotificationStore = create(
  devtools(
    (set, get) => ({
      // State
      notifications: [],
      unreadCount: 0,
      fcmToken: null,

      // Actions
      addNotification: notification => {
        const {notifications} = get();

        // Add new notification to the beginning
        const newNotification = {
          ...notification,
          id: notification.id || Date.now().toString(),
          timestamp: notification.timestamp || new Date().toISOString(),
          isRead: false,
        };

        const updatedNotifications = [newNotification, ...notifications];

        // Calculate unread count
        const unreadCount = updatedNotifications.filter(n => !n.isRead).length;

        set(
          {
            notifications: updatedNotifications,
            unreadCount,
          },
          false,
          'addNotification',
        );

        // Persist to storage
        EncryptedStorage.setItem(
          'notifications',
          JSON.stringify(updatedNotifications),
        );
      },

      markAsRead: notificationId => {
        const {notifications} = get();

        const updatedNotifications = notifications.map(notification =>
          notification.id === notificationId
            ? {...notification, isRead: true}
            : notification,
        );

        // Calculate unread count
        const unreadCount = updatedNotifications.filter(n => !n.isRead).length;

        set(
          {
            notifications: updatedNotifications,
            unreadCount,
          },
          false,
          'markAsRead',
        );

        // Persist to storage
        EncryptedStorage.setItem(
          'notifications',
          JSON.stringify(updatedNotifications),
        );
      },

      markAllAsRead: () => {
        const {notifications} = get();

        const updatedNotifications = notifications.map(notification => ({
          ...notification,
          isRead: true,
        }));

        set(
          {
            notifications: updatedNotifications,
            unreadCount: 0,
          },
          false,
          'markAllAsRead',
        );

        // Persist to storage
        EncryptedStorage.setItem(
          'notifications',
          JSON.stringify(updatedNotifications),
        );
      },

      clearNotifications: () => {
        set(
          {
            notifications: [],
            unreadCount: 0,
          },
          false,
          'clearNotifications',
        );

        // Clear from storage
        EncryptedStorage.removeItem('notifications');
      },

      setFCMToken: async token => {
        set({fcmToken: token}, false, 'setFCMToken');

        // Persist token to storage
        await EncryptedStorage.setItem('fcm_token', token);

        // Optionally send token to backend
        try {
          await axios.post('/api/user/fcm-token', {token});
        } catch (error) {
          console.error('Failed to send FCM token to backend:', error);
        }
      },

      loadNotifications: async () => {
        try {
          const [notificationsData, fcmToken] = await Promise.all([
            EncryptedStorage.getItem('notifications'),
            EncryptedStorage.getItem('fcm_token'),
          ]);

          const notifications = notificationsData
            ? JSON.parse(notificationsData)
            : [];

          const unreadCount = notifications.filter(n => !n.isRead).length;

          set(
            {
              notifications,
              unreadCount,
              fcmToken,
            },
            false,
            'loadNotifications',
          );
        } catch (error) {
          console.error('Failed to load notifications:', error);
        }
      },

      fetchNotifications: async () => {
        try {
          // Replace with your actual API endpoint
          const response = await axios.get('/api/user/notifications');

          const notifications = response.data;
          const unreadCount = notifications.filter(n => !n.isRead).length;

          set(
            {
              notifications,
              unreadCount,
            },
            false,
            'fetchNotifications',
          );

          // Persist to storage
          await EncryptedStorage.setItem(
            'notifications',
            JSON.stringify(notifications),
          );

          return {success: true};
        } catch (error) {
          return {
            success: false,
            error:
              error.response?.data?.message || 'Failed to fetch notifications',
          };
        }
      },

      deleteNotification: async notificationId => {
        const {notifications} = get();

        try {
          // Optionally delete from backend
          await axios.delete(`/api/user/notifications/${notificationId}`);

          const updatedNotifications = notifications.filter(
            n => n.id !== notificationId,
          );

          const unreadCount = updatedNotifications.filter(
            n => !n.isRead,
          ).length;

          set(
            {
              notifications: updatedNotifications,
              unreadCount,
            },
            false,
            'deleteNotification',
          );

          // Persist to storage
          await EncryptedStorage.setItem(
            'notifications',
            JSON.stringify(updatedNotifications),
          );

          return {success: true};
        } catch (error) {
          return {
            success: false,
            error:
              error.response?.data?.message || 'Failed to delete notification',
          };
        }
      },
    }),
    {
      name: 'NotificationStore',
      enabled: __DEV__,
    },
  ),
);

export default useNotificationStore;
