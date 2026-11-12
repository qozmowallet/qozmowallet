/** Official issuer artwork, bundled locally with its original colors and proportions. */
type AssetLogoMetadata = {
  src: string;
  name: string;
  symbol: string;
};

export const ASSET_LOGOS = {
  bitcoin: { src: '/assets/bitcoin.svg', name: 'Bitcoin', symbol: 'BTC' },
  ethereum: { src: '/assets/ethereum.svg', name: 'Ethereum', symbol: 'ETH' },
  solana: { src: '/assets/solana.svg', name: 'Solana', symbol: 'SOL' },
  'pax-gold': { src: '/assets/pax-gold.png', name: 'PAX Gold', symbol: 'PAXG' },
  'nvidia-xstock': { src: '/assets/nvidia-xstock.png', name: 'NVIDIA xStock', symbol: 'NVDAx' },
  'sp500-xstock': { src: '/assets/sp500-xstock.png', name: 'SP500 xStock', symbol: 'SPYx' },
  polygon: { src: '/assets/polygon.svg', name: 'Polygon', symbol: 'POL' },
  'usd-coin': { src: '/assets/usd-coin.svg', name: 'USD Coin', symbol: 'USDC' },
  'global-dollar': { src: '/assets/global-dollar.svg', name: 'Global Dollar', symbol: 'USDG' },
  'robinhood-apple': { src: '/assets/robinhood-apple.png', name: 'Apple · Robinhood Token', symbol: 'AAPL' },
  'robinhood-nvidia': { src: '/assets/robinhood-nvidia.png', name: 'NVIDIA · Robinhood Token', symbol: 'NVDA' },
  'robinhood-microsoft': { src: '/assets/robinhood-microsoft.png', name: 'Microsoft · Robinhood Token', symbol: 'MSFT' },
  'robinhood-tesla': { src: '/assets/robinhood-tesla.png', name: 'Tesla · Robinhood Token', symbol: 'TSLA' },
  'robinhood-sp500': { src: '/assets/robinhood-sp500.png', name: 'S&P 500 · Robinhood Token', symbol: 'SPY' },
  'robinhood-nasdaq': { src: '/assets/robinhood-nasdaq.png', name: 'Invesco QQQ · Robinhood Token', symbol: 'QQQ' },
  'apple-xstock': { src: '/assets/apple-xstock.png', name: 'Apple xStock', symbol: 'AAPLx' },
  'microsoft-xstock': { src: '/assets/microsoft-xstock.png', name: 'Microsoft xStock', symbol: 'MSFTx' },
  'tesla-xstock': { src: '/assets/tesla-xstock.png', name: 'Tesla xStock', symbol: 'TSLAx' },
  'nasdaq-xstock': { src: '/assets/nasdaq-xstock.png', name: 'Nasdaq 100 xStock', symbol: 'QQQx' },
  aave: { src: '/assets/aave.svg', name: 'Aave', symbol: 'AAVE' },
  uniswap: { src: '/assets/uniswap.svg', name: 'Uniswap', symbol: 'UNI' },
} as const satisfies Record<string, AssetLogoMetadata>;

export type AssetLogoId = keyof typeof ASSET_LOGOS;

const assetIdsBySymbol = new Map<string, AssetLogoId>(
  Object.entries(ASSET_LOGOS).map(([id, logo]) => [logo.symbol.toUpperCase(), id as AssetLogoId]),
);

/** Resolve displayed native-token symbols through the same registry as the market watchlist. */
export function assetLogoIdForSymbol(symbol: string): AssetLogoId | undefined {
  return assetIdsBySymbol.get(symbol.toUpperCase());
}
