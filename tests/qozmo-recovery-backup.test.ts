import assert from "node:assert/strict";
import { test } from "node:test";
import type { Hex, PublicClient } from "viem";
import { getUserOperationHash, type UserOperation } from "viem/account-abstraction";
import {
  DETERMINISTIC, QuantumSafeWallet, MemoryJournal, serializeUserOperation, encryptRecoveryBackup,
  decryptRecoveryBackup, parseRecoveryPayload, parseEncryptedRecoveryBackup, MAX_RECOVERY_BACKUP_BYTES,
  wots, recoveryDigest, encodeRecoverySignature, type RecoveryPayload,
} from "../lib/wallet/quantum-sdk/index.ts";

// Disposable public test vectors only. All clients are local mocks; no RPC or broadcasts.
const seed: Hex = `0x${"42".repeat(32)}`;
export async function recoveryFixture(chainId = 31337, callData: Hex = "0x01") {
  const publicClient = { chain: {id: chainId}, getChainId: async () => chainId, getCode: async () => undefined } as unknown as PublicClient;
  const wallet = await QuantumSafeWallet.load({seed, ...DETERMINISTIC, salt: 7n, journal: new MemoryJournal(), publicClient});
  const op: UserOperation<"0.7"> = { sender: wallet.address, nonce: 0n, callData, callGasLimit: 100000n,
    verificationGasLimit: 400000n, preVerificationGas: 60000n, maxFeePerGas: 2n, maxPriorityFeePerGas: 1n, signature: "0x" };
  await wallet.sign(op);
  const payload: RecoveryPayload = {version: 1, derivation: "wots-keccak256-v1", signingPolicy: "read-only", historyScope: "this-storage-only",
    seed, initialPublicKeyHash: wallet.initialPublicKeyHash, initialRecoveryKeyHash: wallet.initialRecoveryKeyHash,
    account: {chainId, address: wallet.address, salt: "7", factory: wallet.factory, entryPoint: wallet.entryPoint,
      accountImplementation: DETERMINISTIC.accountImplementation}, walletCreatedAt: "2026-10-01T00:00:00.000Z", exportedAt: "2026-10-18T00:00:00.000Z",
    journals: [{chainId, entryPoint: wallet.entryPoint, entries: await wallet.journal.list()}]};
  return {payload, wallet, op};
}

test("recovery file round-trips seed, custom salt, identity and signed history without exposing metadata", async () => {
  const {payload} = await recoveryFixture();
  const envelope = await encryptRecoveryBackup(payload, "separate-backup-password");
  const raw = JSON.stringify(envelope);
  for (const secret of [seed.slice(2), payload.account.address.slice(2), payload.journals[0].entries[0].userOpHash.slice(2)])
    assert.equal(raw.toLowerCase().includes(secret.toLowerCase()), false);
  assert.deepEqual(await decryptRecoveryBackup(envelope, "separate-backup-password"), parseRecoveryPayload(payload));
  assert.equal((await decryptRecoveryBackup(envelope, "separate-backup-password")).signingPolicy, "read-only");
  const second = await encryptRecoveryBackup(payload, "separate-backup-password");
  assert.notEqual(envelope.salt, second.salt); assert.notEqual(envelope.iv, second.iv); assert.notEqual(envelope.data, second.data);
});

test("wrong password, ciphertext edits and invalid KDF metadata cannot open a backup", async () => {
  const {payload} = await recoveryFixture();
  const envelope = await encryptRecoveryBackup(payload, "separate-backup-password");
  await assert.rejects(decryptRecoveryBackup(envelope, "wrong-password"), /incorrect|changed/);
  const data = Buffer.from(envelope.data, "base64"); data[0] ^= 1;
  await assert.rejects(decryptRecoveryBackup({...envelope, data: data.toString("base64")}, "separate-backup-password"), /incorrect|changed/);
  for (const change of [{iterations: 1}, {iterations: 2**31}, {version: 2}, {format: "winternitz-private-note"}, {iv: "!"}, {data: "A".repeat(MAX_RECOVERY_BACKUP_BYTES)}])
    assert.throws(() => parseEncryptedRecoveryBackup({...envelope, ...change}), /Invalid/);
  await assert.rejects(encryptRecoveryBackup(payload, "short"), /12 characters/);
});

