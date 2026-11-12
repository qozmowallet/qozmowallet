'use client';

import { useEffect, useState } from 'react';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { AssetLogo } from '@/components/asset-logo';
import { DIcon } from './ui';

const protocols = [
  { slug: 'aave-v3', name: 'Aave V3', category: 'Lending', description: 'Explore decentralized lending and borrowing markets.', url: 'https://app.aave.com/', logoId: 'aave', networks: 'Ethereum · Base · Arbitrum' },
  { slug: 'uniswap-v3', name: 'Uniswap V3', category: 'Exchange', description: 'Discover token swaps and liquidity pools across EVM networks.', url: 'https://app.uniswap.org/', logoId: 'uniswap', networks: 'Ethereum · Base · Optimism' },
  { slug: 'lido', name: 'Lido', category: 'Staking', description: 'Explore liquid staking and the Ethereum staking ecosystem.', url: 'https://stake.lido.fi/', color: '#6daecc', letter: 'L', networks: 'Ethereum' },
  { slug: 'morpho-blue', name: 'Morpho Blue', category: 'Lending', description: 'Explore curated vaults and permissionless lending markets.', url: 'https://app.morpho.org/', color: '#697fce', letter: 'M', networks: 'Ethereum · Base' },
] as const;
type ProtocolData = { slug: string; tvl: number; change_1d: number | null };
export function DefiExplore({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<ProtocolData[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(false); const [category, setCategory] = useState('All'); const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 18000); let current = true;
    setLoading(true); setError(false);
    fetch('https://api.llama.fi/protocols', { signal: controller.signal, credentials: 'omit' }).then(async r => {
      if (!r.ok) throw new Error('DeFi metrics unavailable'); const body: unknown = await r.json(); if (!Array.isArray(body)) throw new Error('DeFi metrics unavailable');
      const mapped = body.filter(v => v && typeof v.slug === 'string' && Number.isFinite(v.tvl) && v.tvl >= 0).map(v => ({ slug: v.slug, tvl: v.tvl, change_1d: Number.isFinite(v.change_1d) ? v.change_1d : null }));
      if (current) setData(mapped);
    }).catch(() => { if (current) setError(true); }).finally(() => { clearTimeout(timeout); if (current) setLoading(false); });
    return () => { current = false; controller.abort(); clearTimeout(timeout); };
  }, [reload]);
  return <section className={`qd-panel qd-defi ${compact ? 'qd-defi-compact' : ''}`}><div className="qd-panel-heading"><div><h2>{compact ? 'Explore a little further' : 'Your window into DeFi'}</h2><p>Discover protocols across the EVM ecosystem.</p></div><span className="qd-small-tag">DISCOVER</span></div>{!compact && <div className="qd-tabs qd-defi-tabs" role="group" aria-label="Protocol category">{['All','Lending','Exchange','Staking'].map(c => <button className={category === c ? 'is-active' : ''} onClick={() => setCategory(c)} aria-pressed={category === c} key={c}>{c}</button>)}</div>}
    <div className="qd-protocol-grid">{protocols.filter(p => category === 'All' || p.category === category).slice(0, compact ? 2 : 4).map(protocol => { const live = data.find(p => p.slug === protocol.slug); return <article className="qd-protocol" key={protocol.name}><div className="qd-protocol-top">{'logoId' in protocol ? <AssetLogo assetId={protocol.logoId} size={compact ? 32 : 40} className="qd-protocol-logo"/> : <span className="qd-protocol-logo qd-protocol-initial" style={{ background: `${protocol.color}15`, color: protocol.color }}>{protocol.letter}</span>}<span><strong>{protocol.name}</strong><small>{protocol.category}</small></span><a href={protocol.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${protocol.name} website`}><DIcon icon={faArrowUpRightFromSquare} size={13}/></a></div><p>{protocol.description}</p><div className="qd-protocol-metrics"><span>Protocol TVL<strong>{live ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2 }).format(live.tvl) : loading ? 'Loading…' : 'Unavailable'}</strong></span><span className={live?.change_1d != null && live.change_1d < 0 ? 'qd-negative' : 'qd-positive'}>{live?.change_1d != null ? `${live.change_1d > 0 ? '+' : ''}${live.change_1d.toFixed(2)}%` : '—'}<small>TVL · 24h</small></span></div><span className="qd-protocol-networks">{protocol.networks}</span></article>; })}</div><div className="qd-table-note"><span>{error ? <button className="qd-text-button" onClick={() => setReload(r => r + 1)}>Metrics unavailable · Retry</button> : 'TVL by DefiLlama · Versions shown above'}</span><span>External apps · No deposits made by Qozmo</span></div>
  </section>;
}
