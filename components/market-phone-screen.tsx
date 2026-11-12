'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBatteryFull } from '@fortawesome/free-solid-svg-icons';
import { AssetLogo } from '@/components/asset-logo';
import { QozmoMark } from '@/components/brand';
import { useMarketPrices } from '@/components/use-market-prices';
import {
  MARKET_ASSETS, MARKET_STALE_MS, marketAssetCategory, formatMarketChange, formatMarketPrice,
  type MarketId, type MarketQuote,
} from '@/lib/market-data';
import { ASSET_CATEGORIES, type AssetFilter } from '@/lib/wallet/assets';

const cryptoAssets = MARKET_ASSETS.filter(asset => asset.group === 'crypto');
const realWorldAssets = MARKET_ASSETS.filter(asset => asset.group !== 'crypto');
function changeClass(change: number | null | undefined) {
  return change == null || change === 0 ? 'phone-ui-change-neutral' : change > 0 ? 'phone-ui-change-up' : 'phone-ui-change-down';
}

function relativeTradeTime(timestamp: number, now: number) {
  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function TradeTime({ quote, now, compact = false }: { quote?: MarketQuote; now: number; compact?: boolean }) {
  if (!quote) return <span className="phone-ui-trade-time">Waiting for price</span>;
  if (quote.updatedAt === null) return <span className="phone-ui-trade-time">Trade time unavailable</span>;
  const date = new Date(quote.updatedAt);
  const older = now - quote.updatedAt > MARKET_STALE_MS;
  const clock = date.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC',
  });
  return <span className={`phone-ui-trade-time${older ? ' phone-ui-trade-older' : ''}`}>
    Last trade <time dateTime={date.toISOString()} title={`${date.toUTCString()}${older ? ' · Latest available trade' : ''}`}>
      {compact || older ? relativeTradeTime(quote.updatedAt, now) : `${clock} UTC`}
    </time>
  </span>;
}

