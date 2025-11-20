import AsyncStorage from "@react-native-async-storage/async-storage";
import { createRule, getAllRules } from "./database";

/**
 * Migration utility to convert old single-rule configuration to new multi-rule format
 * This should be called once when the app starts to migrate existing data
 */
export const migrateToMultipleRules = async (): Promise<void> => {
  try {
    // Check if migration has already been performed
    const migrationKey = "@migration_v2_completed";
    const migrationCompleted = await AsyncStorage.getItem(migrationKey);

    if (migrationCompleted === "true") {
      console.log("Migration already completed, skipping");
      return;
    }

    console.log("Starting migration to multiple rules...");

    // Check if there are already rules in the database
    const existingRules = await getAllRules();
    if (existingRules.length > 0) {
      console.log(
        "Rules already exist in database, marking migration as complete"
      );
      await AsyncStorage.setItem(migrationKey, "true");
      return;
    }

    // Try to load old configuration from AsyncStorage
    const includesData = await AsyncStorage.getItem("@includes");
    const phoneNumberData = await AsyncStorage.getItem("@phoneNumber");
    const bodyData = await AsyncStorage.getItem("@body");

    // Parse the old data
    let keywords: string[] = [];
    let targetNumber: string = "";
    let customMessage: string = "";

    if (includesData) {
      try {
        const includes = JSON.parse(includesData);
        // Old format was an array of {id, text} objects
        keywords = includes.map((item: any) => item.text).filter(Boolean);
      } catch (error) {
        console.error("Failed to parse includes data:", error);
      }
    }

    if (phoneNumberData) {
      targetNumber = phoneNumberData;
    }

    if (bodyData) {
      customMessage = bodyData;
    }

    // Only create a rule if we have at least keywords and a target number
    if (keywords.length > 0 && targetNumber) {
      console.log("Migrating old configuration to new rule...");

      await createRule({
        name: "Default Rule (Migrated)",
        keywords,
        targetNumbers: [targetNumber],
        customMessage: customMessage || undefined,
        enabled: true,
        stopOnMatch: true, // Old behavior was to stop after first match
      });

      console.log("Migration completed successfully");
    } else {
      console.log("No valid old configuration found, skipping rule creation");
    }

    // Mark migration as completed
    await AsyncStorage.setItem(migrationKey, "true");
  } catch (error) {
    console.error("Migration failed:", error);
    // Don't throw - we don't want to break the app if migration fails
  }
};
