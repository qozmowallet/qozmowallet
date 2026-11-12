import { open, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { createPublicClient, createWalletClient, defineChain, encodeDeployData, formatEther, getContractAddress, http, keccak256, parseEther, parseGwei } from 'viem';
import { poseidon2 } from 'poseidon-lite/poseidon2';
import { poseidon4 } from 'poseidon-lite/poseidon4';
import { poolDomain } from '../lib/wallet/privacy/note.ts';
import { archivePrivacyArtifacts, deploymentEnvironment, deployerAccount, deploymentFile, ensure, loadPrivacyArtifacts, readJSONIfPresent, RPC_URL, saveJSON, scriptMain } from './privacy-runtime.mjs';

export const DEPLOYMENT_CHAIN_ID = 46630;
export const CONTRACT_ORDER = ['Poseidon2', 'Poseidon4', 'Groth16Verifier', 'QozmoPrivacyPool'];
const DEFAULT_DENOMINATION = parseEther('0.001');
const DEFAULT_BUDGET = parseEther('0.005');
const MAX_FEE = parseGwei('1');

export function testnetChain(rpc) {
  const url = new URL(rpc);
  ensure(url.protocol === 'https:' || (url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname)), 'RPC configuration requires HTTPS or a local test node.');
  return defineChain({ id: DEPLOYMENT_CHAIN_ID, name: 'Robinhood Chain Testnet', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: [rpc] } } });
}

export async function assertTestnet(client) {
  ensure(await client.getChainId() === DEPLOYMENT_CHAIN_ID, 'Wrong chain: privacy deployment requires Robinhood Testnet 46630.');
}

async function verifyContract(client, journal, build, name) {
    const step = journal.contracts[name];
    ensure(step?.status === 'confirmed', `Deployment is incomplete at ${name}.`);
    const receipt = await client.getTransactionReceipt({ hash: step.hash });
    const tx = await client.getTransaction({ hash: step.hash });
    const block = await client.getBlock({ blockNumber: receipt.blockNumber });
    const input = encodeDeployData({ ...build.contracts[name], args: name === 'QozmoPrivacyPool' ? [BigInt(journal.denomination), journal.contracts.Poseidon2.address, journal.contracts.Poseidon4.address, journal.contracts.Groth16Verifier.address] : [] });
    ensure(receipt.status === 'success' && receipt.contractAddress?.toLowerCase() === step.address.toLowerCase() && receipt.blockHash === block.hash && tx.from.toLowerCase() === journal.deployer.toLowerCase() && tx.input === input && tx.chainId === DEPLOYMENT_CHAIN_ID && tx.value === 0n && tx.nonce === step.nonce && getContractAddress({ from: journal.deployer, nonce: BigInt(step.nonce) }).toLowerCase() === step.address.toLowerCase(), `Deployment receipt or bytecode input mismatch: ${name}.`);
    const code = await client.getCode({ address: step.address });
    ensure(code && code !== '0x' && keccak256(code) === step.codeHash, `Deployment runtime code changed: ${name}.`);
}

export async function verifyDeployment(client, journal, build) {
  await assertTestnet(client);
  for (const name of CONTRACT_ORDER) await verifyContract(client, journal, build, name);
  const pool = journal.contracts.QozmoPrivacyPool.address;
  const read = functionName => client.readContract({ address: pool, abi: build.contracts.QozmoPrivacyPool.abi, functionName });
  const [denomination, domain, chainId, h2, h4, verifier] = await Promise.all(['denomination', 'domain', 'deploymentChainId', 'hasher', 'contextHasher', 'verifier'].map(read));
  ensure(denomination.toString() === journal.denomination && domain === poolDomain({ chainId: DEPLOYMENT_CHAIN_ID, pool, denomination: journal.denomination }) && chainId === BigInt(DEPLOYMENT_CHAIN_ID), 'Pool domain, chain or denomination mismatch.');
  ensure(h2.toLowerCase() === journal.contracts.Poseidon2.address.toLowerCase() && h4.toLowerCase() === journal.contracts.Poseidon4.address.toLowerCase() && verifier.toLowerCase() === journal.contracts.Groth16Verifier.address.toLowerCase(), 'Pool dependency addresses mismatch.');
  for (const [name, values, expected] of [['Poseidon2', [1n, 2n], poseidon2([1n, 2n])], ['Poseidon4', [1n, 2n, 3n, domain], poseidon4([1n, 2n, 3n, domain])]]) {
    ensure(await client.readContract({ address: journal.contracts[name].address, abi: build.contracts[name].abi, functionName: 'poseidon', args: [values] }) === expected, `Poseidon cross-check failed: ${name}.`);
  }
  return { pool, domain: domain.toString() };
}

