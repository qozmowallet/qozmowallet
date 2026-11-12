import { defineChain, getAddress, isAddress, type Address, type Chain, type Hash } from 'viem';
import { arbitrum, base, baseSepolia, mainnet, optimism, polygon, sepolia } from 'viem/chains';

export type WalletNetwork = Readonly<{
  id: number;
  label: string;
  shortLabel: string;
  chain: Chain;
  symbol: string;
  kind: 'mainnet' | 'testnet';
  color: string;
  explorerUrl: string;
  rpcUrl: string;
  feeModel: 'evm' | 'op-stack';
}>;

// The public RPC and explorer are published by Robinhood:
// https://docs.robinhood.com/chain/connecting/
// This definition does not imply a Winternitz deployment on any other network.
const robinhoodMainnet = defineChain({
  id: 4663,
  name: 'Robinhood Chain',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.mainnet.chain.robinhood.com'] } },
  blockExplorers: {
    default: { name: 'Robinhood Chain Explorer', url: 'https://robinhoodchain.blockscout.com' },
  },
});

const robinhoodTestnet = defineChain({
  id: 46630,
  name: 'Robinhood Chain Testnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.testnet.chain.robinhood.com'] } },
  blockExplorers: {
    default: { name: 'Robinhood Chain Explorer', url: 'https://explorer.testnet.chain.robinhood.com' },
  },
  testnet: true,
});

function network(
  chain: Chain,
  label: string,
  shortLabel: string,
  color: string,
  feeModel: WalletNetwork['feeModel'] = 'evm',
): WalletNetwork {
  const rpcUrl = chain.rpcUrls.default.http[0];
  const explorerUrl = chain.blockExplorers?.default.url;
  if (!rpcUrl || !explorerUrl) throw new Error(`Missing network metadata for ${label}.`);
  return Object.freeze({
    id: chain.id,
    label,
    shortLabel,
    chain,
    symbol: chain.nativeCurrency.symbol,
    kind: chain.testnet ? 'testnet' : 'mainnet',
    color,
    explorerUrl: explorerUrl.replace(/\/$/, ''),
    rpcUrl,
    feeModel,
  });
}

/** Public RPC URLs come from the installed viem chain definitions. No API keys are embedded. */
export const WALLET_NETWORKS: readonly WalletNetwork[] = Object.freeze([
  network(robinhoodMainnet, 'Robinhood Chain', 'Robinhood', '#88ab72'),
  network(mainnet, 'Ethereum', 'Ethereum', '#7883cb'),
  network(base, 'Base', 'Base', '#3369ff', 'op-stack'),
  network(arbitrum, 'Arbitrum One', 'Arbitrum', '#6da5cf'),
  network(optimism, 'OP Mainnet', 'Optimism', '#ec5c69', 'op-stack'),
  network(polygon, 'Polygon', 'Polygon', '#9b78de'),
  network(sepolia, 'Sepolia', 'Sepolia', '#91a1dd'),
  network(baseSepolia, 'Base Sepolia', 'Base Sepolia', '#7196f8', 'op-stack'),
  network(robinhoodTestnet, 'Robinhood Testnet', 'Robinhood', '#88ab72'),
]);

export const DEFAULT_NETWORK_ID = robinhoodMainnet.id;

export function getWalletNetwork(id: number): WalletNetwork {
  const found = Number.isSafeInteger(id) && WALLET_NETWORKS.find((item) => item.id === id);
  if (!found) throw new Error('Choose a supported EVM network.');
  return found;
}

/** Reject mutated/custom network descriptors before using their endpoints or signing context. */
export function assertWalletNetwork(value: WalletNetwork): WalletNetwork {
  const canonical = getWalletNetwork(value.id);
  if (
    value.chain.id !== canonical.id ||
    value.rpcUrl !== canonical.rpcUrl ||
    value.kind !== canonical.kind ||
    value.feeModel !== canonical.feeModel
  ) {
    throw new Error('The network configuration changed. Select the network again.');
  }
  return canonical;
}

export function networkExplorerAddress(selected: WalletNetwork, address: Address): string {
  const canonical = assertWalletNetwork(selected);
  if (!isAddress(address, { strict: true })) throw new Error('Invalid wallet address.');
  return `${canonical.explorerUrl}/address/${getAddress(address)}`;
}

export function networkExplorerTx(selected: WalletNetwork, hash: Hash): string {
  const canonical = assertWalletNetwork(selected);
  if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) throw new Error('Invalid transaction hash.');
  return `${canonical.explorerUrl}/tx/${hash}`;
}
