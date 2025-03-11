import React from 'react';
import {render, waitFor, fireEvent} from '@testing-library/react-native';
import ServiceApp from '../SecondPage';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import {useNavigation, useRoute} from '@react-navigation/native';
// import Config from 'react-native-config';

// Mock dependencies
jest.mock('axios');
jest.mock('react-native-encrypted-storage');
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
}));

describe('ServiceApp Component', () => {
  const mockNavigation = {push: jest.fn(), replace: jest.fn()};
  const mockRoute = {params: {encodedId: btoa('12345')}};

  beforeEach(() => {
    useNavigation.mockReturnValue(mockNavigation);
    useRoute.mockReturnValue(mockRoute);
    jest.clearAllMocks();
  });

  it('renders loading animation while fetching services', async () => {
    axios.get.mockResolvedValueOnce({data: []});

    const {getByTestId} = render(<ServiceApp />);

    expect(getByTestId('loading-animation')).toBeTruthy();

    await waitFor(() => expect(axios.get).toHaveBeenCalled());
  });

  it('fetches and displays services correctly', async () => {
    const servicesMock = [
      {
        service_name: 'Plumbing',
        service_urls: 'https://example.com/plumbing.jpg',
      },
    ];

    axios.get.mockResolvedValueOnce({data: servicesMock});

    const {getByText, getByTestId} = render(<ServiceApp />);

    await waitFor(() => {
      expect(getByText('Plumbing')).toBeTruthy();
      expect(getByTestId('service-image')).toBeTruthy();
    });
  });

  it('shows modal when encodedId is present in route params', async () => {
    const {getByText} = render(<ServiceApp />);

    await waitFor(() => {
      expect(getByText('How was the quality of your Service?')).toBeTruthy();
    });
  });

  it('submits feedback successfully', async () => {
    axios.post.mockResolvedValueOnce({data: {message: 'Success'}});
    EncryptedStorage.getItem.mockResolvedValueOnce('mock-jwt-token');

    const {getByText, getByPlaceholderText} = render(<ServiceApp />);

    // Set rating
    fireEvent.press(getByText('Submit'));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        `http:192.168.243.71:5000/api/user/feedback`,
        {rating: 0, comment: '', notification_id: '12345'},
        {headers: {Authorization: 'Bearer mock-jwt-token'}},
      );
    });
  });

  it('displays special offers correctly', () => {
    const {getByText} = render(<ServiceApp />);

    expect(getByText('20%')).toBeTruthy();
    expect(getByText('New User Special')).toBeTruthy();
    expect(getByText('Summer Sale')).toBeTruthy();
  });

  it('handles navigation to Notifications screen', () => {
    const {getByTestId} = render(<ServiceApp />);

    fireEvent.press(getByTestId('notifications-button'));

    expect(mockNavigation.push).toHaveBeenCalledWith('Notifications');
  });
});
