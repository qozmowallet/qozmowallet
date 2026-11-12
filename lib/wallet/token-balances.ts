import { createPublicClient, erc20Abi, getAddress, http, isAddress, zeroAddress, type Address, type Transport } from 'viem';
import { assertNetworkChainId } from './chain-client';
import { tokensForNetwork, type WalletToken } from './assets';
import { assertWalletNetwork, type WalletNetwork } from './networks';

export type TokenBalance = { asset: WalletToken } & (
  | { status: 'ready'; balance: bigint }
  | { status: 'error'; balance?: undefined }
);
export type TokenBalanceSnapshot = { chainId: number; address: Address; blockNumber: bigint; tokens: TokenBalance[] };

/** Read-only ERC-20 balances at one verified block. A failed contract is never a zero balance. */
export async function fetchTokenBalances(network: WalletNetwork, address: Address, transport?: Transport): Promise<TokenBalanceSnapshot> {
  const canonical = assertWalletNetwork(network);
  if (!isAddress(address, { strict: true }) || getAddress(address) === zeroAddress) throw new Error('Invalid wallet address.');
  const account = getAddress(address);
  const assets = tokensForNetwork(canonical);
  const client = createPublicClient({
    chain: canonical.chain,
    cacheTime: 0,
    transport: transport ?? http(canonical.rpcUrl, { timeout: 10_000, retryCount: 0 }),
  });
  assertNetworkChainId(canonical, await client.getChainId());
  const blockNumber = await client.getBlockNumber({ cacheTime: 0 });
  // Read individually: no unverified multicall deployment is required on Robinhood Chain.
  const tokens = await Promise.all(assets.map(async (asset): Promise<TokenBalance> => {
    try {
      const balance = await client.readContract({ address: asset.address, abi: erc20Abi, functionName: 'balanceOf', args: [account], blockNumber });
      return { asset, status: 'ready', balance };
    } catch {
      return { asset, status: 'error' };
    }
  }));
  return { chainId: canonical.id, address: account, blockNumber, tokens };
}
