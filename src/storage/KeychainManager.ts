import { Dispatch } from 'redux';
import { WalletData } from '../types/wallet.types';
import { loadWallets } from '../redux/WalletSlice';
import { KEYCHAIN_PATHS } from '../utils/constants';
import { migrateWallet } from '../utils/walletFactory';
import { NativeModules } from 'react-native';
import * as Keychain from 'react-native-keychain';

const { KeychainWrapper } = NativeModules;

const BIOMETRIC_SERVICE = 'cryptowarden.biometric';

export const storeBiometricSentinel = async (): Promise<boolean> => {
  try {
    await Keychain.setGenericPassword('biometric', 'authorized', {
      service: BIOMETRIC_SERVICE,
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
    });
    return true;
  } catch {
    return false;
  }
};

export const removeBiometricSentinel = async (): Promise<void> => {
  try {
    await Keychain.resetGenericPassword({ service: BIOMETRIC_SERVICE });
  } catch {}
};

export const authenticateWithBiometrics = async (): Promise<boolean> => {
  try {
    const result = await Keychain.getGenericPassword({
      service: BIOMETRIC_SERVICE,
      authenticationPrompt: {
        title: 'Unlock CryptoWarden',
        description: 'Authenticate to access your wallets',
      },
    });
    return !!result;
  } catch {
    return false;
  }
};

export const setValueForKey = (
  key: string,
  value: string,
  synchronizable: boolean,
): Promise<number> => KeychainWrapper.setValueForKey(value, key, synchronizable);

export const getValueForKey = (
  key: string,
  synchronizable: boolean,
): string => KeychainWrapper.getValueForKey(key, synchronizable);

/**
 * One-time recovery of wallets stored by the legacy SeedWarden build (different
 * keychain access group + service after the SeedWarden → Crypto Warden rename).
 * Idempotent and non-destructive — see the native implementation. Safe to call on
 * every load; it no-ops once the current store is populated.
 */
export const migrateLegacyWallets = (): void => {
  try {
    KeychainWrapper.migrateLegacyWalletsIfNeeded?.();
  } catch {}
};

/**
 * Persists wallets to the keychain. Sync is always on (free, not premium-gated):
 * by default it writes to the synchronizable (iCloud) bucket, merging with any
 * remote copy first. `fetchWallets` self-heals a local copy on read, so data is
 * available even without iCloud Keychain. The `synchronizable: false` path is used
 * only by that self-heal to write the local mirror.
 */
export const setWalletsToKeychain = (
  localWallets: WalletData[],
  synchronizable: boolean = true,
): void => {
  let walletsToSave = localWallets;

  if (synchronizable) {
    const remoteWallets = getWalletsFromKeychain({ synchronizable });
    walletsToSave = mergeWallets(localWallets, remoteWallets);
  }

  // WalletData is a plain serializable object — no .getWallet() needed
  const serialized = JSON.stringify(walletsToSave);
  setValueForKey(KEYCHAIN_PATHS.WALLETS, serialized, synchronizable);
};

export const getWalletsFromKeychain = ({
  synchronizable = true,
}: {
  synchronizable?: boolean;
}): WalletData[] => {
  const value = getValueForKey(KEYCHAIN_PATHS.WALLETS, synchronizable);
  if (!value || value === '[]' || value === '') return [];

  try {
    const raw: any[] = JSON.parse(value);
    // Migrate each entry: handles legacy Wallet class objects and adds new fields with defaults
    return raw.map(migrateWallet);
  } catch {
    return [];
  }
};

export const fetchWallets = ({
  dispatch,
  localWallets = [],
}: {
  dispatch: Dispatch<any>;
  // Accepted for backward compatibility but intentionally ignored for reads — see below.
  synchronizable?: boolean;
  localWallets?: WalletData[];
}): void => {
  // iOS Keychain stores synchronizable (iCloud) and non-synchronizable (local)
  // items as SEPARATE entries, even for the same service + key. A wallet written
  // while premium lives in the synced bucket and is invisible to a local-only
  // read (and vice-versa). Gating the read on `premium` therefore hides existing
  // wallets whenever the premium check is false or hasn't resolved yet — which is
  // exactly what happens on a fresh install/upgrade before RevenueCat responds.
  //
  // Reads must NEVER depend on premium: always union both buckets so wallets
  // always show. Premium still gates whether we additionally write an iCloud copy
  // (see setWalletsToKeychain).

  // Recover wallets stranded in the legacy SeedWarden keychain (different bundle
  // id / access group / service after the rename). No-op once migrated or when the
  // current store is already populated.
  migrateLegacyWallets();

  const localStore = getWalletsFromKeychain({ synchronizable: false });
  const syncedStore = getWalletsFromKeychain({ synchronizable: true });
  let remoteWallets = mergeWallets(localStore, syncedStore);

  if (localWallets.length > 0) {
    remoteWallets = mergeWallets(localWallets, remoteWallets);
  }

  // Self-heal the local bucket: persist a non-synchronizable copy of everything
  // we found so wallets survive even if iCloud Keychain is later disabled (or the
  // user is no longer premium). Guard rails:
  //  - never write an empty set (would clobber a populated local store), and
  //  - only write when something is actually missing locally, to avoid a keychain
  //    write on every fetch.
  if (remoteWallets.length > 0) {
    const localKeys = new Set(
      localStore.flatMap(w => [w.seedHash, w.seed]).filter(Boolean),
    );
    const missingLocally = remoteWallets.some(
      w => !localKeys.has(w.seedHash) && !localKeys.has(w.seed),
    );
    if (missingLocally) {
      setWalletsToKeychain(remoteWallets, false);
    }
  }

  dispatch(loadWallets(remoteWallets));
};

/**
 * Merges local and remote wallet arrays by comparing updateDate.
 * Matches wallets first by seedHash (new), then by seed string (legacy fallback).
 * The newer version of a duplicate is kept.
 */
const mergeWallets = (local: WalletData[], remote: WalletData[]): WalletData[] => {
  const merged: WalletData[] = [];

  for (const remoteWallet of remote) {
    const match = local.find(
      lw => lw.seedHash === remoteWallet.seedHash || lw.seed === remoteWallet.seed,
    );
    if (match && new Date(match.updateDate) > new Date(remoteWallet.updateDate)) {
      merged.push(match);
    } else {
      merged.push(remoteWallet);
    }
  }

  for (const localWallet of local) {
    const alreadyMerged = merged.find(
      mw => mw.seedHash === localWallet.seedHash || mw.seed === localWallet.seed,
    );
    if (!alreadyMerged) {
      merged.push(localWallet);
    }
  }

  return merged;
};
