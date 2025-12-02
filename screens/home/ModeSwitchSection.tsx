import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../../constants/colors";
import { Section, CustomButton } from "../../Components/Shared";

interface ModeSwitchSectionProps {
  isDarkMode: boolean;
  advancedMode: boolean;
  onToggleMode: () => void;
}

const ModeSwitchSection: React.FC<ModeSwitchSectionProps> = ({
  isDarkMode,
  advancedMode,
  onToggleMode,
}) => {
  return (
    <>
      <Section title="Mode">
        {advancedMode
          ? "Using Advanced Mode (Multiple Rules)"
          : "Using Simple Mode (Single Rule)"}
      </Section>
      <View style={styles.modeContainer}>
        <Text
          style={[
            styles.modeText,
            { color: isDarkMode ? Colors.lighter : Colors.darker },
          ]}
        >
          {advancedMode ? "Advanced Mode" : "Simple Mode"}
        </Text>
        <CustomButton
          title={advancedMode ? "Switch to Simple" : "Switch to Advanced"}
          cb={onToggleMode}
          buttonStyle={styles.modeToggleButton}
          textStyle={styles.modeToggleText}
        />
      </View>
      {advancedMode && (
        <Text
          style={[
            styles.modeNote,
            { color: isDarkMode ? Colors.light : Colors.dark },
          ]}
        >
          Manage rules in the "Rules" tab
        </Text>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  modeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    gap: 10,
  },
  modeText: {
    fontSize: 16,
    fontWeight: "500",
  },
  modeToggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modeToggleText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modeNote: {
    fontSize: 13,
    marginTop: 8,
    fontStyle: "italic",
  },
});

export default ModeSwitchSection;
