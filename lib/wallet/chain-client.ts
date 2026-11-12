import {
  BaseError,
  TransactionReceiptNotFoundError,
  createPublicClient,
  createWalletClient,
  getAddress,
  http,
  isAddress,
  keccak256,
  parseUnits,
  zeroAddress,
  type Address,
  type Hash,
  type LocalAccount,
} from 'viem';
import { estimateL1Fee, estimateOperatorFee } from 'viem/op-stack';
import { assertWalletNetwork, type WalletNetwork } from './networks';

const ZERO = BigInt(0);
const ONE = BigInt(1);
const MAX_UINT256 = (ONE << BigInt(256)) - ONE;
const RPC_TIMEOUT_MS = 10_000;
const REVIEW_LIFETIME_MS = 120_000;
const MIN_NATIVE_GAS = BigInt(21_000);

export type PreparedNativeTransfer = Readonly<{
  chainId: number;
  from: Address;
  to: Address;
  value: bigint;
  gas: bigint;
  gasPrice: bigint;
  /** Estimated fee budget, including the OP Stack L1/operator fee reserve when relevant. */
  maxFee: bigint;
  balance: bigint;
  nonce: number;
  additionalFee: bigint;
  preparedAt: number;
}>;

export type TransferReceipt =
  | { status: 'pending'; transactionHash: Hash; blockNumber?: undefined }
  | { status: 'succeeded' | 'reverted'; transactionHash: Hash; blockNumber: bigint };

type TransferRequest = { to: string; amount: string };
type TransferState = { nonce: number; gas: bigint; gasPrice: bigint; balance: bigint; additionalFee: bigint };

export class TransferReviewError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransferReviewError';
  }
}

/** A submission can reach an RPC even if the HTTP response is lost. Never retry it automatically. */
export class TransferBroadcastError extends Error {
  readonly transactionHash: Hash;

  constructor(transactionHash: Hash) {
    super('The RPC did not confirm submission. Check this transaction in the explorer before trying again.');
    this.name = 'TransferBroadcastError';
    this.transactionHash = transactionHash;
  }
}

export function assertNetworkChainId(network: WalletNetwork, actualChainId: number): void {
  const canonical = assertWalletNetwork(network);
  if (actualChainId !== canonical.id) {
    throw new Error(`The RPC returned chain ${actualChainId}, not ${canonical.label}. No transaction was signed.`);
  }
}

export function assertTestnetTransfer(network: WalletNetwork): void {
  const canonical = assertWalletNetwork(network);
  if (canonical.kind !== 'testnet') {
    throw new Error('Mainnet accounts are read-only in this release. Choose a test network to send.');
  }
}

function validateAddress(value: string, label: string): Address {
  const trimmed = value.trim();
  if (!isAddress(trimmed, { strict: true })) {
    throw new Error(`Enter a valid ${label} address. Check the spelling and checksum.`);
  }
  const address = getAddress(trimmed);
  if (address === zeroAddress) throw new Error(`The ${label} address cannot be the zero address.`);
  return address;
}

export function validateTransfer({ to, amount }: TransferRequest): { to: Address; value: bigint } {
  const destination = validateAddress(to, 'recipient');
  const normalized = amount.trim();
  // Validate before parseUnits, whose rounding must not silently alter the user's requested amount.
  if (normalized.length > 100 || !/^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/.test(normalized)) {
    throw new Error('Enter a decimal amount with at most 18 decimal places.');
  }
  const value = parseUnits(normalized, 18);
  if (value <= ZERO || value > MAX_UINT256) throw new Error('Enter an amount greater than zero and within the network limit.');
  return { to: destination, value };
}

function publicClient(network: WalletNetwork) {
  const canonical = assertWalletNetwork(network);
  return createPublicClient({
    chain: canonical.chain,
    cacheTime: 0,
    batch: { multicall: false },
    transport: http(canonical.rpcUrl, { timeout: RPC_TIMEOUT_MS, retryCount: 0, batch: false }),
  });
}

async function verifiedClient(network: WalletNetwork) {
  const client = publicClient(network);
  assertNetworkChainId(network, await client.getChainId());
  return client;
}

