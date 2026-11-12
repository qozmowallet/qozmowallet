/**
 * Winternitz one-time signatures (w = 16, keccak256), byte-for-byte compatible with
 * contracts/src/WOTS.sol. See docs/design.md for the specification.
 *
 *   F(x, i, j)   = keccak256(x ‖ uint16(i) ‖ uint8(j))        chain step from position j
 *   sk_{k,i}     = keccak256(seed ‖ uint32(k) ‖ uint16(i))     secret element i of key k
 *   pk_i         = F^15(sk_i)
 *   pkh          = keccak256(pk_0 ‖ … ‖ pk_66)
 *   sig_i        = F^{d_i}(sk_i)
 *
 * A key must never sign two different digests. Callers are responsible for tracking which key
 * indices have been used; see wallet.ts for the guard rails.
 */
import { keccak_256 } from "@noble/hashes/sha3.js";
import { bytesToHex, hexToBytes, type Hex } from "viem";

export const W = 16;
export const L1 = 64;
export const L2 = 3;
export const L = L1 + L2;
export const N = 32;
export const SIGNATURE_BYTES = L * N; // 2144

/** Base-16 digits of the digest followed by the 3-digit checksum. */
export function digits(digest: Uint8Array): number[] {
  if (digest.length !== N) throw new Error(`digest must be ${N} bytes`);
  const d: number[] = [];
  for (const b of digest) d.push(b >> 4, b & 0x0f);
  let checksum = 0;
  for (const x of d) checksum += W - 1 - x;
  d.push((checksum >> 8) & 0x0f, (checksum >> 4) & 0x0f, checksum & 0x0f);
  return d;
}

const stepInput = new Uint8Array(N + 3);

/** Applies F `steps` times to `x` on chain `i`, starting at position `from`. */
export function chain(x: Uint8Array, i: number, from: number, steps: number): Uint8Array {
  if (from + steps > W - 1) throw new Error("chain overflow");
  let out = x;
  for (let j = from; j < from + steps; j++) {
    stepInput.set(out, 0);
    stepInput[N] = i >> 8;
    stepInput[N + 1] = i & 0xff;
    stepInput[N + 2] = j;
    out = keccak_256(stepInput);
  }
  return out;
}

function checkSeed(seed: Uint8Array) {
  if (seed.length !== N) throw new Error(`seed must be ${N} bytes`);
}

function checkIndex(keyIndex: number) {
  if (!Number.isInteger(keyIndex) || keyIndex < 0 || keyIndex > 0xffffffff) {
    throw new Error("key index must be a uint32");
  }
}

export function secretKey(seed: Uint8Array, keyIndex: number): Uint8Array[] {
  checkSeed(seed);
  checkIndex(keyIndex);
  const input = new Uint8Array(N + 6);
  input.set(seed, 0);
  new DataView(input.buffer).setUint32(N, keyIndex);
  const sk: Uint8Array[] = [];
  for (let i = 0; i < L; i++) {
    input[N + 4] = i >> 8;
    input[N + 5] = i & 0xff;
    sk.push(keccak_256(input));
  }
  return sk;
}

export function publicKey(seed: Uint8Array, keyIndex: number): Uint8Array[] {
  return secretKey(seed, keyIndex).map((sk, i) => chain(sk, i, 0, W - 1));
}

export function hashPublicKey(pk: Uint8Array[]): Uint8Array {
  const buf = new Uint8Array(SIGNATURE_BYTES);
  pk.forEach((p, i) => buf.set(p, i * N));
  return keccak_256(buf);
}

export function publicKeyHashBytes(seed: Uint8Array, keyIndex: number): Uint8Array {
  return hashPublicKey(publicKey(seed, keyIndex));
}

export function signBytes(seed: Uint8Array, keyIndex: number, digest: Uint8Array): Uint8Array {
  const d = digits(digest);
  const sig = new Uint8Array(SIGNATURE_BYTES);
  secretKey(seed, keyIndex).forEach((sk, i) => sig.set(chain(sk, i, 0, d[i]), i * N));
  return sig;
}

/** Walks each chain to its end; returns the pkh the signature commits to. */
export function recoverPublicKeyHashBytes(digest: Uint8Array, sig: Uint8Array): Uint8Array {
  if (sig.length !== SIGNATURE_BYTES) throw new Error(`signature must be ${SIGNATURE_BYTES} bytes`);
  const d = digits(digest);
  const pk: Uint8Array[] = [];
  for (let i = 0; i < L; i++) {
    pk.push(chain(sig.subarray(i * N, (i + 1) * N), i, d[i], W - 1 - d[i]));
  }
  return hashPublicKey(pk);
}

/**
 * Recovery keys come from the same seed, in the upper half of the uint32 key-index space, so
 * they need no separate backup. Main keys use indices below this offset.
 */
export const RECOVERY_KEY_OFFSET = 0x80000000;

// ---- Hex convenience API ----

export function publicKeyHash(seed: Hex, keyIndex: number): Hex {
  return bytesToHex(publicKeyHashBytes(hexToBytes(seed), keyIndex));
}

export function sign(seed: Hex, keyIndex: number, digest: Hex): Hex {
  return bytesToHex(signBytes(hexToBytes(seed), keyIndex, hexToBytes(digest)));
}

export function recoverPublicKeyHash(digest: Hex, sig: Hex): Hex {
  return bytesToHex(recoverPublicKeyHashBytes(hexToBytes(digest), hexToBytes(sig)));
}

export function verify(pkh: Hex, digest: Hex, sig: Hex): boolean {
  const s = hexToBytes(sig);
  if (s.length !== SIGNATURE_BYTES) return false;
  return recoverPublicKeyHash(digest, sig).toLowerCase() === pkh.toLowerCase();
}

export function recoveryKeyHash(seed: Hex, recoveryIndex: number): Hex {
  if (!Number.isInteger(recoveryIndex) || recoveryIndex < 0 || recoveryIndex >= RECOVERY_KEY_OFFSET) {
    throw new Error("recovery index out of range");
  }
  return publicKeyHash(seed, RECOVERY_KEY_OFFSET + recoveryIndex);
}