/** A live HTML application screen, aligned with the photographic phone by its parent. */
export function MarketPhoneScreen({ onOpenDemo }: { onOpenDemo: () => void }) {
  const { quotes, status, errorMessage, reconnect, now } = useMarketPrices();
  const [selectedId, setSelectedId] = useState<MarketId>('bitcoin');
  const [category, setCategory] = useState<AssetFilter>('all');
  const selectedAsset = MARKET_ASSETS.find(asset => asset.id === selectedId) ?? MARKET_ASSETS[0];
  const selectedQuote = quotes[selectedAsset.id];
  const low = selectedQuote?.low24h;
  const high = selectedQuote?.high24h;
  const hasRange = low != null && high != null && high >= low;
  const rangePosition = hasRange && selectedQuote
    ? high === low ? 50 : Math.max(0, Math.min(100, (selectedQuote.priceUsd - low) / (high - low) * 100))
    : null;
  const connectionLabel = {
    connecting: 'Connecting', live: 'Live feed', partial: 'Partial feed',
    reconnecting: 'Reconnecting', offline: 'Offline',
  }[status];
  const canReconnect = status === 'partial' || status === 'offline' || status === 'reconnecting';
  const hasQuotes = Object.keys(quotes).length > 0;
  const connectionNote = status === 'live'
    ? 'USD prices · 24h changes · Latest trades'
    : status === 'connecting'
      ? 'Connecting to live market prices…'
      : status === 'partial'
        ? 'Partial feed. Latest received quotes shown.'
        : hasQuotes
          ? 'Feed interrupted. Last received quotes shown.'
          : 'Prices unavailable. Retrying automatically.';
  return <div className="phone-ui" aria-label="Qozmo live market watch">
    <div className="phone-ui-statusbar" aria-hidden="true">
      <span>9:41</span><i className="phone-ui-island"/>
      <FontAwesomeIcon icon={faBatteryFull}/>
    </div>

    <header className="phone-ui-header">
      <div className="phone-ui-brand"><QozmoMark/><span>qozmo<span>.</span></span></div>
      <span
        className={`phone-ui-feed-status phone-ui-feed-${status}`}
        role="status"
        data-market-status={status}
        title={errorMessage ?? 'Live public market connection'}
      ><i/>{connectionLabel}</span>
    </header>

    <section className="phone-ui-spotlight" data-selected-asset={selectedAsset.id} aria-label={`${selectedAsset.name} market price`}>
      <div className="phone-ui-spotlight-heading"><span>{selectedAsset.name} <small>{selectedAsset.symbol}</small></span><span>USD</span></div>
      <div className={`phone-ui-featured-price${!selectedQuote ? ' phone-ui-price-pending' : ''}`}>{formatMarketPrice(selectedQuote?.priceUsd)}</div>
      <div className="phone-ui-featured-change">
        <span className={changeClass(selectedQuote?.change24h)}>{formatMarketChange(selectedQuote?.change24h)}</span>
        <span>past 24 hours</span>
      </div>
    </section>

    <div className="phone-ui-crypto-tabs" role="group" aria-label="Choose a crypto asset">
      {cryptoAssets.map(asset => <button
        key={asset.id}
        type="button"
        className={`phone-ui-crypto-tab${selectedId === asset.id ? ' is-selected' : ''}`}
        aria-pressed={selectedId === asset.id}
        aria-label={`Show ${asset.name} market details`}
        onClick={() => setSelectedId(asset.id)}
      >
        <span className="phone-ui-tab-label"><AssetLogo assetId={asset.id} size={17}/>{asset.symbol}</span>
        <span className="phone-ui-tab-price" data-market-price={asset.id}>{formatMarketPrice(quotes[asset.id]?.priceUsd)}</span>
      </button>)}
    </div>

    <div className="phone-ui-range-section">
      <div className={`phone-ui-range${hasRange ? '' : ' phone-ui-range-pending'}`} role="img" aria-label={hasRange ? `${selectedAsset.name} 24-hour range: low ${formatMarketPrice(low)}, high ${formatMarketPrice(high)}` : `${selectedAsset.name} 24-hour range unavailable`}>
        <div className="phone-ui-range-labels"><span><small>24h low</small>{formatMarketPrice(low)}</span><span><small>24h high</small>{formatMarketPrice(high)}</span></div>
        <div className="phone-ui-range-track">{rangePosition !== null && <i style={{ left: `${rangePosition}%` }}/>}</div>
      </div>
      <div className="phone-ui-range-footer"><TradeTime quote={selectedQuote} now={now}/><span>Market watch</span></div>
    </div>

    <section className="phone-ui-rwa" aria-labelledby="phone-ui-rwa-heading">
      <div className="phone-ui-rwa-heading"><h2 id="phone-ui-rwa-heading">Beyond crypto</h2><select aria-label="Phone asset category" value={category} onChange={event => setCategory(event.target.value as AssetFilter)}>{ASSET_CATEGORIES.filter(item => item.id !== 'crypto').map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div>
      <div className="phone-ui-rwa-list">
        {realWorldAssets.filter(asset => category === 'all' || marketAssetCategory(asset) === category).map(asset => {
          const quote = quotes[asset.id];
          return <button type="button" className={`phone-ui-rwa-row${selectedId === asset.id ? ' is-selected' : ''}`} key={asset.id} aria-pressed={selectedId === asset.id} onClick={() => setSelectedId(asset.id)}>
            <AssetLogo assetId={asset.id} size={31}/>
            <div className="phone-ui-rwa-identity"><strong>{asset.name}</strong><span>{asset.symbol} <i/> {asset.kind}</span><TradeTime quote={quote} now={now} compact/></div>
            <div className="phone-ui-rwa-quote"><strong data-market-price={asset.id}>{formatMarketPrice(quote?.priceUsd)}</strong><span className={changeClass(quote?.change24h)}>{formatMarketChange(quote?.change24h)}</span></div>
          </button>;
        })}
      </div>
    </section>

    <div className="phone-ui-feed-footer">
      <div className="phone-ui-source-row">
        <a href="https://www.kraken.com/prices" target="_blank" rel="noreferrer">Prices by Kraken</a>
        {canReconnect && <button type="button" className="phone-ui-reconnect" onClick={reconnect} aria-label="Reconnect live prices">Retry</button>}
        {!canReconnect && <span>Updates automatically</span>}
      </div>
      <p className={status === 'live' ? '' : 'phone-ui-feed-notice'}>{connectionNote}</p>
      <noscript>Enable JavaScript for live market prices.</noscript>
    </div>

    <button className="phone-ui-demo-button" type="button" onClick={onOpenDemo}><span>Open your wallet</span><span>App</span></button>
    <div className="phone-ui-home-indicator" aria-hidden="true"/>
  </div>;
}
