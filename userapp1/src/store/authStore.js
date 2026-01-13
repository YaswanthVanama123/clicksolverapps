import {create} from 'zustand';
import {devtools} from 'zustand/middleware';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';

const useAuthStore = create(
  devtools(
    (set, get) => ({
      // State
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      setToken: token => {
        set({token, isAuthenticated: !!token}, false, 'setToken');
        if (token) {
          EncryptedStorage.setItem('auth_token', token);
        } else {
          EncryptedStorage.removeItem('auth_token');
        }
      },

      setUser: user => {
        set({user}, false, 'setUser');
        if (user) {
          EncryptedStorage.setItem('user_data', JSON.stringify(user));
        }
      },

      login: async (phoneNumber, otp) => {
        set({isLoading: true}, false, 'login_start');
        try {
          // Replace with your actual API endpoint
          const response = await axios.post('/api/auth/login', {
            phoneNumber,
            otp,
          });

          const {token, user} = response.data;

          // Store token and user data
          await EncryptedStorage.setItem('auth_token', token);
          await EncryptedStorage.setItem('user_data', JSON.stringify(user));

          set(
            {
              token,
              user,
              isAuthenticated: true,
              isLoading: false,
            },
            false,
            'login_success',
          );

          return {success: true, data: response.data};
        } catch (error) {
          set({isLoading: false}, false, 'login_error');
          return {
            success: false,
            error: error.response?.data?.message || 'Login failed',
          };
        }
      },

      logout: async () => {
        set({isLoading: true}, false, 'logout_start');
        try {
          // Clear stored data
          await EncryptedStorage.removeItem('auth_token');
          await EncryptedStorage.removeItem('user_data');

          // Optionally call logout API
          // await axios.post('/api/auth/logout');

          set(
            {
              token: null,
              user: null,
              isAuthenticated: false,
              isLoading: false,
            },
            false,
            'logout_success',
          );

          return {success: true};
        } catch (error) {
          set({isLoading: false}, false, 'logout_error');
          return {
            success: false,
            error: error.message || 'Logout failed',
          };
        }
      },

      checkAuth: async () => {
        set({isLoading: true}, false, 'checkAuth_start');
        try {
          // Retrieve stored token and user data
          const token = await EncryptedStorage.getItem('auth_token');
          const userData = await EncryptedStorage.getItem('user_data');

          if (token && userData) {
            const user = JSON.parse(userData);

            // Optionally verify token with backend
            // const response = await axios.get('/api/auth/verify', {
            //   headers: { Authorization: `Bearer ${token}` }
            // });

            set(
              {
                token,
                user,
                isAuthenticated: true,
                isLoading: false,
              },
              false,
              'checkAuth_success',
            );

            return {success: true, isAuthenticated: true};
          } else {
            set(
              {
                token: null,
                user: null,
                isAuthenticated: false,
                isLoading: false,
              },
              false,
              'checkAuth_no_token',
            );

            return {success: true, isAuthenticated: false};
          }
        } catch (error) {
          set(
            {
              token: null,
              user: null,
              isAuthenticated: false,
              isLoading: false,
            },
            false,
            'checkAuth_error',
          );

          return {
            success: false,
            error: error.message || 'Auth check failed',
          };
        }
      },
    }),
    {
      name: 'AuthStore',
      enabled: __DEV__,
    },
  ),
);

export default useAuthStore;
