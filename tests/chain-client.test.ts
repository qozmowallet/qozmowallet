import assert from 'node:assert/strict';
import test from 'node:test';
import { getAddress, type Address, type LocalAccount } from 'viem';
import {
  assertNetworkChainId,
  assertPreparedTransfer,
  assertReviewStillCurrent,
  assertTestnetTransfer,
  broadcastNativeTransfer,
  validateTransfer,
  type PreparedNativeTransfer,
} from '../lib/wallet/chain-client';
import { DEFAULT_NETWORK_ID, WALLET_NETWORKS, getWalletNetwork, networkExplorerAddress, networkExplorerTx } from '../lib/wallet/networks';

const sender = getAddress('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266');
const recipient = getAddress('0x70997970c51812dc3a010c7d01b50e0d17dc79c8');
const network = getWalletNetwork(11155111);
const time = 1_800_000_000_000;
const prepared: PreparedNativeTransfer = {
  chainId: network.id,
  from: sender,
  to: recipient,
  value: BigInt('100000000000000000'),
  gas: BigInt(25_200),
  gasPrice: BigInt('2000000000'),
  maxFee: BigInt('50400000000000'),
  additionalFee: BigInt(0),
  balance: BigInt('1000000000000000000'),
  nonce: 3,
  preparedAt: time,
};

test('network registry defaults to Robinhood mainnet and keeps all nine chain IDs distinct', () => {
  assert.equal(DEFAULT_NETWORK_ID, 4663);
  assert.equal(getWalletNetwork(DEFAULT_NETWORK_ID).kind, 'mainnet');
  assert.equal(getWalletNetwork(4663).rpcUrl, 'https://rpc.mainnet.chain.robinhood.com');
  assert.equal(WALLET_NETWORKS.length, 9);
  assert.equal(new Set(WALLET_NETWORKS.map((item) => item.id)).size, 9);
  assert.equal(getWalletNetwork(46630).rpcUrl, 'https://rpc.testnet.chain.robinhood.com');
  assert.equal(getWalletNetwork(137).symbol, 'POL');
  assert.throws(() => getWalletNetwork(9999999), /supported/);
});

test('valid native amounts preserve all 18 decimal digits without rounding', () => {
  assert.deepEqual(validateTransfer({ to: recipient.toLowerCase(), amount: '0.000000000000000001' }), { to: recipient, value: BigInt(1) });
  assert.equal(validateTransfer({ to: recipient, amount: ' 1.234567890123456789 ' }).value, BigInt('1234567890123456789'));
});

test('transfer validation rejects invalid checksum, malformed and zero recipients', () => {
  for (const to of ['0x0', 'alice.eth', '0x0000000000000000000000000000000000000000', recipient.replace('C', 'c')]) {
    assert.throws(() => validateTransfer({ to, amount: '1' }), /address|checksum/);
  }
});

test('transfer amounts reject zero, exponent notation, negatives and excess precision', () => {
  for (const amount of ['', '0', '0.000000000000000000', '-1', '+1', '1e3', '1,000', '01', '.5', '1.', '0.0000000000000000001', '1 2']) {
    assert.throws(() => validateTransfer({ to: recipient, amount }), /amount|decimal/);
  }
  assert.throws(() => validateTransfer({ to: recipient, amount: '9'.repeat(80) }), /network limit/);
});

test('chain checks reject RPC identity mismatch and forged network descriptors', () => {
  assert.doesNotThrow(() => assertNetworkChainId(network, network.id));
  assert.throws(() => assertNetworkChainId(network, 1), /RPC returned chain/);
  assert.throws(() => assertNetworkChainId({ ...network, rpcUrl: 'https://example.invalid' }, network.id), /configuration changed/);
  assert.throws(() => assertTestnetTransfer({ ...getWalletNetwork(1), kind: 'testnet' }), /configuration changed/);
});

test('review binds network, account, amount and fee budget and expires after two minutes', () => {
  assert.doesNotThrow(() => assertPreparedTransfer({ network, address: sender, prepared, now: time }));
  assert.throws(() => assertPreparedTransfer({ network: getWalletNetwork(84532), address: sender, prepared, now: time }), /network changed/);
  assert.throws(() => assertPreparedTransfer({ network, address: recipient, prepared, now: time }), /wallet or network changed/);
  assert.throws(() => assertPreparedTransfer({ network, address: sender, prepared: { ...prepared, value: BigInt(0) }, now: time }), /invalid/);
  assert.throws(() => assertPreparedTransfer({ network, address: sender, prepared: { ...prepared, maxFee: BigInt(1) }, now: time }), /invalid/);
  assert.throws(() => assertPreparedTransfer({ network, address: sender, prepared, now: time + 120_001 }), /expired/);
  assert.throws(() => assertPreparedTransfer({ network, address: sender, prepared, now: time - 1 }), /expired/);
});

test('fresh network state cannot silently change the reviewed nonce or increase its fee', () => {
  const current = { nonce: prepared.nonce, gas: BigInt(21_000), gasPrice: BigInt('1900000000'), balance: prepared.balance, additionalFee: BigInt(0) };
  assert.doesNotThrow(() => assertReviewStillCurrent(prepared, current));
  assert.throws(() => assertReviewStillCurrent(prepared, { ...current, nonce: 4 }), /nonce changed/);
  assert.throws(() => assertReviewStillCurrent(prepared, { ...current, gasPrice: prepared.gasPrice + BigInt(1) }), /fee increased/);
  assert.throws(() => assertReviewStillCurrent(prepared, { ...current, gas: prepared.gas + BigInt(1) }), /fee increased/);
  assert.throws(() => assertReviewStillCurrent(prepared, { ...current, additionalFee: BigInt(1) }), /fee increased/);
  assert.throws(() => assertReviewStillCurrent(prepared, { ...current, balance: prepared.value }), /balance changed/);
});

test('mainnet broadcasting is blocked before RPC, local signing or a fabricated testnet flag', async () => {
  let signed = false;
  const account = {
    address: sender,
    signTransaction: async () => { signed = true; throw new Error('Signing must never run'); },
  } as unknown as LocalAccount;
  await assert.rejects(broadcastNativeTransfer({ network: getWalletNetwork(1), account, prepared }), /Mainnet accounts are read-only/);
  await assert.rejects(broadcastNativeTransfer({ network: getWalletNetwork(4663), account, prepared }), /Mainnet accounts are read-only/);
  await assert.rejects(broadcastNativeTransfer({ network: { ...getWalletNetwork(1), kind: 'testnet' }, account, prepared }), /configuration changed/);
  assert.equal(signed, false);
});

test('explorer links are derived only from configured networks and validated identifiers', () => {
  assert.equal(networkExplorerAddress(network, sender), `https://sepolia.etherscan.io/address/${sender}`);
  const hash = `0x${'a'.repeat(64)}` as const;
  assert.equal(networkExplorerTx(network, hash), `https://sepolia.etherscan.io/tx/${hash}`);
  assert.throws(() => networkExplorerAddress(network, '0x1' as Address), /Invalid wallet address/);
  assert.throws(() => networkExplorerTx(network, '0x1'), /Invalid transaction hash/);
});
