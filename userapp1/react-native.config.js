// react-native.config.js
module.exports = {
  // 1️⃣ Skip codegen / TS parsing for @rnmapbox/maps
  codegenConfig: {
    '@rnmapbox/maps': {
      type: 'binary',
    },
  },
  // 2️⃣ Stop automatic iOS pod injection (we’re doing it by hand in Podfile)
  dependencies: {
    '@rnmapbox/maps': {
      platforms: { ios: null },
    },
  },
};
NativeRNMBXLocationModule.ts