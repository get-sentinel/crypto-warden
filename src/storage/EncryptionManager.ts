import Aes from 'react-native-aes-crypto';

/**
 * AES-256-CBC encryption with a PBKDF2-derived key, matching the production app's
 * scheme so legacy "Sentinel Cloud" blobs can be decrypted:
 *   key = PBKDF2(password, salt = uid, cost = 500, length = 256)
 *
 * The production app used react-native-aes-crypto@2, whose pbkdf2 took no explicit
 * hash. v3 requires one. Legacy blobs therefore have no recorded algorithm, so on
 * decryption we try each candidate and keep whichever produces a valid payload. New
 * blobs record the algorithm they were written with.
 */
const PBKDF2_COST = 500;
const PBKDF2_LENGTH = 256;
const AES_MODE = 'aes-256-cbc';

export type Pbkdf2Algorithm = 'sha512' | 'sha256' | 'sha1';
export const PBKDF2_ALGORITHMS: Pbkdf2Algorithm[] = ['sha512', 'sha256', 'sha1'];
const ENCRYPT_ALGORITHM: Pbkdf2Algorithm = 'sha256';

export interface EncryptedBlob {
  cipher: string;
  iv: string;
  /** PBKDF2 hash used. Absent on legacy production blobs (try PBKDF2_ALGORITHMS). */
  algorithm?: Pbkdf2Algorithm;
}

const deriveKey = (password: string, salt: string, algorithm: Pbkdf2Algorithm) =>
  Aes.pbkdf2(password, salt, PBKDF2_COST, PBKDF2_LENGTH, algorithm);

export const encryptData = async ({
  value,
  password,
  uid,
}: {
  value: string;
  password: string;
  uid: string;
}): Promise<EncryptedBlob> => {
  const key = await deriveKey(password, uid, ENCRYPT_ALGORITHM);
  const iv = await Aes.randomKey(16);
  const cipher = await Aes.encrypt(value, key, iv, AES_MODE);
  return { cipher, iv, algorithm: ENCRYPT_ALGORITHM };
};

/**
 * Decrypts a blob. `validate` is used to confirm the right key when the algorithm
 * is unknown (legacy blobs) — decryption with a wrong key may not throw, so we need
 * a payload check. Returns undefined if nothing decrypts to a valid payload.
 */
export const decryptData = async ({
  encryptedData,
  password,
  uid,
  validate,
}: {
  encryptedData: EncryptedBlob;
  password: string;
  uid: string;
  validate?: (plaintext: string) => boolean;
}): Promise<string | undefined> => {
  if (!encryptedData?.cipher || !encryptedData?.iv) return undefined;

  const candidates: Pbkdf2Algorithm[] = encryptedData.algorithm
    ? [encryptedData.algorithm]
    : PBKDF2_ALGORITHMS;

  for (const algorithm of candidates) {
    try {
      const key = await deriveKey(password, uid, algorithm);
      const plaintext = await Aes.decrypt(encryptedData.cipher, key, encryptedData.iv, AES_MODE);
      if (!validate || validate(plaintext)) return plaintext;
    } catch {
      // Wrong key → bad padding or decode error. Try the next algorithm.
    }
  }
  return undefined;
};
