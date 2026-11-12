import {
  BaseError, createPublicClient, createWalletClient, custom, decodeFunctionResult, encodeFunctionData, erc20Abi, getAddress,
  http, isAddress, parseUnits, toHex, zeroAddress, type Address, type EIP1193Provider, type Hex,
  type PublicClient,
} from 'viem';
import { entryPoint07Abi, type UserOperation } from 'viem/account-abstraction';
import { getWalletNetwork } from '../networks';
import {
  QuantumSafeWallet, bundlerSubmitter, selfSubmitter, checkDeploymentReadiness,
  parseDeploymentManifest, deserializeUserOperation, inspectOperationReceipt,
  type Call, type FeeEstimate, type JournalEntry, type KeyState, type Submitter,
  type OperationReceiptInspection,
} from '../quantum-sdk/index';
import deployment from '../quantum-deployment.json';
import { QUANTUM_CHAIN_ID, QuantumJournal, assertCurrentQuantumRecord, decryptQuantumRecord, type QuantumRecord } from './storage';
import { gatewayBase, managedBundlerUrl } from '../gateway';
import { requestExtensionOrigin } from '../../app-runtime';
import type { TransferExecutionPreview } from '../quantum-sdk/transfer-preview';
import { deriveAccountNotesKey } from '../privacy/account-notes';
import { privacyCallDetails, verifyAccountPrivacyPool } from '../privacy/account-calls';
import type { PrivacyTransaction } from '../privacy/transactions';
import { encodeCalls } from '../quantum-sdk/account';
import { PRIVACY_RESEARCH } from '../privacy/research-deployment';
import type { AccountReceipt } from '../account-activity';
import { ConnectionCheckError, inspectManagedGateway } from '../connection';

export const QUANTUM_NETWORK = getWalletNetwork(QUANTUM_CHAIN_ID);
export const QUANTUM_DEPLOYMENT = parseDeploymentManifest(deployment);
export type QuantumSession = { record: QuantumRecord; wallet: QuantumSafeWallet; client: PublicClient; notesKey?: CryptoKey };
export type QuantumRelay = { submitter: Submitter; label: string; payer?: Address };
export type QuantumToken = { address: Address; symbol: string; decimals: number; balance: bigint };
export type QuantumStatus = { balance: bigint; state: KeyState; entries: JournalEntry[]; pending?: JournalEntry; recoveryExposed: boolean };
export type QuantumReview = Readonly<{
  recordId: string; address: Address; recipient: Address; amount: string; value: bigint;
  token?: Readonly<QuantumToken>; calls: Call[]; operation: UserOperation<'0.7'>;
  fees: FeeEstimate; createdAt: number; relay: QuantumRelay; impact?: Readonly<TransferExecutionPreview>;
}>;
const reviews = new WeakSet<QuantumReview>();
export type QuantumPrivacyReview = Readonly<{
  recordId: string; address: Address; transaction: Readonly<PrivacyTransaction>;
  details: Readonly<ReturnType<typeof privacyCallDetails>>; operation: UserOperation<'0.7'>;
  fees: Readonly<FeeEstimate>; createdAt: number; relay: QuantumRelay;
}>;
const privacyReviews = new WeakSet<QuantumPrivacyReview>();
const timeout = 10_000;

export function quantumErrorMessage(reason: unknown): string {
  if (reason instanceof BaseError) return 'The network or relay could not complete this request. Keep any signed operation and refresh before retrying.';
  const message = reason instanceof Error ? reason.message : 'Qozmo Quantum could not complete this request.';
  return /https?:\/\//i.test(message) ? 'The relay connection is unavailable. Verify its settings and preserve any pending operation.' : message.replace(/Winternitz wallet/gi, 'Qozmo Quantum');
}

export function assertQuantumChain(chainId: number) {
  if (chainId !== QUANTUM_CHAIN_ID) throw new Error('Qozmo Quantum signing is available on Robinhood Testnet (46630) only.');
}

export function quantumPublicClient() {
  return createPublicClient({ chain: QUANTUM_NETWORK.chain, cacheTime: 0, transport: http(QUANTUM_NETWORK.rpcUrl, { timeout, retryCount: 0 }) });
}

