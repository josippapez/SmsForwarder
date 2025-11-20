import React from "react";
import { View, StyleSheet, useColorScheme } from "react-native";
import { Colors } from "../../constants/colors";
import { Section, CustomTextInput } from "../Shared";

interface CustomMessageSectionProps {
  body: string;
  setBody: (body: string) => void;
}

/**
 * Section for custom SMS message input
 */
export const CustomMessageSection: React.FC<CustomMessageSectionProps> = ({
  body,
  setBody,
}) => {
  const isDarkMode = useColorScheme() === "dark";

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode
            ? Colors.background.card.dark
            : Colors.background.card.light,
        },
      ]}
    >
      <Section
        title="Custom SMS message"
        titleStyle={styles.sectionTitle}
        sectionStyle={styles.sectionHeader}
      >
        Leave blank to send the original message
      </Section>

      <CustomTextInput
        value={body}
        onChangeText={setBody}
        placeholder="Enter custom message..."
        multiline
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginTop: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    marginTop: 0,
  },
  sectionTitle: {
    fontWeight: "500",
  },
});