export async function fetchNativeBalance(network: WalletNetwork, address: Address): Promise<{ balance: bigint; blockNumber: bigint }> {
  const account = validateAddress(address, 'wallet');
  const client = await verifiedClient(network);
  const blockNumber = await client.getBlockNumber({ cacheTime: 0 });
  const balance = await client.getBalance({ address: account, blockNumber });
  return { balance, blockNumber };
}

function buffered(value: bigint, percent: number): bigint {
  return (value * BigInt(100 + percent) + BigInt(99)) / BigInt(100);
}

async function extraRollupFee(
  network: WalletNetwork,
  client: ReturnType<typeof publicClient>,
  request: { account: Address; to: Address; value: bigint },
): Promise<bigint> {
  if (network.feeModel !== 'op-stack') return ZERO;
  // Unlike Arbitrum's gas estimate, OP Stack execution gas does not include these charges.
  // Both calls are mandatory: a failure must not be presented as a zero network fee.
  const [l1Fee, operatorFee] = await Promise.all([
    estimateL1Fee(client, request),
    estimateOperatorFee(client, request),
  ]);
  return l1Fee + operatorFee;
}

export async function prepareNativeTransfer({
  network,
  account,
  to,
  amount,
}: TransferRequest & { network: WalletNetwork; account: Address }): Promise<PreparedNativeTransfer> {
  const canonical = assertWalletNetwork(network);
  const from = validateAddress(account, 'sender');
  const transfer = validateTransfer({ to, amount });
  const client = await verifiedClient(canonical);
  const request = { account: from, to: transfer.to, value: transfer.value };
  const [balance, nonce, marketGasPrice] = await Promise.all([
    client.getBalance({ address: from, blockTag: 'pending' }),
    client.getTransactionCount({ address: from, blockTag: 'pending' }),
    client.getGasPrice(),
  ]);
  if (marketGasPrice <= ZERO || !Number.isSafeInteger(nonce) || nonce < 0) {
    throw new Error('The RPC returned an invalid fee or account nonce. Try a fresh estimate.');
  }
  if (balance < transfer.value) throw new Error(`Insufficient ${canonical.symbol} balance for this amount.`);
  const gasPrice = buffered(marketGasPrice, 10);
  const [gasEstimate, rollupFee] = await Promise.all([
    client.estimateGas({ ...request, nonce, gasPrice }),
    extraRollupFee(canonical, client, request),
  ]);
  if (gasEstimate < MIN_NATIVE_GAS || rollupFee < ZERO) {
    throw new Error('The RPC returned an invalid gas estimate. Try again later.');
  }
  const gas = buffered(gasEstimate, 20);
  const additionalFee = buffered(rollupFee, 25);
  const maxFee = gas * gasPrice + additionalFee;
  if (balance < transfer.value + maxFee) {
    throw new Error(`Leave enough ${canonical.symbol} to cover the estimated network fee.`);
  }
  return Object.freeze({
    chainId: canonical.id,
    from,
    ...transfer,
    gas,
    gasPrice,
    maxFee,
    balance,
    nonce,
    additionalFee,
    preparedAt: Date.now(),
  });
}

/** Reused by the signer and pure tests; no RPC or account signature is performed here. */
export function assertPreparedTransfer({
  network,
  address,
  prepared,
  now = Date.now(),
}: { network: WalletNetwork; address: Address; prepared: PreparedNativeTransfer; now?: number }): void {
  const canonical = assertWalletNetwork(network);
  const from = validateAddress(address, 'sender');
  const destination = validateAddress(prepared.to, 'recipient');
  if (prepared.chainId !== canonical.id || getAddress(prepared.from) !== from) {
    throw new TransferReviewError('The wallet or network changed. Review the transfer again.');
  }
  if (
    prepared.to !== destination ||
    typeof prepared.value !== 'bigint' || prepared.value <= ZERO || prepared.value > MAX_UINT256 ||
    typeof prepared.gas !== 'bigint' || prepared.gas < MIN_NATIVE_GAS ||
    typeof prepared.gasPrice !== 'bigint' || prepared.gasPrice <= ZERO ||
    typeof prepared.additionalFee !== 'bigint' || prepared.additionalFee < ZERO ||
    typeof prepared.maxFee !== 'bigint' || prepared.maxFee !== prepared.gas * prepared.gasPrice + prepared.additionalFee ||
    !Number.isSafeInteger(prepared.nonce) || prepared.nonce < 0
  ) {
    throw new TransferReviewError('The transfer review is invalid. Prepare it again.');
  }
  if (!Number.isFinite(prepared.preparedAt) || prepared.preparedAt > now || now - prepared.preparedAt > REVIEW_LIFETIME_MS) {
    throw new TransferReviewError('This fee quote has expired. Review the transfer again.');
  }
}

