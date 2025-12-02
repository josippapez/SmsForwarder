import { EventEmitter, type EventSubscription } from "expo-modules-core";
import ExpoSmsListenerModule from "./src/ExpoSmsListenerModule";

export type SmsMessage = {
  originatingAddress: string;
  body: string;
  timestamp: number;
  box?: "inbox" | "sent" | "draft";
  type?: "sms" | "mms";
  subscriptionId?: number | null;
  simSlotIndex?: number | null;
  messageRef?: string | null;
  rawPdu?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type RespondViaMessagePayload = {
  targetAddress: string;
  body: string;
  timestamp: number;
  metadata?: Record<string, unknown> | null;
};

type SmsListenerEvents = {
  onSmsReceived: (payload: SmsMessage) => void;
  onMmsReceived: (payload: SmsMessage) => void;
  onRespondViaMessage: (payload: RespondViaMessagePayload) => void;
};

const emitter = new EventEmitter<SmsListenerEvents>(ExpoSmsListenerModule);

export function startService(): void {
  ExpoSmsListenerModule.startService();
}

export function addListener(
  listener: (message: SmsMessage) => void
): EventSubscription {
  return emitter.addListener("onSmsReceived", (payload: SmsMessage) => {
    listener(normalizePayload(payload));
  });
}

export function addMmsListener(
  listener: (message: SmsMessage) => void
): EventSubscription {
  return emitter.addListener("onMmsReceived", (payload: SmsMessage) => {
    listener(normalizePayload({ ...payload, type: "mms" }));
  });
}

export function addRespondViaMessageListener(
  listener: (payload: RespondViaMessagePayload) => void
): EventSubscription {
  return emitter.addListener(
    "onRespondViaMessage",
    (payload: RespondViaMessagePayload) => {
      listener(normalizeRespondPayload(payload));
    }
  );
}

export function stopService(): void {
  ExpoSmsListenerModule.stopService();
}

export function setContactMuted(address: string, muted: boolean): boolean {
  return ExpoSmsListenerModule.setContactMuted(address, muted);
}

export function setContactBlocked(address: string, blocked: boolean): boolean {
  return ExpoSmsListenerModule.setContactBlocked(address, blocked);
}

export function isContactMuted(address: string): boolean {
  return ExpoSmsListenerModule.isContactMuted(address);
}

export function isContactBlocked(address: string): boolean {
  return ExpoSmsListenerModule.isContactBlocked(address);
}

function normalizePayload(payload: any): SmsMessage {
  const timestampSource = payload?.timestamp;
  const timestamp =
    typeof timestampSource === "number"
      ? timestampSource
      : Number(timestampSource ?? Date.now());

  return {
    originatingAddress: payload?.originatingAddress ?? "Unknown",
    body: payload?.body ?? "",
    timestamp,
    box: payload?.box ?? "inbox",
    type: payload?.type ?? "sms",
    subscriptionId:
      typeof payload?.subscriptionId === "number"
        ? payload.subscriptionId
        : null,
    simSlotIndex:
      typeof payload?.simSlotIndex === "number" ? payload.simSlotIndex : null,
    messageRef: payload?.messageRef ?? null,
    rawPdu: payload?.rawPdu ?? null,
    metadata: payload?.metadata ?? null,
  };
}

function normalizeRespondPayload(payload: any): RespondViaMessagePayload {
  const timestampSource = payload?.timestamp;
  const timestamp =
    typeof timestampSource === "number"
      ? timestampSource
      : Number(timestampSource ?? Date.now());

  return {
    targetAddress: payload?.targetAddress ?? "",
    body: payload?.body ?? "",
    timestamp,
    metadata: payload?.metadata ?? null,
  };
}
