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

export const setWalletsToKeychain = (
  localWallets: WalletData[],
  synchronizable: boolean = false,
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
  synchronizable,
  localWallets = [],
}: {
  dispatch: Dispatch<any>;
  synchronizable?: boolean;
  localWallets?: WalletData[];
}): void => {
  const remoteWallets = getWalletsFromKeychain({ synchronizable });

  if (localWallets.length > 0) {
    dispatch(loadWallets(mergeWallets(localWallets, remoteWallets)));
    return;
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