export async function deployPrivacy({ account, build, rpc = RPC_URL, broadcast = false, journalPath = deploymentFile, denomination = DEFAULT_DENOMINATION, budget = DEFAULT_BUDGET, maxFeePerGas = MAX_FEE, archive = true, log = console.log }) {
  ensure(typeof denomination === 'bigint' && denomination > 0n && denomination < 10n ** 20n, 'Pool research denomination must be positive and below 100 ETH.');
  ensure(typeof budget === 'bigint' && budget > 0n, 'Gas fee budget must be positive.');
  const chain = testnetChain(rpc);
  const client = createPublicClient({ chain, transport: http(rpc, { retryCount: 1, timeout: 20_000 }), pollingInterval: 1500 });
  const wallet = createWalletClient({ account, chain, transport: http(rpc, { retryCount: 0, timeout: 20_000 }) });
  await assertTestnet(client);
  let journal = await readJSONIfPresent(journalPath);
  if (journal) ensure(journal.chainId === DEPLOYMENT_CHAIN_ID && journal.deployer === account.address && journal.manifestHash === build.manifestHash && journal.denomination === denomination.toString(), 'Deployment journal belongs to a different signer, build or denomination. Preserve it and use a separate deployment file.');
  const balance = await client.getBalance({ address: account.address });
  const fees = await client.estimateFeesPerGas();
  ensure(fees.maxFeePerGas <= maxFeePerGas, 'Gas fee exceeds the configured research deployment limit (CLI default: 1 gwei).');
  log(`Deployer: ${account.address}\nChain: 46630\nBalance: ${formatEther(balance)} test ETH\nPool denomination: ${formatEther(denomination)} test ETH\nTotal deployment fee cap: ${formatEther(budget)} test ETH`);
  if (!broadcast) {
    const nonce = await client.getTransactionCount({ address: account.address, blockTag: 'pending' });
    let nextNonce = nonce;
    for (const name of CONTRACT_ORDER) log(`${name}: ${journal?.contracts[name]?.address ?? getContractAddress({ from: account.address, nonce: BigInt(nextNonce++) })}`);
    log('Preview only. Use --broadcast to deploy. Pool denomination is not deposited by deployment.');
    return journal;
  }
  const lockPath = `${journalPath}.lock`;
  await saveJSON(`${journalPath}.preflight.json`, { chainId: DEPLOYMENT_CHAIN_ID, deployer: account.address, manifestHash: build.manifestHash });
  let lock;
  try { lock = await open(lockPath, 'wx'); }
  catch { throw new Error('Another deployment holds the journal lock.'); }
  try {
    journal = await readJSONIfPresent(journalPath) ?? { version: 1, chainId: DEPLOYMENT_CHAIN_ID, deployer: account.address, denomination: denomination.toString(), manifestHash: build.manifestHash, researchOnly: true, feeCapUsed: '0', contracts: {}, artifactArchive: archive ? await archivePrivacyArtifacts(build) : null };
    ensure(journal.deployer === account.address && journal.manifestHash === build.manifestHash && journal.denomination === denomination.toString() && journal.chainId === DEPLOYMENT_CHAIN_ID, 'Deployment journal changed during preflight.');
    await saveJSON(journalPath, journal);
    for (const name of CONTRACT_ORDER) {
      await assertTestnet(client);
      let step = journal.contracts[name];
      if (!step) {
        const latest = await client.getTransactionCount({ address: account.address, blockTag: 'latest' });
        const nonce = await client.getTransactionCount({ address: account.address, blockTag: 'pending' });
        ensure(nonce === latest, 'Nonce is occupied by another pending transaction. Wait for it before deployment.');
        const args = name === 'QozmoPrivacyPool' ? [denomination, journal.contracts.Poseidon2.address, journal.contracts.Poseidon4.address, journal.contracts.Groth16Verifier.address] : [];
        const data = encodeDeployData({ ...build.contracts[name], args });
        const estimate = await client.estimateGas({ account: account.address, data, value: 0n });
        const gas = estimate * 12n / 10n + 10_000n;
        ensure(gas <= 15_000_000n, `Gas estimate exceeds the per-contract limit: ${name}.`);
        const currentFees = await client.estimateFeesPerGas();
        ensure(currentFees.maxFeePerGas <= maxFeePerGas, 'Gas fee exceeds the configured research deployment limit (CLI default: 1 gwei).');
        const allowance = gas * currentFees.maxFeePerGas;
        ensure(BigInt(journal.feeCapUsed) + allowance <= budget, 'Gas fee budget exhausted. Confirm the journal before increasing the budget.');
        ensure(await client.getBalance({ address: account.address }) >= allowance, 'Insufficient test ETH to cover the next contract deployment.');
        const signed = await wallet.signTransaction({ account, chain, data, nonce, gas, type: 'eip1559', ...currentFees, value: 0n });
        const hash = keccak256(signed);
        step = { status: 'pending', hash, nonce, address: getContractAddress({ from: account.address, nonce: BigInt(nonce) }), feeCap: allowance.toString() };
        journal.contracts[name] = step;
        journal.feeCapUsed = (BigInt(journal.feeCapUsed) + allowance).toString();
        // Persist the transaction hash before sending: an uncertain RPC response must never cause duplicate deployment.
        await saveJSON(journalPath, journal);
        await assertTestnet(client);
        ensure(await client.getTransactionCount({ address: account.address, blockTag: 'pending' }) === nonce, 'Nonce changed before broadcast. Check the pending deployment hash and wallet activity.');
        ensure(await client.sendRawTransaction({ serializedTransaction: signed }) === hash, 'Deployment RPC returned a different transaction hash.');
        log(`${name} submitted: ${hash}`);
      }
      if (step.status === 'confirmed') { await verifyContract(client, journal, build, name); continue; }
      let receipt;
      try { receipt = await client.waitForTransactionReceipt({ hash: step.hash, confirmations: 2, timeout: 120_000 }); }
      catch { throw new Error(`Pending deployment ${name}: ${step.hash}. Check the explorer and rerun; this script will not send it twice.`); }
      ensure(receipt.status === 'success' && receipt.contractAddress?.toLowerCase() === step.address.toLowerCase(), `Deployment failed or address mismatch: ${name}.`);
      const code = await client.getCode({ address: step.address });
      ensure(code && code !== '0x', `Deployment has no runtime code: ${name}.`);
      Object.assign(step, { status: 'confirmed', blockNumber: receipt.blockNumber.toString(), blockHash: receipt.blockHash, gasUsed: receipt.gasUsed.toString(), codeHash: keccak256(code) });
      await saveJSON(journalPath, journal);
      log(`${name} confirmed: ${step.address}`);
    }
    const verified = await verifyDeployment(client, journal, build);
    journal.status = 'verified';
    journal.domain = verified.domain;
    journal.verifiedAt = new Date().toISOString();
    await saveJSON(journalPath, journal);
    log(`Pool verified: ${verified.pool}`);
    return journal;
  } finally { await lock.close(); await rm(lockPath, { force: true }); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await scriptMain(async () => {
    const flags = process.argv.slice(2);
    ensure(flags.every(flag => flag === '--broadcast'), 'Deployment supports only --broadcast; default mode is preview.');
    const env = await deploymentEnvironment();
    const account = deployerAccount(env.WALLET_TESTNET);
    const build = await loadPrivacyArtifacts();
    await deployPrivacy({ account, build, rpc: env.QOZMO_PRIVACY_RPC_URL || RPC_URL, broadcast: flags.includes('--broadcast') });
  });
}
