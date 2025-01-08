module.exports = {
  dependencies: {
    'react-native': {
      platforms: {
        ios: null, // Ensure iOS linking is disabled
        android: {}, // Include Android
      },
    },
  },
  assets: ['./src/assets/fonts'], // Adjust this path to point to your fonts
};
