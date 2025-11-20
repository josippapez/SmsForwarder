import React from "react";
import { TextInput, StyleSheet, useColorScheme, TextStyle } from "react-native";
import { Colors } from "../../constants/colors";

interface CustomTextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: TextStyle;
  multiline?: boolean;
}

/**
 * Styled text input component with theme support
 */
export const CustomTextInput: React.FC<CustomTextInputProps> = ({
  value,
  onChangeText,
  placeholder,
  style,
  multiline = false,
}) => {
  const isDarkMode = useColorScheme() === "dark";

  return (
    <TextInput
      style={[
        styles.input,
        {
          backgroundColor: isDarkMode
            ? Colors.input.background.dark
            : Colors.input.background.light,
          color: isDarkMode ? Colors.white : Colors.black,
        },
        style,
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.text.secondary}
      multiline={multiline}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    fontSize: 20,
    borderRadius: 10,
    borderColor: "transparent",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});
