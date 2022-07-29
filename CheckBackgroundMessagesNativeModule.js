//  Created by react-native-create-bridge

import {NativeModules} from 'react-native';

const {CheckBackgroundMessages} = NativeModules;

export default {
  exampleMethod() {
    return CheckBackgroundMessages.exampleMethod();
  },

  startService() {
    return CheckBackgroundMessages.startService();
  },

  stopService() {
    return CheckBackgroundMessages.stopService();
  },

  EXAMPLE_CONSTANT: CheckBackgroundMessages.EXAMPLE_CONSTANT,
};
