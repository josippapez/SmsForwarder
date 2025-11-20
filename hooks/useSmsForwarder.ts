import { useEffect } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import * as ExpoBackgroundService from "../modules/expo-background-service";
import * as ExpoSmsListener from "../modules/expo-sms-listener";
import * as ExpoSmsManager from "../modules/expo-sms-manager";
import type { SmsMessage } from "../types";
import {
  initDatabase,
  insertForwardedMessage,
  getEnabledRules,
} from "../utils/database";

interface UseSmsForwarderProps {
  enabled: boolean;
  advancedMode?: boolean;
  simpleKeywords?: string[];
  simpleTargetNumber?: string;
  simpleCustomMessage?: string;
}

/**
 * Custom hook to manage SMS forwarding functionality
 * Handles background service, SMS listening, and message forwarding
 * Supports both simple mode (single rule) and advanced mode (multiple rules)
 */
export const useSmsForwarder = ({
  enabled,
  advancedMode = false,
  simpleKeywords = [],
  simpleTargetNumber = "",
  simpleCustomMessage = "",
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

      try {
        if (advancedMode) {
          // Advanced Mode: Use multiple rules from database
          await handleAdvancedMode(message);
        } else {
          // Simple Mode: Use keywords and single target number
          await handleSimpleMode(message);
        }
      } catch (error) {
        console.error("Error processing SMS:", error);
      }
    };

    const handleSimpleMode = async (message: SmsMessage) => {
      const matchedKeyword = simpleKeywords.find(keyword =>
        message.body.includes(keyword)
      );

      if (!matchedKeyword || !simpleTargetNumber) {
        console.log("No keyword match or no target number (simple mode)");
        return;
      }

      console.log(
        "Keyword matched:",
        matchedKeyword,
        "Forwarding to:",
        simpleTargetNumber
      );

      const messageToSend = simpleCustomMessage || message.body;
      const timestamp = Date.now();

      try {
        const sendResult = await Promise.race([
          ExpoSmsManager.send(simpleTargetNumber, messageToSend),
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
        console.log("SMS forwarded successfully:", sendResult);

        await insertForwardedMessage({
          originalSender: message.originatingAddress || "Unknown",
          recipient: simpleTargetNumber,
          messageBody: message.body,
          customMessage: simpleCustomMessage || undefined,
          keywordMatched: matchedKeyword,
          status: "success",
          timestamp,
        });
      } catch (error: any) {
        console.error("Failed to forward SMS:", error);
        await insertForwardedMessage({
          originalSender: message.originatingAddress || "Unknown",
          recipient: simpleTargetNumber,
          messageBody: message.body,
          customMessage: simpleCustomMessage || undefined,
          keywordMatched: matchedKeyword,
          status: "failed",
          timestamp,
          errorMessage: error?.message || "Unknown error",
        });
      }
    };

    const handleAdvancedMode = async (message: SmsMessage) => {
      const rules = await getEnabledRules();

      if (rules.length === 0) {
        console.log("No enabled rules found");
        return;
      }

      console.log(`Checking ${rules.length} enabled rules`);

      // Collect all forwarding tasks to run in parallel
      const forwardingTasks: Promise<void>[] = [];

      for (const rule of rules) {
        console.log(`Checking rule: ${rule.name}`);

        const matchedKeyword = rule.keywords.find(keyword =>
          message.body.includes(keyword)
        );

        if (!matchedKeyword) {
          console.log(`No keyword match for rule: ${rule.name}`);
          continue;
        }

        console.log(
          `Keyword "${matchedKeyword}" matched in rule: ${rule.name}`
        );

        // Create forwarding tasks for all target numbers (non-blocking)
        for (const targetNumber of rule.targetNumbers) {
          const task = (async () => {
            const messageToSend = rule.customMessage || message.body;
            const timestamp = Date.now();

            try {
              console.log(
                `Forwarding to ${targetNumber} using rule: ${rule.name}`
              );
              const sendResult = await Promise.race([
                ExpoSmsManager.send(targetNumber, messageToSend),
                new Promise((_, reject) =>
                  setTimeout(
                    () =>
                      reject(
                        new Error(
                          "SMS send timeout (may be emulator limitation)"
                        )
                      ),
                    30000
                  )
                ),
              ]);
              console.log("SMS forwarded successfully:", sendResult);

              await insertForwardedMessage({
                originalSender: message.originatingAddress || "Unknown",
                recipient: targetNumber,
                messageBody: message.body,
                customMessage: rule.customMessage || undefined,
                keywordMatched: matchedKeyword,
                ruleId: rule.id,
                ruleName: rule.name,
                status: "success",
                timestamp,
              });
            } catch (error: any) {
              console.error(`Failed to forward SMS to ${targetNumber}:`, error);
              try {
                await insertForwardedMessage({
                  originalSender: message.originatingAddress || "Unknown",
                  recipient: targetNumber,
                  messageBody: message.body,
                  customMessage: rule.customMessage || undefined,
                  keywordMatched: matchedKeyword,
                  ruleId: rule.id,
                  ruleName: rule.name,
                  status: "failed",
                  timestamp,
                  errorMessage: error?.message || "Unknown error",
                });
              } catch (dbError) {
                console.error("Failed to log to database:", dbError);
              }
            }
          })();

          forwardingTasks.push(task);
        }

        if (rule.stopOnMatch) {
          console.log(
            `Stop-on-match enabled for rule: ${rule.name}. Stopping rule evaluation.`
          );
          break;
        }
      }

      // Execute all forwarding tasks in parallel
      if (forwardingTasks.length > 0) {
        await Promise.allSettled(forwardingTasks);
        console.log("All forwarding tasks completed");
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
  }, [
    enabled,
    advancedMode,
    simpleKeywords,
    simpleTargetNumber,
    simpleCustomMessage,
  ]);
};
