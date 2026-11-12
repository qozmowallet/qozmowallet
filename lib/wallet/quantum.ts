/**
 * Qozmo Quantum Lab: local SLH-DSA key-possession proofs only.
 *
 * Uses the maintained @noble/post-quantum implementation of SLH-DSA-SHA2-256f.
 * This is NOT Winternitz's WOTS smart-account protocol, network transaction
 * signing, audited wallet protection, or proof of ownership of the EVM address
 * named in a message. The EVM address and chain are signed context only.
 * No seed, secret key, or mnemonic is persisted, sent to a server, or logged.
 * Mutable secret buffers are cleared on a best-effort basis; JavaScript cannot
 * guarantee erasure of immutable strings or every internal runtime copy.
 */

import { slh_dsa_sha2_256f } from '@noble/post-quantum/slh-dsa.js';
import { mnemonicToSeedSync, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { bytesToHex, getAddress, hexToBytes, isAddress, type Hex } from 'viem';

export const QUANTUM_ALGORITHM = 'SLH-DSA-SHA2-256f' as const;
export const MAX_QUANTUM_PROOF_JSON_BYTES = 120_000;

const KEYGEN_SEED_BYTES = 96;
const PUBLIC_KEY_BYTES = 64;
const SIGNATURE_BYTES = 49_856;
const MAX_MESSAGE_LENGTH = 1_024;
const DOMAIN = 'qozmo/quantum-proof/slh-dsa-sha2-256f/v1';
const TITLE = 'Qozmo Quantum Lab';
const PURPOSE = 'Purpose: Local key proof only; not a transaction or account protection.';
const encoder = new TextEncoder();
const context = encoder.encode(DOMAIN);
const PROOF_FIELDS = [
  'version', 'algorithm', 'publicKey', 'fingerprint', 'message', 'signature', 'createdAt',
] as const;

export type QuantumIdentity = {
  algorithm: typeof QUANTUM_ALGORITHM;
  /** Canonical 0x-prefixed, lowercase hex; 64 bytes. */
  publicKey: string;
  /** SHA-256 of the entire public key; canonical 0x-prefixed lowercase hex. */
  fingerprint: string;
};

export type QuantumProof = QuantumIdentity & {
  version: 1;
  message: string;
  /** Canonical 0x-prefixed, lowercase hex; 49,856 bytes. */
  signature: string;
  createdAt: string;
};

type ProofContext = { address: string; chainId: number };
type KeyPair = { publicKey: Uint8Array; secretKey: Uint8Array };

function webCrypto(): Crypto {
  if (!globalThis.crypto?.subtle || !globalThis.crypto.getRandomValues) {
    throw new Error('Quantum proofs require WebCrypto in a secure browser context.');
  }
  return globalThis.crypto;
}

function normalizeMnemonic(mnemonic: string): string {
  if (typeof mnemonic !== 'string' || mnemonic.length > 512) {
    throw new Error('Enter a valid English recovery phrase.');
  }
  const normalized = mnemonic.normalize('NFKD').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!validateMnemonic(normalized, wordlist)) {
    throw new Error('Enter a valid English recovery phrase.');
  }
  return normalized;
}

async function deriveKeyPair(mnemonic: string): Promise<KeyPair> {
  const provider = webCrypto();
  const bip39Seed = mnemonicToSeedSync(normalizeMnemonic(mnemonic));
  // Use all 64 BIP39 seed bytes. HKDF provides a separate application key domain;
  // expanding to 96 bytes does not increase the recovery phrase's entropy.
  const input = new Uint8Array(bip39Seed);
  bip39Seed.fill(0);
  let keygenSeed: Uint8Array | undefined;
  try {
    const sourceKey = await provider.subtle.importKey('raw', input.buffer, 'HKDF', false, ['deriveBits']);
    keygenSeed = new Uint8Array(await provider.subtle.deriveBits({
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(32),
      info: context,
    }, sourceKey, KEYGEN_SEED_BYTES * 8));
    const generated = slh_dsa_sha2_256f.keygen(keygenSeed);
    try {
      // Own the returned buffers before clearing any derivation material.
      return {
        publicKey: new Uint8Array(generated.publicKey),
        secretKey: new Uint8Array(generated.secretKey),
      };
    } finally {
      generated.secretKey.fill(0);
    }
  } finally {
    input.fill(0);
    keygenSeed?.fill(0);
  }
}

async function identityFromKey(publicKey: Uint8Array): Promise<QuantumIdentity> {
  const hash = await webCrypto().subtle.digest('SHA-256', new Uint8Array(publicKey).buffer);
  return {
    algorithm: QUANTUM_ALGORITHM,
    publicKey: bytesToHex(publicKey),
    fingerprint: bytesToHex(new Uint8Array(hash)),
  };
}

function canonicalContext({ address, chainId }: ProofContext): ProofContext {
  if (typeof address !== 'string' || !isAddress(address)) {
    throw new Error('The local proof needs a valid EVM address.');
  }
  if (!Number.isSafeInteger(chainId) || chainId <= 0) {
    throw new Error('The local proof needs a valid chain ID.');
  }
  return { address: getAddress(address), chainId };
}

function proofMessage(account: ProofContext, createdAt: string, nonce: string): string {
  return [
    TITLE,
    `Domain: ${DOMAIN}`,
    PURPOSE,
    `Algorithm: ${QUANTUM_ALGORITHM}`,
    `Address context: ${account.address}`,
    `Chain ID: ${account.chainId}`,
    `Created at: ${createdAt}`,
    `Nonce: ${nonce}`,
  ].join('\n');
}

