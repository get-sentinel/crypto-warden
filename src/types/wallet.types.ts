export type ChainNetwork =
  | 'ethereum'
  | 'bitcoin'
  | 'solana'
  | 'polygon'
  | 'bnb'
  | 'avalanche'
  | 'arbitrum'
  | 'optimism'
  | 'cosmos'
  | 'terra'
  | 'sui'
  | 'aptos'
  | 'near'
  | 'tron'
  | 'base'
  | 'fantom'
  | 'other';

export interface WalletData {
  id: number;
  name: string;
  seed: string;
  /** SHA-256 of the seed normalized to: trimmed, lowercased, single-spaced. Used for duplicate detection. */
  seedHash: string;
  address?: string;
  password?: string;
  /** Provider icon index (0–18). Kept for backward compatibility with wallet icon display. */
  provider: number;
  chain?: ChainNetwork;
  notes?: string;
  tags?: string[];
  isDeleted: boolean;
  /** ISO date string */
  createDate: string;
  /** ISO date string */
  updateDate: string;
}

export interface ExportBundle {
  version: 1;
  exportedAt: string;
  wallets: WalletData[];
}
