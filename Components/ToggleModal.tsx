import React, { useRef, useEffect } from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Switch,
  TouchableWithoutFeedback,
  View,
  Text,
} from "react-native";
import { fadeIn } from "../animations/Animations";
import { Section } from "./Shared";

type Props = Readonly<{
  isDarkMode: boolean;
  enabled: boolean;
  visible: boolean;
  setVisible: (visible: boolean) => void;
  toggleSwitch: () => void;
  canToggle: boolean;
  blockedMessage?: string | null;
}>;

function ToggleModal(props: Props) {
  const {
    enabled,
    toggleSwitch,
    visible,
    setVisible,
    isDarkMode,
    canToggle,
    blockedMessage,
  } = props;
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      animation.setValue(0);
      fadeIn(animation, 0.5, 250, false);
    }
  }, [visible, animation]);

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      onRequestClose={() => {
        setVisible(false);
      }}
      animationType="slide"
    >
      <TouchableWithoutFeedback
        onPress={() => {
          setVisible(false);
        }}
      >
        <Animated.View
          style={{
            flex: 1,
            opacity: animation,
            backgroundColor: isDarkMode ? "black" : "#4d4d4d",
          }}
        />
      </TouchableWithoutFeedback>
      <View
        style={{
          position: "absolute",
          width: "100%",
          height: "30%",
          bottom: 0,
          backgroundColor: isDarkMode ? "#5e5e5e" : "white",
          borderRadius: 20,
          elevation: 20,
        }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Section title={enabled ? "Running" : "Stopped"} boldedTitle />
          <Switch
            trackColor={{
              false: "#767577",
              true: "#81b0ff",
            }}
            thumbColor={enabled ? "#cccccc" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleSwitch}
            value={enabled}
            disabled={!canToggle}
          />
          {!canToggle && blockedMessage && (
            <Text
              style={{
                marginTop: 16,
                color: isDarkMode ? "#f5f5f5" : "#333333",
                textAlign: "center",
              }}
            >
              {blockedMessage}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default ToggleModal;

const styles = StyleSheet.create({
  content: {
    height: "50%",
    backgroundColor: "white",
    padding: 22,
    justifyContent: "center",
    alignItems: "center",
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
    backgroundColor: "black",
  },
});
