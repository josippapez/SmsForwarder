import React from "react";
import { View, StyleSheet, useColorScheme } from "react-native";
import { Colors } from "../../constants/colors";
import { Section, CustomTextInput, CustomButton } from "../Shared";
import type { IncludeItem } from "../../types";
import Images from "../../Styles/Images";

interface KeywordInputSectionProps {
  includes: IncludeItem[];
  setIncludes: (includes: IncludeItem[]) => void;
}

/**
 * Section for managing keyword filters
 */
export const KeywordInputSection: React.FC<KeywordInputSectionProps> = ({
  includes,
  setIncludes,
}) => {
  const isDarkMode = useColorScheme() === "dark";

  const handleAddKeyword = () => {
    setIncludes([...includes, { text: "", id: Date.now().toString() }]);
  };

  const handleUpdateKeyword = (index: number, text: string) => {
    const updatedIncludes = [...includes];
    updatedIncludes[index] = { ...updatedIncludes[index], text };
    setIncludes(updatedIncludes);
  };

  const handleRemoveKeyword = (index: number) => {
    setIncludes(includes.filter((_, i) => i !== index));
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
        sectionStyle={styles.sectionHeader}
        titleStyle={styles.sectionTitle}
        title="Message includes..."
      >
        If message includes any of the inputs (case sensitive)
      </Section>

      {includes.map((item, index) => (
        <View
          key={item.id}
          style={[styles.inputRow, index > 0 && styles.inputRowMargin]}
        >
          <CustomTextInput
            style={styles.inputFlex}
            value={item.text}
            onChangeText={text => handleUpdateKeyword(index, text)}
            placeholder="Enter keyword..."
          />
          <CustomButton
            cb={() => handleRemoveKeyword(index)}
            buttonStyle={styles.removeButton}
            backgroundimage={{
              image: isDarkMode ? Images.minusWhite : Images.minus,
              style: { width: 20, height: 20 },
            }}
          />
        </View>
      ))}

      {includes.length < 7 && (
        <CustomButton
          buttonStyle={styles.addButton}
          cb={handleAddKeyword}
          backgroundimage={{
            image: isDarkMode ? Images.addWhite : Images.add,
            style: { width: 20, height: 20 },
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  sectionHeader: {
    marginTop: 0,
  },
  sectionTitle: {
    fontWeight: "500",
  },
  inputRow: {
    flexDirection: "row",
  },
  inputRowMargin: {
    marginTop: 10,
  },
  inputFlex: {
    flex: 1,
  },
  removeButton: {
    marginLeft: 10,
  },
  addButton: {
    marginTop: 20,
  },
});
