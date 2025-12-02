import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Platform, useColorScheme } from "react-native";
import {
  advancedModeAtom,
  bodyAtom,
  includesAtom,
  phoneNumberAtom,
  readPermissionsPolicyAtom,
} from "../../store/atoms";
import { Colors } from "../../constants/colors";
import {
  useDefaultSmsRole,
  usePersistence,
  useSmsForwarder,
} from "../../hooks";

export const useHomeScreenState = () => {
  const isDarkMode = useColorScheme() === "dark";
  const [includes, setIncludes] = useAtom(includesAtom);
  const [phoneNumber, setPhoneNumber] = useAtom(phoneNumberAtom);
  const [body, setBody] = useAtom(bodyAtom);
  const [readPermissionsPolicy, setReadPermissionsPolicy] = useAtom(
    readPermissionsPolicyAtom
  );
  const [advancedMode, setAdvancedMode] = useAtom(advancedModeAtom);

  const [displayPermissionsPolicy, setDisplayPermissionsPolicy] =
    useState(false);
  const [isToggleModalVisible, setIsToggleModalVisible] = useState(false);
  const [forwardingEnabled, setForwardingEnabled] = useState(false);

  usePersistence();

  const includeData = useMemo(
    () => includes.map(item => item.text),
    [includes]
  );
  const isAndroid = Platform.OS === "android";
  const roleState = useDefaultSmsRole();
  const canControlForwarder = !isAndroid || roleState.isDefault;
  const forwarderActive = forwardingEnabled && canControlForwarder;

  useSmsForwarder({
    enabled: forwarderActive,
    advancedMode,
    simpleKeywords: includeData,
    simpleTargetNumber: phoneNumber,
    simpleCustomMessage: body,
  });

  useEffect(() => {
    if (!canControlForwarder && forwardingEnabled) {
      setForwardingEnabled(false);
    }
  }, [canControlForwarder, forwardingEnabled]);

  const requireDefaultRole = useCallback(() => {
    if (!isAndroid || canControlForwarder) {
      return false;
    }

    Alert.alert(
      "Set SmsForwarder as default",
      "Open the Default SMS Role section above and make SmsForwarder the default SMS app before starting the service."
    );
    return true;
  }, [canControlForwarder, isAndroid]);

  const toggleSwitch = useCallback(() => {
    if (!canControlForwarder && !forwardingEnabled) {
      requireDefaultRole();
      return;
    }
    setForwardingEnabled(prev => !prev);
  }, [canControlForwarder, forwardingEnabled, requireDefaultRole]);

  const toggleVisible = useCallback(() => {
    if (!readPermissionsPolicy) {
      setDisplayPermissionsPolicy(true);
      return;
    }

    if (!forwardingEnabled && requireDefaultRole()) {
      return;
    }

    setIsToggleModalVisible(prev => !prev);
  }, [forwardingEnabled, readPermissionsPolicy, requireDefaultRole]);

  const backgroundColor = isDarkMode ? Colors.black : Colors.white;

  return {
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
    setForwardingEnabled,
    canControlForwarder,
    toggleSwitch,
    toggleVisible,
    requireDefaultRole,
    roleState,
    backgroundColor,
  };
};
