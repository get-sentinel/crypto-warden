import { ChainNetwork, WalletData } from '../types/wallet.types';
import { getMaxNumberFromArray } from './utils';

/** Maps existing provider IDs to their primary chain for auto-population during migration. */
const PROVIDER_CHAIN_MAP: Record<number, ChainNetwork> = {
  '-1': 'other',
  0: 'ethereum',   // MetaMask
  1: 'solana',     // Phantom
  2: 'ethereum',   // Crypto.com DeFi
  3: 'cosmos',     // Keplr
  4: 'terra',      // Terrastation
  5: 'other',      // TrustWallet (multi-chain)
  6: 'sui',        // Sui
  7: 'other',      // Exodus (multi-chain)
  8: 'ethereum',   // MyEtherWallet
  9: 'other',      // Coinomi (multi-chain)
  10: 'aptos',     // Petra
  11: 'ethereum',  // Coinbase Wallet
  12: 'other',     // Ledger (hardware, multi-chain)
  13: 'other',     // KeepKey (hardware)
  14: 'other',     // Trezor (hardware)
  15: 'other',     // Airgap (multi-chain)
  16: 'other',     // Atomic (multi-chain)
  17: 'other',     // Xdefi (multi-chain)
  18: 'bitcoin',   // Blue Wallet
};

export function getChainFromProvider(providerId: number): ChainNetwork {
  return PROVIDER_CHAIN_MAP[providerId] ?? 'other';
}

/** Normalizes a seed phrase for hashing: trim, lowercase, collapse whitespace. */
function normalizeSeed(seed: string): string {
  return seed.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Computes a simple SHA-256 hex digest of a normalized seed using js-sha256. */
export function computeSeedHash(normalizedSeed: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { sha256 } = require('js-sha256');
  return sha256(normalizedSeed) as string;
}

/** Creates a new WalletData from user input. */
export function createWallet(params: {
  idPool?: number[];
  name: string;
  seed: string;
  provider?: number;
  address?: string;
  password?: string;
  chain?: ChainNetwork;
  notes?: string;
  tags?: string[];
}): WalletData {
  const normalized = normalizeSeed(params.seed);
  const now = new Date().toISOString();
  return {
    id: getMaxNumberFromArray(params.idPool ?? []),
    name: params.name,
    seed: params.seed,
    seedHash: computeSeedHash(normalized),
    address: params.address,
    password: params.password,
    provider: params.provider ?? 0,
    chain: params.chain ?? (params.provider != null ? getChainFromProvider(params.provider) : 'other'),
    notes: params.notes,
    tags: params.tags ?? [],
    isDeleted: false,
    createDate: now,
    updateDate: now,
  };
}

/**
 * Migrates a raw stored object (legacy Wallet class instance or plain object) to WalletData.
 * Handles missing fields gracefully — safe to call on data from any past app version.
 */
export function migrateWallet(raw: any): WalletData {
  const seed: string = raw.seed ?? '';
  const normalized = normalizeSeed(seed);

  // Convert legacy Date objects or date strings to ISO strings
  const toISO = (val: any): string => {
    if (!val) return new Date().toISOString();
    if (val instanceof Date) return val.toISOString();
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  };

  return {
    id: typeof raw.id === 'number' ? raw.id : 0,
    name: raw.name ?? 'My Wallet',
    seed,
    seedHash: raw.seedHash ?? computeSeedHash(normalized),
    address: raw.address,
    password: raw.password,
    provider: typeof raw.provider === 'number' ? raw.provider : 0,
    chain: raw.chain ?? getChainFromProvider(raw.provider ?? 0),
    notes: raw.notes,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    isDeleted: raw.isDeleted ?? false,
    createDate: toISO(raw.createDate),
    updateDate: toISO(raw.updateDate),
  };
}

/** Returns the first wallet whose seedHash matches, ignoring deleted wallets. */
export function findDuplicateBySeedHash(
  seedHash: string,
  wallets: WalletData[],
): WalletData | undefined {
  return wallets.find(w => !w.isDeleted && w.seedHash === seedHash);
}

/** Returns the first wallet whose address matches (case-insensitive), ignoring deleted wallets. */
export function findDuplicateByAddress(
  address: string,
  wallets: WalletData[],
): WalletData | undefined {
  if (!address.trim()) return undefined;
  const lower = address.toLowerCase();
  return wallets.find(
    w => !w.isDeleted && !!w.address && w.address.toLowerCase() === lower,
  );
}
