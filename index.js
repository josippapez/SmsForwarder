/**
 * @format
 */

import React from 'react';
import {AppRegistry} from 'react-native';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import App from './App';
import {name as appName} from './app.json';
import CheckBackgroundMessages from './CheckBackgroundMessages';
import {persistor, store} from './store/store';

const Root = () => (
  <Provider store={store}>
    <PersistGate persistor={persistor} loading={null}>
      <App />
    </PersistGate>
  </Provider>
);

AppRegistry.registerHeadlessTask(
  'CheckBackgroundMessages',
  () => CheckBackgroundMessages,
);
AppRegistry.registerComponent(appName, () => Root);
