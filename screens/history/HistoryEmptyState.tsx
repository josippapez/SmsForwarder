import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "../../constants/colors";

interface HistoryEmptyStateProps {
  isDarkMode: boolean;
  hasFilters: boolean;
}

const HistoryEmptyState: React.FC<HistoryEmptyStateProps> = ({
  isDarkMode,
  hasFilters,
}) => (
  <View style={styles.emptyContainer}>
    <Text
      style={[
        styles.emptyText,
        { color: isDarkMode ? Colors.lighter : Colors.darker },
      ]}
    >
      {hasFilters
        ? "No messages match your filters"
        : "No forwarded messages yet"}
    </Text>
    <Text
      style={[
        styles.emptySubtext,
        { color: isDarkMode ? Colors.light : Colors.dark },
      ]}
    >
      {hasFilters
        ? "Try adjusting your search or filters"
        : "Start forwarding SMS messages to see them here"}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.7,
  },
});

export default HistoryEmptyState;
