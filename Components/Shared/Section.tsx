import React from "react";
import { View, Text, StyleSheet, useColorScheme } from "react-native";
import { Colors } from "../../constants/colors";

interface SectionProps {
  title: string;
  children?: string;
  boldedTitle?: boolean;
  sectionStyle?: any;
  titleStyle?: any;
}

/**
 * Section component for displaying titled content sections
 */
export const Section: React.FC<SectionProps> = ({
  title,
  children,
  boldedTitle = false,
  sectionStyle,
  titleStyle,
}) => {
  const isDarkMode = useColorScheme() === "dark";

  return (
    <View style={[styles.sectionContainer, sectionStyle]}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
            fontWeight: boldedTitle ? "700" : "400",
          },
          titleStyle,
        ]}
      >
        {title}
      </Text>
      {children ? (
        <Text
          style={[
            styles.sectionDescription,
            {
              color: isDarkMode ? Colors.text.secondary : Colors.dark,
            },
          ]}
        >
          {children}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "600",
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "400",
  },
});
