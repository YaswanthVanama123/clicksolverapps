// jest.config.js
module.exports = {
  preset: 'react-native',
  testEnvironment: 'jest-environment-jsdom',
  setupFiles: ['<rootDir>/jest.setup.js'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-vector-icons|@react-native-firebase|react-native-push-notification|@react-native-community/push-notification-ios|@rnmapbox/maps|react-native-geolocation-service)/)',
  ],
  moduleNameMapper: {
    '\\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
};
