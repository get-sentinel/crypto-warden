import { Dimensions, Linking } from 'react-native';
import { WalletData } from '../types/wallet.types';
import { TOAST_POSITION, WALLET_PROVIDERS } from './constants';
import { Dispatch } from 'react';
import { setPendingURLWallet } from '../redux/WalletSlice';
import { createWallet, findDuplicateBySeedHash, computeSeedHash } from './walletFactory';
import Toast from 'react-native-toast-message';

export const cropWalletAddress = (address: string): string => {
  const length = address.length;
  return address.slice(0, 4) + '...' + address.slice(length - 4, length);
};

export const isSmallScreen = (): boolean =>
  Dimensions.get('screen').height < 812;

export const getProviderName = (providerId: number): string =>
  WALLET_PROVIDERS.find(w => w.id === providerId)?.name ?? 'Unknown';

export const getProviderImagePath = (providerId: number) =>
  WALLET_PROVIDERS.find(w => w.id === providerId)?.imagePath;

export const getMaxNumberFromArray = (array: number[]): number => {
  const newId =
    array.filter(o => o !== null && o !== undefined).sort((a, b) => b - a)[0] + 1;
  return !newId || isNaN(newId) ? 0 : newId;
};

export const openURL = (url: string): void => {
  Linking.canOpenURL(url).then(supported => {
    if (supported) {
      Linking.openURL(url);
    }
  });
};

export const getNextSorting = (sorting: number): number => {
  switch (sorting) {
    case 0: return 1;
    case 1: return 2;
    case 2: return 3;
    case 3:
    default: return 0;
  }
};

export const sortWallets = (wallets: WalletData[], sorting: number): WalletData[] => {
  const active = [...wallets.filter(w => !w.isDeleted)];
  switch (sorting) {
    case 0: // Oldest first
    default:
      return active;
    case 1: // Newest first
      return active.reverse();
    case 2: // A → Z
      return active.sort((a, b) => a.name.localeCompare(b.name));
    case 3: // Z → A
      return active.sort((a, b) => b.name.localeCompare(a.name));
  }
};

export const findProviderIdByName = (name: string): number => {
  const provider = WALLET_PROVIDERS.find(
    p => p.name.toLowerCase() === name.toLowerCase(),
  );
  return provider ? provider.id : 0;
};

/**
 * Parses a cryptowarden:// deep-link URL and stores the wallet as a PENDING import
 * (in Redux state). The Home screen shows a confirmation dialog before saving.
 * This prevents silent wallet injection by malicious apps.
 */
export const addNewWalletFromURL = (
  dispatch: Dispatch<any>,
  url: string,
  wallets: WalletData[],
): void => {
  const parts = url.split('//');
  if (parts.length !== 2) {
    console.error('Invalid cryptowarden:// URL format');
    return;
  }

  const walletName = decodeURIComponent(parts[1].split('?')[0]) || 'My Wallet';
  const queryString = parts[1].split('?')[1];
  if (!queryString) {
    console.error('cryptowarden:// URL missing query parameters');
    return;
  }

  const query: Record<string, string> = {};
  queryString.split('&').forEach(item => {
    const [key, value] = item.split('=');
    if (key && value !== undefined) query[key] = decodeURIComponent(value);
  });

  const seed = query.seed;
  if (!seed) {
    Toast.show({
      type: 'error',
      position: TOAST_POSITION,
      text1: 'Could not import wallet',
      text2: 'The seed is either missing or malformed',
      visibilityTime: 2000,
      props: { iconName: 'cancel' },
    });
    return;
  }

  const idPool = wallets.map(w => w.id);
  const pendingWallet = createWallet({
    idPool,
    name: walletName,
    seed,
    provider: query.provider ? findProviderIdByName(query.provider) : 0,
    address: query.address,
    password: query.password,
  });

  // Check for duplicates before surfacing the confirmation dialog
  const seedHash = computeSeedHash(seed.trim().toLowerCase().replace(/\s+/g, ' '));
  const duplicate = findDuplicateBySeedHash(seedHash, wallets);
  if (duplicate) {
    Toast.show({
      type: 'info',
      position: TOAST_POSITION,
      text1: 'Wallet already exists',
      text2: `"${duplicate.name}" has the same seed phrase.`,
      visibilityTime: 3000,
    });
    // Still surface the dialog — user may want to save it anyway
  }

  // Surface a confirmation dialog in the Home screen before saving
  dispatch(setPendingURLWallet(pendingWallet));
};
