import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { Colors } from "../../constants/colors";
import { Section, CustomButton } from "../Shared";

interface Props {
  isDefault: boolean;
  isRoleAvailable: boolean;
  loading: boolean;
  currentDefaultPackage: string | null;
  error: string | null;
  onRequestRole: () => void;
  onRefresh: () => void;
  onOpenSettings: () => void;
}

export const DefaultSmsRoleSection: React.FC<Props> = ({
  isDefault,
  isRoleAvailable,
  loading,
  currentDefaultPackage,
  error,
  onRequestRole,
  onRefresh,
  onOpenSettings,
}) => {
  const isDarkMode = useColorScheme() === "dark";
  const requestDescription = isDefault
    ? "SmsForwarder is the active SMS app."
    : "SmsForwarder must become the default SMS app before messages can be forwarded.";

  const availabilityNote = isRoleAvailable
    ? null
    : "Your device blocks automatic role changes. Use system settings to update the default SMS app.";

  const cardColors = {
    background: isDarkMode
      ? Colors.background.card.dark
      : Colors.background.card.light,
    border: isDarkMode ? Colors.input.border.dark : Colors.input.border.light,
    text: isDarkMode ? Colors.text.dark : Colors.text.light,
  };

  const requestButtonStyle = {
    ...styles.primaryButton,
    ...(isDefault ? { backgroundColor: cardColors.border } : null),
  };

  return (
    <View style={styles.container}>
      <Section title="Default SMS Role">{requestDescription}</Section>
      <View
        style={[
          styles.card,
          {
            backgroundColor: cardColors.background,
            borderColor: cardColors.border,
          },
        ]}
      >
        <View style={styles.statusRow}>
          <View style={styles.statusInfo}>
            <Text style={[styles.statusLabel, { color: cardColors.text }]}>
              Current status
            </Text>
            {currentDefaultPackage && (
              <Text
                style={[styles.detailText, { color: cardColors.text }]}
                numberOfLines={2}
              >
                Default package:{" "}
                <Text style={styles.detailValue}>{currentDefaultPackage}</Text>
              </Text>
            )}
          </View>
          <View
            style={[
              styles.badge,
              isDefault ? styles.badgeSuccess : styles.badgeWarning,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: isDarkMode ? Colors.text.dark : Colors.text.light },
              ]}
            >
              {isDefault ? "Active" : "Action needed"}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={[styles.loadingText, { color: cardColors.text }]}>
              Checking status…
            </Text>
          </View>
        ) : (
          <Text style={[styles.descriptionText, { color: cardColors.text }]}>
            {requestDescription}
          </Text>
        )}

        {availabilityNote && (
          <Text style={styles.noteText}>{availabilityNote}</Text>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.buttonRow}>
          <CustomButton
            title={isDefault ? "Already default" : "Set as default"}
            cb={onRequestRole}
            disabled={isDefault || !isRoleAvailable}
            buttonStyle={requestButtonStyle}
            textStyle={styles.primaryButtonText}
          />
          <CustomButton
            title="Refresh"
            cb={onRefresh}
            buttonStyle={{
              ...styles.secondaryButton,
              borderColor: cardColors.border,
              backgroundColor: cardColors.background,
            }}
            textStyle={{
              ...styles.secondaryButtonText,
              color: cardColors.text,
            }}
          />
        </View>

        {!isDefault && (
          <CustomButton
            title="Open system settings"
            cb={onOpenSettings}
            buttonStyle={{
              ...styles.tertiaryButton,
              borderColor: cardColors.border,
              backgroundColor: cardColors.background,
            }}
            textStyle={styles.tertiaryButtonText}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  statusInfo: {
    flex: 1,
    minWidth: 0,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  badgeSuccess: {
    backgroundColor: `${Colors.success}33`,
  },
  badgeWarning: {
    backgroundColor: `${Colors.warning}33`,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text.light,
  },
  descriptionText: {
    fontSize: 14,
  },
  detailText: {
    fontSize: 13,
    marginTop: 2,
    flexShrink: 1,
  },
  detailValue: {
    fontWeight: "600",
    color: Colors.primary,
  },
  noteText: {
    fontSize: 13,
    color: Colors.warning,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  primaryButtonText: {
    color: Colors.white,
    fontWeight: "700",
  },
  secondaryButton: {
    width: 120,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.background.card.light,
    borderWidth: 1,
    borderColor: Colors.input.border.light,
  },
  secondaryButtonText: {
    color: Colors.text.light,
    fontWeight: "600",
  },
  tertiaryButton: {
    marginTop: 6,
    width: "100%",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.background.card.light,
    borderWidth: 1,
    borderColor: Colors.input.border.light,
  },
  tertiaryButtonText: {
    color: Colors.primary,
    fontWeight: "600",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.text.light,
  },
});
