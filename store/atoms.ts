import { atomWithStorage, createJSONStorage } from 'jotai/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';

const storage = createJSONStorage<any>(() => AsyncStorage);

export const includesAtom = atomWithStorage<{id: string; text: string}[]>(
  'includes',
  [{id: '1', text: ''}],
  storage
);

export const phoneNumberAtom = atomWithStorage<string>(
  'phoneNumber',
  '',
  storage
);

export const bodyAtom = atomWithStorage<string>(
  'body',
  '',
  storage
);

export const readPermissionsPolicyAtom = atomWithStorage<boolean>(
  'readPermissionsPolicy',
  false,
  storage
);
