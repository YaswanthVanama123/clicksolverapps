import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import EditProfile from '../EditProfile';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import {useNavigation, useRoute} from '@react-navigation/native';

// Mock dependencies
jest.mock('axios');
jest.mock('react-native-encrypted-storage');
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
  CommonActions: {
    reset: jest.fn(),
  },
}));
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

describe('EditProfile Screen', () => {
  const mockNavigation = {goBack: jest.fn(), dispatch: jest.fn()};
  const mockRoute = {
    params: {
      details: {
        name: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '1234567890',
      },
    },
  };

  beforeEach(() => {
    useNavigation.mockReturnValue(mockNavigation);
    useRoute.mockReturnValue(mockRoute);
  });

  it('renders the profile details correctly', async () => {
    const {getByDisplayValue} = render(<EditProfile />);

    await waitFor(() => {
      expect(getByDisplayValue('John Doe')).toBeTruthy();
      expect(getByDisplayValue('john@example.com')).toBeTruthy();
      expect(getByDisplayValue('1234567890')).toBeTruthy();
    });
  });

  it('updates the full name input', async () => {
    const {getByTestId} = render(<EditProfile />);
    const fullNameInput = getByTestId('fullName-input');

    fireEvent.changeText(fullNameInput, 'Jane Doe');

    expect(fullNameInput.props.value).toBe('Jane Doe');
  });

  it('calls updateProfile API on button press', async () => {
    axios.post.mockResolvedValue({status: 200});
    EncryptedStorage.getItem.mockResolvedValue('mock-jwt-token');

    const {getByText} = render(<EditProfile />);
    const button = getByText('Update Profile');

    fireEvent.press(button);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        `${process.env.BACKENDAIPJ}/api/user/details/update`,
        {name: 'John Doe', email: 'john@example.com', phone: '1234567890'},
        {headers: {Authorization: 'Bearer mock-jwt-token'}},
      );
    });
  });
});
