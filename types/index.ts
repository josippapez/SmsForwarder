/**
 * Type definitions for the SMS Forwarder app
 */

export interface IncludeItem {
  id: string;
  text: string;
}

export interface SmsMessage {
  body: string;
  originatingAddress?: string;
  timestamp?: number;
  box?: "inbox" | "sent" | "draft";
  type?: "sms" | "mms";
  subscriptionId?: number | null;
  simSlotIndex?: number | null;
  messageRef?: string | null;
  rawPdu?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface ContactInfo {
  name?: string;
  phoneNumber: string;
}

export type PermissionStatus = "granted" | "denied" | "undetermined";
