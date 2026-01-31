const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'json'],
    resolveRequest: (context, moduleName, platform) => {
      // Redirect axios to use browser build instead of node build
      if (moduleName === 'axios') {
        return {
          filePath: path.resolve(__dirname, 'node_modules/axios/dist/browser/axios.cjs'),
          type: 'sourceFile',
        };
      }
      // Let Metro handle all other requests
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