/** Runtime pins and factory/EntryPoint links must match the supplied source deployment. */
export async function verifyQuantumDeployment(client: PublicClient = quantumPublicClient()) {
  assertQuantumChain(client.chain?.id ?? await client.getChainId());
  const report = await checkDeploymentReadiness(client, { manifest: QUANTUM_DEPLOYMENT });
  const infrastructure = report.checks.filter(check => check.name !== 'bundler');
  if (infrastructure.length !== 7 || infrastructure.some(check => !check.ok)) throw new Error('Qozmo Quantum deployment could not be verified on this network. Signing is blocked. Retry the connection check.');
  return { ...report, ready: true, checks: infrastructure };
}

export async function unlockQuantumSession(record: QuantumRecord, password: string): Promise<QuantumSession> {
  assertQuantumChain(record.chainId); assertCurrentQuantumRecord(record);
  const seed = await decryptQuantumRecord(record, password);
  const client = quantumPublicClient();
  const wallet = await QuantumSafeWallet.load({ seed, publicClient: client, factory: QUANTUM_DEPLOYMENT.factory,
    accountImplementation: QUANTUM_DEPLOYMENT.accountImplementation, entryPoint: QUANTUM_DEPLOYMENT.entryPoint,
    salt: BigInt(record.salt), journal: new QuantumJournal(record), restoreBlocked: record.restored });
  if (wallet.address !== record.address) throw new Error('The quantum address does not match the encrypted account.');
  assertCurrentQuantumRecord(record);
  const notesKey = await deriveAccountNotesKey(seed, record.address);
  assertCurrentQuantumRecord(record);
  return { record, wallet, client, notesKey };
}

export function assertQuantumSigner(session: QuantumSession) {
  assertQuantumChain(session.record.chainId);
  if (session.record.restored || session.wallet.signingBlocked) throw new Error('This imported Qozmo Quantum account is read-only. A recovery phrase or backup cannot prove complete one-time-key history. Keep the original signing device.');
  assertCurrentQuantumRecord(session.record);
}

export async function readQuantumStatus(session: QuantumSession): Promise<QuantumStatus> {
  assertQuantumChain(session.record.chainId);
  await verifyQuantumDeployment(session.client);
  const [sync, balance, state] = await Promise.all([session.wallet.sync(), session.wallet.getBalance(), session.wallet.getKeyState()]);
  if (!Number.isSafeInteger(state.keyIndex) || state.keyIndex < 0 || state.keyIndex >= 2 ** 31 || !Number.isSafeInteger(state.recoveryIndex) || state.recoveryIndex < 0) throw new Error('Unsupported quantum key state. Signing is blocked.');
  return { balance, state, entries: await session.wallet.journal.list(), pending: sync.pending, recoveryExposed: sync.recoveryExposed };
}

export function validateBundlerUrl(input: string): string {
  const url = new URL(input.trim());
  if (url.protocol !== 'https:' || url.username || url.password || url.hash) throw new Error('Use an HTTPS bundler endpoint without URL user-info or fragments.');
  return url.href;
}

export async function connectQuantumBundler(input: string): Promise<QuantumRelay> {
  const url = validateBundlerUrl(input);
  await requestExtensionOrigin(url);
  const client = quantumPublicClient();
  await verifyQuantumDeployment(client);
  const report = await checkDeploymentReadiness(client, { manifest: QUANTUM_DEPLOYMENT, bundlerUrl: url });
  if (!report.ready) throw new Error('The bundler must report Robinhood Testnet and EntryPoint v0.7. Check the endpoint, provider CORS settings and connection.');
  return { submitter: bundlerSubmitter({ url, entryPoint: QUANTUM_DEPLOYMENT.entryPoint, client }), label: 'ERC-4337 bundler' };
}

