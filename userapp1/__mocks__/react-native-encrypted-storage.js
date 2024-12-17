// __mocks__/react-native-encrypted-storage.js
export default {
  getItem: jest.fn(() => Promise.resolve('mock-jwt-token')),
  setItem: jest.fn(() => Promise.resolve()),
};
