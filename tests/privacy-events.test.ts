import assert from 'node:assert/strict';
import test from 'node:test';
import type { PublicClient } from 'viem';
import { merklePath } from '../lib/wallet/privacy/note';
import { scanPrivacyDeposits } from '../lib/wallet/privacy/events';
import { PRIVACY_RESEARCH } from '../lib/wallet/privacy/research-deployment';

const hash = `0x${'ab'.repeat(32)}`;
const other = `0x${'cd'.repeat(32)}`;
const root = BigInt(merklePath([1n, 2n], 0).root);
function fixture(overrides: Record<string, unknown> = {}) {
  return { getChainId: async () => 46630, getBlockNumber: async () => 105n, getBlock: async () => ({ hash }), readContract: async ({ functionName }: { functionName: string }) => functionName === 'nextIndex' ? 2 : root, getLogs: async () => [0, 1].map(i => ({ blockNumber: 101n, blockHash: hash, transactionIndex: 0, logIndex: i, removed: false, args: { leafIndex: i, commitment: BigInt(i + 1), root } })), ...overrides } as unknown as PublicClient;
}
test('privacy event scan reconstructs sequential confirmed leaves against a canonical state root', async () => {
  assert.deepEqual((await scanPrivacyDeposits(fixture(), PRIVACY_RESEARCH.pool, 46630, 100n)).leaves, [1n, 2n]);
});
test('privacy scan rejects wrong networks, gaps, wrong roots, reorged logs and unbounded work', async () => {
  await assert.rejects(scanPrivacyDeposits(fixture({ getChainId: async () => 1 }), PRIVACY_RESEARCH.pool, 46630, 100n), /Wrong chain/);
  await assert.rejects(scanPrivacyDeposits(fixture({ getLogs: async () => [{ blockNumber: 101n, blockHash: hash, args: { leafIndex: 1, commitment: 1n } }] }), PRIVACY_RESEARCH.pool, 46630, 100n), /discontinuous/);
  await assert.rejects(scanPrivacyDeposits(fixture({ readContract: async ({ functionName }: { functionName: string }) => functionName === 'nextIndex' ? 2 : 1n }), PRIVACY_RESEARCH.pool, 46630, 100n), /canonical pool state/);
  await assert.rejects(scanPrivacyDeposits(fixture({ getBlock: async ({ blockNumber }: { blockNumber: bigint }) => ({ hash: blockNumber === 101n ? other : hash }) }), PRIVACY_RESEARCH.pool, 46630, 100n), /reorganized/);
  await assert.rejects(scanPrivacyDeposits(fixture({ getBlockNumber: async () => 2_000_000n }), PRIVACY_RESEARCH.pool, 46630, 100n), /range exceeded/);
});
