'use client';

import { useEffect, useState } from 'react';
import { formatUnits, type Address } from 'viem';
import { faArrowUpRightFromSquare, faRotate } from '@fortawesome/free-solid-svg-icons';
import { AssetLogo } from '@/components/asset-logo';
import { ASSET_CATEGORIES, tokensForNetwork, type AssetFilter } from '@/lib/wallet/assets';
import { fetchTokenBalances, type TokenBalanceSnapshot } from '@/lib/wallet/token-balances';
import { networkExplorerAddress, type WalletNetwork } from '@/lib/wallet/networks';
import { DIcon, errorText } from './ui';

export function TokenHoldings({ network, address, hidden, query = '', onSetup }: {
  network: WalletNetwork; address?: Address; hidden: boolean; query?: string; onSetup: () => void;
}) {
  const [filter, setFilter] = useState<AssetFilter>('all');
  const [snapshot, setSnapshot] = useState<TokenBalanceSnapshot | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const catalog = tokensForNetwork(network);
  const assets = catalog.filter(asset => (filter === 'all' || filter === asset.category)
    && `${asset.name} ${asset.symbol}`.toLowerCase().includes(query.trim().toLowerCase()));
  // Never show another network's or account's snapshot while an effect is catching up.
  const active = snapshot?.chainId === network.id && snapshot.address === address ? snapshot : null;

  useEffect(() => {
    let current = true;
    setSnapshot(null); setError('');
    if (!address || !tokensForNetwork(network).length) { setLoading(false); return; }
    setLoading(true);
    fetchTokenBalances(network, address)
      .then(value => { if (current) setSnapshot(value); })
      .catch(reason => { if (current) setError(errorText(reason)); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [network, address, refresh]);

  return <section className="qd-panel qd-token-holdings" aria-labelledby="qd-holdings-title">
    <div className="qd-panel-heading"><div><h2 id="qd-holdings-title">Beyond crypto</h2><p>Tokenized stocks, ETFs, gold and dollars · {network.label}</p></div>
      <button className="qd-icon-button" aria-label="Refresh token balances" onClick={() => setRefresh(value => value + 1)} disabled={!address || loading || !catalog.length}><DIcon icon={faRotate} size={14}/></button>
    </div>
    <div className="qd-table-toolbar"><div className="qd-tabs qd-asset-filters" role="group" aria-label="Holdings category">
      {ASSET_CATEGORIES.map(category => <button key={category.id} className={filter === category.id ? 'is-active' : ''} aria-pressed={filter === category.id} onClick={() => setFilter(category.id)}>{category.label}</button>)}
    </div></div>
    {error && <p className="qd-holdings-notice" role="alert">Balances unavailable. {error} <button className="qd-text-button" onClick={() => setRefresh(value => value + 1)}>Try again</button></p>}
    {!address && <div className="qd-holdings-notice">Explore assets on this network. <button className="qd-text-button" onClick={onSetup}>Create or import a wallet</button> to read your holdings.</div>}
    <div className="qd-table-scroll"><table><thead><tr><th scope="col">Asset</th><th scope="col">Type</th><th scope="col">Network</th><th scope="col">Your balance</th><th scope="col">Contract</th></tr></thead><tbody>
      {assets.map(asset => {
        const holding = active?.tokens.find(item => item.asset.address === asset.address);
        const balance = !address ? '—' : error || holding?.status === 'error' ? 'Unavailable' : holding?.status !== 'ready' ? 'Loading…' : hidden ? '••••' : `${formatUnits(holding.balance, asset.decimals)} ${asset.symbol}`;
        return <tr key={asset.address}><td><div className="qd-asset-cell"><AssetLogo assetId={asset.logoId} size={32}/><span><strong>{asset.name}</strong><small>{asset.symbol}</small></span></div></td>
          <td><span className={`qd-asset-category qd-category-${asset.category}`}>{ASSET_CATEGORIES.find(category => category.id === asset.category)?.label}</span></td>
          <td>{network.shortLabel}</td><td className="qd-number" data-token-balance={asset.symbol}>{balance}</td>
          <td><a className="qd-text-button" href={networkExplorerAddress(network, asset.address)} target="_blank" rel="noopener noreferrer" aria-label={`View ${asset.symbol} contract on ${network.label}`}><span>{asset.address.slice(0,6)}…{asset.address.slice(-4)}</span> <DIcon icon={faArrowUpRightFromSquare} size={9}/></a></td>
        </tr>;
      })}
    </tbody></table></div>
    {!assets.length && <p className="qd-no-results">{!catalog.length ? 'No verified token contracts are configured on this network. Choose Ethereum or Robinhood Chain mainnet to explore tokenized assets.' : 'No assets match this category or search on the selected network.'}</p>}
    <div className="qd-table-note"><span>{active ? `Onchain token units · Block ${active.blockNumber.toLocaleString()}` : 'Issuer-specific tokens · Balances stay separate from market quotes.'}</span>
      <a href={network.id === 4663 ? 'https://docs.robinhood.com/chain/contracts/' : 'https://developers.circle.com/stablecoins/usdc-contract-addresses'} target="_blank" rel="noopener noreferrer">Contract sources <DIcon icon={faArrowUpRightFromSquare} size={9}/></a>
    </div>
  </section>;
}