export async function connectQuantumManagedBundler(signal?: AbortSignal): Promise<QuantumRelay> {
  const health = await inspectManagedGateway(signal);
  if (health.status !== 'connected') throw new ConnectionCheckError(health);
  const url = managedBundlerUrl(); const client = quantumPublicClient(); await verifyQuantumDeployment(client);
  const results = await Promise.all(['eth_chainId','eth_supportedEntryPoints'].map(async (method,id) => {
    const response = await fetch(url,{ method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id,method,params:[]}),credentials:'omit',cache:'no-store',signal:signal ? AbortSignal.any([signal,AbortSignal.timeout(12000)]) : AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error('The managed bundler check failed.');
    const body = await response.json(); if(body.id !== id || body.jsonrpc !== '2.0' || body.error) throw new Error('The managed bundler returned an invalid check.'); return body.result;
  }));
  if (results[0] !== toHex(QUANTUM_CHAIN_ID) || !Array.isArray(results[1]) || !results[1].some((p:unknown)=>typeof p==='string'&&p.toLowerCase()===QUANTUM_DEPLOYMENT.entryPoint.toLowerCase())) throw new Error('The managed bundler network or EntryPoint changed.');
  signal?.throwIfAborted();
  return { submitter:bundlerSubmitter({url,entryPoint:QUANTUM_DEPLOYMENT.entryPoint,client}),label:'Qozmo managed bundler' };
}

export async function connectQuantumBrowserRelay(): Promise<QuantumRelay> {
  const provider = (window as unknown as { ethereum?: EIP1193Provider }).ethereum;
  if (!provider) throw new Error('No browser wallet was found. Use a supported wallet extension or connect your own ERC-4337 bundler.');
  const accounts = await provider.request({ method: 'eth_requestAccounts' }) as string[];
  if (!accounts[0] || !isAddress(accounts[0], { strict: true })) throw new Error('Choose a valid gas-payer account in your browser wallet.');
  await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: toHex(QUANTUM_CHAIN_ID) }] });
  const actual = await provider.request({ method: 'eth_chainId' });
  if (typeof actual !== 'string' || BigInt(actual) !== BigInt(QUANTUM_CHAIN_ID)) throw new Error('The gas-payer wallet must be on Robinhood Testnet.');
  const client = quantumPublicClient(); await verifyQuantumDeployment(client);
  const payer = getAddress(accounts[0]);
  const walletClient = createWalletClient({ chain: QUANTUM_NETWORK.chain, account: payer, transport: custom(provider) });
  return { submitter: selfSubmitter({ entryPoint: QUANTUM_DEPLOYMENT.entryPoint, publicClient: client, walletClient }), label: 'Browser wallet gas payer', payer };
}

export async function readQuantumToken(session: QuantumSession, input: string): Promise<QuantumToken> {
  if (!isAddress(input.trim(), { strict: true }) || input.trim().toLowerCase() === zeroAddress) throw new Error('Enter a valid token contract on Robinhood Testnet.');
  assertQuantumChain(await session.client.getChainId());
  const address = getAddress(input.trim());
  const blockNumber = await session.client.getBlockNumber({ cacheTime: 0 });
  const [code, symbol, decimals, balance] = await Promise.all([
    session.client.getCode({ address, blockNumber }),
    session.client.readContract({ address, abi: erc20Abi, functionName: 'symbol', blockNumber }),
    session.client.readContract({ address, abi: erc20Abi, functionName: 'decimals', blockNumber }),
    session.client.readContract({ address, abi: erc20Abi, functionName: 'balanceOf', args: [session.record.address], blockNumber }),
  ]);
  if (!code || code === '0x' || typeof symbol !== 'string' || !symbol.trim() || symbol.length > 32 || /[\u0000-\u001f\u007f]/.test(symbol) || !Number.isInteger(decimals) || decimals < 0 || decimals > 36) throw new Error('The token returned unsupported metadata. No transfer was prepared.');
  return Object.freeze({ address, symbol, decimals, balance });
}

export function quantumAmount(input: string, decimals: number) {
  const text = input.trim();
  if (text.length > 120 || !/^(0|[1-9]\d*)(\.\d+)?$/.test(text) || (text.split('.')[1]?.length ?? 0) > decimals) throw new Error('Enter a positive decimal amount within the asset precision.');
  const value = parseUnits(text, decimals);
  if (value <= 0n || value >= 2n ** 256n) throw new Error('The transfer amount is outside the supported range.');
  return value;
}

