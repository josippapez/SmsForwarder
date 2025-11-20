import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  useColorScheme,
} from "react-native";
import { Colors } from "../../constants/colors";
import type { ForwardingRule } from "../../utils/database";

interface RuleCardProps {
  rule: ForwardingRule;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (enabled: boolean) => void;
}

export const RuleCard: React.FC<RuleCardProps> = ({
  rule,
  onEdit,
  onDelete,
  onToggle,
}) => {
  const isDarkMode = useColorScheme() === "dark";
  const bgColor = isDarkMode ? Colors.darker : Colors.lighter;
  const textColor = isDarkMode ? Colors.lighter : Colors.darker;

  return (
    <View style={[styles.card, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.name, { color: textColor }]}>{rule.name}</Text>
          <Text style={[styles.meta, { color: textColor }]}>
            {rule.keywords.length} keyword
            {rule.keywords.length !== 1 ? "s" : ""} →{" "}
            {rule.targetNumbers.length} number
            {rule.targetNumbers.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <Switch
          value={rule.enabled}
          onValueChange={onToggle}
          trackColor={{ false: "#767577", true: Colors.primary }}
          thumbColor={rule.enabled ? "#fff" : "#f4f3f4"}
        />
      </View>

      <View style={styles.keywords}>
        {rule.keywords.slice(0, 3).map((keyword, index) => (
          <View
            key={index}
            style={[
              styles.keywordBadge,
              { backgroundColor: isDarkMode ? Colors.dark : Colors.light },
            ]}
          >
            <Text style={[styles.keywordText, { color: textColor }]}>
              {keyword}
            </Text>
          </View>
        ))}
        {rule.keywords.length > 3 && (
          <Text style={[styles.meta, { color: textColor }]}>
            +{rule.keywords.length - 3} more
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={onEdit}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={onDelete}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  meta: {
    fontSize: 12,
    opacity: 0.7,
  },
  keywords: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  keywordBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  keywordText: {
    fontSize: 12,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  editButton: {
    backgroundColor: Colors.primary,
  },
  deleteButton: {
    backgroundColor: Colors.error,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
