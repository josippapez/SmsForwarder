import SmsListener from 'react-native-android-sms-listener';
import SmsAndroid from 'react-native-get-sms-android';
import {PermissionsAndroid} from 'react-native';
import {filter} from './App';

const CheckBackgroundMessages = async taskData => {
  const newSms = filter;
  console.log(taskData);
  const permissions = [
    PermissionsAndroid.PERMISSIONS.SEND_SMS,
    PermissionsAndroid.PERMISSIONS.READ_SMS,
    PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
  ];
  await PermissionsAndroid.requestMultiple(permissions);
  SmsListener.addListener(message => {
    if (newSms.includes.some(word => message.body.includes(word))) {
      console.log('Message received: ', message);
      SmsAndroid.autoSend(
        JSON.stringify(newSms.phoneNumber),
        newSms.body,
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
