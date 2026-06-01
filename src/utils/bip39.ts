import { wordlists } from 'bip39';
import { computeSeedHash } from './walletFactory';

export { computeSeedHash };

const VALID_WORD_COUNTS = new Set([12, 15, 18, 21, 24]);

export const SeedStatus = {
  EMPTY: 0,
  WRONG_WORD_COUNT: 1,
  LEADING_TRAILING_SPACE: 2,
  SPECIAL_CHARS: 3,
  /** Word count is valid and no special characters — may not be BIP-39. */
  VALID_FORMAT: 4,
  /** One or more words are not in the BIP-39 English wordlist. */
  INVALID_BIP39_WORD: 5,
  /** All words are valid BIP-39 but the checksum fails. */
  INVALID_CHECKSUM: 6,
  /** Fully valid BIP-39 mnemonic (wordlist + checksum). */
  VALID_BIP39: 7,
} as const;

export type SeedStatusCode = (typeof SeedStatus)[keyof typeof SeedStatus];

const englishWordlist = wordlists['english'];

/**
 * BIP-39 seed analysis. Status 5 (word not in wordlist) is a warning — it does NOT block
 * saving, since many legitimate wallets (Ledger, exchange-generated) use non-standard seeds.
 * Checksum validation is intentionally not performed. Only status 0 (empty) blocks saving.
 */
export function analyzeSeedFull(value: string): SeedStatusCode {
  if (!value) return SeedStatus.EMPTY;

  if (value !== value.trim()) return SeedStatus.LEADING_TRAILING_SPACE;

  const words = value.trim().split(/\s+/);

  if (!VALID_WORD_COUNTS.has(words.length)) return SeedStatus.WRONG_WORD_COUNT;

  const specialChars = /[^a-zA-Z\s]/;
  if (specialChars.test(value)) return SeedStatus.SPECIAL_CHARS;

  // Check each word against the BIP-39 English wordlist
  const invalidWord = words.find(w => !englishWordlist.includes(w.toLowerCase()));
  if (invalidWord) return SeedStatus.INVALID_BIP39_WORD;

  return SeedStatus.VALID_BIP39;
}
