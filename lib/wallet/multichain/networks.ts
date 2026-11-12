/** Native accounts are classical. WOTS remains exclusive to the pinned Robinhood smart account. */
export const NATIVE_NETWORKS = Object.freeze({
  'solana-devnet': Object.freeze({ id: 'solana-devnet', name: 'Solana Devnet', symbol: 'SOL', decimals: 9, signature: 'Ed25519', rpc: 'https://api.devnet.solana.com', genesis: 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG', icon: '/assets/solana.svg' }),
  'bitcoin-signet': Object.freeze({ id: 'bitcoin-signet', name: 'Bitcoin Signet', symbol: 'BTC', decimals: 8, signature: 'ECDSA · SegWit', rpc: 'https://mempool.space/signet/api', genesis: '00000008819873e925422c1ff0f99f7cc9bbb232af63a077a480a3633bee1ef6', icon: '/assets/bitcoin.svg' }),
} as const);
export type NativeNetworkId = keyof typeof NATIVE_NETWORKS;
export type ExtensionNetworkId = 'quantum-robinhood' | NativeNetworkId;
export function nativeNetwork(id: NativeNetworkId) {
  if (!Object.hasOwn(NATIVE_NETWORKS, id)) throw new Error('Choose Solana Devnet or Bitcoin Signet. Native mainnet signing is not enabled.');
  return NATIVE_NETWORKS[id];
}
export function nativeExplorer(network: NativeNetworkId, type: 'address' | 'tx', value: string): string {
  nativeNetwork(network);
  if (network === 'solana-devnet') {
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,88}$/.test(value)) throw new Error('Invalid Solana explorer identifier.');
    return `https://explorer.solana.com/${type}/${value}?cluster=devnet`;
  }
  if (!(type === 'tx' ? /^[0-9a-f]{64}$/ : /^tb1[qp][a-z0-9]{20,85}$/).test(value)) throw new Error('Invalid Signet explorer identifier.');
  return `https://mempool.space/signet/${type}/${value}`;
}
export function parseNativeAmount(input: string, decimals: number): bigint {
  if (![8,9].includes(decimals) || typeof input !== 'string' || input.length > 40 || !new RegExp(`^(?:0|[1-9]\\d*)(?:\\.\\d{1,${decimals}})?$`).test(input.trim())) throw new Error(`Enter a decimal amount with at most ${decimals} places.`);
  const [whole, fraction = ''] = input.trim().split('.');
  const amount = BigInt(whole) * 10n ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, '0'));
  if (amount <= 0n || amount > 2_100_000_000_000_000n) throw new Error('Amount is outside this release’s transfer limits.');
  return amount;
}
