import assert from 'node:assert/strict';
import test from 'node:test';
import { MARKET_ASSETS, marketAssetCategory, mergeMarketQuotes, parseTickerMessage } from '../lib/market-data';

test('expanded market quotes retain real timestamps and ignore unknown or invalid prices', () => {
  const now = Date.parse('2026-11-08T10:00:00Z');
  const quotes = parseTickerMessage({ channel: 'ticker', type: 'snapshot', data: [
    { symbol: 'AAPLx/USD', last: 200.5, change_pct: 1.2, high: 205, low: 198, timestamp: '2026-11-08T09:59:00Z' },
    { symbol: 'USDC/USD', last: 1.001, timestamp: '2026-11-08T10:00:00Z' },
    { symbol: 'TSLAx/USD', last: null }, { symbol: 'FAKE/USD', last: 20 },
  ] }, now);
  assert.deepEqual(Object.keys(quotes).sort(), ['apple-xstock', 'usd-coin']);
  assert.equal(quotes['apple-xstock']?.updatedAt, now - 60_000);
  assert.equal(quotes['usd-coin']?.change24h, null);
  const older = parseTickerMessage({ channel: 'ticker', type: 'update', data: [
    { symbol: 'AAPLx/USD', last: 190, timestamp: '2026-11-08T09:58:00Z' },
  ] }, now);
  assert.equal(mergeMarketQuotes(quotes, older)['apple-xstock']?.priceUsd, 200.5);
});

test('market categories distinguish stocks, ETFs, gold and stablecoins from crypto', () => {
  const counts = new Map<string, number>();
  for (const asset of MARKET_ASSETS) counts.set(marketAssetCategory(asset), (counts.get(marketAssetCategory(asset)) ?? 0) + 1);
  assert.deepEqual(Object.fromEntries(counts), { crypto: 3, gold: 1, stocks: 4, etfs: 2, stablecoins: 1 });
});
