import { useState } from "react";
import { Alert } from "react-native";
import * as Contacts from "expo-contacts";
import type { PermissionStatus } from "../types";

/**
 * Custom hook to manage contact selection functionality
 * Handles permission requests and contact retrieval
 */
export const useContactSelector = () => {
  const [isLoading, setIsLoading] = useState(false);

  const selectPhoneNumber = async (): Promise<string | null> => {
    setIsLoading(true);

    try {
      const { status }: { status: PermissionStatus } =
        await Contacts.requestPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Contacts permission is required to select a phone number."
        );
        setIsLoading(false);
        return null;
      }

      // Use presentContactPickerAsync to show native contact picker
      const contact = await Contacts.presentContactPickerAsync();

      if (contact && contact.phoneNumbers && contact.phoneNumbers.length > 0) {
        const phoneNumber = contact.phoneNumbers[0].number ?? null;
        console.log(
          `Selected phone number ${phoneNumber} from ${contact.name}`
        );
        setIsLoading(false);
        return phoneNumber;
      }

      Alert.alert("No Phone Number", "Selected contact has no phone number.");
      setIsLoading(false);
      return null;
    } catch (error) {
      console.error("Error selecting contact:", error);
      Alert.alert("Error", "Failed to select contact. Please try again.");
      setIsLoading(false);
      return null;
    }
  };

  return {
    selectPhoneNumber,
    isLoading,
  };
};
