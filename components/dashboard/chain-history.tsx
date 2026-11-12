'use client';
import { useEffect, useRef, useState } from 'react';
import type { Address } from 'viem';
import { fetchHistoryPage, historyCSV, type HistoryKind, type HistoryRow } from '@/lib/wallet/history';
import { networkExplorerAddress, networkExplorerTx, type WalletNetwork } from '@/lib/wallet/networks';
import { errorText, shortAddress } from './ui';

const kinds: HistoryKind[] = ['native', 'internal', 'token'];
type Slice = { rows: HistoryRow[]; page: number; more: boolean; error?: string };
const empty = (): Record<HistoryKind, Slice> => ({ native: { rows: [], page: 0, more: true }, internal: { rows: [], page: 0, more: true }, token: { rows: [], page: 0, more: true } });

export function ChainHistory({ address, network }: { address?: Address; network: WalletNetwork }) {
  const [data, setData] = useState(empty); const [busy, setBusy] = useState(false); const [filter, setFilter] = useState('all'); const [query, setQuery] = useState(''); const [observed, setObserved] = useState('');
  const controller = useRef<AbortController | null>(null); const identity = `${network.id}:${address}`;
  const [loadedIdentity, setLoadedIdentity] = useState(identity);
  useEffect(() => { controller.current?.abort(); setData(empty()); setObserved(''); setBusy(false); setLoadedIdentity(identity); return () => controller.current?.abort(); }, [identity]);
  async function sync(reset = false) {
    if (!address || busy) return;
    controller.current?.abort(); const request = new AbortController(); controller.current = request; setBusy(true);
    const base = reset ? empty() : data;
    const results = await Promise.allSettled(kinds.map(async kind => {
      const slice = base[kind];
      if (!slice.more) return { kind, slice };
      const result = await fetchHistoryPage(network.id, address, kind, slice.page + 1, request.signal);
      return { kind, slice: { rows: [...slice.rows, ...result.rows], page: slice.page + 1, more: result.hasMore } };
    }));
    if (request.signal.aborted) return;
    const next = { ...base }; results.forEach((r, index) => { if (r.status === 'fulfilled') next[r.value.kind] = r.value.slice; else next[kinds[index]] = { ...(reset ? data[kinds[index]] : base[kinds[index]]), more:true, error: errorText(r.reason) }; });
    setData(next); setObserved(new Date().toLocaleTimeString()); setBusy(false);
  }
  const current = identity === loadedIdentity ? data : empty();
  const rows = kinds.flatMap(kind => current[kind].rows).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const shown = rows.filter(r => (filter === 'all' || filter === r.direction || filter === r.kind) && `${r.hash} ${r.symbol} ${r.from} ${r.to || ''} ${r.contract || ''}`.toLowerCase().includes(query.toLowerCase()));
  function exportCSV() { const url = URL.createObjectURL(new Blob([historyCSV(shown)], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = `qozmo-history-${network.id}-${address}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  return <section className="qd-panel qd-tools-panel"><div className="qd-panel-heading"><div><h2>Onchain history</h2><p>{network.label} · incoming, outgoing, internal transfers and ERC-20 events.</p></div><button className="qd-button qd-secondary qd-small" disabled={!address || busy} onClick={() => void sync(true)}>{busy ? 'Syncing…' : 'Sync history'}</button></div>
    <p className="qd-fine-print">Sync queries a Blockscout explorer with your public address. Records are explorer-indexed, not independently verified. Token names are unverified. Pagination loads 100 records per category at a time.</p>
    <div className="qd-tools-toolbar"><input aria-label="Search onchain history" placeholder="Address, hash or token…" value={query} onChange={e => setQuery(e.target.value)}/><select aria-label="History filter" value={filter} onChange={e => setFilter(e.target.value)}>{['all','in','out','self','native','internal','token'].map(v => <option key={v} value={v}>{v === 'all' ? 'All records' : v}</option>)}</select><button className="qd-button qd-secondary qd-small" disabled={!shown.length} onClick={exportCSV}>Export loaded CSV</button></div>
    {!address && <p className="qd-fine-print">Create or import a wallet to load its history.</p>}
    {kinds.filter(k => current[k].error).map(k => <p className="qd-message qd-message-error" key={k}>{k}: {current[k].error}</p>)}
    {observed && <p className="qd-fine-print">Last check {observed}. {rows.length} records loaded. {kinds.every(k => !current[k].more && !current[k].error) ? 'All provider pages for these categories loaded; NFTs and other operation types are outside this view.' : 'History may be partial. Load more or retry failed categories.'}</p>}
    <div className="qd-transactions">{shown.map(r => <a className="qd-transaction" href={networkExplorerTx(network, r.hash)} target="_blank" rel="noopener noreferrer" key={r.id}><span><strong>{r.direction === 'in' ? 'Received from' : r.direction === 'self' ? 'Self transfer' : 'Sent to'} {shortAddress(r.direction === 'in' ? r.from : r.to || r.from)}</strong><small>{r.kind} · {new Date(r.timestamp).toLocaleString()}{r.contract ? ` · ${shortAddress(r.contract)}` : ''}</small></span><span><strong>{r.value} {r.symbol}</strong><small>{r.status === 'reverted' ? 'Reverted' : 'Indexed'}</small></span></a>)}</div>
    {observed && !shown.length && !busy && <p className="qd-fine-print">No loaded records match this view. Review provider errors before treating an account as empty.</p>}
    <div className="qd-tools-toolbar"><button className="qd-button qd-secondary qd-small" disabled={!address || busy || kinds.every(k => !current[k].more)} onClick={() => void sync()}>Load more / retry</button>{address && <a className="qd-text-button" href={networkExplorerAddress(network, address)} target="_blank" rel="noopener noreferrer">Compare on explorer</a>}</div>
  </section>;
}
