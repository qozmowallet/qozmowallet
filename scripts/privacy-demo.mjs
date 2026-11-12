import { mkdir, open, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { BaseError, ContractFunctionRevertedError, createPublicClient, createWalletClient, decodeFunctionData, encodeFunctionData, formatEther, hexToBytes, http, keccak256, parseEther, parseGwei, zeroAddress } from 'viem';
import { groth16 } from 'snarkjs';
import { getCurveFromName } from 'ffjavascript';
import { createPrivacyNote, noteCommitment, noteNullifierHash } from '../lib/wallet/privacy/note.ts';
import { decryptPrivacyNote, encryptPrivacyNote } from '../lib/wallet/privacy/backup.ts';
import { preparePrivacyDeposit, preparePrivacyWithdrawal, privacyPoolAbi } from '../lib/wallet/privacy/transactions.ts';
import { scanPrivacyDeposits } from '../lib/wallet/privacy/events.ts';
import { parseDemoEvidence, verifyDemoEvidence } from '../lib/wallet/privacy/demo-evidence.ts';
import { PRIVACY_RESEARCH } from '../lib/wallet/privacy/research-deployment.ts';
import { assertTestnet, testnetChain, verifyDeployment } from './privacy-deploy.mjs';
import { deploymentEnvironment, deployerAccount, deploymentFile, ensure, loadPrivacyArtifacts, projectRoot, readJSONIfPresent, RPC_URL, saveJSON, scriptMain } from './privacy-runtime.mjs';

const defaultState = path.join(projectRoot, 'privacy/local/demo-46630.json');
const defaultEvidence = path.join(projectRoot, 'lib/wallet/privacy/demo-evidence.json');

/** CLI-only backup password; the private key and derived password never enter public evidence. */
export function demoBackupPassword(privateKey, pool, manifestHash) {
  const key = hexToBytes(privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`);
  let derived;
  try {
    derived = hkdf(sha256, key, new TextEncoder().encode('qozmo-privacy-demo-backup-v1'), new TextEncoder().encode(`46630:${pool.toLowerCase()}:${manifestHash}`), 32);
    return Array.from(derived, b => b.toString(16).padStart(2, '0')).join('');
  } finally { key.fill(0); derived?.fill(0); }
}

export async function runPrivacyDemo({ account, privateKey, build, deployment, rpc = RPC_URL, broadcast = false, statePath = defaultState, evidencePath = defaultEvidence, pins = PRIVACY_RESEARCH, feeBudget = parseEther('0.001'), maxFeePerGas = parseGwei('1'), log = console.log }) {
  const chain = testnetChain(rpc);
  const client = createPublicClient({ chain, transport: http(rpc, { retryCount: 1, timeout: 20_000 }), pollingInterval: 500 });
  const wallet = createWalletClient({ account, chain, transport: http(rpc, { retryCount: 0, timeout: 20_000 }) });
  await assertTestnet(client);
  ensure(deployment.status === 'verified' && deployment.manifestHash === build.manifestHash && account.address === deployment.deployer, 'Pool demo requires the pinned deployment and its testnet signer.');
  await verifyDeployment(client, deployment, build);
  const pool = deployment.contracts.QozmoPrivacyPool.address;
  const denomination = BigInt(deployment.denomination);
  ensure(denomination === parseEther('0.001'), 'Pool demo requires the 0.001 test ETH research denomination.');
  let state = await readJSONIfPresent(statePath);
  const balance = await client.getBalance({ address: account.address });
  log(`Privacy Ring demo · Robinhood Testnet 46630\nPool: ${pool}\nSender / recipient: ${account.address}\nDeposit: ${formatEther(denomination)} test ETH\nWallet balance: ${formatEther(balance)} test ETH\nDemo gas-fee cap: ${formatEther(feeBudget)} test ETH`);
  if (state) ensure(state.manifestHash === build.manifestHash && state.pool === pool && state.sender === account.address && state.recipient === account.address, 'Pool demo journal does not match the deployment or signer.');
  if (!broadcast) { log(state?.status === 'complete' ? 'Demo already completed; no new deposit will be sent.' : 'Preview only. --broadcast runs one deposit and returns the full denomination to the same wallet.'); return state; }
  await mkdir(path.dirname(statePath), { recursive: true, mode: 0o700 });
  let lock;
  try { lock = await open(`${statePath}.lock`, 'wx', 0o600); }
  catch { throw new Error('Pool demo is already running or has a stale journal lock.'); }
  let usedProver = false;
  try {
    const password = demoBackupPassword(privateKey, pool, build.manifestHash);
    state = await readJSONIfPresent(statePath);
    if (!state) {
      ensure(balance >= denomination + feeBudget, 'Insufficient test ETH for the deposit and demo gas reserve.');
      const note = createPrivacyNote({ chainId: 46630, pool, denomination: denomination.toString() });
      const encryptedNote = await encryptPrivacyNote(note, password);
      // Verify decryptability before any transaction can make this note carry funds.
      ensure(noteCommitment(await decryptPrivacyNote(JSON.stringify(encryptedNote), password)) === noteCommitment(note), 'Pool demo note backup verification failed.');
      state = { version: 1, status: 'prepared', manifestHash: build.manifestHash, pool, sender: account.address, recipient: account.address, encryptedNote, feeCapUsed: '0' };
      await saveJSON(statePath, state);
    }
    ensure(state.manifestHash === build.manifestHash && state.pool === pool && state.sender === account.address && state.recipient === account.address, 'Pool demo journal changed during preflight.');
    const note = await decryptPrivacyNote(JSON.stringify(state.encryptedNote), password);
    ensure(note.pool === pool && note.chainId === 46630 && note.denomination === denomination.toString(), 'Pool demo note belongs to a different pool, chain or denomination.');
    const commitment = noteCommitment(note);
    const nullifierHash = noteNullifierHash(note);
    async function sendStep(name, transaction) {
      await assertTestnet(client);
      let step = state[name];
      if (!step) {
        const nonce = await client.getTransactionCount({ address: account.address, blockTag: 'pending' });
        ensure(nonce === await client.getTransactionCount({ address: account.address, blockTag: 'latest' }), 'Nonce is occupied by another transaction; wait before the demo.');
        const fees = await client.estimateFeesPerGas();
        ensure(fees.maxFeePerGas <= maxFeePerGas, 'Gas fee exceeds the demo fee-per-gas limit.');
        const estimate = await client.estimateGas({ account: account.address, to: pool, data: transaction.data, value: transaction.value });
        const gas = estimate * 12n / 10n + 10_000n;
        const allowance = gas * fees.maxFeePerGas;
        ensure(gas <= 1_500_000n && BigInt(state.feeCapUsed) + allowance <= feeBudget, 'Gas estimate exceeds the demo fee budget.');
        ensure(await client.getBalance({ address: account.address }) >= transaction.value + allowance, 'Insufficient test ETH for the next demo transaction.');
        const signed = await wallet.signTransaction({ account, chain, nonce, to: pool, data: transaction.data, value: transaction.value, gas, type: 'eip1559', ...fees });
        step = { status: 'pending', hash: keccak256(signed), nonce };
        state[name] = step;
        state.feeCapUsed = (BigInt(state.feeCapUsed) + allowance).toString();
        await saveJSON(statePath, state);
        await assertTestnet(client);
        ensure(await client.getTransactionCount({ address: account.address, blockTag: 'pending' }) === nonce, 'Nonce changed before the demo broadcast. Reconcile the stored transaction hash.');
        ensure(await client.sendRawTransaction({ serializedTransaction: signed }) === step.hash, 'Pool demo RPC returned a different transaction hash.');
        log(`${name} submitted: ${step.hash}`);
      }
      let receipt;
      try { receipt = await client.waitForTransactionReceipt({ hash: step.hash, confirmations: 3, timeout: 120_000 }); }
      catch { throw new Error(`Pool demo ${name} is unresolved. Preserve the journal and check hash ${step.hash}; no duplicate will be sent.`); }
      const tx = await client.getTransaction({ hash: step.hash });
      const block = await client.getBlock({ blockNumber: receipt.blockNumber });
      ensure(receipt.status === 'success' && receipt.blockHash === block.hash && tx.from.toLowerCase() === account.address.toLowerCase() && tx.to?.toLowerCase() === pool.toLowerCase() && tx.input === transaction.data && tx.value === transaction.value && tx.chainId === 46630 && tx.nonce === step.nonce, `Pool demo ${name} receipt or calldata did not match.`);
      Object.assign(step, { status: 'confirmed', blockNumber: receipt.blockNumber.toString(), blockHash: receipt.blockHash, gasFeeWei: (receipt.gasUsed * receipt.effectiveGasPrice).toString() });
      await saveJSON(statePath, state);
      log(`${name} confirmed: ${step.hash}`);
      return receipt;
    }
    await sendStep('deposit', preparePrivacyDeposit(note));
    if (!state.withdrawal) {
      const snapshot = await scanPrivacyDeposits(client, pool, 46630, BigInt(deployment.contracts.QozmoPrivacyPool.blockNumber));
      ensure(snapshot.leaves.includes(commitment), 'Pool demo deposit was not found in the confirmed tree.');
      usedProver = true;
      let publicProof;
      const withdrawal = await preparePrivacyWithdrawal(note, snapshot.leaves, account.address, zeroAddress, 0n, async witness => {
        const { proof, publicSignals } = await groth16.fullProve(witness, path.join(build.directory, 'withdraw_js/withdraw.wasm'), path.join(build.directory, 'withdraw.zkey'), undefined, undefined, { singleThread: true });
        ensure(await groth16.verify(JSON.parse(await readFile(path.join(build.directory, 'verification-key.json'), 'utf8')), publicSignals, proof), 'Test proof failed demo verification.');
        const [a, b, c] = JSON.parse(`[${await groth16.exportSolidityCallData(proof, publicSignals)}]`);
        publicProof = { proof: { a: a.map(v => BigInt(v).toString()), b: b.map(row => row.map(v => BigInt(v).toString())), c: c.map(v => BigInt(v).toString()) }, publicSignals };
        return { a: a.map(BigInt), b: b.map(row => row.map(BigInt)), c: c.map(BigInt), publicSignals: publicSignals.map(BigInt) };
      });
      state.publicProof = publicProof;
      state.withdrawalData = withdrawal.data;
      state.leafIndex = snapshot.leaves.indexOf(commitment);
      await saveJSON(statePath, state);
      log('Groth16 membership proof generated and verified locally.');
    }
    ensure(state.withdrawalData && state.publicProof, 'Pool demo withdrawal proof is missing. Preserve the encrypted note.');
    await sendStep('withdrawal', { to: pool, value: 0n, data: state.withdrawalData });
    // Check an actual InvalidWithdrawal revert, not an arbitrary failed RPC request.
    const args = decodeFunctionData({ abi: privacyPoolAbi, data: state.withdrawalData }).args;
    let replayRejected = false;
    try { await client.simulateContract({ address: pool, abi: build.contracts.QozmoPrivacyPool.abi, functionName: 'withdraw', args, account: account.address }); }
    catch (error) { const revert = error instanceof BaseError ? error.walk(e => e instanceof ContractFunctionRevertedError) : undefined; replayRejected = revert?.data?.errorName === 'InvalidWithdrawal'; }
    ensure(replayRejected, 'Pool demo replay check did not establish an InvalidWithdrawal revert.');
    const pin = step => ({ hash: step.hash, blockNumber: step.blockNumber, blockHash: step.blockHash });
    const evidence = parseDemoEvidence({ version: 1, status: 'complete', chainId: 46630, pool, verifier: deployment.contracts.Groth16Verifier.address, denomination: denomination.toString(), sender: account.address, recipient: account.address, commitment: commitment.toString(), nullifierHash: nullifierHash.toString(), root: state.publicProof.publicSignals[0], domain: deployment.domain, leafIndex: state.leafIndex, deposit: pin(state.deposit), withdrawal: pin(state.withdrawal), gasFeeWei: (BigInt(state.deposit.gasFeeWei) + BigInt(state.withdrawal.gasFeeWei)).toString(), completedAt: state.completedAt ?? new Date().toISOString(), ...state.publicProof }, pins);
    await verifyDemoEvidence(evidence, client, undefined, pins);
    state.status = 'complete';
    state.completedAt = evidence.completedAt;
    state.replayRejected = true;
    await saveJSON(statePath, state);
    // Publish an explicit public schema only; never serialize the private journal or witness here.
    await saveJSON(evidencePath, evidence);
    log(`Demo complete. Deposit and withdrawal: ${formatEther(denomination)} test ETH. Gas: ${formatEther(BigInt(evidence.gasFeeWei))} test ETH. Public evidence ready for the dashboard.`);
    return evidence;
  } finally {
    await lock.close(); await rm(`${statePath}.lock`, { force: true });
    if (usedProver) await (await getCurveFromName('bn128')).terminate();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await scriptMain(async () => {
    ensure(process.argv.slice(2).every(flag => flag === '--broadcast'), 'Pool demo supports only --broadcast; default mode is preview.');
    const env = await deploymentEnvironment();
    const account = deployerAccount(env.WALLET_TESTNET);
    const deployment = await readJSONIfPresent(deploymentFile);
    ensure(deployment?.status === 'verified', 'Pool demo requires a completed testnet deployment.');
    ensure(deployment.artifactArchive === `privacy/artifacts/${deployment.manifestHash}`, 'Pool demo archive path mismatch.');
    const build = await loadPrivacyArtifacts(path.join(projectRoot, deployment.artifactArchive));
    await runPrivacyDemo({ account, privateKey: env.WALLET_TESTNET.trim(), build, deployment, rpc: env.QOZMO_PRIVACY_RPC_URL || RPC_URL, broadcast: process.argv.includes('--broadcast') });
  });
}
