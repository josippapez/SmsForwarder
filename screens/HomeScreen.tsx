import React, { useMemo } from "react";
import {
  ColorValue,
  Pressable,
  ScrollView,
  StatusBar,
  StatusBarStyle,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import PermissionsPolicyModal from "../Components/PermissionsPolicyModal";
import ToggleModal from "../Components/ToggleModal";
import { Section } from "../Components/Shared";
import { DefaultSmsRoleSection } from "../Components/Sections";
import { Colors } from "../constants/colors";
import ModeSwitchSection from "./home/ModeSwitchSection";
import SimpleModeConfiguration from "./home/SimpleModeConfiguration";
import StartStopControls from "./home/StartStopControls";
import { useHomeScreenState } from "./home/useHomeScreenState";

/**
 * Main Home Screen - SMS Forwarder Configuration
 * Allows users to configure SMS forwarding rules
 */
const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const {
    isDarkMode,
    isAndroid,
    includes,
    setIncludes,
    phoneNumber,
    setPhoneNumber,
    body,
    setBody,
    advancedMode,
    setAdvancedMode,
    readPermissionsPolicy,
    setReadPermissionsPolicy,
    displayPermissionsPolicy,
    setDisplayPermissionsPolicy,
    isToggleModalVisible,
    setIsToggleModalVisible,
    forwardingEnabled,
    canControlForwarder,
    toggleSwitch,
    toggleVisible,
    roleState,
    backgroundColor,
  } = useHomeScreenState();

  const shouldGateContent = isAndroid && !roleState.isDefault;
  const defaultRoleSection = useMemo(() => {
    if (!isAndroid) {
      return null;
    }

    return (
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
    );
  }, [
    isAndroid,
    roleState.currentDefaultPackage,
    roleState.error,
    roleState.isDefault,
    roleState.isRoleAvailable,
    roleState.loading,
    roleState.openSettings,
    roleState.refreshStatus,
    roleState.requestRole,
  ]);

  const roleStatusBanner =
    !shouldGateContent && isAndroid ? (
      <Pressable
        style={[
          styles.roleStatusBar,
          {
            backgroundColor: isDarkMode
              ? Colors.background.card.dark
              : Colors.background.card.light,
            borderColor: isDarkMode
              ? Colors.input.border.dark
              : Colors.input.border.light,
          },
        ]}
        onPress={() => navigation.navigate("Settings")}
      >
        <View style={styles.roleStatusBarTextGroup}>
          <Text
            style={[
              styles.roleStatusBarLabel,
              { color: isDarkMode ? Colors.light : Colors.dark },
            ]}
          >
            Default SMS role active
          </Text>
          <Text style={styles.roleStatusBarHint} numberOfLines={1}>
            SmsForwarder is handling messages. Tap to manage.
          </Text>
        </View>
        <Text style={styles.roleStatusBarAction}>{"Settings ›"}</Text>
      </Pressable>
    ) : null;

  return (
    <View style={{ flex: 1 }}>
      <StatusBar
        animated={true}
        translucent
        backgroundColor={backgroundColor as ColorValue}
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
        style={{ backgroundColor, flex: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <Section
          boldedTitle
          title="SMS Forwarder"
          sectionStyle={{
            paddingVertical: 20,
          }}
        />

        {shouldGateContent ? (
          <View style={styles.roleGateWrapper}>
            {defaultRoleSection}
            <Text
              style={[
                styles.roleGateHint,
                { color: isDarkMode ? Colors.light : Colors.dark },
              ]}
            >
              SmsForwarder has to be the default SMS app before any rules or
              history become available.
            </Text>
          </View>
        ) : (
          <>
            {roleStatusBanner}
            <ModeSwitchSection
              advancedMode={advancedMode}
              isDarkMode={isDarkMode}
              onToggleMode={() => setAdvancedMode(!advancedMode)}
            />

            {!advancedMode && (
              <SimpleModeConfiguration
                includes={includes}
                setIncludes={setIncludes}
                phoneNumber={phoneNumber}
                setPhoneNumber={setPhoneNumber}
                body={body}
                setBody={setBody}
              />
            )}

            <StartStopControls
              enabled={forwardingEnabled}
              isDarkMode={isDarkMode}
              disabled={!forwardingEnabled && !canControlForwarder}
              canControlForwarder={canControlForwarder}
              onPress={toggleVisible}
            />
          </>
        )}
      </ScrollView>

      <PermissionsPolicyModal
        visible={displayPermissionsPolicy}
        setVisible={(state: boolean) => {
          setDisplayPermissionsPolicy(state);
        }}
        setDisplayToggleModal={() => {
          setIsToggleModalVisible(true);
          setReadPermissionsPolicy(true);
        }}
      />

      <ToggleModal
        isDarkMode={isDarkMode}
        visible={isToggleModalVisible}
        setVisible={setIsToggleModalVisible}
        enabled={forwardingEnabled}
        toggleSwitch={toggleSwitch}
        canToggle={canControlForwarder}
        blockedMessage="Set SmsForwarder as the default SMS app to control forwarding."
      />
    </View>
  );
};

const styles = StyleSheet.create({
  roleGateWrapper: {
    gap: 16,
    paddingTop: 8,
  },
  roleGateHint: {
    fontSize: 14,
    lineHeight: 20,
  },
  roleStatusBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    gap: 16,
  },
  roleStatusBarTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  roleStatusBarLabel: {
    fontWeight: "600",
    fontSize: 15,
  },
  roleStatusBarHint: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  roleStatusBarAction: {
    fontWeight: "700",
    color: Colors.primary,
  },
});

export default HomeScreen;
