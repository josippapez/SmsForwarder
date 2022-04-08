/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import CheckBackgroundMessages from './CheckBackgroundMessages';

AppRegistry.registerHeadlessTask(
  'CheckBackgroundMessages',
  () => CheckBackgroundMessages,
);
AppRegistry.registerComponent(appName, () => App);
