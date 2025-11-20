import React from "react";
import { View, StyleSheet, useColorScheme } from "react-native";
import { Colors } from "../../constants/colors";
import { Section, CustomTextInput, CustomButton } from "../Shared";
import { useContactSelector } from "../../hooks";

interface PhoneNumberSectionProps {
  phoneNumber: string;
  setPhoneNumber: (phoneNumber: string) => void;
}

/**
 * Section for phone number input and contact selection
 */
export const PhoneNumberSection: React.FC<PhoneNumberSectionProps> = ({
  phoneNumber,
  setPhoneNumber,
}) => {
  const isDarkMode = useColorScheme() === "dark";
  const { selectPhoneNumber, isLoading } = useContactSelector();

  const handleSelectContact = async () => {
    const phone = await selectPhoneNumber();
    if (phone) {
      setPhoneNumber(phone);
    }
  };

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
        title="Phone number"
        titleStyle={styles.sectionTitle}
        sectionStyle={styles.sectionHeader}
      >
        Choose a phone number to forward/send SMS to
      </Section>

      <CustomTextInput
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        placeholder="Enter phone number..."
      />

      <Section title="OR" boldedTitle sectionStyle={styles.divider} />

      <CustomButton
        title={isLoading ? "Loading..." : "Select phone number"}
        cb={handleSelectContact}
        buttonStyle={styles.selectButton}
        textStyle={styles.selectButtonText}
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
  },
  sectionHeader: {
    marginTop: 0,
  },
  sectionTitle: {
    fontWeight: "500",
  },
  divider: {
    marginTop: 20,
  },
  selectButton: {
    borderRadius: 16,
    paddingHorizontal: 26,
    paddingVertical: 16,
  },
  selectButtonText: {
    fontWeight: "bold",
  },
});
