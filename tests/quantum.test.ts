import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import {
  createQuantumProof,
  deriveQuantumIdentity,
  MAX_QUANTUM_PROOF_JSON_BYTES,
  parseQuantumProofJSON,
  QUANTUM_ALGORITHM,
  verifyQuantumProof,
  type QuantumProof,
} from '../lib/wallet/quantum';

// Public BIP39 test vector, never a user wallet or a funded account.
const PHRASE = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const ACCOUNT = { address: '0x1111111111111111111111111111111111111111', chainId: 46630 };
let proof: QuantumProof;

before(async () => {
  proof = await createQuantumProof(PHRASE, ACCOUNT);
});

test('the same recovery phrase derives the same application identity', async () => {
  const first = await deriveQuantumIdentity(PHRASE);
  const second = await deriveQuantumIdentity(PHRASE);
  assert.deepEqual(first, second);
  assert.equal(first.algorithm, QUANTUM_ALGORITHM);
  assert.equal(first.publicKey.length, 2 + 64 * 2);
  assert.equal(first.fingerprint.length, 66);
  assert.equal(first.publicKey, proof.publicKey);
});

test('a real SLH-DSA proof verifies after JSON export and import', async () => {
  const restored = parseQuantumProofJSON(JSON.stringify(proof, null, 2));
  assert.equal(restored.signature.length, 2 + 49_856 * 2);
  assert.match(restored.message, /Address context: 0x1111111111111111111111111111111111111111/);
  assert.match(restored.message, /Chain ID: 46630/);
  assert.ok(restored.message.includes(`Created at: ${restored.createdAt}`));
  assert.equal(await verifyQuantumProof(restored), true);
});

test('each proof gets an independent cryptographic nonce', async () => {
  const next = await createQuantumProof(PHRASE, ACCOUNT);
  assert.equal(next.publicKey, proof.publicKey);
  assert.notEqual(next.message.split('\n').at(-1), proof.message.split('\n').at(-1));
  assert.equal(await verifyQuantumProof(next), true);
});

test('tampering with a well-formed chain context fails signature verification', async () => {
  const tampered = { ...proof, message: proof.message.replace('Chain ID: 46630', 'Chain ID: 1') };
  assert.doesNotThrow(() => parseQuantumProofJSON(JSON.stringify(tampered)));
  assert.equal(await verifyQuantumProof(tampered), false);
});

test('tampering with signature bytes fails verification', async () => {
  const changedByte = proof.signature.slice(2, 4) === '00' ? '01' : '00';
  const tampered = { ...proof, signature: `0x${changedByte}${proof.signature.slice(4)}` };
  assert.equal(await verifyQuantumProof(tampered), false);
});

test('a mismatched public-key fingerprint fails verification', async () => {
  assert.equal(await verifyQuantumProof({ ...proof, fingerprint: `0x${'00'.repeat(32)}` }), false);
});

test('domain and timestamp mismatches are rejected before cryptographic verification', async () => {
  const wrongDomain = { ...proof, message: proof.message.replace('qozmo/quantum-proof/', 'other/quantum-proof/') };
  const wrongTime = { ...proof, createdAt: '2020-01-01T00:00:00.000Z' };
  for (const invalid of [wrongDomain, wrongTime]) {
    assert.throws(() => parseQuantumProofJSON(JSON.stringify(invalid)));
    assert.equal(await verifyQuantumProof(invalid), false);
  }
});

test('strict parsing rejects unsupported formats, lengths and extra fields', async () => {
  const invalids: unknown[] = [
    null,
    [],
    { ...proof, version: 2 },
    { ...proof, algorithm: 'WOTS' },
    { ...proof, publicKey: '0x00' },
    { ...proof, signature: `${proof.signature}00` },
    { ...proof, message: 'x'.repeat(1_025) },
    { ...proof, createdAt: '2026-02-30T00:00:00.000Z' },
    { ...proof, unrelated: 'not part of this format' },
  ];
  for (const invalid of invalids) {
    assert.throws(() => parseQuantumProofJSON(JSON.stringify(invalid)));
    assert.equal(await verifyQuantumProof(invalid), false);
  }
  assert.throws(() => parseQuantumProofJSON('{not JSON}'));
  assert.throws(() => parseQuantumProofJSON(' '.repeat(MAX_QUANTUM_PROOF_JSON_BYTES + 1)));
});

test('invalid recovery phrases and account context are rejected', async () => {
  await assert.rejects(deriveQuantumIdentity('not a valid recovery phrase'));
  await assert.rejects(createQuantumProof(PHRASE, { ...ACCOUNT, address: 'not-an-address' }));
  await assert.rejects(createQuantumProof(PHRASE, { ...ACCOUNT, chainId: -1 }));
  await assert.rejects(createQuantumProof(PHRASE, { ...ACCOUNT, chainId: Number.MAX_SAFE_INTEGER + 1 }));
});
