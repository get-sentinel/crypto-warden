import AesCrypto from 'react-native-aes-crypto';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import { WalletData, ExportBundle } from '../types/wallet.types';

const KDF_ITERATIONS = 100_000;
const KDF_KEY_SIZE = 256;

export async function exportWallets(wallets: WalletData[], password: string): Promise<void> {
  if (!password) throw new Error('Password is required');

  const salt = await AesCrypto.randomKey(16);
  const iv = await AesCrypto.randomKey(16);
  const key = await AesCrypto.pbkdf2(password, salt, KDF_ITERATIONS, KDF_KEY_SIZE, 'sha256');

  const bundle: ExportBundle = {
    version: 1,
    exportedAt: new Date().toISOString(),
    wallets,
  };

  const plaintext = JSON.stringify(bundle);
  const ciphertext = await AesCrypto.encrypt(plaintext, key, iv, 'aes-256-cbc');
  const hmac = await AesCrypto.hmac256(salt + iv + ciphertext, key);

  const filePayload = JSON.stringify({ magic: 'CW1', kdf: 'pbkdf2', kdfIterations: KDF_ITERATIONS, kdfSalt: salt, iv, ciphertext, hmac });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = `CryptoWarden_Export_${timestamp}.warden`;
  const filePath = `${RNFS.TemporaryDirectoryPath}/${fileName}`;

  // Write the payload to a real file and share that file:// path. Sharing a
  // base64 `data:` URI leaves the Share promise unsettled on iPad/macOS (the
  // share sheet's completion handler never fires), which freezes the UI on the
  // export spinner. A real file path resolves reliably across platforms.
  await RNFS.writeFile(filePath, filePayload, 'utf8');

  try {
    await Share.open({
      url: `file://${filePath}`,
      filename: fileName,
      type: 'application/octet-stream',
      failOnCancel: false,
    });
  } catch (err: any) {
    // Some platforms reject with "User did not share" on dismissal even with
    // failOnCancel:false — treat that as a normal cancel, not a failure.
    if (err?.message !== 'User did not share') throw err;
  } finally {
    RNFS.unlink(filePath).catch(() => {});
  }
}
