import assert from 'node:assert/strict';
import test from 'node:test';
import { custom, encodeAbiParameters, formatUnits, getAddress, type Address } from 'viem';
import { tokensForNetwork } from '../lib/wallet/assets';
import { fetchTokenBalances } from '../lib/wallet/token-balances';
import { getWalletNetwork } from '../lib/wallet/networks';

const owner = getAddress('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266');
const word = (value: bigint) => encodeAbiParameters([{ type: 'uint256' }], [value]);

test('token reads pin every balance to one block and preserve token decimal units', async () => {
  const calls: { to: string; data: string; block: string }[] = [];
  const snapshot = await fetchTokenBalances(getWalletNetwork(1), owner, custom({
    async request({ method, params }) {
      if (method === 'eth_chainId') return '0x1';
      if (method === 'eth_blockNumber') return '0xab';
      if (method === 'eth_call') {
        const [call, block] = params as [{ to: string; data: string }, string];
        calls.push({ ...call, block });
        return word(call.to.toLowerCase().startsWith('0xa0b8') ? BigInt(1234567) : BigInt('1000000000000000001'));
      }
      throw new Error(`Unexpected RPC: ${method}`);
    },
  }, { retryCount: 0 }));
  assert.equal(snapshot.blockNumber, BigInt(171));
  assert.equal(snapshot.address, owner);
  assert.equal(calls.length, 2);
  assert.ok(calls.every(call => call.block === '0xab' && call.data.startsWith('0x70a08231') && call.data.endsWith(owner.slice(2).toLowerCase())));
  const usdc = snapshot.tokens.find(item => item.asset.symbol === 'USDC')!;
  assert.equal(usdc.status, 'ready');
  assert.equal(formatUnits(usdc.balance!, usdc.asset.decimals), '1.234567');
  const gold = snapshot.tokens.find(item => item.asset.symbol === 'PAXG')!;
  assert.equal(formatUnits(gold.balance!, gold.asset.decimals), '1.000000000000000001');
});

test('wrong-chain RPC responses stop before any block or token reads', async () => {
  const methods: string[] = [];
  await assert.rejects(fetchTokenBalances(getWalletNetwork(4663), owner, custom({
    async request({ method }) { methods.push(method); return '0x1'; },
  }, { retryCount: 0 })), /RPC returned chain/);
  assert.deepEqual(methods, ['eth_chainId']);
});

test('a missing contract is unavailable while a valid zero balance stays zero', async () => {
  const result = await fetchTokenBalances(getWalletNetwork(1), owner, custom({
    async request({ method, params }) {
      if (method === 'eth_chainId') return '0x1';
      if (method === 'eth_blockNumber') return '0x10';
      const [call] = params as [{ to: string }];
      return call.to.toLowerCase().startsWith('0xa0b8') ? '0x' : word(BigInt(0));
    },
  }, { retryCount: 0 }));
  assert.equal(result.tokens.find(item => item.asset.symbol === 'PAXG')?.balance, BigInt(0));
  const failed = result.tokens.find(item => item.asset.symbol === 'USDC')!;
  assert.equal(failed.status, 'error');
  assert.equal(failed.balance, undefined);
});

test('asset contracts are isolated by chain and cannot be silently reused on testnet', async () => {
  const robinhood = tokensForNetwork(getWalletNetwork(4663));
  assert.deepEqual(robinhood.filter(item => item.category === 'etfs').map(item => item.symbol), ['SPY', 'QQQ']);
  assert.equal(robinhood.filter(item => item.category === 'stocks').length, 4);
  assert.ok(robinhood.every(item => item.chainId === 4663));
  assert.equal(tokensForNetwork(getWalletNetwork(46630)).length, 0);
  assert.equal(tokensForNetwork(getWalletNetwork(11155111)).length, 0);
  await assert.rejects(fetchTokenBalances({ ...getWalletNetwork(1), rpcUrl: 'https://example.invalid' }, owner), /configuration changed/);
  await assert.rejects(fetchTokenBalances(getWalletNetwork(1), '0x0' as Address), /Invalid wallet address/);
});
