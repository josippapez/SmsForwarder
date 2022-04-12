import React from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Switch,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {fadeIn} from '../Animations';
import {Section} from '../App';

type Props = {
  isDarkMode: boolean;
  enabled: boolean;
  visible: boolean;
  setVisible: (visible: boolean) => void;
  toggleSwitch: () => void;
};

function ToggleModal(props: Props) {
  const {enabled, toggleSwitch, visible, setVisible, isDarkMode} = props;
  var animation = new Animated.Value(0);

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      onRequestClose={() => {
        setVisible(false);
      }}
      animationType="slide"
      onShow={() => {
        fadeIn(animation, 0.5, 250, false);
      }}>
      <TouchableWithoutFeedback
        onPress={() => {
          setVisible(false);
        }}>
        <Animated.View
          style={{
            flex: 1,
            opacity: animation,
            backgroundColor: isDarkMode ? 'black' : '#4d4d4d',
          }}
        />
      </TouchableWithoutFeedback>
      <View
        style={{
          position: 'absolute',
          width: '100%',
          height: '30%',
          bottom: 0,
          backgroundColor: isDarkMode ? '#5e5e5e' : 'white',
          borderRadius: 20,
          elevation: 20,
        }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Section title="Toggle" boldedTitle />
          <Switch
            trackColor={{
              false: '#767577',
              true: '#81b0ff',
            }}
            thumbColor={enabled ? '#cccccc' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleSwitch}
            value={enabled}
          />
        </View>
      </View>
    </Modal>
  );
}

export default ToggleModal;

const styles = StyleSheet.create({
  content: {
    height: '50%',
    backgroundColor: 'white',
    padding: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 17,
    borderTopLeftRadius: 17,
  },
  contentTitle: {
    fontSize: 20,
    marginBottom: 12,
  },
  contentView: {
    margin: 0,
    height: 100,
    backgroundColor: 'black',
  },
});
