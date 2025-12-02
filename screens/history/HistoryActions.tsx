import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CustomButton } from "../../Components/Shared";

interface HistoryActionsProps {
  onExport: () => void;
  onClear: () => void;
}

const HistoryActions: React.FC<HistoryActionsProps> = ({
  onExport,
  onClear,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.actionButtons, { paddingBottom: insets.bottom || 12 }]}
    >
      <CustomButton
        title="Export CSV"
        cb={onExport}
        buttonStyle={{ ...styles.actionButton, ...styles.exportButton }}
        textStyle={styles.actionButtonText}
      />
      <CustomButton
        title="Clear All"
        cb={onClear}
        buttonStyle={{ ...styles.actionButton, ...styles.deleteButton }}
        textStyle={styles.actionButtonText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  actionButtons: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
  },
  exportButton: {
    backgroundColor: "#2196F3",
  },
  deleteButton: {
    backgroundColor: "#F44336",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});

export default HistoryActions;