async function executionCheck(session: QuantumSession, review: Pick<QuantumReview, 'recipient' | 'value' | 'token' | 'fees'>) {
  const preview = await session.wallet.previewTransfer({ recipient: review.recipient, amount: review.value, token: review.token?.address, maxFee: review.fees.max });
  if (preview.status !== 'passed' && preview.status !== 'not-deployed') throw new Error(preview.message);
  // Even before account deployment, eth_call can simulate the token directly from its address.
  // execute() does not enforce ERC-20's return boolean; reject a false result before signing.
  if (review.token && preview.status === 'not-deployed') {
    const data = encodeFunctionData({ abi: erc20Abi, functionName: 'transfer', args: [review.recipient, review.value] });
    const response = await session.client.call({ account: session.record.address, to: review.token.address, data });
    if (response.data && response.data !== '0x' && !decodeFunctionResult({ abi: erc20Abi, functionName: 'transfer', data: response.data })) throw new Error('The token contract returned false for this transfer. No signature was created.');
  }
  return preview;
}

export async function prepareQuantumTransfer(session: QuantumSession, relay: QuantumRelay, request: { recipient: string; amount: string; tokenAddress?: string }, signal?: AbortSignal): Promise<QuantumReview> {
  assertQuantumSigner(session); signal?.throwIfAborted();
  await verifyQuantumDeployment(session.client);
  const sync = await session.wallet.sync();
  if (sync.pending) throw new Error('A signed operation is pending. Reconcile it or retry its exact bytes before creating another transfer.');
  if (sync.recoveryExposed) throw new Error('A recovery key was exposed. Preserve your history and use the original account recovery procedure before further spending.');
  if (!isAddress(request.recipient.trim(), { strict: true }) || request.recipient.trim().toLowerCase() === zeroAddress) throw new Error('Enter a valid non-zero recipient address, including its checksum.');
  const recipient = getAddress(request.recipient.trim());
  const token = request.tokenAddress ? await readQuantumToken(session, request.tokenAddress) : undefined;
  const value = quantumAmount(request.amount, token?.decimals ?? 18);
  const calls: Call[] = [Object.freeze(token
    ? { to: token.address, value: 0n, data: encodeFunctionData({ abi: erc20Abi, functionName: 'transfer', args: [recipient, value] }) }
    : { to: recipient, value, data: '0x' as Hex })];
  const operation = await session.wallet.prepare(calls, relay.submitter);
  const fees = await session.wallet.quote(operation);
  const details = { recordId: session.record.id, address: session.record.address, recipient, amount: request.amount.trim(), value,
    token, calls: Object.freeze(calls) as unknown as Call[], operation: Object.freeze(operation), fees: Object.freeze(fees), createdAt: Date.now(), relay };
  const impact = await executionCheck(session, details); signal?.throwIfAborted(); assertQuantumSigner(session);
  const review: QuantumReview = Object.freeze({ ...details, impact: Object.freeze(impact) });
  reviews.add(review); return review;
}

export function assertQuantumReview(session: QuantumSession, review: QuantumReview, now = Date.now()) {
  assertQuantumSigner(session);
  if (!reviews.has(review) || review.recordId !== session.record.id || review.address !== session.record.address || now < review.createdAt || now - review.createdAt > 120_000) throw new Error('This transfer review is missing, expired or belongs to another account. Review the transfer again.');
}

async function submitSigned(session: QuantumSession, operation: UserOperation<'0.7'>, relay: QuantumRelay, keyIndex: number, signal?: AbortSignal, progress?: (value: string) => void) {
  signal?.throwIfAborted(); assertQuantumSigner(session);
  progress?.('Submitting signed operation…');
  // A transport failure leaves the signed bytes in the write-ahead journal. Never clear or re-sign them.
  const submitted = await relay.submitter.submit(operation);
  progress?.('Waiting for verified execution…');
  const result = await submitted.wait();
  const inspection = await inspectOperationReceipt(session.client, { chainId: QUANTUM_CHAIN_ID, account: session.record.address,
    entryPoint: QUANTUM_DEPLOYMENT.entryPoint, transactionHash: result.transactionHash, userOpHash: result.userOpHash });
  if (inspection.status !== 'succeeded' && inspection.status !== 'execution-reverted') throw new Error('Execution could not be verified. Preserve the pending operation and check the explorer.');
  const previous = await session.wallet.journal.get(keyIndex);
  if (previous) await session.wallet.journal.put({ ...previous, status: 'confirmed', transactionHash: result.transactionHash });
  return { ...result, success: inspection.status === 'succeeded', inspection };
}

