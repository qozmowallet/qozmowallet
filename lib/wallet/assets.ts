import { getAddress, type Address } from 'viem';
import type { AssetLogoId } from '../asset-logos';
import { assertWalletNetwork, type WalletNetwork } from './networks';

export const ASSET_CATEGORIES = [
  { id: 'all', label: 'All assets' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'stocks', label: 'Stocks' },
  { id: 'etfs', label: 'ETFs' },
  { id: 'gold', label: 'Gold' },
  { id: 'stablecoins', label: 'Stablecoins' },
] as const;
export type AssetCategory = Exclude<typeof ASSET_CATEGORIES[number]['id'], 'all'>;
export type AssetFilter = typeof ASSET_CATEGORIES[number]['id'];
export type WalletToken = Readonly<{
  chainId: number;
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  category: AssetCategory;
  logoId: AssetLogoId;
  sourceUrl: string;
}>;

// Issuer contracts verified 2026-11-08. Symbols alone never identify a holding.
// Robinhood stocks are distinct from Kraken xStocks; their prices are not interchangeable.
const robinhood = 'https://docs.robinhood.com/chain/contracts/';
const token = (value: WalletToken): WalletToken => Object.freeze({ ...value, address: getAddress(value.address) });
export const WALLET_TOKENS: readonly WalletToken[] = Object.freeze([
  token({ chainId: 1, address: '0x45804880De22913dAFE09f4980848ECE6EcbAf78', symbol: 'PAXG', name: 'PAX Gold', decimals: 18, category: 'gold', logoId: 'pax-gold', sourceUrl: 'https://www.paxos.com/assets/paxg' }),
  token({ chainId: 1, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6, category: 'stablecoins', logoId: 'usd-coin', sourceUrl: 'https://developers.circle.com/stablecoins/usdc-contract-addresses' }),
  token({ chainId: 4663, address: '0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9', symbol: 'AAPL', name: 'Apple · Robinhood Token', decimals: 18, category: 'stocks', logoId: 'robinhood-apple', sourceUrl: robinhood }),
  token({ chainId: 4663, address: '0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC', symbol: 'NVDA', name: 'NVIDIA · Robinhood Token', decimals: 18, category: 'stocks', logoId: 'robinhood-nvidia', sourceUrl: robinhood }),
  token({ chainId: 4663, address: '0xe93237C50D904957Cf27E7B1133b510C669c2e74', symbol: 'MSFT', name: 'Microsoft · Robinhood Token', decimals: 18, category: 'stocks', logoId: 'robinhood-microsoft', sourceUrl: robinhood }),
  token({ chainId: 4663, address: '0x322F0929c4625eD5bAd873c95208D54E1c003b2d', symbol: 'TSLA', name: 'Tesla · Robinhood Token', decimals: 18, category: 'stocks', logoId: 'robinhood-tesla', sourceUrl: robinhood }),
  token({ chainId: 4663, address: '0x117cc2133c37B721F49dE2A7a74833232B3B4C0C', symbol: 'SPY', name: 'S&P 500 · Robinhood Token', decimals: 18, category: 'etfs', logoId: 'robinhood-sp500', sourceUrl: robinhood }),
  token({ chainId: 4663, address: '0xD5f3879160bc7c32ebb4dC785F8a4F505888de68', symbol: 'QQQ', name: 'Invesco QQQ · Robinhood Token', decimals: 18, category: 'etfs', logoId: 'robinhood-nasdaq', sourceUrl: robinhood }),
  token({ chainId: 4663, address: '0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168', symbol: 'USDG', name: 'Global Dollar', decimals: 6, category: 'stablecoins', logoId: 'global-dollar', sourceUrl: robinhood }),
  token({ chainId: 4663, address: '0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18, category: 'crypto', logoId: 'ethereum', sourceUrl: robinhood }),
]);

export function tokensForNetwork(network: WalletNetwork): readonly WalletToken[] {
  const canonical = assertWalletNetwork(network);
  return WALLET_TOKENS.filter(asset => asset.chainId === canonical.id);
}
