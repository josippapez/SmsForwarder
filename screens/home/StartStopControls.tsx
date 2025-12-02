import React from "react";
import { StyleSheet, Text } from "react-native";
import { Colors } from "../../constants/colors";
import { CustomButton } from "../../Components/Shared";

interface StartStopControlsProps {
  enabled: boolean;
  disabled: boolean;
  isDarkMode: boolean;
  canControlForwarder: boolean;
  onPress: () => void;
}

const StartStopControls: React.FC<StartStopControlsProps> = ({
  enabled,
  disabled,
  isDarkMode,
  canControlForwarder,
  onPress,
}) => (
  <>
    <CustomButton
      title={enabled ? "Stop" : "Start"}
      cb={onPress}
      disabled={disabled}
      buttonStyle={styles.startStopButton}
      textStyle={styles.startStopButtonText}
    />
    {!canControlForwarder && (
      <Text
        style={{
          marginTop: 8,
          color: isDarkMode ? Colors.light : Colors.dark,
          fontStyle: "italic",
        }}
      >
        SmsForwarder must be the default SMS app before you can start
        forwarding.
      </Text>
    )}
  </>
);

const styles = StyleSheet.create({
  startStopButton: {
    borderRadius: 16,
    paddingHorizontal: 26,
    paddingVertical: 16,
  },
  startStopButtonText: {
    fontWeight: "bold",
  },
});

export default StartStopControls;
