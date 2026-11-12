import { formatEther, getAddress, isAddress, isHash, parseEther } from 'viem';
import { WALLET_NETWORKS } from './networks';

export type WalletActivity = {
  id: string;
  hash: `0x${string}`;
  address: `0x${string}`;
  to: `0x${string}`;
  chainId: number;
  amount: string;
  symbol: string;
  createdAt: string;
  status: 'pending' | 'succeeded' | 'reverted';
};
export const ACTIVITY_STORAGE_KEY = 'qozmo.wallet.activity.v1';
const ACTIVITY_LOCK = 'qozmo-activity-write';
const MAX_RECORDS = 100;
const MAX_STORAGE_LENGTH = 256_000;

function checkedActivity(value: unknown): WalletActivity | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const v = value as Partial<WalletActivity>;
  const network = WALLET_NETWORKS.find(n => n.id === v.chainId);
  if (!network
    || typeof v.hash !== 'string' || !isHash(v.hash)
    || typeof v.id !== 'string' || v.id.toLowerCase() !== v.hash.toLowerCase()
    || typeof v.address !== 'string' || !isAddress(v.address)
    || typeof v.to !== 'string' || !isAddress(v.to)
    || typeof v.amount !== 'string' || v.amount.length > 100 || !/^\d+(\.\d{1,18})?$/.test(v.amount)
    || v.symbol !== network.symbol
    || typeof v.createdAt !== 'string' || !Number.isFinite(Date.parse(v.createdAt))
    || new Date(v.createdAt).toISOString() !== v.createdAt
    || !v.status || !['pending', 'succeeded', 'reverted'].includes(v.status)) return null;
  try {
    const amount = parseEther(v.amount);
    if (amount <= BigInt(0) || amount >= (BigInt(1) << BigInt(256))) return null;
    const hash = v.hash.toLowerCase() as WalletActivity['hash'];
    return {
      id: hash,
      hash,
      address: getAddress(v.address),
      to: getAddress(v.to),
      chainId: network.id,
      amount: formatEther(amount),
      symbol: network.symbol,
      createdAt: v.createdAt,
      status: v.status,
    };
  } catch { return null; }
}

/** Merge by chain and hash, retaining final statuses when stale pending snapshots arrive. */
export function mergeActivityRecords(current: readonly WalletActivity[], updates: readonly WalletActivity[]): WalletActivity[] {
  const merged = new Map<string, WalletActivity>();
  for (const candidate of [...current, ...updates]) {
    const record = checkedActivity(candidate);
    if (!record) continue;
    const key = `${record.chainId}:${record.hash}`;
    const previous = merged.get(key);
    if (!previous) merged.set(key, record);
    else if (previous.status === 'pending' && record.status !== 'pending') {
      // A receipt can update status, but not the already-recorded transaction details.
      merged.set(key, { ...previous, status: record.status });
    }
  }
  const sorted = [...merged.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.id.localeCompare(b.id));
  // An old unresolved hash must not be displaced by newer completed activity.
  const pending = sorted.filter(record => record.status === 'pending').slice(0, MAX_RECORDS);
  return [...pending, ...sorted.filter(record => record.status !== 'pending').slice(0, MAX_RECORDS - pending.length)]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.id.localeCompare(b.id));
}

export function readActivity(): WalletActivity[] {
  try {
    if (typeof window === 'undefined') return [];
    const text = window.localStorage.getItem(ACTIVITY_STORAGE_KEY) || '[]';
    if (text.length > MAX_STORAGE_LENGTH) return [];
    const data: unknown = JSON.parse(text);
    if (!Array.isArray(data)) return [];
    return mergeActivityRecords([], data.slice(0, 1_000));
  } catch { return []; }
}

/** Atomic cross-tab read/merge/write. Callers keep their in-memory copy if storage fails. */
export async function saveActivity(updates: readonly WalletActivity[]): Promise<WalletActivity[]> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.locks) {
    throw new Error('This browser cannot safely coordinate activity storage. Keep your transaction hash.');
  }
  return navigator.locks.request(ACTIVITY_LOCK, () => {
    const merged = mergeActivityRecords(readActivity(), updates);
    window.localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(merged));
    return merged;
  });
}
