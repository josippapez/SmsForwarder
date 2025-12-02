import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import {
  getRoleStatus,
  requestRole,
  openDefaultSmsSettings,
  type RoleStatus,
} from "../modules/expo-role-manager";

interface RoleHookState extends RoleStatus {}

export const useDefaultSmsRole = () => {
  const [status, setStatus] = useState<RoleHookState>({
    isAvailable: Platform.OS === "android",
    isDefault: false,
    currentDefaultPackage: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waitingForRoleResult, setWaitingForRoleResult] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  const refreshStatus = useCallback(async () => {
    if (Platform.OS !== "android") {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const nextStatus = await getRoleStatus();
      setStatus(nextStatus);
    } catch (err: any) {
      console.error("Failed to get role status", err);
      setError(err?.message || "Unable to read SMS role status");
    } finally {
      setLoading(false);
    }
  }, []);

  const requestDefaultRole = useCallback(async () => {
    if (Platform.OS !== "android") {
      return { completed: false, isDefault: false };
    }

    setError(null);
    try {
      const result = await requestRole();
      if (result.completed) {
        setWaitingForRoleResult(true);
      } else {
        await refreshStatus();
      }
      return result;
    } catch (err: any) {
      console.error("Failed to request default SMS role", err);
      setError(err?.message || "Unable to launch role request");
      await refreshStatus();
      return { completed: false, isDefault: status.isDefault };
    }
  }, [refreshStatus, status.isDefault]);

  const openSettings = useCallback(async () => {
    if (Platform.OS !== "android") {
      return;
    }

    try {
      await openDefaultSmsSettings();
      setWaitingForRoleResult(true);
    } catch (err: any) {
      console.error("Failed to open default SMS settings", err);
      setError(err?.message || "Unable to open system settings");
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    const subscription = AppState.addEventListener("change", nextState => {
      const previousState = appState.current;
      appState.current = nextState;

      if (
        waitingForRoleResult &&
        (previousState === "inactive" || previousState === "background") &&
        nextState === "active"
      ) {
        setWaitingForRoleResult(false);
        refreshStatus();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refreshStatus, waitingForRoleResult]);

  return {
    loading,
    error,
    isRoleAvailable: status.isAvailable,
    isDefault: status.isDefault,
    currentDefaultPackage: status.currentDefaultPackage,
    refreshStatus,
    requestRole: requestDefaultRole,
    openSettings,
  };
};
