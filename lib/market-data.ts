import type { AssetCategory } from './wallet/assets';

/** Public market quotes. This watchlist never represents a visitor's holdings. */
export const MARKET_ASSETS = [
  { id: 'bitcoin', symbol: 'BTC', pair: 'BTC/USD', name: 'Bitcoin', group: 'crypto', kind: 'Cryptocurrency', icon: 'bitcoin', accent: '#eaa64b', sourceUrl: 'https://www.kraken.com/prices' },
  { id: 'ethereum', symbol: 'ETH', pair: 'ETH/USD', name: 'Ethereum', group: 'crypto', kind: 'Cryptocurrency', icon: 'ethereum', accent: '#9c9be0', sourceUrl: 'https://www.kraken.com/prices' },
  { id: 'solana', symbol: 'SOL', pair: 'SOL/USD', name: 'Solana', group: 'crypto', kind: 'Cryptocurrency', icon: 'solana', accent: '#88c9bb', sourceUrl: 'https://www.kraken.com/prices' },
  { id: 'pax-gold', symbol: 'PAXG', pair: 'PAXG/USD', name: 'PAX Gold', group: 'rwa', kind: 'Tokenized gold', icon: 'gold', accent: '#c8ad65', sourceUrl: 'https://www.paxos.com/assets/paxg' },
  { id: 'nvidia-xstock', symbol: 'NVDAx', pair: 'NVDAx/USD', name: 'NVIDIA xStock', group: 'rwa', kind: 'Tokenized equity', icon: 'nvidia', accent: '#91ac72', sourceUrl: 'https://defi.xstocks.fi/' },
  { id: 'sp500-xstock', symbol: 'SPYx', pair: 'SPYx/USD', name: 'SP500 xStock', group: 'rwa', kind: 'Tokenized ETF', icon: 'sp500', accent: '#899bc6', sourceUrl: 'https://defi.xstocks.fi/' },
  { id: 'apple-xstock', symbol: 'AAPLx', pair: 'AAPLx/USD', name: 'Apple xStock', group: 'rwa', kind: 'Tokenized equity', icon: 'apple', accent: '#9a9aa5', sourceUrl: 'https://www.kraken.com/xstocks' },
  { id: 'microsoft-xstock', symbol: 'MSFTx', pair: 'MSFTx/USD', name: 'Microsoft xStock', group: 'rwa', kind: 'Tokenized equity', icon: 'microsoft', accent: '#8ab7ce', sourceUrl: 'https://www.kraken.com/xstocks' },
  { id: 'tesla-xstock', symbol: 'TSLAx', pair: 'TSLAx/USD', name: 'Tesla xStock', group: 'rwa', kind: 'Tokenized equity', icon: 'tesla', accent: '#cd8b99', sourceUrl: 'https://www.kraken.com/xstocks' },
  { id: 'nasdaq-xstock', symbol: 'QQQx', pair: 'QQQx/USD', name: 'Nasdaq 100 xStock', group: 'rwa', kind: 'Tokenized ETF', icon: 'nasdaq', accent: '#9b8cc8', sourceUrl: 'https://www.kraken.com/xstocks' },
  { id: 'usd-coin', symbol: 'USDC', pair: 'USDC/USD', name: 'USD Coin', group: 'stablecoins', kind: 'Stablecoin', icon: 'dollar', accent: '#83a4d2', sourceUrl: 'https://www.kraken.com/prices' },
] as const;

export type MarketAsset = typeof MARKET_ASSETS[number];
export type MarketId = MarketAsset['id'];
export function marketAssetCategory(asset: MarketAsset): AssetCategory {
  if (asset.group === 'crypto') return 'crypto';
  if (asset.group === 'stablecoins') return 'stablecoins';
  return asset.kind === 'Tokenized gold' ? 'gold' : asset.kind === 'Tokenized ETF' ? 'etfs' : 'stocks';
}
export type MarketQuote = {
  id: MarketId;
  priceUsd: number;
  change24h: number | null;
  high24h: number | null;
  low24h: number | null;
  /** Provider's ticker timestamp; it may predate this connection. */
  updatedAt: number | null;
  receivedAt: number;
};
export type MarketQuotes = Partial<Record<MarketId, MarketQuote>>;
export type PriceStatus = 'connecting' | 'live' | 'partial' | 'reconnecting' | 'offline';

export const MARKET_ENDPOINT = 'wss://ws.kraken.com/v2';
export const MARKET_STALE_MS = 5 * 60_000;
export const MARKET_SUBSCRIPTION = {
  method: 'subscribe',
  params: { channel: 'ticker', symbol: MARKET_ASSETS.map(asset => asset.pair), snapshot: true, event_trigger: 'trades' },
  req_id: 1,
};

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const positiveNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;
const finiteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/** Ignore control messages and malformed quotes; never convert null prices to zero. */
export function parseTickerMessage(payload: unknown, now = Date.now()): MarketQuotes {
  if (!isRecord(payload) || payload.channel !== 'ticker'
    || (payload.type !== 'snapshot' && payload.type !== 'update') || !Array.isArray(payload.data)) return {};
  const quotes: MarketQuotes = {};
  for (const item of payload.data) {
    if (!isRecord(item) || !positiveNumber(item.last)) continue;
    const asset = MARKET_ASSETS.find(candidate => candidate.pair === item.symbol);
    if (!asset) continue;
    const timestamp = typeof item.timestamp === 'string' ? Date.parse(item.timestamp) : NaN;
    const validRange = positiveNumber(item.high) && positiveNumber(item.low) && item.high >= item.low;
    quotes[asset.id] = {
      id: asset.id,
      priceUsd: item.last,
      change24h: finiteNumber(item.change_pct) ? item.change_pct : null,
      high24h: validRange ? item.high as number : null,
      low24h: validRange ? item.low as number : null,
      updatedAt: Number.isFinite(timestamp) && timestamp > 0 && timestamp <= now + 120_000 ? timestamp : null,
      receivedAt: now,
    };
  }
  return quotes;
}

/** A late network message must not roll a displayed price back to an older trade. */
export function mergeMarketQuotes(current: MarketQuotes, incoming: MarketQuotes): MarketQuotes {
  const next = { ...current };
  for (const asset of MARKET_ASSETS) {
    const quote = incoming[asset.id];
    const previous = current[asset.id];
    if (!quote) continue;
    if (previous?.updatedAt != null && quote.updatedAt != null && quote.updatedAt < previous.updatedAt) continue;
    next[asset.id] = quote;
  }
  return next;
}

export const formatMarketPrice = (price: number | null | undefined) =>
  price == null || !Number.isFinite(price) ? '—' : new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(price);

export const formatMarketChange = (change: number | null | undefined) =>
  change == null || !Number.isFinite(change) ? '—' : `${change > 0 ? '+' : ''}${change.toFixed(2)}%`;
