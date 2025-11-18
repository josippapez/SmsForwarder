import React from 'react';
import {Modal, Text, TouchableWithoutFeedback, View} from 'react-native';
import CustomButton from './Shared/CustomButton';

type Props = {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  setDisplayToggleModal: () => void;
};

const PermissionsPolicyModal = (props: Props) => {
  const {visible, setVisible, setDisplayToggleModal} = props;
  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      onRequestClose={() => {
        setVisible(false);
      }}
      animationType="fade">
      <TouchableWithoutFeedback
        onPress={e => {
          if (e.currentTarget === e.target) {
            setVisible(false);
          }
        }}>
        <View
          style={{
            flex: 1,
            backgroundColor: '#00000099',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <View
            style={{
              position: 'absolute',
              padding: 20,
              width: '90%',
              backgroundColor: '#333333',
              borderRadius: 20,
              elevation: 20,
            }}>
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: '#ffffff',
                  textAlign: 'center',
                }}>
                This app requires access to SMS Send, Read and Receive
                permissions to function properly. You will be asked to grant
                these permissions when you try to start the app on start button.
              </Text>
              <Text
                style={{
                  marginTop: 20,
                  fontSize: 16,
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}>
                If you're not prompted to grant these permissions, please enable
                these permissions in your device's apps settings.
              </Text>
              <CustomButton
                title="OK"
                cb={() => {
                  setVisible(false);
                  setDisplayToggleModal();
                }}
                buttonStyle={{
                  marginTop: 20,
                  width: '100%',
                  backgroundColor: '#ff0000',
                }}
              />
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default PermissionsPolicyModal;