test("account, derivation, initial keys and signing-policy substitutions are rejected", async () => {
  const {payload} = await recoveryFixture();
  for (const change of [
    {derivation: "other"}, {signingPolicy: "enabled"}, {historyScope: "global-complete"}, {seed: `0x${"44".repeat(32)}`},
    {initialPublicKeyHash: `0x${"12".repeat(32)}`}, {account: {...payload.account, salt: "8"}},
    {account: {...payload.account, address: DETERMINISTIC.factory}}, {account: {...payload.account, chainId: -1}},
  ]) assert.throws(() => parseRecoveryPayload({...payload, ...change}), /Invalid/);
});

test("signed operation tampering, wrong network/domain and key indices fail validation", async () => {
  const {payload} = await recoveryFixture();
  const original = payload.journals[0].entries[0];
  for (const change of [
    {userOperation: {...original.userOperation, callData: "0x02"}},
    {userOperation: {...original.userOperation, maxFeePerGas: "999n"}},
    {userOperation: {...original.userOperation, signature: "0x"}},
    {userOperation: {...original.userOperation, nonce: "-1n"}},
    {userOperation: {...original.userOperation, unknownField: "0x01"}},
    {keyIndex: 1}, {createdAt: -1}, {kind: "recovery"}, {transactionHash: "0x12"},
  ]) assert.throws(() => parseRecoveryPayload({...payload, journals: [{...payload.journals[0], entries: [{...original, ...change}]}]}));
  assert.throws(() => parseRecoveryPayload({...payload, journals: [{...payload.journals[0], chainId: 1}]}));
  assert.throws(() => parseRecoveryPayload({...payload, journals: [{...payload.journals[0], entryPoint: DETERMINISTIC.factory}]}));
  assert.throws(() => parseRecoveryPayload({...payload, journals: [{...payload.journals[0], entries: [original, original]}]}));
});

test("independently valid signatures that reuse a key across networks cannot be archived together", async () => {
  const a = await recoveryFixture(31337);
  const b = await recoveryFixture(11155111);
  assert.doesNotThrow(() => parseRecoveryPayload(b.payload));
  assert.throws(() => parseRecoveryPayload({...a.payload, journals: [...a.payload.journals, ...b.payload.journals]}), /already signed/);
});

test("recovery signatures are bound to their own key index, replacement and next recovery key", async () => {
  const {payload, op} = await recoveryFixture();
  const hash = getUserOperationHash({userOperation: op, chainId: payload.account.chainId,
    entryPointAddress: payload.account.entryPoint, entryPointVersion: "0.7"});
  const next = wots.publicKeyHash(seed, 1);
  const nextRecovery = wots.recoveryKeyHash(seed, 1);
  const sig = encodeRecoverySignature(next, nextRecovery,
    wots.sign(seed, wots.RECOVERY_KEY_OFFSET, recoveryDigest(hash, next, nextRecovery)));
  const entry = {keyIndex: wots.RECOVERY_KEY_OFFSET, userOpHash: hash, nextPublicKeyHash: next,
    userOperation: serializeUserOperation({...op, signature: sig}), status: "signed" as const,
    kind: "recovery" as const, replacesKeyIndex: 0, createdAt: Date.now()};
  const combined = {...payload, journals: [{...payload.journals[0], entries: [...payload.journals[0].entries, entry]}]};
  assert.doesNotThrow(() => parseRecoveryPayload(combined));
  assert.throws(() => parseRecoveryPayload({...combined, journals: [{...combined.journals[0], entries: [{...entry, replacesKeyIndex: 1}]}]}));
});

test("empty or older known history is still read-only and carries no freshness claim", async () => {
  const {payload} = await recoveryFixture();
  const old = {...payload, exportedAt: "2020-01-01T00:00:00.000Z", journals: []};
  const opened = await decryptRecoveryBackup(await encryptRecoveryBackup(old, "separate-backup-password"), "separate-backup-password");
  assert.equal(opened.signingPolicy, "read-only");
  assert.equal(opened.historyScope, "this-storage-only");
  assert.deepEqual(opened.journals, []);
});
