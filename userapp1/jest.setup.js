// jest.setup.js
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
// jest.setup.js

jest.mock('@react-native-firebase/messaging', () => {
  return {
    onMessage: jest.fn(),
    onNotificationOpenedApp: jest.fn(),
    getInitialNotification: jest.fn().mockResolvedValue(null),
    requestPermission: jest.fn().mockResolvedValue(true),
    getToken: jest.fn().mockResolvedValue('mock-firebase-token'),
    subscribeToTopic: jest.fn(),
    unsubscribeFromTopic: jest.fn(),
  };
});

// jest.setup.js

jest.mock('react-native-push-notification', () => ({
  configure: jest.fn(),
  localNotification: jest.fn(),
  cancelAllLocalNotifications: jest.fn(),
}));

// jest.setup.js

jest.mock('@rnmapbox/maps', () => ({
  MapView: jest.fn(() => null),
  Camera: jest.fn(() => null),
  UserLocation: jest.fn(() => null),
  ShapeSource: jest.fn(() => null),
  SymbolLayer: jest.fn(() => null),
  LineLayer: jest.fn(() => null),
  FillLayer: jest.fn(() => null),
  PointAnnotation: jest.fn(() => null),
  Mapbox: {
    setAccessToken: jest.fn(),
  },
}));

// jest.setup.js

jest.mock('react-native-geolocation-service', () => ({
  getCurrentPosition: jest.fn((success, error) => {
    success({coords: {latitude: 37.7749, longitude: -122.4194}});
  }),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
  stopObserving: jest.fn(),
}));
