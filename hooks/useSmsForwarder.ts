import { useEffect } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import * as ExpoBackgroundService from "../modules/expo-background-service";
import * as ExpoSmsListener from "../modules/expo-sms-listener";
import * as ExpoSmsManager from "../modules/expo-sms-manager";
import type { SmsMessage } from "../types";

interface UseSmsForwarderProps {
  enabled: boolean;
  includeKeywords: string[];
  targetPhoneNumber: string;
  customMessage: string;
}

/**
 * Custom hook to manage SMS forwarding functionality
 * Handles background service, SMS listening, and message forwarding
 */
export const useSmsForwarder = ({
  enabled,
  includeKeywords,
  targetPhoneNumber,
  customMessage,
}: UseSmsForwarderProps) => {
  useEffect(() => {
    let subscription: any;

    const requestPermissions = async () => {
      if (Platform.OS !== "android") {
        return true;
      }

      const permissions = [
        PermissionsAndroid.PERMISSIONS.SEND_SMS,
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      ];

      // Request notification permission for Android 13+ (API 33+)
      if (Platform.Version >= 33) {
        permissions.push(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS as any
        );
      }

      try {
        const granted = await PermissionsAndroid.requestMultiple(permissions);
        const allGranted = Object.values(granted).every(
          status => status === PermissionsAndroid.RESULTS.GRANTED
        );

        if (!allGranted) {
          console.error("Some permissions were denied:", granted);
          return false;
        }

        return true;
      } catch (error) {
        console.error("Permission request failed:", error);
        return false;
      }
    };

    const startForwarding = async () => {
      const hasPermissions = await requestPermissions();

      if (!hasPermissions) {
        console.error("Required permissions not granted");
        return;
      }

      ExpoBackgroundService.startService();
      ExpoSmsListener.startService();

      subscription = ExpoSmsListener.addListener((message: SmsMessage) => {
        const shouldForward = includeKeywords.some(keyword =>
          message.body.includes(keyword)
        );

        if (shouldForward && targetPhoneNumber) {
          const messageToSend = customMessage || message.body;

          ExpoSmsManager.send(targetPhoneNumber, messageToSend).catch(
            (error: any) => {
              console.error("Failed to forward SMS:", error);
            }
          );
        }
      });
    };

    if (enabled) {
      startForwarding();
    } else {
      ExpoBackgroundService.stopService();
      ExpoSmsListener.stopService();
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [enabled, includeKeywords, targetPhoneNumber, customMessage]);
};