export async function confirmQuantumTransfer(session: QuantumSession, review: QuantumReview, password: string, signal?: AbortSignal, progress?: (value: string) => void) {
  return browserOperationLock(session)(async () => {
    assertQuantumReview(session, review); signal?.throwIfAborted();
    await decryptQuantumRecord(session.record, password);
    await verifyQuantumDeployment(session.client);
    const sync = await session.wallet.sync();
    if (sync.pending || sync.recoveryExposed) throw new Error('Quantum key state changed. Reconcile the account before signing.');
    const fresh = await session.wallet.prepare(review.calls, review.relay.submitter);
    if (fresh.nonce !== review.operation.nonce || fresh.factory !== review.operation.factory || fresh.callData !== review.operation.callData ||
      fresh.maxFeePerGas > review.operation.maxFeePerGas || fresh.maxPriorityFeePerGas > review.operation.maxPriorityFeePerGas ||
      fresh.callGasLimit > review.operation.callGasLimit || fresh.verificationGasLimit > review.operation.verificationGasLimit || fresh.preVerificationGas > review.operation.preVerificationGas) throw new Error('Fees, deployment or nonce changed. Review the transfer again.');
    await executionCheck(session, review);
    assertQuantumReview(session, review); signal?.throwIfAborted();
    progress?.('Signing with the next one-time key…');
    const signed = await session.wallet.sign(review.operation);
    reviews.delete(review);
    return submitSigned(session, signed, review.relay, sync.keyIndex, signal, progress);
  });
}

function browserOperationLock(session: QuantumSession) {
  return async <T>(work: () => Promise<T>) => {
    if (!navigator.locks) throw new Error('Quantum transactions need Web Locks over HTTPS or localhost.');
    return navigator.locks.request(`qozmo.quantum.operation:${session.record.initialPublicKeyHash}`, work);
  };
}

async function privacyExecutionCheck(session: QuantumSession, tx: PrivacyTransaction, fees: FeeEstimate) {
  const details = privacyCallDetails(tx, session.record.address);
  const block = await verifyAccountPrivacyPool(session.client);
  // The research event scanner is bounded. Stop new funding before its range expires.
  if (details.kind === 'deposit' && block - PRIVACY_RESEARCH.deployBlock > 999_000n) throw new Error('New deposits are paused: this research pool needs a reviewed historical indexer before more funding.');
  if (await session.wallet.getBalance() < tx.value + fees.max) throw new Error('Fund your Qozmo account with test ETH for the deposit and maximum account gas fee.');
  const call = { to: tx.to, value: tx.value, data: tx.data };
  const code = await session.client.getCode({ address: session.record.address });
  if (code && code !== '0x') {
    await session.client.call({ account: QUANTUM_DEPLOYMENT.entryPoint, to: session.record.address, data: encodeCalls([call]) });
  } else {
    await session.client.call({ account: session.record.address, ...call });
  }
}

