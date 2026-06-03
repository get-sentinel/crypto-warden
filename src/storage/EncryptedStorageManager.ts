import EncryptedStorage from 'react-native-encrypted-storage';

/**
 * Thin wrapper over react-native-encrypted-storage (iOS Keychain / Android
 * EncryptedSharedPreferences). Used by the "Encrypted Storage" backend and for
 * persisting local settings on Android.
 */
export const getValueForKey = async ({ key }: { key: string }): Promise<string | undefined> => {
  try {
    const value = await EncryptedStorage.getItem(key);
    return value ?? undefined;
  } catch {
    return undefined;
  }
};

export const setValueForKey = async ({
  key,
  value,
}: {
  key: string;
  value: string;
}): Promise<boolean> => {
  try {
    await EncryptedStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};
