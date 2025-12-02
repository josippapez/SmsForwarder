import { Platform } from "react-native";
import { requireNativeModule } from "expo-modules-core";

export type RoleStatus = {
  isAvailable: boolean;
  isDefault: boolean;
  currentDefaultPackage: string | null;
};

export type RequestRoleResult = {
  completed: boolean;
  isDefault: boolean;
};

const nativeModule =
  Platform.OS === "android" ? requireNativeModule("ExpoRoleManager") : null;

function ensureModule() {
  if (!nativeModule) {
    throw new Error(
      "ExpoRoleManager native module is unavailable on this platform"
    );
  }
  return nativeModule as {
    getRoleStatus: () => Promise<RoleStatus>;
    requestRole: () => Promise<RequestRoleResult>;
    openDefaultSmsSettings: () => Promise<void>;
  };
}

export async function getRoleStatus(): Promise<RoleStatus> {
  if (!nativeModule) {
    return {
      isAvailable: false,
      isDefault: false,
      currentDefaultPackage: null,
    };
  }
  return ensureModule().getRoleStatus();
}

export async function requestRole(): Promise<RequestRoleResult> {
  if (!nativeModule) {
    return { completed: false, isDefault: false };
  }
  return ensureModule().requestRole();
}

export async function openDefaultSmsSettings(): Promise<void> {
  if (!nativeModule) {
    return;
  }
  return ensureModule().openDefaultSmsSettings();
}
