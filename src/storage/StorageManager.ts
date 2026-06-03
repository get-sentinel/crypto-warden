import { Dispatch } from 'redux';
import { Platform } from 'react-native';

import { WalletData } from '../types/wallet.types';
import { migrateWallet } from '../utils/walletFactory';
import { loadWallets } from '../redux/WalletSlice';
import { setPassword, setSecurityOption } from '../redux/AccountSlice';
import {
  E_STORAGE_KEY,
  KEYCHAIN_KEY,
  SECURITY_OPTIONS,
  SECURITY_OPTION_DISPLAY_NAMES,
  SENTINEL_CLOUD_KEY,
} from '../utils/constants';
import {
  getValueForKey,
  getWalletsFromKeychain,
  migrateLegacyWallets,
  setValueForKey,
} from './KeychainManager';
import * as EncryptedStorageManager from './EncryptedStorageManager';
import * as FirestoreManager from '../firebase/firestore';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** A decrypted/stored wallets blob must be a JSON array. Used to validate keys. */
const isWalletsJson = (value: string): boolean => {
  try {
    return Array.isArray(JSON.parse(value));
  } catch {
    return false;
  }
};

/** Parses a stored JSON string into migrated WalletData objects. */
const getWalletsFromString = (value: string | undefined): WalletData[] => {
  if (!value || value === '[]' || value.trim() === '') return [];
  try {
    const raw = JSON.parse(value);
    return Array.isArray(raw) ? raw.map(migrateWallet) : [];
  } catch {
    return [];
  }
};

/**
 * Reassigns `id`s so every wallet has a unique one. Wallets merged from different
 * backends each number their ids from 0/1, so collisions are common — and since the
 * UI uses `id` as the list key and as the update/delete match key, duplicates make
 * deletes hit the wrong wallet. The first wallet keeps its id; later collisions get
 * a fresh id above the current max.
 */
export const normalizeIds = (wallets: WalletData[]): WalletData[] => {
  const seen = new Set<number>();
  let maxId = wallets.reduce(
    (max, w) => Math.max(max, typeof w.id === 'number' ? w.id : 0),
    0,
  );
  return wallets.map(w => {
    let id = typeof w.id === 'number' ? w.id : 0;
    if (seen.has(id)) id = ++maxId;
    seen.add(id);
    return id === w.id ? w : { ...w, id };
  });
};

/** Merges two wallet lists, deduping by seedHash (then seed); newest updateDate wins. */
export const mergeWallets = (local: WalletData[], remote: WalletData[]): WalletData[] => {
  const merged: WalletData[] = [];
  for (const wallet of [...remote, ...local]) {
    const idx = merged.findIndex(
      m => m.seedHash === wallet.seedHash || (!!m.seed && m.seed === wallet.seed),
    );
    if (idx === -1) {
      merged.push(wallet);
    } else if (new Date(wallet.updateDate) > new Date(merged[idx].updateDate)) {
      merged[idx] = wallet;
    }
  }
  return normalizeIds(merged);
};

// ── Local settings storage (securityOption + password) ─────────────────────────
// iOS keeps these in the keychain (non-synchronizable); Android in EncryptedStorage.

export const setToLocalStorage = async ({
  key,
  value,
}: {
  key: string;
  value: string;
}): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      return await EncryptedStorageManager.setValueForKey({ key, value });
    }
    setValueForKey(key, value, false);
    return true;
  } catch {
    return false;
  }
};

export const getFromLocalStorage = async ({
  key,
}: {
  key: string;
}): Promise<string | undefined> => {
  if (Platform.OS === 'android') {
    return EncryptedStorageManager.getValueForKey({ key });
  }
  // Native getValueForKey returns "[]" as its empty sentinel.
  const value = getValueForKey(key, false);
  return !value || value === '[]' || value.trim() === '' ? undefined : value;
};

// ── Backend read/write ─────────────────────────────────────────────────────────

export const getDataFromRemote = async ({
  securityOption,
  uid,
  password,
}: {
  securityOption: string;
  uid?: string;
  password?: string;
}): Promise<WalletData[]> => {
  switch (securityOption) {
    case SECURITY_OPTIONS.SENTINEL: {
      if (!uid || !password) return [];
      const value = await FirestoreManager.getEncryptedValueForKey({
        uid,
        key: SENTINEL_CLOUD_KEY.WALLETS,
        password,
        validate: isWalletsJson,
      });
      return getWalletsFromString(value);
    }
    case SECURITY_OPTIONS.E_STORAGE: {
      const value = await EncryptedStorageManager.getValueForKey({
        key: E_STORAGE_KEY.WALLETS,
      });
      return getWalletsFromString(value);
    }
    case SECURITY_OPTIONS.ICLOUD:
    default: {
      // Recover any wallets stranded in the legacy SeedWarden keychain group, then
      // union both keychain buckets (local + iCloud) for robustness.
      migrateLegacyWallets();
      const local = getWalletsFromKeychain({ synchronizable: false });
      const synced = getWalletsFromKeychain({ synchronizable: true });
      return mergeWallets(local, synced);
    }
  }
};

