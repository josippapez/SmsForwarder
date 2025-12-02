import { useCallback, useEffect, useRef } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import type { EventSubscription } from "expo-modules-core";
import * as ExpoBackgroundService from "../modules/expo-background-service";
import * as ExpoSmsListener from "../modules/expo-sms-listener";
import * as ExpoSmsManager from "../modules/expo-sms-manager";
import type { SmsMessage } from "../types";
import {
  initDatabase,
  insertForwardedMessage,
  getEnabledRules,
  insertInboundMessage,
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
  const advancedModeRef = useRef(advancedMode);
  const simpleKeywordsRef = useRef(simpleKeywords);
  const simpleTargetNumberRef = useRef(simpleTargetNumber);
  const simpleCustomMessageRef = useRef(simpleCustomMessage);
  const forwardingEnabledRef = useRef(enabled);

  useEffect(() => {
    advancedModeRef.current = advancedMode;
  }, [advancedMode]);

  useEffect(() => {
    simpleKeywordsRef.current = simpleKeywords;
  }, [simpleKeywords]);

  useEffect(() => {
    simpleTargetNumberRef.current = simpleTargetNumber;
  }, [simpleTargetNumber]);

  useEffect(() => {
    simpleCustomMessageRef.current = simpleCustomMessage;
  }, [simpleCustomMessage]);

  useEffect(() => {
    forwardingEnabledRef.current = enabled;
  }, [enabled]);

  const requestPermissions = useCallback(async () => {
    if (Platform.OS !== "android") {
      return true;
    }

    const permissions = [
      PermissionsAndroid.PERMISSIONS.SEND_SMS,
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      PermissionsAndroid.PERMISSIONS.RECEIVE_WAP_PUSH,
      PermissionsAndroid.PERMISSIONS.RECEIVE_MMS,
      PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
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
  }, []);

  const handleSimpleMode = useCallback(async (message: SmsMessage) => {
    if (!message.body) {
      return;
    }

    const keywords = simpleKeywordsRef.current || [];
    const targetNumber = simpleTargetNumberRef.current || "";
    const customMessage = simpleCustomMessageRef.current || "";

    const matchedKeyword = keywords.find(keyword =>
      message.body.includes(keyword)
    );

    if (!matchedKeyword || !targetNumber) {
      console.log("No keyword match or no target number (simple mode)");
      return;
    }

    console.log(
      "Keyword matched:",
      matchedKeyword,
      "Forwarding to:",
      targetNumber
    );

    const messageToSend = customMessage || message.body;
    const timestamp = Date.now();

    try {
      const sendResult = await Promise.race([
        ExpoSmsManager.send(targetNumber, messageToSend),
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
        recipient: targetNumber,
        messageBody: message.body,
        customMessage: customMessage || undefined,
        keywordMatched: matchedKeyword,
        status: "success",
        timestamp,
      });
    } catch (error: any) {
      console.error("Failed to forward SMS:", error);
      await insertForwardedMessage({
        originalSender: message.originatingAddress || "Unknown",
        recipient: targetNumber,
        messageBody: message.body,
        customMessage: customMessage || undefined,
        keywordMatched: matchedKeyword,
        status: "failed",
        timestamp,
        errorMessage: error?.message || "Unknown error",
      });
    }
  }, []);

  const handleAdvancedMode = useCallback(async (message: SmsMessage) => {
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

      console.log(`Keyword "${matchedKeyword}" matched in rule: ${rule.name}`);

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
                      new Error("SMS send timeout (may be emulator limitation)")
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
  }, []);

  const handleSmsReceived = useCallback(
    async (message: SmsMessage) => {
      console.log("SMS received:", message);

      try {
        await persistInboundMessage(message);

        if (!forwardingEnabledRef.current) {
          return;
        }

        if (advancedModeRef.current) {
          await handleAdvancedMode(message);
        } else {
          await handleSimpleMode(message);
        }
      } catch (error) {
        console.error("Error processing SMS:", error);
      }
    },
    [handleAdvancedMode, handleSimpleMode]
  );

  useEffect(() => {
    let subscriptions: EventSubscription[] = [];

    const startServices = async () => {
      const hasPermissions = await requestPermissions();

      if (!hasPermissions) {
        console.error("Required permissions not granted");
        return;
      }

      // Initialize database
      await initDatabase();

      ExpoSmsListener.startService();

      subscriptions = [
        ExpoSmsListener.addListener(handleSmsReceived),
        ExpoSmsListener.addMmsListener(handleSmsReceived),
      ];
    };

    startServices();

    return () => {
      subscriptions.forEach(sub => sub.remove());
      subscriptions = [];
      ExpoSmsListener.stopService();
      ExpoBackgroundService.stopService();
    };
  }, [handleSmsReceived, requestPermissions]);

  useEffect(() => {
    if (enabled) {
      ExpoBackgroundService.startService();
    } else {
      ExpoBackgroundService.stopService();
    }
  }, [enabled]);
};

const persistInboundMessage = async (message: SmsMessage) => {
  if (!message.body) {
    return;
  }

  try {
    await insertInboundMessage({
      type: message.type ?? "sms",
      box: message.box ?? "inbox",
      address: message.originatingAddress || "Unknown",
      body: message.body,
      timestamp: message.timestamp ?? Date.now(),
      subscriptionId: message.subscriptionId ?? null,
      simSlotIndex: message.simSlotIndex ?? null,
      isRead: false,
      messageRef: message.messageRef ?? null,
      rawPdu: message.rawPdu ?? null,
      metadata: message.metadata ?? null,
    });
  } catch (error) {
    console.error("Failed to persist inbound message", error);
  }
};
