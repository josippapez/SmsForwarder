import React, { useState } from "react";
import {
  ColorValue,
  ScrollView,
  StatusBar,
  StatusBarStyle,
  StyleSheet,
  useColorScheme,
  View,
  Text,
} from "react-native";
import { useAtom } from "jotai";
import {
  includesAtom,
  phoneNumberAtom,
  bodyAtom,
  readPermissionsPolicyAtom,
  advancedModeAtom,
} from "../store/atoms";
import { Colors } from "../constants/colors";
import { useSmsForwarder, usePersistence } from "../hooks";
import PermissionsPolicyModal from "../Components/PermissionsPolicyModal";
import ToggleModal from "../Components/ToggleModal";
import { Section, CustomButton } from "../Components/Shared";
import {
  KeywordInputSection,
  PhoneNumberSection,
  CustomMessageSection,
} from "../Components/Sections";

/**
 * Main Home Screen - SMS Forwarder Configuration
 * Allows users to configure SMS forwarding rules
 */
const HomeScreen = () => {
  const isDarkMode = useColorScheme() === "dark";

  // Global state from Jotai
  const [includes, setIncludes] = useAtom(includesAtom);
  const [phoneNumber, setPhoneNumber] = useAtom(phoneNumberAtom);
  const [body, setBody] = useAtom(bodyAtom);
  const [readPermissionsPolicy, setReadPermissionsPolicy] = useAtom(
    readPermissionsPolicyAtom
  );
  const [advancedMode, setAdvancedMode] = useAtom(advancedModeAtom);

  // Local state
  const [displayPermissionsPolicy, setDisplayPermissionsPolicy] =
    useState(false);
  const [visible, setVisible] = useState(false);
  const [enabled, setEnabled] = useState(false);

  // Enable persistence for Jotai atoms
  usePersistence();

  // Custom hooks
  const includeData = includes.map(item => item.text);
  useSmsForwarder({
    enabled,
    advancedMode,
    simpleKeywords: includeData,
    simpleTargetNumber: phoneNumber,
    simpleCustomMessage: body,
  });

  const toggleSwitch = () => setEnabled(prev => !prev);

  const toggleVisible = () => {
    if (!readPermissionsPolicy) {
      return setDisplayPermissionsPolicy(true);
    }
    setVisible(prev => !prev);
  };

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.black : Colors.white,
    flex: 1,
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar
        animated={true}
        translucent
        backgroundColor={
          (isDarkMode ? Colors.black : Colors.white) as ColorValue
        }
        barStyle={
          (isDarkMode ? "light-content" : "dark-content") as StatusBarStyle
        }
        showHideTransition={"fade"}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        bounces
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingVertical: 20,
        }}
        style={backgroundStyle}
        keyboardShouldPersistTaps="handled"
      >
        <Section
          boldedTitle
          title="SMS Forwarder"
          sectionStyle={{
            paddingVertical: 20,
          }}
        />

        <Section title="Mode">
          {advancedMode
            ? "Using Advanced Mode (Multiple Rules)"
            : "Using Simple Mode (Single Rule)"}
        </Section>
        <View style={styles.modeContainer}>
          <Text
            style={[
              styles.modeText,
              { color: isDarkMode ? Colors.lighter : Colors.darker },
            ]}
          >
            {advancedMode ? "Advanced Mode" : "Simple Mode"}
          </Text>
          <CustomButton
            title={advancedMode ? "Switch to Simple" : "Switch to Advanced"}
            cb={() => setAdvancedMode(!advancedMode)}
            buttonStyle={styles.modeToggleButton}
            textStyle={styles.modeToggleText}
          />
        </View>
        {advancedMode && (
          <Text
            style={[
              styles.modeNote,
              { color: isDarkMode ? Colors.light : Colors.dark },
            ]}
          >
            Manage rules in the "Rules" tab
          </Text>
        )}

        {!advancedMode && (
          <>
            <KeywordInputSection
              includes={includes}
              setIncludes={setIncludes}
            />

            <PhoneNumberSection
              phoneNumber={phoneNumber}
              setPhoneNumber={setPhoneNumber}
            />

            <CustomMessageSection body={body} setBody={setBody} />
          </>
        )}

        <CustomButton
          title={enabled ? "Stop" : "Start"}
          cb={toggleVisible}
          buttonStyle={styles.startStopButton}
          textStyle={styles.startStopButtonText}
        />
      </ScrollView>

      <PermissionsPolicyModal
        visible={displayPermissionsPolicy}
        setVisible={(state: boolean) => {
          setDisplayPermissionsPolicy(state);
        }}
        setDisplayToggleModal={() => {
          setVisible(true);
          setReadPermissionsPolicy(true);
        }}
      />

      <ToggleModal
        isDarkMode={isDarkMode}
        visible={visible}
        setVisible={setVisible}
        enabled={enabled}
        toggleSwitch={toggleSwitch}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  startStopButton: {
    borderRadius: 16,
    paddingHorizontal: 26,
    paddingVertical: 16,
  },
  startStopButtonText: {
    fontWeight: "bold",
  },
  modeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    gap: 10,
  },
  modeText: {
    fontSize: 16,
    fontWeight: "500",
  },
  modeToggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modeToggleText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modeNote: {
    fontSize: 13,
    marginTop: 8,
    fontStyle: "italic",
  },
});

export default HomeScreen;
