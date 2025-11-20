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
}

export interface ContactInfo {
  name?: string;
  phoneNumber: string;
}

export type PermissionStatus = "granted" | "denied" | "undetermined";