/** Same WOTS journal and operation lock as public transfers; no second signing wallet. */
export async function prepareQuantumPrivacy(session: QuantumSession, relay: QuantumRelay, transaction: PrivacyTransaction, signal?: AbortSignal): Promise<QuantumPrivacyReview> {
  assertQuantumSigner(session); signal?.throwIfAborted();
  const tx = Object.freeze({ ...transaction });
  const details = Object.freeze(privacyCallDetails(tx, session.record.address));
  await verifyQuantumDeployment(session.client);
  const sync = await session.wallet.sync();
  if (sync.pending || sync.recoveryExposed) throw new Error('Reconcile the pending operation or exposed recovery key before using Privacy Ring.');
  const operation = await session.wallet.prepare([{ to: tx.to, value: tx.value, data: tx.data }], relay.submitter);
  const fees = await session.wallet.quote(operation);
  await privacyExecutionCheck(session, tx, fees);
  signal?.throwIfAborted(); assertQuantumSigner(session);
  const review = Object.freeze({ recordId: session.record.id, address: session.record.address, transaction: tx, details, operation: Object.freeze(operation), fees: Object.freeze(fees), createdAt: Date.now(), relay });
  privacyReviews.add(review); return review;
}
export function assertQuantumPrivacyReview(session: QuantumSession, review: QuantumPrivacyReview, now = Date.now()) {
  assertQuantumSigner(session);
  if (!privacyReviews.has(review) || review.recordId !== session.record.id || review.address !== session.record.address || now < review.createdAt || now - review.createdAt > 120_000) throw new Error('This Privacy Ring review expired or belongs to another wallet. Review again.');
}
export async function confirmQuantumPrivacy(session: QuantumSession, review: QuantumPrivacyReview, password: string, signal?: AbortSignal, progress?: (message: string) => void) {
  return browserOperationLock(session)(async () => {
    assertQuantumPrivacyReview(session, review); signal?.throwIfAborted();
    await decryptQuantumRecord(session.record, password); await verifyQuantumDeployment(session.client);
    const sync = await session.wallet.sync();
    if (sync.pending || sync.recoveryExposed) throw new Error('Account key state changed. Reconcile before signing.');
    const tx = review.transaction;
    const fresh = await session.wallet.prepare([{ to: tx.to, value: tx.value, data: tx.data }], review.relay.submitter);
    if (fresh.nonce !== review.operation.nonce || fresh.factory !== review.operation.factory || fresh.factoryData !== review.operation.factoryData || fresh.callData !== review.operation.callData ||
      fresh.maxFeePerGas > review.operation.maxFeePerGas || fresh.maxPriorityFeePerGas > review.operation.maxPriorityFeePerGas || fresh.callGasLimit > review.operation.callGasLimit || fresh.verificationGasLimit > review.operation.verificationGasLimit || fresh.preVerificationGas > review.operation.preVerificationGas) throw new Error('Fees, deployment or nonce changed. Review the privacy operation again.');
    await privacyExecutionCheck(session, tx, review.fees);
    assertQuantumPrivacyReview(session, review); signal?.throwIfAborted();
    progress?.('Signing Privacy Ring with your Qozmo account’s next one-time key…');
    const signed = await session.wallet.sign(review.operation);
    privacyReviews.delete(review);
    return submitSigned(session, signed, review.relay, sync.keyIndex, signal, progress);
  });
}

export async function retryQuantumPending(session: QuantumSession, relay: QuantumRelay, password: string, signal?: AbortSignal, progress?: (value: string) => void) {
  return browserOperationLock(session)(async () => {
    assertQuantumSigner(session); signal?.throwIfAborted();
    await decryptQuantumRecord(session.record, password); await verifyQuantumDeployment(session.client);
    const sync = await session.wallet.sync();
    if (!sync.pending) throw new Error('No current pending operation. Refresh the account.');
    const op = deserializeUserOperation(sync.pending.userOperation);
    return submitSigned(session, op, relay, sync.pending.keyIndex, signal, progress);
  });
}

export async function inspectQuantumEntry(session: QuantumSession, entry: JournalEntry): Promise<AccountReceipt | null> {
  if (!entry.transactionHash) return null;
  const inspection = await inspectOperationReceipt(session.client, { chainId: QUANTUM_CHAIN_ID, account: session.record.address,
    entryPoint: QUANTUM_DEPLOYMENT.entryPoint, transactionHash: entry.transactionHash, userOpHash: entry.userOpHash });
  if (!inspection.blockNumber || !['succeeded','execution-reverted'].includes(inspection.status)) return inspection;
  const head = await session.client.getBlockNumber({ cacheTime: 0 });
  const included = BigInt(inspection.blockNumber);
  if (head < included) return { ...inspection, status: 'unverified', reason: 'noncanonical-block' };
  const confirmations = head - included + 1n;
  return { ...inspection, confirmations: Number(confirmations > BigInt(Number.MAX_SAFE_INTEGER) ? BigInt(Number.MAX_SAFE_INTEGER) : confirmations) };
}
