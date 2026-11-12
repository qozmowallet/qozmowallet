import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

test('privacy deployment reads raw testnet keys without accepting an address, mnemonic or invalid scalar', async () => {
  const { deployerAccount } = await import(pathToFileURL(path.resolve('scripts/privacy-runtime.mjs')).href);
  const fixture = '0'.repeat(63) + '1';
  assert.equal(deployerAccount(fixture).address, '0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf');
  assert.equal(deployerAccount(`0x${fixture}`).address, deployerAccount(fixture).address);
  for (const value of [undefined, '', '0x' + '1'.repeat(40), 'test test test test test test test test test test test junk', '0'.repeat(64), 'f'.repeat(64)]) assert.throws(() => deployerAccount(value));
});

test('privacy deployment rejects mainnet/wrong-chain RPCs and remote unencrypted endpoints', async () => {
  const { assertTestnet, testnetChain } = await import(pathToFileURL(path.resolve('scripts/privacy-deploy.mjs')).href);
  for (const id of [1, 4663, 31337]) await assert.rejects(assertTestnet({ getChainId: async () => id }), /Wrong chain/);
  await assertTestnet({ getChainId: async () => 46630 });
  assert.equal(testnetChain('https://rpc.testnet.chain.robinhood.com').id, 46630);
  assert.equal(testnetChain('http://127.0.0.1:8545').id, 46630);
  assert.throws(() => testnetChain('http://example.org'), /HTTPS/);
});
