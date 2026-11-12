import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { ACTIVITY_STORAGE_KEY, mergeActivityRecords, readActivity, saveActivity, type WalletActivity } from '../lib/wallet/activity';

const address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
function activity(index: number, status: WalletActivity['status'] = 'pending'): WalletActivity {
  const hash = `0x${index.toString(16).padStart(64, '0')}` as const;
  return { id: hash, hash, address, to: '0x0000000000000000000000000000000000000001', chainId: 11155111, amount: '0.001', symbol: 'ETH', createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString(), status };
}

describe('wallet activity reconciliation', () => {
  it('preserves a newly submitted hash when an older receipt request completes', () => {
    const first = activity(1);
    const second = activity(2);
    const latest = mergeActivityRecords([first], [second]);
    const completed = mergeActivityRecords(latest, [{ ...first, status: 'succeeded' }]);
    assert.equal(completed.length, 2);
    assert.equal(completed.find(row => row.id === first.id)?.status, 'succeeded');
    assert.equal(completed.find(row => row.id === second.id)?.status, 'pending');
  });

  it('does not downgrade final receipts when stale pending snapshots arrive', () => {
    const first = activity(1, 'succeeded');
    const second = activity(2, 'reverted');
    const merged = mergeActivityRecords([first, second], [activity(1), activity(2)]);
    assert.equal(merged.find(row => row.id === first.id)?.status, 'succeeded');
    assert.equal(merged.find(row => row.id === second.id)?.status, 'reverted');
  });

  it('retains unresolved hashes before trimming older completed history', () => {
    const pending = activity(1);
    const completed = Array.from({ length: 120 }, (_, index) => activity(index + 2, 'succeeded'));
    const merged = mergeActivityRecords([pending], completed);
    assert.equal(merged.length, 100);
    assert.equal(merged.some(row => row.id === pending.id && row.status === 'pending'), true);
  });

  it('rejects stored rows that would crash network or date rendering', () => {
    const valid = activity(1);
    const malformed = [
      { ...activity(2), chainId: 999999999 },
      { ...activity(3), createdAt: 'not a date' },
      { ...activity(4), id: 'not-the-transaction-hash' },
      { ...activity(5), amount: '0' },
      { ...activity(6), symbol: 'FAKE' },
    ];
    assert.deepEqual(mergeActivityRecords([], [valid, ...malformed]), [valid]);
  });
});

describe('cross-tab activity persistence', () => {
  const data = new Map<string, string>();
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const previousNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  let lockQueue: Promise<unknown> = Promise.resolve();
  before(() => {
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage: {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
    } } });
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { locks: {
      request: (_name: string, work: () => unknown) => {
        const result = lockQueue.then(work);
        lockQueue = result.catch(() => undefined);
        return result;
      },
    } } });
  });
  after(() => {
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
    else Reflect.deleteProperty(globalThis, 'window');
    if (previousNavigator) Object.defineProperty(globalThis, 'navigator', previousNavigator);
    else Reflect.deleteProperty(globalThis, 'navigator');
  });

  it('merges concurrent submissions and later receipt updates without dropping a hash', async () => {
    data.clear();
    await Promise.all([saveActivity([activity(1)]), saveActivity([activity(2)])]);
    assert.equal(readActivity().length, 2);
    await Promise.all([
      saveActivity([{ ...activity(1), status: 'succeeded' }]),
      saveActivity([activity(1), activity(3)]),
    ]);
    const stored = readActivity();
    assert.equal(stored.length, 3);
    assert.equal(stored.find(row => row.id === activity(1).id)?.status, 'succeeded');
    assert.equal(stored.find(row => row.id === activity(3).id)?.status, 'pending');
    assert.equal(data.has(ACTIVITY_STORAGE_KEY), true);
  });
});
