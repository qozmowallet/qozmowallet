import { decodeFunctionData, encodeFunctionData, getAddress, keccak256, parseAbi, zeroAddress, type Address, type PublicClient } from 'viem';
import { FIELD } from './note';
import { privacyPoolAbi, type PrivacyTransaction } from './transactions';
import { PRIVACY_RESEARCH as pins } from './research-deployment';

const linksAbi = parseAbi(['function verifier() view returns (address)']);
export function privacyCallDetails(tx: PrivacyTransaction, owner: Address) {
  if (tx.chainId !== pins.chainId || getAddress(tx.to) !== pins.pool) throw new Error('Only the pinned Qozmo research pool is supported.');
  const decoded = decodeFunctionData({ abi: privacyPoolAbi, data: tx.data });
  if (decoded.functionName === 'deposit') {
    if (tx.value !== BigInt(pins.denomination) || decoded.args[0] <= 0n || decoded.args[0] >= FIELD) throw new Error('Invalid privacy deposit.');
    if (encodeFunctionData({ abi: privacyPoolAbi, functionName: 'deposit', args: decoded.args }) !== tx.data) throw new Error('Noncanonical privacy calldata.');
    return { kind: 'deposit' as const, reference: decoded.args[0].toString(), recipient: pins.pool };
  }
  if (decoded.functionName === 'withdraw') {
    const [, , , , nullifier, recipient, relayer, fee] = decoded.args;
    if (tx.value !== 0n || getAddress(recipient) !== getAddress(owner) || relayer !== zeroAddress || fee !== 0n || nullifier <= 0n || nullifier >= FIELD) throw new Error('This wallet withdraws the full denomination to its own Qozmo account only.');
    if (encodeFunctionData({ abi: privacyPoolAbi, functionName: 'withdraw', args: decoded.args }) !== tx.data) throw new Error('Noncanonical privacy calldata.');
    return { kind: 'withdrawal' as const, reference: nullifier.toString(), recipient: getAddress(recipient) };
  }
  throw new Error('Unsupported privacy pool operation.');
}

/** Validate runtime, immutable links and current pool configuration before reading or signing. */
export async function verifyAccountPrivacyPool(client: PublicClient) {
  if (await client.getChainId() !== pins.chainId) throw new Error('Privacy Ring is available on Robinhood Testnet only.');
  const blockNumber = await client.getBlockNumber({ cacheTime: 0 });
  if (blockNumber < pins.deployBlock) throw new Error('The privacy deployment block is not available on this RPC.');
  const [pool, verifier, domain, denomination, verifierAddress] = await Promise.all([
    client.getCode({ address: pins.pool, blockNumber }), client.getCode({ address: pins.verifier, blockNumber }),
    client.readContract({ address: pins.pool, abi: privacyPoolAbi, functionName: 'domain', blockNumber }),
    client.readContract({ address: pins.pool, abi: privacyPoolAbi, functionName: 'denomination', blockNumber }),
    client.readContract({ address: pins.pool, abi: linksAbi, functionName: 'verifier', blockNumber }),
  ]);
  if (!pool || !verifier || keccak256(pool) !== pins.poolCodeHash || keccak256(verifier) !== pins.verifierCodeHash || domain.toString() !== pins.domain || denomination.toString() !== pins.denomination || getAddress(verifierAddress) !== pins.verifier) throw new Error('Privacy pool deployment verification failed. Signing is blocked.');
  return blockNumber;
}
