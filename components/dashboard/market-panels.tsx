'use client';

import { useEffect, useId, useState } from 'react';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { AssetLogo } from '@/components/asset-logo';
import { MARKET_ASSETS, marketAssetCategory, formatMarketChange, formatMarketPrice, type MarketId, type MarketQuotes, type PriceStatus } from '@/lib/market-data';
import { ASSET_CATEGORIES, type AssetFilter } from '@/lib/wallet/assets';
import { DIcon } from './ui';

export function AssetMark({ id }: { id: MarketId }) {
  return <AssetLogo assetId={id} size={32} className="qd-asset-mark"/>;
}

export function MarketWatch({ quotes, status, query = '', compact = false }: { quotes: MarketQuotes; status: PriceStatus; query?: string; compact?: boolean }) {
  const [filter, setFilter] = useState<AssetFilter>('all');
  const assets = MARKET_ASSETS.filter(a => (filter === 'all' || marketAssetCategory(a) === filter) && `${a.name} ${a.symbol}`.toLowerCase().includes(query.toLowerCase()));
  return <section className={`qd-panel qd-market-table ${compact ? 'qd-market-compact' : ''}`} aria-labelledby="qd-market-title"><div className="qd-panel-heading"><div><h2 id="qd-market-title">Market watch</h2><p>Crypto and real-world assets, at a glance.</p></div><span className={`qd-feed qd-feed-${status}`}><i/>{status === 'live' ? 'Live prices' : status === 'connecting' ? 'Connecting' : 'Last received'}</span></div>
    <div className="qd-table-toolbar"><div className="qd-tabs qd-asset-filters" role="group" aria-label="Market category">{ASSET_CATEGORIES.map(item => <button key={item.id} className={filter === item.id ? 'is-active' : ''} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</button>)}</div><span>USD</span></div>
    <div className="qd-table-scroll"><table><thead><tr><th>Asset</th><th>Price</th><th>24h change</th>{!compact && <th>24h range</th>}<th>Last trade</th></tr></thead><tbody>{assets.map(asset => { const quote = quotes[asset.id]; const age = quote?.updatedAt ? Math.max(0, Math.floor((Date.now() - quote.updatedAt) / 60000)) : null; return <tr key={asset.id}><td><div className="qd-asset-cell"><AssetMark id={asset.id}/><span><strong>{asset.name}</strong><small>{asset.symbol} · {asset.kind}</small></span></div></td><td className="qd-number" data-dashboard-price={asset.id}>{formatMarketPrice(quote?.priceUsd)}</td><td className={`qd-number ${quote?.change24h == null ? '' : quote.change24h >= 0 ? 'qd-positive' : 'qd-negative'}`}>{formatMarketChange(quote?.change24h)}</td>{!compact && <td className="qd-range-cell">{quote?.low24h && quote?.high24h ? <><span>{formatMarketPrice(quote.low24h)}</span><i><b style={{ left: `${Math.min(100, Math.max(0, (quote.priceUsd - quote.low24h) / Math.max(0.00001, quote.high24h - quote.low24h) * 100))}%` }}/></i><span>{formatMarketPrice(quote.high24h)}</span></> : '—'}</td>}<td className="qd-muted" title={quote?.updatedAt ? new Date(quote.updatedAt).toISOString() : undefined}>{age == null ? 'Waiting' : age === 0 ? 'Just now' : `${age}m ago`}</td></tr>; })}</tbody></table>{assets.length === 0 && <p className="qd-no-results">No assets match “{query}”.</p>}</div><div className="qd-table-note"><span>Kraken watchlist · xStocks quotes are separate from Robinhood tokens and your holdings.</span><a href="https://www.kraken.com/prices" target="_blank" rel="noopener noreferrer">Data by Kraken <DIcon icon={faArrowUpRightFromSquare} size={9}/></a></div>
  </section>;
}

