import React, { useState } from "react";
import {
  ColorValue,
  ScrollView,
  StatusBar,
  StatusBarStyle,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { useAtom } from "jotai";
import {
  includesAtom,
  phoneNumberAtom,
  bodyAtom,
  readPermissionsPolicyAtom,
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
    includeKeywords: includeData,
    targetPhoneNumber: phoneNumber,
    customMessage: body,
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

        <KeywordInputSection includes={includes} setIncludes={setIncludes} />

        <PhoneNumberSection
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
        />

        <CustomMessageSection body={body} setBody={setBody} />

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
});

export default HomeScreen;
