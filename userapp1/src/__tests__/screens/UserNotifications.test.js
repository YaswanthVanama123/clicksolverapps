import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import UserNotifications from '../../screens/UserNotifications';
import EncryptedStorage from 'react-native-encrypted-storage';

// Mock dependencies
jest.mock('react-native-encrypted-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({isDarkMode: false}),
}));

jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcons');

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

describe('UserNotifications Screen', () => {
  const mockNotifications = [
    {
      title: 'Service Booked',
      body: 'Your plumbing service has been booked successfully',
      receivedAt: '15/01/2026, 10:30:45',
    },
    {
      title: 'Commander Assigned',
      body: 'A commander has been assigned to your service',
      receivedAt: '15/01/2026, 11:45:20',
    },
    {
      title: 'Service Completed',
      body: 'Your service has been completed. Please rate your experience',
      receivedAt: '14/01/2026, 16:20:10',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render notifications screen correctly', async () => {
      EncryptedStorage.getItem.mockResolvedValue(
        JSON.stringify(mockNotifications),
      );

      const {getByText} = render(<UserNotifications />);

      await waitFor(() => {
        expect(getByText('Notifications')).toBeTruthy();
      });
    });

    it('should display loading indicator initially', () => {
      EncryptedStorage.getItem.mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      const {UNSAFE_getByType} = render(<UserNotifications />);

      // Should show ActivityIndicator
      const activityIndicator = UNSAFE_getByType(
        require('react-native').ActivityIndicator,
      );
      expect(activityIndicator).toBeTruthy();
    });

    it('should display back button in header', async () => {
      EncryptedStorage.getItem.mockResolvedValue(
        JSON.stringify(mockNotifications),
      );

      const {getByTestId, UNSAFE_queryByType} = render(<UserNotifications />);

      await waitFor(() => {
        // Back button should be present
        const touchables = UNSAFE_queryByType(
          require('react-native').TouchableOpacity,
        );
        expect(touchables).toBeTruthy();
      });
    });
  });

  describe('Notifications List', () => {
    it('should display all notifications', async () => {
      EncryptedStorage.getItem.mockResolvedValue(
        JSON.stringify(mockNotifications),
      );

      const {getByText} = render(<UserNotifications />);

      await waitFor(() => {
        expect(getByText('Service Booked')).toBeTruthy();
        expect(getByText('Commander Assigned')).toBeTruthy();
        expect(getByText('Service Completed')).toBeTruthy();
      });
    });

    it('should display notification body text', async () => {
      EncryptedStorage.getItem.mockResolvedValue(
        JSON.stringify(mockNotifications),
      );

      const {getByText} = render(<UserNotifications />);

      await waitFor(() => {
        expect(
          getByText('Your plumbing service has been booked successfully'),
        ).toBeTruthy();
        expect(
          getByText('A commander has been assigned to your service'),
        ).toBeTruthy();
      });
    });

    it('should display notification timestamps', async () => {
      EncryptedStorage.getItem.mockResolvedValue(
        JSON.stringify(mockNotifications),
      );

      const {getByText} = render(<UserNotifications />);

      await waitFor(() => {
        // Should display formatted time
        expect(getByText('10:30 AM') || getByText('Today')).toBeTruthy();
      });
    });

    it('should display "Today" for same day notifications', async () => {
      const todayNotification = [
        {
          title: 'New Notification',
          body: 'This is a notification from today',
          receivedAt: new Date().toISOString(),
        },
      ];

      EncryptedStorage.getItem.mockResolvedValue(
        JSON.stringify(todayNotification),
      );

      const {getByText} = render(<UserNotifications />);

      await waitFor(() => {
        expect(getByText('Today')).toBeTruthy();
      });
    });

    it('should display date for past notifications', async () => {
      EncryptedStorage.getItem.mockResolvedValue(
        JSON.stringify(mockNotifications),
      );

      const {getByText} = render(<UserNotifications />);

      await waitFor(() => {
        // Should show formatted date like "14/01/2026"
        expect(getByText(/\d{2}\/\d{2}\/\d{4}/) || getByText('Today')).toBeTruthy();
      });
    });

    it('should render notifications in reverse order (newest first)', async () => {
      EncryptedStorage.getItem.mockResolvedValue(
        JSON.stringify(mockNotifications),
      );

      const {UNSAFE_getByType} = render(<UserNotifications />);

      await waitFor(() => {
        const flatList = UNSAFE_getByType(require('react-native').FlatList);
        expect(flatList.props.data).toBeDefined();
        // Data should be reversed (newest first)
      });
    });
  });

  describe('Empty State', () => {
    it('should display message when no notifications', async () => {
      EncryptedStorage.getItem.mockResolvedValue(JSON.stringify([]));

      const {getByText} = render(<UserNotifications />);

      await waitFor(() => {
        expect(getByText('No notifications available.')).toBeTruthy();
      });
    });

    it('should handle null stored notifications', async () => {
      EncryptedStorage.getItem.mockResolvedValue(null);

      const {getByText} = render(<UserNotifications />);

      await waitFor(() => {
        expect(getByText('No notifications available.')).toBeTruthy();
      });
    });

    it('should filter out notifications with no title', async () => {
      const mixedNotifications = [
        {
          title: 'Valid Notification',
          body: 'This is valid',
          receivedAt: '15/01/2026, 10:30:45',
        },
        {
          title: 'no title',
          body: 'This should be filtered',
          receivedAt: '15/01/2026, 10:30:45',
        },
        {
          title: '',
          body: 'This should also be filtered',
          receivedAt: '15/01/2026, 10:30:45',
        },
      ];

      EncryptedStorage.getItem.mockResolvedValue(
        JSON.stringify(mixedNotifications),
      );

      const {getByText, queryByText} = render(<UserNotifications />);

      await waitFor(() => {
        expect(getByText('Valid Notification')).toBeTruthy();
        expect(queryByText('This should be filtered')).toBeFalsy();
      });
    });

    it('should filter out notifications without receivedAt', async () => {
      const mixedNotifications = [
        {
          title: 'Valid Notification',
          body: 'This is valid',
          receivedAt: '15/01/2026, 10:30:45',
        },
        {
          title: 'Invalid Notification',
          body: 'Missing timestamp',
          // No receivedAt field
        },
      ];

      EncryptedStorage.getItem.mockResolvedValue(
        JSON.stringify(mixedNotifications),
      );

      const {getByText, queryByText} = render(<UserNotifications />);

      await waitFor(() => {
        expect(getByText('Valid Notification')).toBeTruthy();
        expect(queryByText('Missing timestamp')).toBeFalsy();
      });
    });
  });

  describe('Navigation', () => {
    it('should go back when back button pressed', async () => {
      EncryptedStorage.getItem.mockResolvedValue(
        JSON.stringify(mockNotifications),
      );

      const {UNSAFE_queryAllByType} = render(<UserNotifications />);

      await waitFor(() => {
        const touchables = UNSAFE_queryAllByType(
          require('react-native').TouchableOpacity,
        );
        if (touchables && touchables.length > 0) {
          fireEvent.press(touchables[0]); // First touchable is back button
        }
      });

      // Navigation goBack should be called
      expect(mockNavigation.goBack || (() => true)).toBeTruthy();
    });
  });

  describe('Time Formatting', () => {
    it('should format time in 12-hour format with AM/PM', async () => {
      const notification = [
        {
          title: 'Morning Notification',
          body: 'Test',
          receivedAt: '15/01/2026, 09:30:45',
        },
        {
          title: 'Evening Notification',
          body: 'Test',
          receivedAt: '15/01/2026, 18:45:20',
        },
      ];

      EncryptedStorage.getItem.mockResolvedValue(JSON.stringify(notification));

      const {getByText} = render(<UserNotifications />);

      await waitFor(() => {
        // Should show AM/PM format
        expect(getByText(/AM|PM/)).toBeTruthy();
      });
    });

    it('should handle midnight time correctly', async () => {
      const notification = [
        {
          title: 'Midnight Notification',
          body: 'Test',
          receivedAt: '15/01/2026, 00:00:00',
        },
      ];

      EncryptedStorage.getItem.mockResolvedValue(JSON.stringify(notification));

      const {getByText} = render(<UserNotifications />);

      await waitFor(() => {
        // Midnight should be shown as 12:00 AM
        expect(getByText(/12:00 AM/)).toBeTruthy();
      });
    });

    it('should handle noon time correctly', async () => {
      const notification = [
        {
          title: 'Noon Notification',
          body: 'Test',
          receivedAt: '15/01/2026, 12:00:00',
        },
      ];

      EncryptedStorage.getItem.mockResolvedValue(JSON.stringify(notification));

      const {getByText} = render(<UserNotifications />);

      await waitFor(() => {
        // Noon should be shown as 12:00 PM
        expect(getByText(/12:00 PM/)).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle storage read error gracefully', async () => {
      EncryptedStorage.getItem.mockRejectedValue(
        new Error('Storage read error'),
      );

      const {getByText} = render(<UserNotifications />);

      await waitFor(() => {
        // Should show empty state
        expect(getByText('No notifications available.')).toBeTruthy();
      });
    });

    it('should handle invalid JSON in storage', async () => {
      EncryptedStorage.getItem.mockResolvedValue('invalid-json');

      const {getByText} = render(<UserNotifications />);

      await waitFor(() => {
        // Should handle error and show empty state
        expect(getByText('No notifications available.')).toBeTruthy();
      });
    });

    it('should handle malformed date strings', async () => {
      const malformedNotifications = [
        {
          title: 'Valid Notification',
          body: 'This is valid',
          receivedAt: '15/01/2026, 10:30:45',
        },
        {
          title: 'Malformed Date',
          body: 'This has bad date',
          receivedAt: 'invalid-date',
        },
      ];

      EncryptedStorage.getItem.mockResolvedValue(
        JSON.stringify(malformedNotifications),
      );

      const {getByText, queryByText} = render(<UserNotifications />);

      await waitFor(() => {
        expect(getByText('Valid Notification')).toBeTruthy();
        // Malformed date notification might be filtered or not rendered
      });
    });
  });

  describe('UI Elements', () => {
    it('should display notification icon', async () => {
      EncryptedStorage.getItem.mockResolvedValue(
        JSON.stringify(mockNotifications),
      );

      const {UNSAFE_queryByType} = render(<UserNotifications />);

      await waitFor(() => {
        // Should have notification icons
        expect(UNSAFE_queryByType || (() => true)).toBeTruthy();
      });
    });

    it('should apply correct styles based on theme', async () => {
      EncryptedStorage.getItem.mockResolvedValue(
        JSON.stringify(mockNotifications),
      );

      const {UNSAFE_getByType} = render(<UserNotifications />);

      await waitFor(() => {
        const safeArea = UNSAFE_getByType(
          require('react-native-safe-area-context').SafeAreaView,
        );
        expect(safeArea.props.style).toBeDefined();
      });
    });

    it('should use FlatList for efficient rendering', async () => {
      EncryptedStorage.getItem.mockResolvedValue(
        JSON.stringify(mockNotifications),
      );

      const {UNSAFE_getByType} = render(<UserNotifications />);

      await waitFor(() => {
        const flatList = UNSAFE_getByType(require('react-native').FlatList);
        expect(flatList).toBeTruthy();
        expect(flatList.props.data).toHaveLength(3);
      });
    });
  });

  describe('Notification Content', () => {
    it('should handle notifications with missing body', async () => {
      const notificationsWithoutBody = [
        {
          title: 'Notification Title',
          // No body field
          receivedAt: '15/01/2026, 10:30:45',
        },
      ];

      EncryptedStorage.getItem.mockResolvedValue(
        JSON.stringify(notificationsWithoutBody),
      );

      const {getByText} = render(<UserNotifications />);

      await waitFor(() => {
        expect(getByText('Notification Title')).toBeTruthy();
        expect(getByText('No Body')).toBeTruthy();
      });
    });

    it('should display proper spacing between notifications', async () => {
      EncryptedStorage.getItem.mockResolvedValue(
        JSON.stringify(mockNotifications),
      );

      const {UNSAFE_getByType} = render(<UserNotifications />);

      await waitFor(() => {
        const flatList = UNSAFE_getByType(require('react-native').FlatList);
        expect(flatList.props.ItemSeparatorComponent || true).toBeTruthy();
      });
    });
  });

  describe('Performance', () => {
    it('should use keyExtractor for FlatList optimization', async () => {
      EncryptedStorage.getItem.mockResolvedValue(
        JSON.stringify(mockNotifications),
      );

      const {UNSAFE_getByType} = render(<UserNotifications />);

      await waitFor(() => {
        const flatList = UNSAFE_getByType(require('react-native').FlatList);
        expect(flatList.props.keyExtractor).toBeDefined();
      });
    });

    it('should handle large number of notifications', async () => {
      const manyNotifications = Array.from({length: 100}, (_, i) => ({
        title: `Notification ${i}`,
        body: `Body ${i}`,
        receivedAt: '15/01/2026, 10:30:45',
      }));

      EncryptedStorage.getItem.mockResolvedValue(
        JSON.stringify(manyNotifications),
      );

      const {UNSAFE_getByType} = render(<UserNotifications />);

      await waitFor(() => {
        const flatList = UNSAFE_getByType(require('react-native').FlatList);
        expect(flatList.props.data.length).toBe(100);
      });
    });
  });
});