function isCanonicalHex(value: unknown, byteLength: number): value is Hex {
  return typeof value === 'string'
    && value.length === byteLength * 2 + 2
    && /^0x[0-9a-f]+$/.test(value);
}

function checkedProof(value: unknown): QuantumProof {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid quantum proof: expected an object.');
  }
  const prototype = Object.getPrototypeOf(value);
  const names = Object.getOwnPropertyNames(value);
  if ((prototype !== Object.prototype && prototype !== null)
    || Object.getOwnPropertySymbols(value).length !== 0
    || names.length !== PROOF_FIELDS.length
    || names.some(name => !(PROOF_FIELDS as readonly string[]).includes(name))) {
    throw new Error('Invalid quantum proof: unexpected fields.');
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (PROOF_FIELDS.some(field => !descriptors[field] || !('value' in descriptors[field]))) {
    throw new Error('Invalid quantum proof: unsupported property format.');
  }
  const proof = value as Record<string, unknown>;
  if (proof.version !== 1 || proof.algorithm !== QUANTUM_ALGORITHM) {
    throw new Error('Unsupported quantum proof version or algorithm.');
  }
  if (!isCanonicalHex(proof.publicKey, PUBLIC_KEY_BYTES)
    || !isCanonicalHex(proof.signature, SIGNATURE_BYTES)
    || !isCanonicalHex(proof.fingerprint, 32)) {
    throw new Error('Invalid quantum proof: incorrect key, signature, or fingerprint length.');
  }
  if (typeof proof.message !== 'string' || proof.message.length > MAX_MESSAGE_LENGTH
    || typeof proof.createdAt !== 'string'
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(proof.createdAt)
    || !Number.isFinite(Date.parse(proof.createdAt))
    || new Date(proof.createdAt).toISOString() !== proof.createdAt) {
    throw new Error('Invalid quantum proof: invalid message or UTC creation time.');
  }
  const lines = proof.message.split('\n');
  if (lines.length !== 8
    || lines[0] !== TITLE
    || lines[1] !== `Domain: ${DOMAIN}`
    || lines[2] !== PURPOSE
    || lines[3] !== `Algorithm: ${QUANTUM_ALGORITHM}`
    || !lines[4].startsWith('Address context: ')
    || !/^Chain ID: [1-9][0-9]{0,15}$/.test(lines[5])
    || lines[6] !== `Created at: ${proof.createdAt}`
    || !/^Nonce: 0x[0-9a-f]{64}$/.test(lines[7])) {
    throw new Error('Invalid quantum proof: message domain or metadata does not match.');
  }
  const account = canonicalContext({
    address: lines[4].slice('Address context: '.length),
    chainId: Number(lines[5].slice('Chain ID: '.length)),
  });
  if (proof.message !== proofMessage(account, proof.createdAt, lines[7].slice('Nonce: '.length))) {
    throw new Error('Invalid quantum proof: non-canonical message.');
  }
  // Return an explicit snapshot. Imported input objects are not retained.
  return {
    version: 1,
    algorithm: QUANTUM_ALGORITHM,
    publicKey: proof.publicKey,
    fingerprint: proof.fingerprint,
    message: proof.message,
    signature: proof.signature,
    createdAt: proof.createdAt,
  };
}

/** Derive a repeatable, application-separated identity without persisting keys. */
export async function deriveQuantumIdentity(mnemonic: string): Promise<QuantumIdentity> {
  const keys = await deriveKeyPair(mnemonic);
  try {
    return await identityFromKey(keys.publicKey);
  } finally {
    keys.secretKey.fill(0);
  }
}

/** Create a fresh local proof. The address is signed context, not an EOA ownership claim. */
export async function createQuantumProof(mnemonic: string, account: ProofContext): Promise<QuantumProof> {
  const canonical = canonicalContext(account);
  const createdAt = new Date().toISOString();
  const nonce = bytesToHex(webCrypto().getRandomValues(new Uint8Array(32)));
  const message = proofMessage(canonical, createdAt, nonce);
  const keys = await deriveKeyPair(mnemonic);
  try {
    const identity = await identityFromKey(keys.publicKey);
    const signature = slh_dsa_sha2_256f.sign(encoder.encode(message), keys.secretKey, { context });
    return { version: 1, ...identity, message, signature: bytesToHex(signature), createdAt };
  } finally {
    keys.secretKey.fill(0);
  }
}

/** Validate structure, metadata, public-key fingerprint and the actual SLH-DSA signature. */
export async function verifyQuantumProof(value: unknown): Promise<boolean> {
  try {
    const proof = checkedProof(value);
    const publicKey = hexToBytes(proof.publicKey as Hex);
    const identity = await identityFromKey(publicKey);
    if (identity.fingerprint !== proof.fingerprint) return false;
    return slh_dsa_sha2_256f.verify(
      hexToBytes(proof.signature as Hex), encoder.encode(proof.message), publicKey, { context },
    );
  } catch {
    return false;
  }
}

/**
 * Bounded JSON parsing and schema/domain validation; does not verify a signature.
 * Always follow it with verifyQuantumProof before displaying a verified result.
 */
export function parseQuantumProofJSON(text: string): QuantumProof {
  if (typeof text !== 'string' || text.length > MAX_QUANTUM_PROOF_JSON_BYTES
    || encoder.encode(text).byteLength > MAX_QUANTUM_PROOF_JSON_BYTES) {
    throw new Error('Quantum proof file is too large (maximum 120 KB).');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Quantum proof file is not valid JSON.');
  }
  return checkedProof(parsed);
}
