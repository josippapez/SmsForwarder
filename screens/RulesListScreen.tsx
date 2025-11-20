import React, { useState, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  useColorScheme,
  Alert,
  ActivityIndicator,
  Text,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Colors } from "../constants/colors";
import {
  getAllRules,
  deleteRule,
  toggleRuleEnabled,
  type ForwardingRule,
} from "../utils/database";
import { RuleCard } from "../Components/Rules/RuleCard";
import { Section, CustomButton } from "../Components/Shared";

interface RulesListScreenProps {
  navigation: any;
}

const RulesListScreen: React.FC<RulesListScreenProps> = ({ navigation }) => {
  const isDarkMode = useColorScheme() === "dark";
  const [rules, setRules] = useState<ForwardingRule[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRules = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedRules = await getAllRules();
      setRules(fetchedRules);
    } catch (error) {
      console.error("Failed to load rules:", error);
      Alert.alert("Error", "Failed to load forwarding rules");
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload rules when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadRules();
    }, [loadRules])
  );

  const handleEdit = (rule: ForwardingRule) => {
    navigation.navigate("EditRule", { ruleId: rule.id });
  };

  const handleDelete = (rule: ForwardingRule) => {
    Alert.alert(
      "Delete Rule",
      `Are you sure you want to delete "${rule.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteRule(rule.id)
              .then(() => loadRules())
              .catch(error => {
                console.error("Failed to delete rule:", error);
                Alert.alert("Error", "Failed to delete rule");
              });
          },
        },
      ]
    );
  };

  const handleToggle = async (rule: ForwardingRule, enabled: boolean) => {
    try {
      await toggleRuleEnabled(rule.id, enabled);
      loadRules();
    } catch (error) {
      console.error("Failed to toggle rule:", error);
      Alert.alert("Error", "Failed to update rule");
    }
  };

  const handleAddRule = () => {
    navigation.navigate("EditRule", { ruleId: null });
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text
        style={[
          styles.emptyText,
          { color: isDarkMode ? Colors.lighter : Colors.darker },
        ]}
      >
        No Forwarding Rules
      </Text>
      <Text
        style={[
          styles.emptySubtext,
          { color: isDarkMode ? Colors.light : Colors.dark },
        ]}
      >
        Create your first rule to start forwarding SMS messages
      </Text>
    </View>
  );

  const backgroundColor = isDarkMode ? Colors.black : Colors.white;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Section
        boldedTitle
        title="Forwarding Rules"
        sectionStyle={{
          paddingVertical: 20,
        }}
      />

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator
            size="large"
            color={isDarkMode ? Colors.lighter : Colors.darker}
          />
        </View>
      ) : (
        <FlatList
          data={rules}
          renderItem={({ item }) => (
            <RuleCard
              rule={item}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(item)}
              onToggle={enabled => handleToggle(item, enabled)}
            />
          )}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
        />
      )}

      <View style={styles.addButtonContainer}>
        <CustomButton
          title="Add New Rule"
          cb={handleAddRule}
          buttonStyle={styles.addButton}
          textStyle={styles.addButtonText}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  listContent: {
    paddingBottom: 100,
    flexGrow: 1,
  },
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
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default RulesListScreen;