type Candle = { time: number; price: number };
type Period = '1D' | '1W' | '1M';
export function MarketChart({ quotes }: { quotes: MarketQuotes }) {
  const [assetId, setAssetId] = useState<MarketId>('ethereum');
  const [period, setPeriod] = useState<Period>('1D'); const [candles, setCandles] = useState<Candle[]>([]);
  const [error, setError] = useState(false); const [loading, setLoading] = useState(true); const [reload, setReload] = useState(0);
  const gradientId = useId().replace(/:/g, '');
  const asset = MARKET_ASSETS.find(a => a.id === assetId)!; const quote = quotes[assetId];
  useEffect(() => {
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 15000);
    let current = true; setLoading(true); setError(false); setCandles([]);
    const days = period === '1D' ? 1 : period === '1W' ? 7 : 30;
    const interval = period === '1D' ? 60 : period === '1W' ? 240 : 1440;
    const since = Math.floor(Date.now() / 1000) - days * 86400;
    const pair = assetId === 'bitcoin' ? 'XBTUSD' : asset.pair.replace('/', '');
    const assetClass = asset.kind === 'Tokenized equity' || asset.kind === 'Tokenized ETF' ? '&asset_class=tokenized_asset' : '';
    fetch(`https://api.kraken.com/0/public/OHLC?pair=${pair}&interval=${interval}&since=${since}${assetClass}`, { signal: controller.signal, credentials: 'omit' })
      .then(async response => { if (!response.ok) throw new Error('History unavailable'); const data = await response.json(); if (data.error?.length || !data.result) throw new Error('History unavailable'); const rows = Object.entries(data.result).find(([key, value]) => key !== 'last' && Array.isArray(value))?.[1]; if (!Array.isArray(rows)) throw new Error('History unavailable'); const parsed = rows.filter((r: unknown) => Array.isArray(r) && Number.isFinite(Number(r[0])) && Number.isFinite(Number(r[4])) && Number(r[4]) > 0).map((r: unknown[]) => ({ time: Number(r[0]) * 1000, price: Number(r[4]) })); if (parsed.length < 2) throw new Error('History unavailable'); if (current) setCandles(parsed); })
      .catch(() => { if (current) setError(true); }).finally(() => { clearTimeout(timer); if (current) setLoading(false); });
    return () => { current = false; clearTimeout(timer); controller.abort(); };
  }, [assetId, period, reload]);
  const low = Math.min(...candles.map(c => c.price)); const high = Math.max(...candles.map(c => c.price));
  const points = candles.map((c, i) => `${(i / Math.max(1, candles.length - 1)) * 600},${130 - ((c.price - low) / Math.max(0.01, high - low)) * 110}`).join(' ');
  const change = quote?.change24h;
  return <section className="qd-panel qd-chart-panel" aria-labelledby="qd-pulse-title"><div className="qd-panel-heading"><div><h2 id="qd-pulse-title">Market pulse</h2><p>Follow the market. Find your perspective.</p></div><select aria-label="Chart asset" className="qd-mini-select" value={assetId} onChange={e => setAssetId(e.target.value as typeof assetId)}>{MARKET_ASSETS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div><div className="qd-chart-summary"><div><strong>{formatMarketPrice(quote?.priceUsd)}</strong><span className={change != null && change >= 0 ? 'qd-positive' : 'qd-negative'}>{formatMarketChange(change)} <small>past 24h</small></span></div><div className="qd-segment qd-chart-period" role="group" aria-label="Chart period">{(['1D','1W','1M'] as const).map(p => <button className={period === p ? 'is-active' : ''} aria-pressed={period === p} onClick={() => setPeriod(p)} key={p}>{p}</button>)}</div></div>
    <div className="qd-chart-area">{loading ? <div className="qd-chart-loading"><span/>Loading market history…</div> : error ? <div className="qd-chart-loading">Historical prices are unavailable.<button onClick={() => setReload(r => r + 1)}>Try again</button></div> : <><svg viewBox="0 0 600 150" preserveAspectRatio="none" role="img" aria-label={`${asset.name} ${period} closing price history. Low ${formatMarketPrice(low)}, high ${formatMarketPrice(high)}.`}><defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#bdb2e5" stopOpacity=".35"/><stop offset="1" stopColor="#bdb2e5" stopOpacity="0"/></linearGradient></defs>{[20,75,130].map(y => <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="#edeaf2" strokeDasharray="3 5"/>)}<polygon points={`0,150 ${points} 600,150`} fill={`url(#${gradientId})`}/><polyline points={points} fill="none" stroke="#9786ca" strokeWidth="2.2" vectorEffect="non-scaling-stroke" strokeLinejoin="round"/></svg><div className="qd-chart-axis">{[candles[0], candles[Math.floor(candles.length / 2)], candles[candles.length - 1]].map((c, i) => <span key={i}>{c ? new Intl.DateTimeFormat('en-US', period === '1D' ? { hour: 'numeric', minute: '2-digit' } : { month: 'short', day: 'numeric' }).format(c.time) : ''}</span>)}</div></>}</div><div className="qd-chart-foot"><span>Kraken price history · USD</span><span>Market data, not portfolio performance</span></div></section>;
}
