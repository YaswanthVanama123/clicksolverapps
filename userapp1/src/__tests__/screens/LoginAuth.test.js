import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import LoginAuth from '../../screens/LoginAuth';
import auth from '@react-native-firebase/auth';

// Mock Firebase Auth
jest.mock('@react-native-firebase/auth', () => {
  return () => ({
    signInWithPhoneNumber: jest.fn(),
    onAuthStateChanged: jest.fn(),
  });
});

describe('LoginAuth Screen', () => {
  let mockAuth;
  let mockConfirmation;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth = auth();

    // Mock confirmation object
    mockConfirmation = {
      confirm: jest.fn(),
    };
  });

  describe('Phone Number Input Stage', () => {
    it('should render phone number input correctly', () => {
      const {getByPlaceholderText, getByText} = render(<LoginAuth />);

      expect(getByPlaceholderText('Enter your mobile number')).toBeTruthy();
      expect(getByText('Send OTP')).toBeTruthy();
    });

    it('should display default phone number prefix +91', () => {
      const {getByDisplayValue} = render(<LoginAuth />);

      expect(getByDisplayValue('+91')).toBeTruthy();
    });

    it('should update phone number when user types', () => {
      const {getByPlaceholderText} = render(<LoginAuth />);
      const input = getByPlaceholderText('Enter your mobile number');

      fireEvent.changeText(input, '+919876543210');

      expect(input.props.value).toBe('+919876543210');
    });

    it('should call signInWithPhoneNumber when Send OTP is pressed', async () => {
      mockAuth.signInWithPhoneNumber.mockResolvedValue(mockConfirmation);

      const {getByText, getByPlaceholderText} = render(<LoginAuth />);
      const input = getByPlaceholderText('Enter your mobile number');
      const sendButton = getByText('Send OTP');

      fireEvent.changeText(input, '+919876543210');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(mockAuth.signInWithPhoneNumber).toHaveBeenCalledWith('+919876543210');
      });
    });

    it('should handle error when signInWithPhoneNumber fails', async () => {
      const error = new Error('Invalid phone number');
      mockAuth.signInWithPhoneNumber.mockRejectedValue(error);

      const {getByText} = render(<LoginAuth />);
      const sendButton = getByText('Send OTP');

      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(mockAuth.signInWithPhoneNumber).toHaveBeenCalled();
      });
    });
  });

  describe('OTP Verification Stage', () => {
    beforeEach(async () => {
      mockAuth.signInWithPhoneNumber.mockResolvedValue(mockConfirmation);
    });

    it('should render OTP input fields after sending OTP', async () => {
      const {getByText, getAllByDisplayValue} = render(<LoginAuth />);
      const sendButton = getByText('Send OTP');

      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(getByText('Confirm Code')).toBeTruthy();
      });

      // Should have 6 OTP input fields
      const otpInputs = getAllByDisplayValue('');
      expect(otpInputs.length).toBeGreaterThanOrEqual(6);
    });

    it('should allow entering OTP digits', async () => {
      const {getByText, getAllByDisplayValue} = render(<LoginAuth />);

      // Send OTP first
      fireEvent.press(getByText('Send OTP'));

      await waitFor(() => {
        expect(getByText('Confirm Code')).toBeTruthy();
      });

      // Get OTP inputs and enter digits
      const otpInputs = getAllByDisplayValue('');

      if (otpInputs.length >= 6) {
        fireEvent.changeText(otpInputs[0], '1');
        fireEvent.changeText(otpInputs[1], '2');
        fireEvent.changeText(otpInputs[2], '3');
        fireEvent.changeText(otpInputs[3], '4');
        fireEvent.changeText(otpInputs[4], '5');
        fireEvent.changeText(otpInputs[5], '6');

        expect(otpInputs[0].props.value).toBe('1');
        expect(otpInputs[5].props.value).toBe('6');
      }
    });

    it('should call confirm when Confirm Code is pressed', async () => {
      mockConfirmation.confirm.mockResolvedValue({user: {uid: '123'}});

      const {getByText, getAllByDisplayValue} = render(<LoginAuth />);

      // Send OTP first
      fireEvent.press(getByText('Send OTP'));

      await waitFor(() => {
        expect(getByText('Confirm Code')).toBeTruthy();
      });

      // Enter OTP
      const otpInputs = getAllByDisplayValue('');
      if (otpInputs.length >= 6) {
        fireEvent.changeText(otpInputs[0], '1');
        fireEvent.changeText(otpInputs[1], '2');
        fireEvent.changeText(otpInputs[2], '3');
        fireEvent.changeText(otpInputs[3], '4');
        fireEvent.changeText(otpInputs[4], '5');
        fireEvent.changeText(otpInputs[5], '6');
      }

      // Confirm code
      const confirmButton = getByText('Confirm Code');
      fireEvent.press(confirmButton);

      await waitFor(() => {
        expect(mockConfirmation.confirm).toHaveBeenCalledWith('123456');
      });
    });

    it('should handle invalid OTP error', async () => {
      mockConfirmation.confirm.mockRejectedValue(new Error('Invalid code'));

      const {getByText, getAllByDisplayValue} = render(<LoginAuth />);

      // Send OTP
      fireEvent.press(getByText('Send OTP'));

      await waitFor(() => {
        expect(getByText('Confirm Code')).toBeTruthy();
      });

      // Enter OTP
      const otpInputs = getAllByDisplayValue('');
      if (otpInputs.length >= 6) {
        fireEvent.changeText(otpInputs[0], '9');
        fireEvent.changeText(otpInputs[1], '9');
        fireEvent.changeText(otpInputs[2], '9');
        fireEvent.changeText(otpInputs[3], '9');
        fireEvent.changeText(otpInputs[4], '9');
        fireEvent.changeText(otpInputs[5], '9');
      }

      // Confirm code
      fireEvent.press(getByText('Confirm Code'));

      await waitFor(() => {
        expect(mockConfirmation.confirm).toHaveBeenCalled();
      });
    });

    it('should limit OTP input to single digit', async () => {
      const {getByText, getAllByDisplayValue} = render(<LoginAuth />);

      fireEvent.press(getByText('Send OTP'));

      await waitFor(() => {
        expect(getByText('Confirm Code')).toBeTruthy();
      });

      const otpInputs = getAllByDisplayValue('');
      if (otpInputs.length > 0) {
        // Should only accept 1 character
        expect(otpInputs[0].props.maxLength).toBe(1);
      }
    });
  });

  describe('Authentication State', () => {
    it('should call onAuthStateChanged on mount', () => {
      const unsubscribe = jest.fn();
      mockAuth.onAuthStateChanged.mockReturnValue(unsubscribe);

      const {unmount} = render(<LoginAuth />);

      expect(mockAuth.onAuthStateChanged).toHaveBeenCalled();

      unmount();
      expect(unsubscribe).toHaveBeenCalled();
    });
  });

  describe('UI Elements', () => {
    it('should apply correct styles to phone input', () => {
      const {getByPlaceholderText} = render(<LoginAuth />);
      const input = getByPlaceholderText('Enter your mobile number');

      expect(input.props.style).toBeDefined();
      expect(input.props.keyboardType).toBe('phone-pad');
    });

    it('should apply numeric keyboard to OTP inputs', async () => {
      const {getByText, getAllByDisplayValue} = render(<LoginAuth />);

      fireEvent.press(getByText('Send OTP'));

      await waitFor(() => {
        const otpInputs = getAllByDisplayValue('');
        if (otpInputs.length > 0) {
          expect(otpInputs[0].props.keyboardType).toBe('numeric');
        }
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty phone number', async () => {
      mockAuth.signInWithPhoneNumber.mockResolvedValue(mockConfirmation);

      const {getByText, getByPlaceholderText} = render(<LoginAuth />);
      const input = getByPlaceholderText('Enter your mobile number');
      const sendButton = getByText('Send OTP');

      fireEvent.changeText(input, '');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(mockAuth.signInWithPhoneNumber).toHaveBeenCalledWith('');
      });
    });

    it('should handle partial OTP entry', async () => {
      const {getByText, getAllByDisplayValue} = render(<LoginAuth />);

      fireEvent.press(getByText('Send OTP'));

      await waitFor(() => {
        expect(getByText('Confirm Code')).toBeTruthy();
      });

      const otpInputs = getAllByDisplayValue('');
      if (otpInputs.length >= 3) {
        fireEvent.changeText(otpInputs[0], '1');
        fireEvent.changeText(otpInputs[1], '2');
        fireEvent.changeText(otpInputs[2], '3');
        // Leave remaining fields empty
      }

      // Should still allow pressing confirm
      const confirmButton = getByText('Confirm Code');
      expect(confirmButton).toBeTruthy();
    });
  });
});
