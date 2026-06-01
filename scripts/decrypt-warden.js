#!/usr/bin/env node
/**
 * Decrypt a CryptoWarden `.warden` export file.
 *
 * Usage:
 *   node scripts/decrypt-warden.js <file.warden> [-o out.json]
 *   node scripts/decrypt-warden.js <file.warden> --password "my password"
 *
 * If --password is omitted you'll be prompted for it (input hidden).
 *
 * No npm dependencies — uses only Node's built-in `crypto`/`readline`.
 *
 * File format (see src/utils/exportManager.ts):
 *   The file is JSON (older builds wrapped that JSON in base64). Fields:
 *     { magic:'CW1', kdf:'pbkdf2', kdfIterations, kdfSalt, iv, ciphertext, hmac }
 *
 * Crypto, matching react-native-aes-crypto exactly:
 *   - kdfSalt / iv are HEX strings of 16 random bytes.
 *   - key = PBKDF2-HMAC-SHA256(password, salt, iterations, 32 bytes)
 *           IMPORTANT: the salt fed to PBKDF2 is the UTF-8 bytes of the hex
 *           STRING (not the decoded bytes) — that's how the native lib does it.
 *   - ciphertext = base64( AES-256-CBC(plaintext, key, iv) ), PKCS7 padding.
 *   - hmac = HMAC-SHA256(key=raw 32 key bytes, msg = (saltHex + ivHex + ciphertextB64) as UTF-8)
 */

const fs = require('fs');
const crypto = require('crypto');
const readline = require('readline');

function fail(msg) {
  console.error('Error: ' + msg);
  process.exit(1);
}

function parseArgs(argv) {
  const args = { file: null, password: null, out: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--password' || a === '-p') args.password = argv[++i];
    else if (a === '-o' || a === '--out') args.out = argv[++i];
    else if (a === '-h' || a === '--help') args.help = true;
    else if (!args.file) args.file = a;
  }
  return args;
}

function promptHidden(question) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const stdin = process.stdin;
    const onData = char => {
      char = char + '';
      if (char === '\n' || char === '\r' || char === '') {
        stdin.removeListener('data', onData);
      } else {
        // re-print the prompt with no echoed characters
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(question);
      }
    };
    stdin.on('data', onData);
    rl.question(question, value => {
      rl.close();
      process.stdout.write('\n');
      resolve(value);
    });
  });
}

function readPayload(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  // Newer exports write JSON directly; older ones wrapped it in base64.
  try {
    return JSON.parse(raw);
  } catch (_) {
    try {
      return JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    } catch (_2) {
      fail('Could not parse the file as JSON or base64-wrapped JSON. Is this a .warden export?');
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.file) {
    console.log('Usage: node scripts/decrypt-warden.js <file.warden> [--password "..."] [-o out.json]');
    process.exit(args.help ? 0 : 1);
  }
  if (!fs.existsSync(args.file)) fail(`File not found: ${args.file}`);

  const payload = readPayload(args.file);
  if (payload.magic !== 'CW1') {
    console.warn(`Warning: unexpected magic "${payload.magic}" (expected "CW1"). Trying anyway.`);
  }

  const { kdfIterations, kdfSalt, iv, ciphertext, hmac } = payload;
  if (!kdfSalt || !iv || !ciphertext) fail('File is missing required fields (kdfSalt/iv/ciphertext).');

  const password = args.password || (await promptHidden('Decryption password: '));
  if (!password) fail('No password provided.');

  // Derive the AES key. NOTE: salt is the UTF-8 bytes of the hex string.
  const iterations = kdfIterations || 100000;
  const key = crypto.pbkdf2Sync(
    Buffer.from(password, 'utf8'),
    Buffer.from(kdfSalt, 'utf8'),
    iterations,
    32,
    'sha256',
  );

  // Verify HMAC (authenticity / wrong-password / corruption check) when present.
  if (hmac) {
    const expected = crypto
      .createHmac('sha256', key)
      .update(kdfSalt + iv + ciphertext, 'utf8')
      .digest('hex');
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(hmac, 'hex');
    const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
    if (!ok) {
      fail('HMAC check failed — wrong password or the file has been tampered with/corrupted.');
    }
  }

  // Decrypt AES-256-CBC.
  let plaintext;
  try {
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'));
    plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertext, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  } catch (e) {
    fail('Decryption failed — wrong password or corrupted file. (' + e.message + ')');
  }

  const bundle = JSON.parse(plaintext);
  const output = JSON.stringify(bundle, null, 2);

  if (args.out) {
    fs.writeFileSync(args.out, output);
    console.error(`Decrypted ${bundle.wallets ? bundle.wallets.length : '?'} wallet(s) -> ${args.out}`);
  } else {
    process.stdout.write(output + '\n');
  }
}

main().catch(e => fail(e.message));
