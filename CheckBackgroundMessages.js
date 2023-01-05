import {NativeModules, PermissionsAndroid} from 'react-native';
import {filter} from './App';
import SmsListener from './SmsListener';

const {Sms} = NativeModules;

const CheckBackgroundMessages = async taskData => {
  const {includes, phoneNumber, body} = filter;
  const includeData = includes.map(item => item.text);
  const permissions = [
    PermissionsAndroid.PERMISSIONS.SEND_SMS,
    PermissionsAndroid.PERMISSIONS.READ_SMS,
    PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
    PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
  ];
  await PermissionsAndroid.requestMultiple(permissions);
  SmsListener.addListener(message => {
    if (includeData.some(word => message.body.includes(word))) {
      Sms.autoSend(
        JSON.stringify(phoneNumber),
        body !== '' ? body : message.body,
        fail => {
          console.log('Failed with this error: ' + fail);
        },
        success => {
          console.log('SMS sent successfully');
        },
      );
    }
  });
};

export default CheckBackgroundMessages;
