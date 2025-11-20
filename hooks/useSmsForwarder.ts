import { useEffect } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import * as ExpoBackgroundService from "../modules/expo-background-service";
import * as ExpoSmsListener from "../modules/expo-sms-listener";
import * as ExpoSmsManager from "../modules/expo-sms-manager";
import type { SmsMessage } from "../types";
import { initDatabase, insertForwardedMessage } from "../utils/database";

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

    const handleSmsReceived = async (message: SmsMessage) => {
      console.log("SMS received:", message);

      const matchedKeyword = includeKeywords.find(keyword =>
        message.body.includes(keyword)
      );

      if (!matchedKeyword || !targetPhoneNumber) {
        console.log("No keyword match or no target number");
        return;
      }

      console.log(
        "Keyword matched:",
        matchedKeyword,
        "Forwarding to:",
        targetPhoneNumber
      );

      const messageToSend = customMessage || message.body;
      const timestamp = Date.now();

      try {
        console.log("Attempting to send SMS...");
        const sendResult = await Promise.race([
          ExpoSmsManager.send(targetPhoneNumber, messageToSend),
          new Promise((_, reject) =>
            setTimeout(
              () =>
                reject(
                  new Error("SMS send timeout (may be emulator limitation)")
                ),
              30000
            )
          ),
        ]);
        console.log("SMS forwarded successfully, result:", sendResult);

        // Log successful forward to database
        console.log("Inserting into database...");
        const insertId = await insertForwardedMessage({
          originalSender: message.originatingAddress || "Unknown",
          recipient: targetPhoneNumber,
          messageBody: message.body,
          customMessage: customMessage || undefined,
          keywordMatched: matchedKeyword,
          status: "success",
          timestamp,
        });
        console.log("Logged to database with ID:", insertId);
      } catch (error: any) {
        console.error("Failed to forward SMS:", error);

        // Log failed forward to database
        try {
          console.log("Inserting error into database...");
          const insertId = await insertForwardedMessage({
            originalSender: message.originatingAddress || "Unknown",
            recipient: targetPhoneNumber,
            messageBody: message.body,
            customMessage: customMessage || undefined,
            keywordMatched: matchedKeyword,
            status: "failed",
            timestamp,
            errorMessage: error?.message || "Unknown error",
          });
          console.log("Logged error to database with ID:", insertId);
        } catch (dbError) {
          console.error("Failed to log to database:", dbError);
        }
      }
    };

    const startForwarding = async () => {
      const hasPermissions = await requestPermissions();

      if (!hasPermissions) {
        console.error("Required permissions not granted");
        return;
      }

      // Initialize database
      await initDatabase();

      ExpoBackgroundService.startService();
      ExpoSmsListener.startService();

      subscription = ExpoSmsListener.addListener(handleSmsReceived);
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
