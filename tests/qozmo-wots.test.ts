import assert from "node:assert/strict";
import { test } from "node:test";
import { bytesToHex, hexToBytes, keccak256, toHex, type Hex } from "viem";

import {
  L,
  SIGNATURE_BYTES,
  chain,
  digits,
  publicKeyHash,
  recoverPublicKeyHash,
  sign,
  verify,
} from "../lib/wallet/quantum-sdk/wots.ts";

// Also asserted by contracts/test/WOTS.t.sol against the Solidity reference implementation.
const KNOWN_PKH = "0x01cdfcb80168ccad2bf774f5c321b44717793f09ac3b1753b35972f703429edb";

const seed = keccak256(toHex("winternitz test seed"));
const digest = keccak256(toHex("hello quantum world"));

test("digits: 64 message digits + 3 checksum digits, all in 0..15", () => {
  const d = digits(hexToBytes(digest));
  assert.equal(d.length, L);
  assert.ok(d.every((x) => x >= 0 && x <= 15));
  const checksum = d.slice(0, 64).reduce((s, x) => s + (15 - x), 0);
  assert.equal((d[64] << 8) | (d[65] << 4) | d[66], checksum);
});

test("digits: all-zero digest has maximal checksum 960", () => {
  const d = digits(new Uint8Array(32));
  assert.deepEqual(d.slice(64), [0x3, 0xc, 0x0]); // 960 = 0x3c0
});

test("digits: all-0xff digest has zero checksum", () => {
  const d = digits(new Uint8Array(32).fill(0xff));
  assert.deepEqual(d.slice(64), [0, 0, 0]);
});

test("chain composes: F^a then F^b equals F^(a+b)", () => {
  const x = hexToBytes(keccak256("0x01"));
  assert.deepEqual(chain(chain(x, 5, 0, 4), 5, 4, 7), chain(x, 5, 0, 11));
});

test("chain is domain separated by chain index and position", () => {
  const x = hexToBytes(keccak256("0x02"));
  assert.notDeepEqual(chain(x, 0, 0, 1), chain(x, 1, 0, 1));
  assert.notDeepEqual(chain(x, 0, 0, 1), chain(x, 0, 1, 1));
});

test("chain refuses to walk past the end", () => {
  assert.throws(() => chain(new Uint8Array(32), 0, 10, 6));
});

test("sign/verify round trip", () => {
  const pkh = publicKeyHash(seed, 0);
  const sig = sign(seed, 0, digest);
  assert.equal((sig.length - 2) / 2, SIGNATURE_BYTES);
  assert.equal(recoverPublicKeyHash(digest, sig), pkh);
  assert.ok(verify(pkh, digest, sig));
});

test("different key indices give different keys", () => {
  assert.notEqual(publicKeyHash(seed, 0), publicKeyHash(seed, 1));
  assert.ok(!verify(publicKeyHash(seed, 1), digest, sign(seed, 0, digest)));
});

test("signature does not verify for another digest", () => {
  const pkh = publicKeyHash(seed, 3);
  const sig = sign(seed, 3, digest);
  assert.ok(!verify(pkh, keccak256(toHex("other")), sig));
});

test("flipping any single bit of the signature breaks verification", () => {
  const pkh = publicKeyHash(seed, 7);
  const sig = hexToBytes(sign(seed, 7, digest));
  // Every chain, a few bit positions each: 67 × 4 = 268 mutations.
  for (let i = 0; i < L; i++) {
    for (const bit of [0, 77, 150, 255]) {
      const bad = sig.slice();
      bad[i * 32 + (bit >> 3)] ^= 1 << (bit & 7);
      assert.ok(!verify(pkh, digest, bytesToHex(bad)), `chain ${i} bit ${bit}`);
    }
  }
});

test("flipping any single bit of the digest breaks verification", () => {
  const pkh = publicKeyHash(seed, 2);
  const sig = sign(seed, 2, digest);
  const d = hexToBytes(digest);
  for (let bit = 0; bit < 256; bit++) {
    const bad = d.slice();
    bad[bit >> 3] ^= 1 << (bit & 7);
    assert.ok(!verify(pkh, bytesToHex(bad), sig), `digest bit ${bit}`);
  }
});

test("rejects malformed lengths", () => {
  const pkh = publicKeyHash(seed, 0);
  const sig = sign(seed, 0, digest);
  assert.ok(!verify(pkh, digest, sig.slice(0, -2) as Hex));
  assert.throws(() => sign(seed, 0, "0x1234"));
  assert.throws(() => publicKeyHash("0x1234", 0));
  assert.throws(() => publicKeyHash(seed, -1));
});

test("known answer: stable across releases", () => {
  // Pinned so any change to the scheme (and therefore to on-chain compatibility) is caught.
  assert.equal(
    publicKeyHash("0x0000000000000000000000000000000000000000000000000000000000000001", 0),
    KNOWN_PKH,
  );
});
