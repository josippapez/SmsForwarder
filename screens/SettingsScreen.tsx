import React from "react";
import {
  ColorValue,
  Platform,
  ScrollView,
  StatusBar,
  StatusBarStyle,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { Colors } from "../constants/colors";
import { Section } from "../Components/Shared";
import { DefaultSmsRoleSection } from "../Components/Sections";
import { useDefaultSmsRole } from "../hooks";

const SettingsScreen = () => {
  const roleState = useDefaultSmsRole();
  const isDarkMode = useColorScheme() === "dark";
  const isAndroid = Platform.OS === "android";
  const backgroundColor = isDarkMode ? Colors.black : Colors.white;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar
        animated
        translucent
        backgroundColor={backgroundColor as ColorValue}
        barStyle={
          (isDarkMode ? "light-content" : "dark-content") as StatusBarStyle
        }
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <Section
          boldedTitle
          title="Settings"
          sectionStyle={styles.sectionHeader}
        />
        {isAndroid ? (
          <DefaultSmsRoleSection
            isDefault={roleState.isDefault}
            isRoleAvailable={roleState.isRoleAvailable}
            loading={roleState.loading}
            currentDefaultPackage={roleState.currentDefaultPackage}
            error={roleState.error}
            onRequestRole={roleState.requestRole}
            onRefresh={roleState.refreshStatus}
            onOpenSettings={roleState.openSettings}
          />
        ) : (
          <Text
            style={[
              styles.platformNote,
              { color: isDarkMode ? Colors.light : Colors.dark },
            ]}
          >
            Default SMS role controls are only available on Android devices.
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionHeader: {
    paddingVertical: 20,
  },
  platformNote: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default SettingsScreen;
