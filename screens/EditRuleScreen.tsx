import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  useColorScheme,
  Alert,
  Switch,
  Text,
  ActivityIndicator,
} from "react-native";
import { Colors } from "../constants/colors";
import { Section, CustomButton, CustomTextInput } from "../Components/Shared";
import {
  KeywordInputSection,
  CustomMessageSection,
} from "../Components/Sections";
import { createRule, updateRule, getRule } from "../utils/database";

interface EditRuleScreenProps {
  navigation: any;
  route: any;
}

const EditRuleScreen: React.FC<EditRuleScreenProps> = ({
  navigation,
  route,
}) => {
  const isDarkMode = useColorScheme() === "dark";
  const ruleId = route.params?.ruleId as number | null;
  const isEditMode = ruleId !== null;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);

  // Form state
  const [ruleName, setRuleName] = useState("");
  const [keywordItems, setKeywordItems] = useState<
    Array<{ id: string; text: string }>
  >([]);
  const [targetNumbers, setTargetNumbers] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [stopOnMatch, setStopOnMatch] = useState(false);

  // Load existing rule if in edit mode
  useEffect(() => {
    if (isEditMode && ruleId) {
      loadRule(ruleId);
    }
  }, [isEditMode, ruleId]);

  const loadRule = async (id: number) => {
    try {
      setLoading(true);
      const rule = await getRule(id);

      if (!rule) {
        Alert.alert("Error", "Rule not found");
        navigation.goBack();
        return;
      }

      setRuleName(rule.name);
      setKeywordItems(
        rule.keywords.map(keyword => ({
          id: Date.now().toString() + Math.random(),
          text: keyword,
        }))
      );
      setTargetNumbers(rule.targetNumbers);
      setCustomMessage(rule.customMessage || "");
      setEnabled(rule.enabled);
      setStopOnMatch(rule.stopOnMatch);
    } catch (error) {
      console.error("Failed to load rule:", error);
      Alert.alert("Error", "Failed to load rule");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!ruleName.trim()) {
      Alert.alert("Validation Error", "Please enter a rule name");
      return false;
    }

    const keywords = keywordItems.map(item => item.text.trim()).filter(Boolean);
    if (keywords.length === 0) {
      Alert.alert("Validation Error", "Please add at least one keyword");
      return false;
    }

    if (targetNumbers.length === 0) {
      Alert.alert("Validation Error", "Please add at least one target number");
      return false;
    }

    // Validate phone numbers
    const phoneRegex = /^\+?[\d\s\-()]+$/;
    const invalidNumbers = targetNumbers.filter(
      num => !phoneRegex.test(num.trim())
    );

    if (invalidNumbers.length > 0) {
      Alert.alert(
        "Validation Error",
        `Invalid phone number format: ${invalidNumbers.join(", ")}`
      );
      return false;
    }

    return true;
  };

  const getSaveButtonTitle = () => {
    if (saving) return "Saving...";
    return isEditMode ? "Update Rule" : "Create Rule";
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const keywords = keywordItems
        .map(item => item.text.trim())
        .filter(Boolean);
      const ruleData = {
        name: ruleName.trim(),
        keywords,
        targetNumbers: targetNumbers.map(n => n.trim()).filter(Boolean),
        customMessage: customMessage.trim() || undefined,
        enabled,
        stopOnMatch,
      };

      if (isEditMode && ruleId) {
        await updateRule(ruleId, ruleData);
        Alert.alert("Success", "Rule updated successfully");
      } else {
        await createRule(ruleData);
        Alert.alert("Success", "Rule created successfully");
      }

      navigation.goBack();
    } catch (error) {
      console.error("Failed to save rule:", error);
      Alert.alert("Error", "Failed to save rule");
    } finally {
      setSaving(false);
    }
  };

  const backgroundColor = isDarkMode ? Colors.black : Colors.white;
  const textColor = isDarkMode ? Colors.lighter : Colors.darker;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={textColor} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Rule Name */}
        <View
          style={[
            styles.cardSection,
            {
              backgroundColor: isDarkMode
                ? Colors.background.card.dark
                : Colors.background.card.light,
            },
          ]}
        >
          <Section
            title="Rule Name"
            sectionStyle={styles.sectionInCard}
            titleStyle={styles.sectionTitle}
          >
            Give this rule a descriptive name
          </Section>
          <CustomTextInput
            placeholder="e.g., Bank Alerts, Work Messages"
            onChangeText={setRuleName}
            value={ruleName}
          />
        </View>

        {/* Keywords */}
        <KeywordInputSection
          includes={keywordItems}
          setIncludes={setKeywordItems}
        />

        {/* Target Numbers */}
        <View
          style={[
            styles.cardSection,
            {
              backgroundColor: isDarkMode
                ? Colors.background.card.dark
                : Colors.background.card.light,
            },
          ]}
        >
          <Section
            title="Target Numbers"
            sectionStyle={styles.sectionInCard}
            titleStyle={styles.sectionTitle}
          >
            SMS will be forwarded to these numbers
          </Section>
          {targetNumbers.map((number, index) => (
            <View key={`${number}-${index}`} style={styles.inputRow}>
              <CustomTextInput
                style={styles.inputFlex}
                value={number}
                onChangeText={text => {
                  const updated = [...targetNumbers];
                  updated[index] = text;
                  setTargetNumbers(updated);
                }}
                placeholder="Enter phone number..."
              />
              <CustomButton
                cb={() => {
                  setTargetNumbers(targetNumbers.filter((_, i) => i !== index));
                }}
                buttonStyle={styles.removeButton}
                title="✕"
              />
            </View>
          ))}
          {targetNumbers.length < 5 && !saving && (
            <CustomButton
              title="+ Add Number"
              cb={() => setTargetNumbers([...targetNumbers, ""])}
              buttonStyle={styles.addButton}
            />
          )}
        </View>

        {/* Custom Message */}
        <CustomMessageSection body={customMessage} setBody={setCustomMessage} />

        {/* Stop on Match */}
        <View
          style={[
            styles.cardSection,
            {
              backgroundColor: isDarkMode
                ? Colors.background.card.dark
                : Colors.background.card.light,
            },
          ]}
        >
          <Section
            title="Stop on Match"
            sectionStyle={styles.sectionInCard}
            titleStyle={styles.sectionTitle}
          >
            Stop checking other rules after this one matches
          </Section>
          <View style={styles.switchContainer}>
            <Text style={[styles.switchLabel, { color: textColor }]}>
              {stopOnMatch ? "Enabled" : "Disabled"}
            </Text>
            <Switch
              value={stopOnMatch}
              onValueChange={setStopOnMatch}
              disabled={saving}
              trackColor={{
                false: isDarkMode ? Colors.dark : Colors.lighter,
                true: Colors.primary,
              }}
              thumbColor={isDarkMode ? Colors.lighter : Colors.white}
            />
          </View>
        </View>

        {/* Enabled */}
        <View
          style={[
            styles.cardSection,
            {
              backgroundColor: isDarkMode
                ? Colors.background.card.dark
                : Colors.background.card.light,
            },
          ]}
        >
          <Section
            title="Rule Status"
            sectionStyle={styles.sectionInCard}
            titleStyle={styles.sectionTitle}
          >
            Enable or disable this forwarding rule
          </Section>
          <View style={styles.switchContainer}>
            <Text style={[styles.switchLabel, { color: textColor }]}>
              {enabled ? "Enabled" : "Disabled"}
            </Text>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              disabled={saving}
              trackColor={{
                false: isDarkMode ? Colors.dark : Colors.lighter,
                true: Colors.primary,
              }}
              thumbColor={isDarkMode ? Colors.lighter : Colors.white}
            />
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <CustomButton
            title={getSaveButtonTitle()}
            cb={handleSave}
            buttonStyle={
              saving
                ? { ...styles.saveButton, ...styles.saveButtonDisabled }
                : styles.saveButton
            }
            textStyle={styles.saveButtonText}
          />
          <CustomButton
            title="Cancel"
            cb={saving ? () => {} : () => navigation.goBack()}
            buttonStyle={styles.cancelButton}
            textStyle={{ ...styles.cancelButtonText, color: textColor }}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cardSection: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginTop: 20,
  },
  sectionInCard: {
    marginTop: 0,
  },
  sectionTitle: {
    fontWeight: "500",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  buttonContainer: {
    paddingTop: 20,
    gap: 12,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: 26,
    paddingVertical: 16,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderRadius: 16,
    paddingHorizontal: 26,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.dark,
  },
  cancelButtonText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  inputRow: {
    flexDirection: "row",
    marginTop: 10,
    alignItems: "center",
  },
  inputFlex: {
    flex: 1,
  },
  removeButton: {
    marginLeft: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButton: {
    marginTop: 20,
  },
});

export default EditRuleScreen;