export function assertReviewStillCurrent(prepared: PreparedNativeTransfer, current: TransferState): void {
  if (current.nonce !== prepared.nonce) {
    throw new TransferReviewError('The account nonce changed. Review the transfer again before signing.');
  }
  if (current.gas > prepared.gas || current.gasPrice > prepared.gasPrice || current.additionalFee > prepared.additionalFee) {
    throw new TransferReviewError('The network fee increased. Review an updated estimate before signing.');
  }
  if (current.balance < prepared.value + prepared.maxFee) {
    throw new TransferReviewError('The balance changed and no longer covers the amount plus fee.');
  }
}

const activeBroadcasts = new Set<string>();

export async function broadcastNativeTransfer({
  network,
  account,
  prepared,
}: { network: WalletNetwork; account: LocalAccount; prepared: PreparedNativeTransfer }): Promise<Hash> {
  // This product gate is enforced before RPC access and before any signing operation.
  assertTestnetTransfer(network);
  assertPreparedTransfer({ network, address: account.address, prepared });
  const canonical = assertWalletNetwork(network);
  const lock = `${canonical.id}:${account.address.toLowerCase()}`;
  if (activeBroadcasts.has(lock)) throw new TransferReviewError('A transfer is already being submitted from this account.');
  activeBroadcasts.add(lock);
  try {
    const client = await verifiedClient(canonical);
    const request = { account: prepared.from, to: prepared.to, value: prepared.value };
    const [nonce, gas, gasPrice, balance, additionalFee] = await Promise.all([
      client.getTransactionCount({ address: prepared.from, blockTag: 'pending' }),
      client.estimateGas({ ...request, nonce: prepared.nonce, gasPrice: prepared.gasPrice }),
      client.getGasPrice(),
      client.getBalance({ address: prepared.from, blockTag: 'pending' }),
      extraRollupFee(canonical, client, request),
    ]);
    assertReviewStillCurrent(prepared, { nonce, gas, gasPrice, balance, additionalFee });
    assertNetworkChainId(canonical, await client.getChainId());
    assertPreparedTransfer({ network: canonical, address: account.address, prepared });

    const walletClient = createWalletClient({
      account,
      chain: canonical.chain,
      transport: http(canonical.rpcUrl, { timeout: RPC_TIMEOUT_MS, retryCount: 0, batch: false }),
    });
    // Every signed field is the exact reviewed value. No RPC can supply calldata or approvals.
    const serializedTransaction = await walletClient.signTransaction({
      account,
      chain: canonical.chain,
      type: 'legacy',
      to: prepared.to,
      value: prepared.value,
      nonce: prepared.nonce,
      gas: prepared.gas,
      gasPrice: prepared.gasPrice,
      data: '0x',
    });
    const expectedHash = keccak256(serializedTransaction);
    try {
      const hash = await client.sendRawTransaction({ serializedTransaction });
      if (hash.toLowerCase() !== expectedHash.toLowerCase()) throw new TransferBroadcastError(expectedHash);
      return hash;
    } catch {
      // Do not retry a raw submission: it may already have reached the network.
      throw new TransferBroadcastError(expectedHash);
    }
  } finally {
    activeBroadcasts.delete(lock);
  }
}

export async function getTransferReceipt(network: WalletNetwork, hash: Hash): Promise<TransferReceipt> {
  if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) throw new Error('Invalid transaction hash.');
  const client = await verifiedClient(network);
  try {
    const receipt = await client.getTransactionReceipt({ hash });
    return {
      status: receipt.status === 'success' ? 'succeeded' : 'reverted',
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    const missing = error instanceof TransactionReceiptNotFoundError ||
      (error instanceof BaseError && error.walk((cause) => cause instanceof TransactionReceiptNotFoundError) instanceof TransactionReceiptNotFoundError);
    if (missing) return { status: 'pending', transactionHash: hash };
    throw error;
  }
}
