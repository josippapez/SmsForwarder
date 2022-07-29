import {NativeEventEmitter, NativeModules} from 'react-native';

const {SmsListenerPackage} = NativeModules;
const smsListenerEmitter = new NativeEventEmitter(SmsListenerPackage);
const SMS_RECEIVED_EVENT = 'com.smsforwarder.smslistener:smsReceived';

export default {
  addListener(listener) {
    return smsListenerEmitter.addListener(SMS_RECEIVED_EVENT, listener);
  },
};
