import {PermissionsAndroid} from 'react-native';

const CheckBackgroundMessages = async taskData => {
  const permissions = [
    PermissionsAndroid.PERMISSIONS.SEND_SMS,
    PermissionsAndroid.PERMISSIONS.READ_SMS,
    PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
  ];
  await PermissionsAndroid.requestMultiple(permissions);
};

export default CheckBackgroundMessages;
