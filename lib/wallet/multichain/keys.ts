import { mnemonicToSeedSync } from '@scure/bip39';
import { HDKey } from '@scure/bip32';
import { base58, hex } from '@scure/base';
import { hmac } from '@noble/hashes/hmac.js';
import { sha512 } from '@noble/hashes/sha2.js';
import { ed25519 } from '@noble/curves/ed25519.js';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { p2wpkh, TEST_NETWORK } from '@scure/btc-signer';
import { normalizeMnemonic, validateRecoveryPhrase, type VaultSecret } from '../vault';

export const SOLANA_PATH = "m/44'/501'/0'/0'";
export const BITCOIN_PATH = "m/84'/1'/0'/0/0";
export type NativeAddresses = Readonly<{ solana: string; bitcoin: string; bitcoinPublicKey: string }>;
function seed(secret: VaultSecret) {
  if (!validateRecoveryPhrase(secret.mnemonic)) throw new Error('Invalid standard wallet recovery phrase.');
  return mnemonicToSeedSync(normalizeMnemonic(secret.mnemonic));
}
/** SLIP-0010 hardened Ed25519 derivation; never use the Quantum recovery seed here. */
export function solanaPrivateSeed(secret: VaultSecret): Uint8Array {
  const bip39 = seed(secret);
  let material = hmac(sha512, new TextEncoder().encode('ed25519 seed'), bip39);
  bip39.fill(0);
  try {
    for (const index of [44, 501, 0, 0]) {
      const data = new Uint8Array(37);
      data.set(material.subarray(0,32), 1);
      new DataView(data.buffer).setUint32(33, index + 0x80000000, false);
      const next = hmac(sha512, material.subarray(32), data);
      data.fill(0); material.fill(0); material = next;
    }
    return material.slice(0,32);
  } finally { material.fill(0); }
}
export function bitcoinPrivateKey(secret: VaultSecret): Uint8Array {
  const bip39 = seed(secret);
  const root = HDKey.fromMasterSeed(bip39);
  bip39.fill(0);
  let child: HDKey | undefined;
  try {
    child = root.derive(BITCOIN_PATH);
    if (!child.privateKey) throw new Error('Bitcoin derivation failed.');
    return child.privateKey.slice();
  } finally { root.wipePrivateData(); child?.wipePrivateData(); }
}
export function deriveNativeAddresses(secret: VaultSecret): NativeAddresses {
  const sol = solanaPrivateSeed(secret);
  const btc = bitcoinPrivateKey(secret);
  try {
    const pub = secp256k1.getPublicKey(btc, true);
    return Object.freeze({ solana: base58.encode(ed25519.getPublicKey(sol)), bitcoin: p2wpkh(pub, TEST_NETWORK).address!, bitcoinPublicKey: hex.encode(pub) });
  } finally { sol.fill(0); btc.fill(0); }
}
