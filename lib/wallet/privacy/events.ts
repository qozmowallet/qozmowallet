import { parseAbiItem, type Address, type PublicClient } from 'viem';
import { FIELD, merklePath } from './note';
import { privacyPoolAbi } from './transactions';

export const depositEvent = parseAbiItem('event Deposit(uint256 indexed commitment, uint32 leafIndex, uint256 root)');
export const withdrawalEvent = parseAbiItem('event Withdrawal(uint256 indexed nullifierHash, address indexed recipient, address relayer, uint256 fee)');

/** Bounded research indexer: sequential indices, canonical logs and a final pinned state root. */
export async function scanPrivacyDeposits(client: PublicClient, pool: Address, chainId: number, deployBlock: bigint, signal?: AbortSignal) {
  signal?.throwIfAborted();
  if (await client.getChainId() !== chainId) throw new Error('Wrong chain for privacy deposit scan.');
  const head = await client.getBlockNumber({ cacheTime: 0 });
  const toBlock = head - 2n;
  if (toBlock < deployBlock) throw new Error('Wait for at least three pool confirmations.');
  // Stop rather than perform unbounded historical RPC work. Research pool has only 256 leaves.
  if (toBlock - deployBlock > 1_000_000n) throw new Error('Research scan range exceeded. Use a reviewed historical indexer.');
  const snapshot = await client.getBlock({ blockNumber: toBlock });
  const [count, root] = await Promise.all([
    client.readContract({ address: pool, abi: privacyPoolAbi, functionName: 'nextIndex', blockNumber: toBlock }),
    client.readContract({ address: pool, abi: privacyPoolAbi, functionName: 'root', blockNumber: toBlock }),
  ]);
  const leaves: bigint[] = [];
  const canonical = new Map<bigint, string>();
  for (let start = deployBlock; start <= toBlock; start += 5000n) {
    signal?.throwIfAborted();
    const end = start + 4999n > toBlock ? toBlock : start + 4999n;
    const logs = await client.getLogs({ address: pool, event: depositEvent, fromBlock: start, toBlock: end, strict: true });
    logs.sort((a, b) => Number(a.blockNumber - b.blockNumber) || a.transactionIndex - b.transactionIndex || a.logIndex - b.logIndex);
    for (const log of logs) {
      if (log.removed || log.args.leafIndex !== leaves.length || log.args.commitment <= 0n || log.args.commitment >= FIELD || leaves.length >= 256) throw new Error('Noncanonical or discontinuous privacy deposit events.');
      let hash = canonical.get(log.blockNumber);
      if (!hash) { hash = (await client.getBlock({ blockNumber: log.blockNumber })).hash; canonical.set(log.blockNumber, hash); }
      if (hash !== log.blockHash) throw new Error('Deposit event was reorganized. Retry the scan.');
      leaves.push(log.args.commitment);
    }
  }
  signal?.throwIfAborted();
  if (leaves.length !== count || (leaves.length > 0 && BigInt(merklePath(leaves, 0).root) !== root) || snapshot.hash !== (await client.getBlock({ blockNumber: toBlock })).hash) throw new Error('Deposit scan does not match canonical pool state. Retry after confirmations.');
  return { leaves, root, blockNumber: toBlock, blockHash: snapshot.hash };
}