export const setDataToRemote = async ({
  securityOption,
  uid,
  value,
  password,
}: {
  securityOption: string;
  uid?: string;
  value: string;
  password?: string;
}): Promise<boolean> => {
  switch (securityOption) {
    case SECURITY_OPTIONS.SENTINEL:
      if (!uid || !password) return false;
      return FirestoreManager.setEncryptedValueForKey({
        uid,
        key: SENTINEL_CLOUD_KEY.WALLETS,
        value,
        password,
      });
    case SECURITY_OPTIONS.E_STORAGE:
      return EncryptedStorageManager.setValueForKey({ key: E_STORAGE_KEY.WALLETS, value });
    case SECURITY_OPTIONS.ICLOUD:
    default:
      setValueForKey(KEYCHAIN_KEY.WALLETS, value, true);
      return true;
  }
};

// ── High-level operations ──────────────────────────────────────────────────────

/** Loads wallets from the active backend (merging with any local set) and dispatches. */
export const getWalletsAndDispatch = async ({
  dispatch,
  local = [],
  securityOption,
  uid,
  password,
}: {
  dispatch: Dispatch<any>;
  local?: WalletData[];
  securityOption: string;
  uid?: string;
  password?: string;
}): Promise<number> => {
  const remote = await getDataFromRemote({ securityOption, uid, password });
  const merged = local.length > 0 ? mergeWallets(local, remote) : normalizeIds(remote);
  dispatch(loadWallets(merged));
  return remote.length;
};

/** Persists wallets to the active backend, merging with the remote copy first. */
export const saveWallets = async ({
  local,
  securityOption,
  uid,
  password,
}: {
  local: WalletData[];
  securityOption: string;
  uid?: string;
  password?: string;
}): Promise<boolean> => {
  const remote = await getDataFromRemote({ securityOption, uid, password });
  const merged = mergeWallets(local, remote);
  return setDataToRemote({
    securityOption,
    uid,
    value: JSON.stringify(merged),
    password,
  });
};

/**
 * Migrates wallets from one backend to another, merging both so nothing is lost.
 * Streams human-readable progress through `setStatusMessage`. Optionally clears the
 * old backend afterwards.
 */
export const switchSecureStorage = async ({
  local,
  oldSecurityOption,
  newSecurityOption,
  newPassword,
  oldPassword,
  uid,
  deleteOrigin,
  dispatch,
  statusMessage,
  setStatusMessage,
}: {
  local: WalletData[];
  oldSecurityOption: string;
  newSecurityOption: string;
  newPassword?: string;
  oldPassword?: string;
  uid?: string;
  deleteOrigin: boolean;
  dispatch: Dispatch<any>;
  statusMessage: string[];
  setStatusMessage: (messages: string[]) => void;
}): Promise<boolean> => {
  const push = (msg: string) => {
    statusMessage.push(msg);
    setStatusMessage([...statusMessage]);
  };

  push('Migration started…');
  const effectivePassword = newPassword ?? oldPassword;

  // Read whatever already lives at the destination so we don't clobber it.
  const remote = await getDataFromRemote({
    securityOption: newSecurityOption,
    uid,
    password: effectivePassword,
  });
  push(`✅ Read destination (${SECURITY_OPTION_DISPLAY_NAMES[newSecurityOption]}): ${remote.length} wallet(s)`);

  const merged = mergeWallets(local, remote);
  push(`✅ Merged with local data: ${merged.length} wallet(s) total`);
  const value = JSON.stringify(merged);

  // Persist a changed password locally before writing the encrypted blob.
  if (oldPassword !== newPassword && newPassword) {
    const ok = await setToLocalStorage({ key: 'password', value: newPassword });
    if (!ok) {
      push('❌ Could not store the new password locally — aborting');
      return false;
    }
    dispatch(setPassword(newPassword));
    push('✅ Stored new password on device');
  }

  // Write to the new backend.
  const wrote = await setDataToRemote({
    securityOption: newSecurityOption,
    uid,
    value,
    password: newPassword ?? oldPassword,
  });
  if (!wrote) {
    push(`❌ Failed to write to ${SECURITY_OPTION_DISPLAY_NAMES[newSecurityOption]} — aborting`);
    return false;
  }
  push(`✅ Saved to ${SECURITY_OPTION_DISPLAY_NAMES[newSecurityOption]}`);

  // Record the new choice.
  await setToLocalStorage({ key: 'securityOption', value: newSecurityOption });
  dispatch(setSecurityOption(newSecurityOption));
  push(`✅ ${SECURITY_OPTION_DISPLAY_NAMES[newSecurityOption]} is now your storage`);

  // Reflect the merged set in the UI immediately.
  dispatch(loadWallets(merged));

  // Optionally clear the old backend.
  if (deleteOrigin && oldSecurityOption !== newSecurityOption) {
    const cleared = await setDataToRemote({
      securityOption: oldSecurityOption,
      uid,
      value: '[]',
      password: oldPassword,
    });
    push(
      cleared
        ? `✅ Cleared old data from ${SECURITY_OPTION_DISPLAY_NAMES[oldSecurityOption]}`
        : `❌ Could not clear ${SECURITY_OPTION_DISPLAY_NAMES[oldSecurityOption]}`,
    );
  }

  push('✅ Migration complete');
  return true;
};
