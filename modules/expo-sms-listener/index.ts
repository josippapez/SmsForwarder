import { EventEmitter, Subscription } from "expo-modules-core";
import ExpoSmsListenerModule from "./src/ExpoSmsListenerModule";

export type SmsMessage = {
  originatingAddress: string;
  body: string;
  timestamp: number;
};

const emitter = new EventEmitter(ExpoSmsListenerModule);

export function startService(): void {
  ExpoSmsListenerModule.startService();
}

export function addListener(
  listener: (message: SmsMessage) => void
): Subscription {
  return emitter.addListener("onSmsReceived", listener);
}

export function stopService(): void {
  ExpoSmsListenerModule.stopService();
}

export { ExpoSmsListenerModule } from "./src/ExpoSmsListenerModule";
