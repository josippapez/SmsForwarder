import { useEffect } from "react";
import { useAtom } from "jotai";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  includesAtom,
  phoneNumberAtom,
  bodyAtom,
  readPermissionsPolicyAtom,
} from "../store/atoms";

/**
 * Hook to persist atom values to AsyncStorage
 * This provides persistence without using atomWithStorage which requires Suspense
 */
export const usePersistence = () => {
  const [includes, setIncludes] = useAtom(includesAtom);
  const [phoneNumber, setPhoneNumber] = useAtom(phoneNumberAtom);
  const [body, setBody] = useAtom(bodyAtom);
  const [readPermissionsPolicy, setReadPermissionsPolicy] = useAtom(
    readPermissionsPolicyAtom
  );

  // Load initial values from AsyncStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedIncludes = await AsyncStorage.getItem("includes");
        const storedPhoneNumber = await AsyncStorage.getItem("phoneNumber");
        const storedBody = await AsyncStorage.getItem("body");
        const storedReadPolicy = await AsyncStorage.getItem(
          "readPermissionsPolicy"
        );

        if (storedIncludes) {
          setIncludes(JSON.parse(storedIncludes));
        }
        if (storedPhoneNumber) {
          setPhoneNumber(storedPhoneNumber);
        }
        if (storedBody) {
          setBody(storedBody);
        }
        if (storedReadPolicy) {
          setReadPermissionsPolicy(JSON.parse(storedReadPolicy));
        }
      } catch (error) {
        console.error("Error loading persisted data:", error);
      }
    };

    loadData();
  }, []);

  // Save values to AsyncStorage when they change
  useEffect(() => {
    AsyncStorage.setItem("includes", JSON.stringify(includes));
  }, [includes]);

  useEffect(() => {
    AsyncStorage.setItem("phoneNumber", phoneNumber);
  }, [phoneNumber]);

  useEffect(() => {
    AsyncStorage.setItem("body", body);
  }, [body]);

  useEffect(() => {
    AsyncStorage.setItem(
      "readPermissionsPolicy",
      JSON.stringify(readPermissionsPolicy)
    );
  }, [readPermissionsPolicy]);
};
