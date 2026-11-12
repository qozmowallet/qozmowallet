import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { runInNewContext } from 'node:vm';
import { createPublicClient, createWalletClient, defineChain, http, toHex, zeroAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { poseidon2 } from 'poseidon-lite/poseidon2';
import { loadPrivacyArtifacts } from './privacy-runtime.mjs';
import { PRIVACY_RESEARCH as pins } from '../lib/wallet/privacy/research-deployment.ts';
import { createPrivacyNote, noteCommitment, noteNullifierHash } from '../lib/wallet/privacy/note.ts';
import { preparePrivacyDeposit, preparePrivacyWithdrawal, privacyPoolAbi } from '../lib/wallet/privacy/transactions.ts';
import { createAccountBackup, inspectAccountBackup } from '../lib/wallet/account-backup.ts';
import { scanPrivacyDeposits } from '../lib/wallet/privacy/events.ts';
import { deriveAccountNotesKey, saveAccountNote, readAccountNotes } from '../lib/wallet/privacy/account-notes.ts';
import { prepareQuantumPrivacy, confirmQuantumPrivacy, prepareQuantumTransfer, confirmQuantumTransfer, QUANTUM_DEPLOYMENT as quantum } from '../lib/wallet/quantum/client.ts';
import { newQuantumDraft, sealQuantumDraft, installQuantumRecord, QuantumJournal } from '../lib/wallet/quantum/storage.ts';
import { QuantumSafeWallet } from '../lib/wallet/quantum-sdk/wallet.ts';
import { selfSubmitter } from '../lib/wallet/quantum-sdk/submitters.ts';
import { quantumSafeAccountFactoryAbi } from '../lib/wallet/quantum-sdk/account.ts';

// Isolated Anvil and public development key only. This script never reads .env.
const records = new Map();
globalThis.localStorage = { getItem: key => records.get(key) ?? null, setItem: (key, value) => records.set(key, value), removeItem: key => records.delete(key) };
Object.defineProperty(globalThis.navigator, 'locks', { configurable: true, value: { request: async (_name, options, callback) => typeof options === 'function' ? options() : callback?.() } });
const password = 'Public isolated unified wallet test';
const payer = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
const server = createServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
await new Promise(resolve => server.close(resolve));
const rpc = `http://127.0.0.1:${port}`;
const node = spawn('anvil', ['--host', '127.0.0.1', '--port', String(port), '--chain-id', '46630', '--number', String(pins.deployBlock), '--block-time', '0.1', '--silent'], { stdio: 'ignore' });
let startError; node.on('error', reason => { startError = reason; });
try {
  const chain = defineChain({ id: 46630, name: 'Isolated Qozmo fixture', nativeCurrency: { name: 'Test ETH', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: [rpc] } } });
  const client = createPublicClient({ chain, transport: http(rpc, { retryCount: 0 }), pollingInterval: 100 });
  const signer = createWalletClient({ chain, account: payer, transport: http(rpc) });
  for (let i = 0; i < 100; i++) { if (startError) throw startError; try { if (await client.getChainId() === 46630) break; } catch {} await new Promise(resolve => setTimeout(resolve, 50)); }
  const request = (method, params) => client.request({ method, params });
  const qRuntime = JSON.parse(await readFile('tests/fixtures/quantum-runtime.json', 'utf8'));
  const pRuntime = JSON.parse(await readFile('tests/fixtures/privacy-runtime.json', 'utf8'));
  for (const name of ['entryPoint', 'factory', 'accountImplementation']) await request('anvil_setCode', [quantum[name], qRuntime[name]]);
  await request('anvil_setCode', [pins.pool, pRuntime.pool]); await request('anvil_setCode', [pins.verifier, pRuntime.verifier]);
  const build = await loadPrivacyArtifacts(`privacy/artifacts/${pins.manifestHash}`);
  for (const [name, address] of [['Poseidon2', '0x934EcAA425B420cf5bfB5C91B455604bC4bb8D24'], ['Poseidon4', '0xbFc56f6757d75d6AB2E6F9cF42391f39b2F20982']]) {
    const hash = await signer.deployContract(build.contracts[name]); const receipt = await client.waitForTransactionReceipt({ hash });
    await request('anvil_setCode', [address, await client.getCode({ address: receipt.contractAddress })]);
  }
  // Reconstruct only the constructor's empty tree storage for the pinned pool runtime.
  let zero = 0n;
  for (let level = 0; level < 8; level++) {
    for (const slot of [2 + level, 10 + level]) await request('anvil_setStorageAt', [pins.pool, toHex(slot, { size: 32 }), toHex(zero, { size: 32 })]);
    zero = poseidon2([zero, zero]);
  }
  await request('anvil_setStorageAt', [pins.pool, toHex(1, { size: 32 }), toHex(zero, { size: 32 })]);
  const draft = newQuantumDraft(), record = await sealQuantumDraft(draft, password, 'Unified local fixture'); await installQuantumRecord(record);
  const wallet = await QuantumSafeWallet.load({ seed: draft.seed, publicClient: client, factory: quantum.factory, accountImplementation: quantum.accountImplementation, entryPoint: quantum.entryPoint, journal: new QuantumJournal(record) });
  const notesKey = await deriveAccountNotesKey(draft.seed, record.address);
  const session = { record, wallet, client, notesKey };
  const relay = { label: 'Isolated Anvil self-bundler', submitter: selfSubmitter({ entryPoint: quantum.entryPoint, publicClient: client, walletClient: signer }) };
  await request('anvil_setBalance', [record.address, toHex(10n ** 18n)]);
  const note = createPrivacyNote({ chainId: 46630, pool: pins.pool, denomination: pins.denomination });
  await saveAccountNote(record.address, notesKey, note);
  const initialReview = await prepareQuantumPrivacy(session, relay, preparePrivacyDeposit(note));
  assert.equal(initialReview.operation.factory, quantum.factory);
  assert.equal((await wallet.journal.list()).length, 0);
  // Bootstrap the clone explicitly: the public EntryPoint runtime fixture alone does not
  // include its separately deployed SenderCreator helper. New-account review is still checked.
  const created = await signer.writeContract({ address: quantum.factory, abi: quantumSafeAccountFactoryAbi, functionName: 'createAccount', args: [record.initialPublicKeyHash, record.initialRecoveryKeyHash, BigInt(record.salt)] });
  assert.equal((await client.waitForTransactionReceipt({ hash: created })).status, 'success');
  await assert.rejects(confirmQuantumPrivacy(session, initialReview, password), /deployment or nonce changed/);
  assert.deepEqual((await readAccountNotes(record.address, notesKey))[0].note, note);
  const depositReview = await prepareQuantumPrivacy(session, relay, preparePrivacyDeposit(note));
  const deposit = await confirmQuantumPrivacy(session, depositReview, password); assert.equal(deposit.success, true);
  assert.equal(await client.getBalance({ address: pins.pool }), BigInt(pins.denomination));
  assert.equal((await wallet.getKeyState()).keyIndex, 1);
  console.log('PASS one smart account deposits into the pinned privacy pool with WOTS key #0');

  // Execute the exact browser bundle in an isolated JS context. Restrict fetch to public artifacts.
  const workerSource = await readFile('public/privacy-prover/worker.js', 'utf8');
  const browserProver = witness => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Browser bundle proof timeout')), 90_000);
    const self = { location: { href: 'https://local-prover.test/privacy-prover/worker.js' }, postMessage(value) {
      clearTimeout(timer); if (value.error) { reject(Error(value.error)); return; }
      resolve({ a: value.a.map(BigInt), b: value.b.map(row => row.map(BigInt)), c: value.c.map(BigInt), publicSignals: value.publicSignals.map(BigInt) });
    } };
    const context = { self, crypto, TextEncoder, TextDecoder, Uint8Array, Uint32Array, ArrayBuffer, WebAssembly, URL, Blob, btoa, atob, setTimeout, clearTimeout, console,
      fetch: async url => {
        assert.equal(url.origin, 'https://local-prover.test');
        assert.ok(['/privacy-prover/withdraw.wasm', '/privacy-prover/withdraw.zkey', '/privacy-prover/verification-key.json'].includes(url.pathname));
        return new Response(await readFile(`public${url.pathname}`));
      } };
    try { runInNewContext(workerSource, context); self.onmessage({ data: witness }).catch(reject); }
    catch (reason) { clearTimeout(timer); reject(Error(`Browser bundle startup failed: ${reason.message}`)); }
  });
  const receipt = await client.getTransactionReceipt({ hash: deposit.transactionHash });
  for (let i = 0; i < 30 && await client.getBlockNumber({ cacheTime: 0 }) < receipt.blockNumber + 2n; i++) await new Promise(resolve => setTimeout(resolve, 100));
  const snapshot = await scanPrivacyDeposits(client, pins.pool, 46630, pins.deployBlock);
  assert.deepEqual(snapshot.leaves, [noteCommitment(note)]);
  const withdrawalTx = await preparePrivacyWithdrawal(note, snapshot.leaves, record.address, zeroAddress, 0n, browserProver);
  const withdrawalReview = await prepareQuantumPrivacy(session, relay, withdrawalTx);
  const withdrawal = await confirmQuantumPrivacy(session, withdrawalReview, password); assert.equal(withdrawal.success, true);
  assert.equal(await client.getBalance({ address: pins.pool }), 0n);
  assert.equal(await client.readContract({ address: pins.pool, abi: privacyPoolAbi, functionName: 'spentNullifiers', args: [noteNullifierHash(note)] }), true);
  assert.equal((await wallet.getKeyState()).keyIndex, 2);
  console.log('PASS browser-bundled local proof and withdrawal to the same account with WOTS key #1');
  await assert.rejects(prepareQuantumPrivacy(session, relay, withdrawalTx));
  const publicReview = await prepareQuantumTransfer(session, relay, { recipient: payer.address, amount: '0.00001' });
  const transfer = await confirmQuantumTransfer(session, publicReview, password); assert.equal(transfer.success, true);
  const history = await wallet.journal.list();
  assert.equal(history.length, 3); assert.deepEqual(history.map(e => e.keyIndex), [0, 1, 2]);
  assert.ok(history.every(e => e.userOperation.sender === record.address && e.status === 'confirmed'));
  console.log('PASS a subsequent public transfer shares the same address, WOTS sequence and confirmed history');
  const complete = await createAccountBackup(record, password);
  const backupReport = await inspectAccountBackup(JSON.stringify(complete.file), password, record);
  assert.equal(backupReport.operationCount, 3); assert.equal(backupReport.noteCount, 1); assert.equal(backupReport.canActivate, false);
  console.log('PASS complete backup authenticates all three signed operations and the privacy note without activating recovery');
  console.log('All operations ran only on ephemeral localhost Anvil. No .env or testnet signer was used.');
} finally { node.kill('SIGTERM'); }
