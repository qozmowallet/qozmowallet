import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPublicClient, createWalletClient, defineChain, encodeFunctionData, http, parseEther, parseGwei, zeroAddress } from 'viem';
import { groth16 } from 'snarkjs';
import { createPrivacyNote, noteCommitment, noteNullifierHash, poolDomain, withdrawalWitness, FIELD } from '../lib/wallet/privacy/note.ts';
import { preparePrivacyDeposit, preparePrivacyWithdrawal } from '../lib/wallet/privacy/transactions.ts';
import { mnemonicToAccount } from 'viem/accounts';
import { deployPrivacy, testnetChain } from './privacy-deploy.mjs';
import { loadPrivacyArtifacts } from './privacy-runtime.mjs';
import { verifyProofOnChain } from './privacy-verify.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const build = path.join(root, 'privacy/build');
const manifest = JSON.parse(await readFile(`${build}/manifest.json`, 'utf8').catch(() => { throw new Error('Run npm run privacy:setup first.'); }));
for (const [file, hash] of Object.entries(manifest.hashes)) assert.equal(createHash('sha256').update(await readFile(path.join(root, file))).digest('hex'), hash, `${file} changed. Re-run npm run privacy:setup.`);
const artifacts = JSON.parse(await readFile(`${build}/contracts.json`, 'utf8'));
const server = createServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
await new Promise(resolve => server.close(resolve));
const chain = defineChain({ id: 31337, name: 'Qozmo privacy local test', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: [`http://127.0.0.1:${port}`] } } });
// Spawn our own isolated local node; never connect to user-configured RPCs or read wallet keys.
const anvil = spawn('anvil', ['--host', '127.0.0.1', '--port', String(port), '--chain-id', '31337', '--block-time', '0.1', '--silent'], { stdio: ['ignore', 'ignore', 'pipe'] });
let nodeError;
anvil.on('error', error => { nodeError = error; });
const client = createPublicClient({ chain, transport: http(undefined, { retryCount: 0 }), pollingInterval: 100 });
const wallet = createWalletClient({ chain, transport: http() });
const denomination = parseEther('0.01');
const results = [];
function pass(label) { results.push(label); console.log(`PASS ${label}`); }
async function mine(hash) {
  const receipt = await client.waitForTransactionReceipt({ hash });
  assert.equal(receipt.status, 'success');
  return receipt;
}
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (nodeError) throw nodeError;
    if (anvil.exitCode !== null) throw new Error('Anvil exited before startup.');
    try { if (await client.getChainId() === 31337) { ready = true; break; } } catch { /* Node starting. */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready, 'Anvil did not start. Install Foundry/anvil and retry.');
  const [depositor, recipient, relayer, attacker] = await wallet.getAddresses();
  const deploy = async (name, args = []) => (await mine(await wallet.deployContract({ ...artifacts[name], args, account: depositor }))).contractAddress;
  const h2 = await deploy('Poseidon2'), h4 = await deploy('Poseidon4'), verifier = await deploy('Groth16Verifier');
  const pool = await deploy('QozmoPrivacyPool', [denomination, h2, h4, verifier]);
  const abi = artifacts.QozmoPrivacyPool.abi;
  const read = (functionName, args = []) => client.readContract({ address: pool, abi, functionName, args });
  const write = (functionName, args, account = depositor, value) => wallet.writeContract({ address: pool, abi, functionName, args, account, value });
  const reject = async (functionName, args, account = depositor, value) => {
    await assert.rejects(client.simulateContract({ address: pool, abi, functionName, args, account, value }));
  };
  const context = { chainId: 31337, pool, denomination: denomination.toString() };
  assert.equal(await read('domain'), poolDomain(context));
  pass('SDK and Solidity pool domains agree');
  const leaves = [], notes = [];
  async function deposit() {
    const note = createPrivacyNote(context), commitment = noteCommitment(note);
    const transaction = preparePrivacyDeposit(note);
    await mine(await wallet.sendTransaction({ account: depositor, to: transaction.to, data: transaction.data, value: transaction.value }));
    notes.push(note); leaves.push(commitment);
    const witness = withdrawalWitness(note, leaves, recipient, zeroAddress, 0n);
    assert.equal(await read('root'), BigInt(witness.root));
    return note;
  }
  const note = await deposit();
  await reject('deposit', [noteCommitment(note)], depositor, denomination);
  await reject('deposit', [FIELD], depositor, denomination);
  await reject('deposit', [123n], depositor, denomination - 1n);
  pass('exact denomination, duplicate commitment and field checks');
  const vk = JSON.parse(await readFile(`${build}/verification-key.json`, 'utf8'));
  async function prove(note, to, relay = zeroAddress, fee = 0n) {
    const witness = withdrawalWitness(note, leaves, to, relay, fee);
    const { proof, publicSignals } = await groth16.fullProve(witness, `${build}/withdraw_js/withdraw.wasm`, `${build}/withdraw.zkey`, undefined, undefined, { singleThread: true });
    assert.deepEqual(publicSignals, [witness.root, witness.nullifierHash, witness.domain, witness.contextHash]);
    assert.ok(await groth16.verify(vk, publicSignals, proof));
    const [a, b, c] = JSON.parse(`[${await groth16.exportSolidityCallData(proof, publicSignals)}]`);
    const args = [a, b, c, BigInt(witness.root), noteNullifierHash(note), to, relay, fee];
    const transaction = await preparePrivacyWithdrawal(note, leaves, to, relay, fee, async () => ({ a: a.map(BigInt), b: b.map(row => row.map(BigInt)), c: c.map(BigInt), publicSignals: publicSignals.map(BigInt) }));
    assert.equal(transaction.data, encodeFunctionData({ abi, functionName: 'withdraw', args }));
    return { args, proof, publicSignals, witness, transaction };
  }
  const first = await prove(note, recipient, relayer, 12345n);
  assert.equal(await groth16.verify(vk, [first.publicSignals[0], first.publicSignals[1], (BigInt(first.publicSignals[2]) + 1n).toString(), first.publicSignals[3]], first.proof), false);
  await reject('withdraw', [...first.args.slice(0, 5), attacker, relayer, 12345n], relayer);
  await reject('withdraw', [...first.args.slice(0, 7), 12346n], relayer);
  await reject('withdraw', first.args, attacker);
  await reject('withdraw', [first.args[0], first.args[1], first.args[2], 1n, ...first.args.slice(4)], relayer);
  const badProof = structuredClone(first.args); badProof[0] = [0n, 0n];
  await reject('withdraw', badProof, relayer);
  pass('real proof rejects modified recipient, fee, domain, root, sender and proof');
  // Adding a deposit after proving must preserve spendability against a historical root.
  await deposit();
  for (let i = 0; i < 7; i++) await deposit();
  const before = await client.getBalance({ address: recipient });
  const relayBefore = await client.getBalance({ address: relayer });
  const receipt = await mine(await write('withdraw', first.args, relayer));
  assert.equal(await client.getBalance({ address: recipient }), before + denomination - 12345n);
  assert.equal(await client.getBalance({ address: relayer }), relayBefore + 12345n - receipt.gasUsed * receipt.effectiveGasPrice);
  assert.equal(await read('spentNullifiers', [noteNullifierHash(note)]), true);
  await reject('withdraw', first.args, relayer);
  pass('historical root payout, relayer fee and double-spend prevention');
  const rejectTo = await deploy('RejectingRecipient');
  const second = await prove(notes[1], rejectTo);
  await reject('withdraw', second.args);
  // Also force an actual reverted transaction, verifying state rollback rather than simulation alone.
  const reverted = await wallet.writeContract({ address: pool, abi, functionName: 'withdraw', args: second.args, account: depositor, gas: 2_000_000n });
  assert.equal((await client.waitForTransactionReceipt({ hash: reverted })).status, 'reverted');
  assert.equal(await read('spentNullifiers', [noteNullifierHash(notes[1])]), false);
  pass('failed recipient payment rolls back nullifier');
  const reenter = await deploy('ReenteringRecipient');
  const reentryProof = await prove(notes[1], reenter);
  await mine(await wallet.writeContract({ address: reenter, abi: artifacts.ReenteringRecipient.abi, functionName: 'configure', args: [pool, encodeFunctionData({ abi, functionName: 'deposit', args: [999n] })], account: depositor }));
  await mine(await write('withdraw', reentryProof.args));
  assert.equal(await client.readContract({ address: reenter, abi: artifacts.ReenteringRecipient.abi, functionName: 'reentrySucceeded' }), false);
  assert.equal(await client.getBalance({ address: pool }), BigInt(leaves.length - 2) * denomination);
  pass('callback reentrancy blocked; unspent deposits remain accounted for');
  // A non-member cannot produce a witness satisfying the circuit.
  const invalidWitness = { ...first.witness, siblings: first.witness.siblings.map((v, i) => i === 0 ? '1' : v) };
  await assert.rejects(groth16.fullProve(invalidWitness, `${build}/withdraw_js/withdraw.wasm`, `${build}/withdraw.zkey`, undefined, undefined, { singleThread: true }));
  pass('invalid Merkle membership fails circuit witness generation');
  const report = { completed: false, scope: 'isolated-anvil-local-only', chainId: 31337, manifestHash: createHash('sha256').update(await readFile(`${build}/manifest.json`)).digest('hex'), generatedAt: new Date().toISOString(), localResearchSetup: true, withdrawalGas: receipt.gasUsed.toString(), checks: results };
  await writeFile(`${build}/test-report.json`, JSON.stringify(report, null, 2));
  // Exercise the actual testnet deployment code with only Anvil's public development mnemonic.
  await client.request({ method: 'anvil_setChainId', params: [46630] });
  await reject('deposit', [123456n], depositor, denomination);
  pass('existing pool refuses operations after the chain ID changes');
  const rpc = `http://127.0.0.1:${port}`;
  const testnet = createPublicClient({ chain: testnetChain(rpc), transport: http(rpc) });
  const account = mnemonicToAccount('test test test test test test test test test test test junk');
  const pinnedBuild = await loadPrivacyArtifacts(build, false);
  const journalPath = `${build}/local-deploy-test.json`;
  const { rm } = await import('node:fs/promises');
  await rm(journalPath, { force: true });
  const beforeNonce = await testnet.getTransactionCount({ address: account.address });
  const config = { account, build: pinnedBuild, rpc, journalPath, archive: false, budget: parseEther('0.05'), maxFeePerGas: parseGwei('3'), log: () => {} };
  await deployPrivacy(config);
  assert.equal(await testnet.getTransactionCount({ address: account.address }), beforeNonce);
  const journal = await deployPrivacy({ ...config, broadcast: true });
  assert.equal(journal.status, 'verified');
  assert.equal(await testnet.getTransactionCount({ address: account.address }), beforeNonce + 4);
  await deployPrivacy({ ...config, broadcast: true });
  assert.equal(await testnet.getTransactionCount({ address: account.address }), beforeNonce + 4);
  assert.equal((await verifyProofOnChain(testnet, journal, pinnedBuild)).validProof, true);
  pass('testnet deployment preview, four real deployments, receipt/code checks, resume and deployed verifier proof');
  report.completed = true;
  await writeFile(`${build}/test-report.json`, JSON.stringify(report, null, 2));
  console.log(`Local end-to-end proof passed. Withdrawal gas: ${receipt.gasUsed}. No external deployment.`);
} finally {
  anvil.kill('SIGTERM');
  // snarkjs/ffjavascript may retain curve workers after verify; terminate cleanly.
  const { getCurveFromName } = await import('ffjavascript');
  const curve = await getCurveFromName('bn128');
  await curve.terminate();
}
