import { ChainNetwork } from '../types/wallet.types';

import METAMASK_IMAGE from '../assets/walletIcons/metamask.png';
import PHANTOM_IMAGE from '../assets/walletIcons/phantom.png';
import CRYPTOCOMDEFI_IMAGE from '../assets/walletIcons/cryptocomdefi.png';
import KEPLR_IMAGE from '../assets/walletIcons/keplr.png';
import EXODUS_IMAGE from '../assets/walletIcons/exodus.png';
import PETRA_IMAGE from '../assets/walletIcons/petra.png';
import TRUSTWALLET_IMAGE from '../assets/walletIcons/trustwallet.png';
import COINOMI_IMAGE from '../assets/walletIcons/coinomi.png';
import SUI_IMAGE from '../assets/walletIcons/sui.png';
import TERRASTATION_IMAGE from '../assets/walletIcons/terrastation.png';
import MYETHERWALLET_IMAGE from '../assets/walletIcons/myetherwallet.png';
import COINBASEWALLET_IMAGE from '../assets/walletIcons/coinbasewallet.png';
import AIRGAP_IMAGE from '../assets/walletIcons/airgap.png';
import KEEPKEY_IMAGE from '../assets/walletIcons/keepkey.png';
import TREZOR_IMAGE from '../assets/walletIcons/trezor.png';
import LEDGER_IMAGE from '../assets/walletIcons/ledger.png';
import BLUE_IMAGE from '../assets/walletIcons/blue.png';
import ATOMIC_IMAGE from '../assets/walletIcons/atomic.png';
import XDEFI_IMAGE from '../assets/walletIcons/xdefi.png';
import APP_ICON_IMAGE from '../assets/app-icon.png';

export const APP_STORE_IOS_ID = '1663191731';
export const PLAY_STORE_ANDROID_ID = 'com.seedwarden';

export const PAGES = {
  HOME: 'home',
  ADD: 'add',
  WALLET_DETAILS: 'walletDetails',
  SETTINGS: 'settings',
  FAQ: 'faq',
  ONBOARDING: 'onboarding',
  PAYWALL: 'paywall',
} as const;

export const KEYCHAIN_PATHS = {
  WALLETS: 'wallets',
} as const;

// ── Spacing & sizing ──────────────────────────────────────────────────────────
export const DEFAULT_PADDING = 24;
export const DEFAULT_05x_MARGIN = 4;
export const DEFAULT_1x_MARGIN = 8;
export const DEFAULT_2x_MARGIN = 16;
export const DEFAULT_3x_MARGIN = 24;
export const DEFAULT_15_MARGIN = 12;
export const DEFAULT_CORNER_RADIUS = 12;
export const TOP_NAV_TITLE_SIZE = 27;
export const TOP_NAV_TITLE_WEIGHT = '800';
export const BUTTON_FONT_SIZE = 18;
export const DEFAULT_TEXT_SIZE = 17;
export const DEFAULT_MODAL_TITLE = 20;
export const TAB_ICON_SIZE = 28;
export const TOAST_POSITION = 'bottom' as const;

// ── Wallet providers ──────────────────────────────────────────────────────────
export const WALLET_PROVIDERS = [
  { id: -1, name: 'Crypto Wallet', imagePath: APP_ICON_IMAGE },
  { id: 0,  name: 'MetaMask',       imagePath: METAMASK_IMAGE },
  { id: 1,  name: 'Phantom',        imagePath: PHANTOM_IMAGE },
  { id: 2,  name: 'Crypto.com DeFi', imagePath: CRYPTOCOMDEFI_IMAGE },
  { id: 3,  name: 'Keplr',          imagePath: KEPLR_IMAGE },
  { id: 4,  name: 'Terrastation',   imagePath: TERRASTATION_IMAGE },
  { id: 5,  name: 'TrustWallet',    imagePath: TRUSTWALLET_IMAGE },
  { id: 6,  name: 'Sui',            imagePath: SUI_IMAGE },
  { id: 7,  name: 'Exodus',         imagePath: EXODUS_IMAGE },
  { id: 8,  name: 'MyEtherWallet',  imagePath: MYETHERWALLET_IMAGE },
  { id: 9,  name: 'Coinomi',        imagePath: COINOMI_IMAGE },
  { id: 10, name: 'Petra',          imagePath: PETRA_IMAGE },
  { id: 11, name: 'Coinbase Wallet', imagePath: COINBASEWALLET_IMAGE },
  { id: 12, name: 'Ledger',         imagePath: LEDGER_IMAGE },
  { id: 13, name: 'KeepKey',        imagePath: KEEPKEY_IMAGE },
  { id: 14, name: 'Trezor',         imagePath: TREZOR_IMAGE },
  { id: 15, name: 'Airgap',         imagePath: AIRGAP_IMAGE },
  { id: 16, name: 'Atomic',         imagePath: ATOMIC_IMAGE },
  { id: 17, name: 'Xdefi',          imagePath: XDEFI_IMAGE },
  { id: 18, name: 'Blue',           imagePath: BLUE_IMAGE },
] as const;

// ── Chain network metadata ────────────────────────────────────────────────────
export const CHAIN_NETWORK_META: Record<ChainNetwork, { label: string; color: string }> = {
  ethereum:  { label: 'Ethereum',  color: '#627EEA' },
  bitcoin:   { label: 'Bitcoin',   color: '#F7931A' },
  solana:    { label: 'Solana',    color: '#9945FF' },
  polygon:   { label: 'Polygon',   color: '#8247E5' },
  bnb:       { label: 'BNB Chain', color: '#F3BA2F' },
  avalanche: { label: 'Avalanche', color: '#E84142' },
  arbitrum:  { label: 'Arbitrum',  color: '#96BEDC' },
  optimism:  { label: 'Optimism',  color: '#FF0420' },
  cosmos:    { label: 'Cosmos',    color: '#7D74F0' },
  terra:     { label: 'Terra',     color: '#5493F7' },
  sui:       { label: 'Sui',       color: '#4DA2FF' },
  aptos:     { label: 'Aptos',     color: '#00D4AA' },
  near:      { label: 'NEAR',      color: '#00C08B' },
  tron:      { label: 'TRON',      color: '#E50915' },
  base:      { label: 'Base',      color: '#0052FF' },
  fantom:    { label: 'Fantom',    color: '#1969FF' },
  other:     { label: 'Other',     color: '#7C8695' },
};

export const CHAIN_NETWORKS = Object.keys(CHAIN_NETWORK_META) as ChainNetwork[];

// ── Seed status messages ──────────────────────────────────────────────────────
interface SeedStatusMessage {
  [key: number]: { message: string; color: string };
}

export const SEED_STATUS_MESSAGE: SeedStatusMessage = {
  0: { message: 'No seed has been provided yet', color: '#C9A227' },
  1: { message: 'Seed must be 12, 18, or 24 words', color: '#DE4D43' },
  2: { message: 'Seed starts or ends with a space', color: '#DE4D43' },
  3: { message: 'Seed contains special characters', color: '#DE4D43' },
  4: { message: 'Format looks fine', color: '#4CAF50' },
  5: { message: 'Word not in BIP-39 wordlist — double-check spelling', color: '#DE4D43' },
  6: { message: 'Checksum invalid — verify the seed carefully', color: '#DE4D43' },
  7: { message: 'Valid BIP-39 seed phrase ✓', color: '#4CAF50' },
};
