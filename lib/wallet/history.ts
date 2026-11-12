import { formatUnits, getAddress, isAddress, isHash, type Address, type Hash } from 'viem';
import { getWalletNetwork } from './networks';
import { gatewayBase } from './gateway';

export type HistoryKind = 'native' | 'internal' | 'token';
export type HistoryRow = { id: string; hash: Hash; chainId: number; from: Address; to: Address | null; value: string; symbol: string; contract?: Address; timestamp: string; block: string; kind: HistoryKind; direction: 'in' | 'out' | 'self'; status: 'succeeded' | 'reverted'; };
const actions = { native: 'txlist', internal: 'txlistinternal', token: 'tokentx' } as const;
const hosts: Record<number, string> = { 1: 'https://eth.blockscout.com', 8453: 'https://base.blockscout.com', 42161: 'https://arbitrum.blockscout.com', 10: 'https://optimism.blockscout.com', 137: 'https://polygon.blockscout.com', 11155111: 'https://eth-sepolia.blockscout.com', 84532: 'https://base-sepolia.blockscout.com', 4663: 'https://robinhoodchain.blockscout.com', 46630: 'https://explorer.testnet.chain.robinhood.com' };
const integer = (v: unknown) => typeof v === 'string' && /^\d{1,78}$/.test(v);

export function parseHistoryRows(rows: unknown, chainId: number, account: Address, kind: HistoryKind, page: number): HistoryRow[] {
  const network = getWalletNetwork(chainId);
  if (!isAddress(account, { strict: true }) || !Array.isArray(rows) || rows.length > 100 || !Object.hasOwn(actions, kind) || !Number.isSafeInteger(page) || page < 1) throw new Error('Invalid history response.');
  return rows.map((raw, index) => {
    const row = raw as Record<string, unknown>;
    if (!row || typeof row !== 'object' || typeof row.hash !== 'string' || !isHash(row.hash) || typeof row.from !== 'string' || !isAddress(row.from, { strict: true }) || !integer(row.value) || !integer(row.timeStamp) || !integer(row.blockNumber)) throw new Error('The explorer returned malformed history.');
    const from = getAddress(row.from); const to = typeof row.to === 'string' && isAddress(row.to, { strict: true }) ? getAddress(row.to) : null;
    const own = getAddress(account);
    if (from !== own && to !== own) throw new Error('History belongs to another account.');
    const seconds = Number(row.timeStamp);
    if (!Number.isSafeInteger(seconds) || seconds < 0 || seconds > Date.now() / 1000 + 300 || BigInt(row.value as string) >= 2n ** 256n) throw new Error('Invalid explorer amount or timestamp.');
    const decimals = kind === 'token' && typeof row.tokenDecimal === 'string' && /^\d{1,2}$/.test(row.tokenDecimal) ? Number(row.tokenDecimal) : kind === 'token' ? -1 : 18;
    if (decimals < 0 || decimals > 36 || (kind === 'token' && (typeof row.contractAddress !== 'string' || !isAddress(row.contractAddress, { strict: true })))) throw new Error('Invalid token metadata in history.');
    const symbol = kind === 'token' && typeof row.tokenSymbol === 'string' && /^[^\u0000-\u001f\u007f]{1,32}$/.test(row.tokenSymbol) ? row.tokenSymbol : kind === 'token' ? 'Unknown token' : network.symbol;
    const identity = kind === 'native' ? 'transaction' : kind === 'internal' && typeof row.traceId === 'string' ? row.traceId : kind === 'token' && integer(row.logIndex) ? row.logIndex as string : `${page}:${index}`;
    return { id: `${chainId}:${kind}:${row.hash.toLowerCase()}:${identity}`, hash: row.hash.toLowerCase() as Hash, chainId, from, to, value: formatUnits(BigInt(row.value as string), decimals), symbol, contract: kind === 'token' ? getAddress(row.contractAddress as string) : undefined, timestamp: new Date(seconds * 1000).toISOString(), block: row.blockNumber as string, kind, direction: from === own ? to === own ? 'self' : 'out' : 'in', status: row.isError === '1' || row.txreceipt_status === '0' ? 'reverted' : 'succeeded' };
  });
}

export async function fetchHistoryPage(chainId: number, account: Address, kind: HistoryKind, page: number, signal?: AbortSignal) {
  getWalletNetwork(chainId);
  if (!isAddress(account, { strict: true }) || !Number.isSafeInteger(page) || page < 1 || page > 10000) throw new Error('Invalid history request.');
  const useGateway = !!process.env.NEXT_PUBLIC_QOZMO_GATEWAY_URL;
  const query = new URLSearchParams({ chainId: String(chainId), address: getAddress(account), action: actions[kind], page: String(page) });
  const url = useGateway ? `${gatewayBase()}/history?${query}` : `${hosts[chainId]}/api?${new URLSearchParams({ module: 'account', action: actions[kind], address: getAddress(account), page: String(page), offset: '100', sort: 'desc' })}`;
  const response = await fetch(url, { signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000), credentials: 'omit', cache: 'no-store' });
  if (!response.ok) throw new Error('History provider is unavailable. Existing records were preserved.');
  const text = await response.text(); if (text.length > 2_000_000) throw new Error('History response is too large.');
  const body = JSON.parse(text);
  let raw = useGateway ? body.rows : body.result;
  if (!useGateway && body.status === '0' && typeof raw === 'string' && /no (transactions|token transfers|internal transactions|records) found/i.test(raw)) raw = [];
  if ((!useGateway && body.status !== '1' && !Array.isArray(raw)) || !Array.isArray(raw)) throw new Error('History is unavailable; this is not an empty account.');
  return { rows: parseHistoryRows(raw, chainId, account, kind, page), hasMore: raw.length === 100, source: useGateway ? 'Qozmo gateway / Blockscout' : new URL(hosts[chainId]).hostname };
}

function csvCell(value: string): string {
  // Quoting alone does not prevent spreadsheet formula execution.
  return `"${(/^[=+\-@\t\r]/.test(value) ? "'" : '') + value.replaceAll('"', '""')}"`;
}
export function historyCSV(rows: readonly HistoryRow[]): string {
  return '\uFEFF' + [['chain_id', 'hash', 'type', 'direction', 'from', 'to', 'amount', 'symbol', 'contract', 'timestamp', 'status', 'block'], ...rows.map(r => [String(r.chainId), r.hash, r.kind, r.direction, r.from, r.to || '', r.value, r.symbol, r.contract || '', r.timestamp, r.status, r.block])].map(row => row.map(csvCell).join(',')).join('\r\n');
}
