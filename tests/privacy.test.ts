import assert from 'node:assert/strict';
import test from 'node:test';
import { getAddress, zeroAddress } from 'viem';
import { poseidon2 } from 'poseidon-lite/poseidon2';
import { createPrivacyNote, field, FIELD, merklePath, noteCommitment, noteNullifierHash, poolDomain, validateNote, withdrawalContext, withdrawalWitness } from '../lib/wallet/privacy/note';
import { decryptPrivacyNote, encryptPrivacyNote } from '../lib/wallet/privacy/backup';
import { preparePrivacyDeposit, preparePrivacyWithdrawal } from '../lib/wallet/privacy/transactions';
import { decodeFunctionData } from 'viem';
import { privacyPoolAbi } from '../lib/wallet/privacy/transactions';

const pool = getAddress('0x1111111111111111111111111111111111111111');
const other = getAddress('0x2222222222222222222222222222222222222222');
const context = { chainId: 46630, pool, denomination: '10000000000000000' };
const fixture = { protocol: 'qozmo-privacy-v1' as const, ...context, secret: '12345', nullifier: '67890' };
const password = 'public note test password';

test('offline transaction builders bind exact denomination and prover public signals', async () => {
  const deposit = preparePrivacyDeposit(fixture);
  assert.equal(deposit.chainId, fixture.chainId); assert.equal(deposit.to, pool);
  assert.equal(deposit.value, BigInt(context.denomination));
  assert.deepEqual(decodeFunctionData({ abi: privacyPoolAbi, data: deposit.data }).args, [noteCommitment(fixture)]);
  const leaves = [noteCommitment(fixture)];
  const mock = async (w: ReturnType<typeof withdrawalWitness>) => ({ a: [1n, 2n] as const, b: [[1n, 2n], [3n, 4n]] as const, c: [1n, 2n] as const, publicSignals: [w.root, w.nullifierHash, w.domain, w.contextHash].map(BigInt) });
  const tx = await preparePrivacyWithdrawal(fixture, leaves, other, zeroAddress, 0n, mock);
  assert.equal(tx.value, 0n); assert.equal(tx.to, pool);
  assert.equal(decodeFunctionData({ abi: privacyPoolAbi, data: tx.data }).functionName, 'withdraw');
  await assert.rejects(preparePrivacyWithdrawal(fixture, leaves, other, zeroAddress, 0n, async w => ({ ...await mock(w), publicSignals: [1n, 2n, 3n, 4n] })), /different withdrawal/);
  await assert.rejects(preparePrivacyWithdrawal(fixture, leaves, other, zeroAddress, 0n, async w => ({ ...await mock(w), a: [-1n, 1n] })), /coordinates/);
});

test('privacy notes isolate chain, pool and denomination and reject mainnet', () => {
  const base = noteCommitment(fixture), spent = noteNullifierHash(fixture);
  for (const change of [{ chainId: 11155111 }, { pool: other }, { denomination: '1' }]) {
    assert.notEqual(noteCommitment({ ...fixture, ...change }), base);
    assert.notEqual(noteNullifierHash({ ...fixture, ...change }), spent);
    assert.notEqual(poolDomain({ ...context, ...change }), poolDomain(context));
  }
  for (const chainId of [1, 4663, 0, NaN, '46630']) assert.throws(() => validateNote({ ...fixture, chainId }));
  for (const secret of ['0', '01', '-1', '1e4', (1n << 248n).toString(), FIELD.toString()]) assert.throws(() => validateNote({ ...fixture, secret }));
  assert.throws(() => validateNote({ ...fixture, extra: true }));
  assert.throws(() => createPrivacyNote({ ...context, pool: zeroAddress }));
  assert.throws(() => createPrivacyNote({ ...context, denomination: '0' }));
  assert.throws(() => field(FIELD.toString()));
  const a = createPrivacyNote(context), b = createPrivacyNote(context);
  assert.notEqual(a.secret, b.secret); assert.notEqual(a.nullifier, b.nullifier);
  assert.notEqual(a.secret, a.nullifier);
});

test('Merkle paths reconstruct roots across tree boundaries and exclude nonmembers', () => {
  for (const count of [1, 2, 3, 7, 8, 9, 255, 256]) {
    const leaves = Array.from({ length: count }, (_, i) => BigInt(i + 1));
    for (const index of new Set([0, count - 1, Math.floor(count / 2)])) {
      const path = merklePath(leaves, index);
      let node = leaves[index];
      for (let i = 0; i < path.siblings.length; i++) node = poseidon2(path.pathIndices[i] ? [BigInt(path.siblings[i]), node] : [node, BigInt(path.siblings[i])]);
      assert.equal(node.toString(), path.root);
      assert.equal(path.root, merklePath(leaves, 0).root);
    }
  }
  assert.throws(() => merklePath([1n, 1n], 0));
  assert.throws(() => merklePath([FIELD], 0));
  assert.throws(() => merklePath([1n], 1));
  assert.throws(() => merklePath(Array.from({ length: 257 }, (_, i) => BigInt(i + 1)), 0));
  assert.throws(() => withdrawalWitness(fixture, [1n], other, zeroAddress, 0n));
});

test('withdrawal context binds recipient, relayer and fee and rejects invalid payouts', () => {
  const base = withdrawalContext(context, other, zeroAddress, 0n);
  assert.notEqual(withdrawalContext(context, other, pool, 0n), base);
  assert.notEqual(withdrawalContext(context, other, pool, 1n), base);
  assert.throws(() => withdrawalContext(context, pool, zeroAddress, 0n));
  assert.throws(() => withdrawalContext(context, zeroAddress, zeroAddress, 0n));
  assert.throws(() => withdrawalContext(context, other, zeroAddress, 1n));
  assert.throws(() => withdrawalContext(context, other, pool, BigInt(context.denomination)));
});

test('encrypted privacy note backups round-trip, randomize and reject tampering and excessive KDF work', async () => {
  const a = await encryptPrivacyNote(fixture, password), b = await encryptPrivacyNote(fixture, password);
  const serialized = JSON.stringify(a);
  assert.deepEqual(await decryptPrivacyNote(serialized, password), fixture);
  assert.notEqual(a.salt, b.salt); assert.notEqual(a.iv, b.iv); assert.notEqual(a.ciphertext, b.ciphertext);
  assert.ok(!serialized.includes('"secret"')); assert.ok(!serialized.includes('"nullifier"'));
  await assert.rejects(decryptPrivacyNote(serialized, 'wrong password here'), /Unable to unlock/);
  for (const name of ['salt', 'iv', 'ciphertext'] as const) {
    const changed = { ...a, [name]: (a[name].startsWith('00') ? '01' : '00') + a[name].slice(2) };
    await assert.rejects(decryptPrivacyNote(JSON.stringify(changed), password));
  }
  await assert.rejects(decryptPrivacyNote(JSON.stringify({ ...a, iterations: 999999999 }), password), /Invalid encrypted/);
  await assert.rejects(decryptPrivacyNote(JSON.stringify({ ...a, extra: 1 }), password), /Invalid encrypted/);
  await assert.rejects(encryptPrivacyNote(fixture, 'short'), /12/);
  await assert.rejects(decryptPrivacyNote('x'.repeat(8193), password), /Invalid encrypted/);
});
