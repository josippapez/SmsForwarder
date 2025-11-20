import { atom } from "jotai";

// Using regular atoms to avoid Suspense issues with atomWithStorage
// Persistence can be added later using atom effects or custom hooks if needed
export const includesAtom = atom<{ id: string; text: string }[]>([
  { id: "1", text: "" },
]);

export const phoneNumberAtom = atom<string>("");

export const bodyAtom = atom<string>("");

export const readPermissionsPolicyAtom = atom<boolean>(false);
