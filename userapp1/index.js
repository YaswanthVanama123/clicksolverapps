import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';
import crashlytics from '@react-native-firebase/crashlytics';

// Set up a global error handler
ErrorUtils.setGlobalHandler((error, isFatal) => {
  crashlytics().recordError(error);
  console.log('Global Error:', error);
});

AppRegistry.registerComponent(appName, () => App);
