import {create} from 'zustand';
import {devtools} from 'zustand/middleware';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import AddressService from '../api/services/address.service';

const useUserStore = create(
  devtools(
    (set, get) => ({
      // State
      profile: null,
      savedAddresses: [],
      preferences: {},
      recentServices: [],
      loadingAddresses: false,

      // Actions
      setProfile: profile => {
        set({profile}, false, 'setProfile');
        // Persist profile to storage
        if (profile) {
          EncryptedStorage.setItem('user_profile', JSON.stringify(profile));
        }
      },

      // Load addresses from API
      loadAddresses: async () => {
        set({loadingAddresses: true}, false, 'loadAddresses:start');
        try {
          const result = await AddressService.getAddresses();

          if (result.success) {
            const addresses = result.data || [];
            set({savedAddresses: addresses, loadingAddresses: false}, false, 'loadAddresses:success');

            // Persist to storage
            await EncryptedStorage.setItem(
              'saved_addresses',
              JSON.stringify(addresses),
            );

            return {success: true, addresses};
          } else {
            set({loadingAddresses: false}, false, 'loadAddresses:error');
            return {success: false, error: result.error};
          }
        } catch (error) {
          set({loadingAddresses: false}, false, 'loadAddresses:error');
          console.error('Failed to load addresses:', error);
          return {success: false, error: 'Failed to load addresses'};
        }
      },

      addAddress: async address => {
        const {savedAddresses} = get();

        try {
          const result = await AddressService.addAddress(address);

          if (result.success) {
            const newAddress = result.data;
            const updatedAddresses = [...savedAddresses, newAddress];

            set({savedAddresses: updatedAddresses}, false, 'addAddress');

            // Persist to storage
            await EncryptedStorage.setItem(
              'saved_addresses',
              JSON.stringify(updatedAddresses),
            );

            return {success: true, address: newAddress};
          } else {
            return {success: false, error: result.error};
          }
        } catch (error) {
          return {
            success: false,
            error: error.message || 'Failed to add address',
          };
        }
      },

      updateAddress: async (addressId, addressData) => {
        const {savedAddresses} = get();

        try {
          const result = await AddressService.updateAddress(addressId, addressData);

          if (result.success) {
            const updatedAddress = result.data;
            const updatedAddresses = savedAddresses.map(addr =>
              addr.id === addressId ? updatedAddress : addr,
            );

            set({savedAddresses: updatedAddresses}, false, 'updateAddress');

            // Persist to storage
            await EncryptedStorage.setItem(
              'saved_addresses',
              JSON.stringify(updatedAddresses),
            );

            return {success: true, address: updatedAddress};
          } else {
            return {success: false, error: result.error};
          }
        } catch (error) {
          return {
            success: false,
            error: error.message || 'Failed to update address',
          };
        }
      },

      removeAddress: async addressId => {
        const {savedAddresses} = get();

        try {
          const result = await AddressService.deleteAddress(addressId);

          if (result.success) {
            const updatedAddresses = savedAddresses.filter(
              addr => addr.id !== addressId,
            );

            set({savedAddresses: updatedAddresses}, false, 'removeAddress');

            // Persist to storage
            await EncryptedStorage.setItem(
              'saved_addresses',
              JSON.stringify(updatedAddresses),
            );

            return {success: true};
          } else {
            return {success: false, error: result.error};
          }
        } catch (error) {
          return {
            success: false,
            error: error.message || 'Failed to remove address',
          };
        }
      },

      setDefaultAddress: async addressId => {
        const {savedAddresses} = get();

        try {
          const result = await AddressService.setDefaultAddress(addressId);

          if (result.success) {
            const updatedAddresses = savedAddresses.map(addr => ({
              ...addr,
              isDefault: addr.id === addressId,
            }));

            set({savedAddresses: updatedAddresses}, false, 'setDefaultAddress');

            // Persist to storage
            await EncryptedStorage.setItem(
              'saved_addresses',
              JSON.stringify(updatedAddresses),
            );

            return {success: true};
          } else {
            return {success: false, error: result.error};
          }
        } catch (error) {
          return {
            success: false,
            error: error.message || 'Failed to set default address',
          };
        }
      },

      updatePreferences: async prefs => {
        const {preferences} = get();

        try {
          // Merge new preferences with existing ones
          const updatedPreferences = {...preferences, ...prefs};

          // Replace with your actual API endpoint
          await axios.patch('/api/user/preferences', updatedPreferences);

          set({preferences: updatedPreferences}, false, 'updatePreferences');

          // Persist to storage
          await EncryptedStorage.setItem(
            'user_preferences',
            JSON.stringify(updatedPreferences),
          );

          return {success: true};
        } catch (error) {
          return {
            success: false,
            error:
              error.response?.data?.message || 'Failed to update preferences',
          };
        }
      },

      // Quick Book Preferences
      updateQuickBookPreferences: async quickBookPrefs => {
        const {preferences} = get();

        try {
          const updatedPreferences = {
            ...preferences,
            quickBook: {
              ...preferences.quickBook,
              ...quickBookPrefs,
            },
          };

          // Save to backend
          await axios.patch(
            '/api/user/quick-book/preferences',
            quickBookPrefs,
          );

          set({preferences: updatedPreferences}, false, 'updateQuickBookPreferences');

          // Persist to storage
          await EncryptedStorage.setItem(
            'user_preferences',
            JSON.stringify(updatedPreferences),
          );

          return {success: true};
        } catch (error) {
          return {
            success: false,
            error:
              error.response?.data?.message ||
              'Failed to update quick book preferences',
          };
        }
      },

      setDefaultTip: async tipAmount => {
        const {preferences} = get();

        try {
          const updatedPreferences = {
            ...preferences,
            defaultTip: tipAmount,
          };

          await axios.patch('/api/user/preferences', {
            defaultTip: tipAmount,
          });

          set({preferences: updatedPreferences}, false, 'setDefaultTip');

          await EncryptedStorage.setItem(
            'user_preferences',
            JSON.stringify(updatedPreferences),
          );

          return {success: true};
        } catch (error) {
          return {
            success: false,
            error:
              error.response?.data?.message || 'Failed to set default tip',
          };
        }
      },

      getDefaultAddress: () => {
        const {savedAddresses} = get();
        return savedAddresses.find(addr => addr.isDefault) || savedAddresses[0] || null;
      },

      addRecentService: service => {
        const {recentServices} = get();

        // Check if service already exists
        const existingIndex = recentServices.findIndex(
          s => s.id === service.id,
        );

        let updatedServices;
        if (existingIndex !== -1) {
          // Move existing service to top
          updatedServices = [
            service,
            ...recentServices.filter(s => s.id !== service.id),
          ];
        } else {
          // Add new service to top
          updatedServices = [service, ...recentServices];
        }

        // Keep only last 5 recent services for quick book display
        updatedServices = updatedServices.slice(0, 5);

        set({recentServices: updatedServices}, false, 'addRecentService');

        // Persist to storage
        EncryptedStorage.setItem(
          'recent_services',
          JSON.stringify(updatedServices),
        );
      },

      // Load persisted data from storage
      loadUserData: async () => {
        try {
          const [profile, addresses, preferences, recentServices] =
            await Promise.all([
              EncryptedStorage.getItem('user_profile'),
              EncryptedStorage.getItem('saved_addresses'),
              EncryptedStorage.getItem('user_preferences'),
              EncryptedStorage.getItem('recent_services'),
            ]);

          set(
            {
              profile: profile ? JSON.parse(profile) : null,
              savedAddresses: addresses ? JSON.parse(addresses) : [],
              preferences: preferences ? JSON.parse(preferences) : {},
              recentServices: recentServices ? JSON.parse(recentServices) : [],
            },
            false,
            'loadUserData',
          );
        } catch (error) {
          console.error('Failed to load user data:', error);
        }
      },

      // Clear all user data
      clearUserData: async () => {
        try {
          await Promise.all([
            EncryptedStorage.removeItem('user_profile'),
            EncryptedStorage.removeItem('saved_addresses'),
            EncryptedStorage.removeItem('user_preferences'),
            EncryptedStorage.removeItem('recent_services'),
          ]);

          set(
            {
              profile: null,
              savedAddresses: [],
              preferences: {},
              recentServices: [],
            },
            false,
            'clearUserData',
          );
        } catch (error) {
          console.error('Failed to clear user data:', error);
        }
      },
    }),
    {
      name: 'UserStore',
      enabled: __DEV__,
    },
  ),
);

export default useUserStore;
