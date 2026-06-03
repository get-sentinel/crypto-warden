import firestore from '@react-native-firebase/firestore';
import { COLLECTION } from '../utils/constants';
import {
  decryptData,
  encryptData,
  EncryptedBlob,
} from '../storage/EncryptionManager';

/**
 * "Sentinel Cloud" backend: the wallets blob is AES-256 encrypted on-device and
 * stored in Firestore at `data/{uid}.{key}`. The server only ever sees ciphertext —
 * the password never leaves the device.
 */
export const setEncryptedValueForKey = async ({
  uid,
  key,
  value,
  password,
}: {
  uid: string;
  key: string;
  value: string;
  password: string;
}): Promise<boolean> => {
  try {
    const encrypted = await encryptData({ value, password, uid });
    await firestore()
      .collection(COLLECTION.DATA)
      .doc(uid)
      .set({ [key]: { ...encrypted, updateDate: new Date() } }, { merge: true });
    return true;
  } catch (error) {
    console.warn('[Firestore] failed to set encrypted value:', String(error));
    return false;
  }
};

export const getEncryptedValueForKey = async ({
  uid,
  key,
  password,
  validate,
}: {
  uid: string;
  key: string;
  password: string;
  validate?: (plaintext: string) => boolean;
}): Promise<string | undefined> => {
  try {
    const snapshot = await firestore().collection(COLLECTION.DATA).doc(uid).get();
    const encrypted = snapshot.data()?.[key] as EncryptedBlob | undefined;
    if (!encrypted) return undefined;
    return await decryptData({ encryptedData: encrypted, password, uid, validate });
  } catch (error) {
    console.warn('[Firestore] failed to get encrypted value:', String(error));
    return undefined;
  }
};
