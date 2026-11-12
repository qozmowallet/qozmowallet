import { encodeAbiParameters, getAddress, keccak256, zeroAddress, type Address } from 'viem';
import { poseidon2 } from 'poseidon-lite/poseidon2';
import { poseidon3 } from 'poseidon-lite/poseidon3';
import { poseidon4 } from 'poseidon-lite/poseidon4';

export const FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
export const TREE_DEPTH = 8; // Research pool: at most 256 deposits; must match the circuit and contract.
export const PRIVACY_CHAINS = [31337, 46630, 11155111] as const;
export type PrivacyNote = {
  protocol: 'qozmo-privacy-v1'; chainId: number; pool: Address; denomination: string;
  secret: string; nullifier: string;
};
export type PoolContext = Pick<PrivacyNote, 'chainId' | 'pool' | 'denomination'>;

export function field(value: unknown): bigint {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]{0,76})$/.test(value)) throw new Error('Expected a canonical field element.');
  const result = BigInt(value);
  if (result >= FIELD) throw new Error('Field element is out of range.');
  return result;
}

export function validateContext(context: PoolContext): PoolContext {
  if (!PRIVACY_CHAINS.includes(context.chainId as typeof PRIVACY_CHAINS[number])) throw new Error('Privacy research supports local, Robinhood Testnet and Sepolia only.');
  const pool = getAddress(context.pool);
  if (pool === zeroAddress) throw new Error('A nonzero pool address is required.');
  if (field(context.denomination) === 0n) throw new Error('The denomination must be positive.');
  return { chainId: context.chainId, pool, denomination: context.denomination };
}

export function poolDomain(context: PoolContext): bigint {
  const c = validateContext(context);
  return BigInt(keccak256(encodeAbiParameters(
    [{ type: 'string' }, { type: 'uint256' }, { type: 'address' }, { type: 'uint256' }],
    ['qozmo-privacy-v1', BigInt(c.chainId), c.pool, BigInt(c.denomination)],
  ))) % FIELD;
}

export function validateNote(value: unknown): PrivacyNote {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid privacy note.');
  const n = value as PrivacyNote;
  const keys = ['protocol', 'chainId', 'pool', 'denomination', 'secret', 'nullifier'];
  if (Object.keys(n).length !== keys.length || !Object.keys(n).every(k => keys.includes(k)) || n.protocol !== 'qozmo-privacy-v1') throw new Error('Invalid privacy note.');
  const context = validateContext(n);
  // 248-bit independently generated secrets; reject alternate encodings and zero secrets.
  for (const v of [n.secret, n.nullifier]) if (field(v) === 0n || field(v) >= 1n << 248n) throw new Error('Invalid privacy note secret.');
  return { protocol: n.protocol, ...context, secret: n.secret, nullifier: n.nullifier };
}

function randomSecret(): string {
  let result = 0n;
  do { result = BigInt(`0x${Array.from(crypto.getRandomValues(new Uint8Array(31)), b => b.toString(16).padStart(2, '0')).join('')}`); } while (result === 0n);
  return result.toString();
}

export function createPrivacyNote(context: PoolContext): PrivacyNote {
  return { protocol: 'qozmo-privacy-v1', ...validateContext(context), secret: randomSecret(), nullifier: randomSecret() };
}

export function noteCommitment(note: PrivacyNote): bigint {
  const n = validateNote(note);
  return poseidon3([field(n.secret), field(n.nullifier), poolDomain(n)]);
}

export function noteNullifierHash(note: PrivacyNote): bigint {
  const n = validateNote(note);
  return poseidon2([field(n.nullifier), poolDomain(n)]);
}

export function withdrawalContext(context: PoolContext, recipient: Address, relayer: Address, fee: bigint): bigint {
  const c = validateContext(context);
  const to = getAddress(recipient), relay = getAddress(relayer);
  if (to === zeroAddress || to === c.pool || fee < 0n || fee >= BigInt(c.denomination) || (fee > 0n && relay === zeroAddress)) throw new Error('Invalid withdrawal recipient or fee.');
  return poseidon4([BigInt(to), BigInt(relay), fee, poolDomain(c)]);
}

export type MerklePath = { root: string; siblings: string[]; pathIndices: number[] };
export function merklePath(leaves: readonly bigint[], index: number): MerklePath {
  if (!Number.isInteger(index) || index < 0 || index >= leaves.length || leaves.length > 2 ** TREE_DEPTH) throw new Error('Invalid leaf index or full research tree.');
  if (leaves.some(v => v <= 0n || v >= FIELD) || new Set(leaves).size !== leaves.length) throw new Error('Invalid or duplicate commitments.');
  let layer = [...leaves];
  let zero = 0n;
  let cursor = index;
  const siblings: string[] = [], pathIndices: number[] = [];
  for (let level = 0; level < TREE_DEPTH; level++) {
    siblings.push((layer[cursor ^ 1] ?? zero).toString());
    pathIndices.push(cursor & 1);
    const next: bigint[] = [];
    for (let i = 0; i < layer.length; i += 2) next.push(poseidon2([layer[i], layer[i + 1] ?? zero]));
    layer = next;
    zero = poseidon2([zero, zero]);
    cursor >>= 1;
  }
  return { root: layer[0].toString(), siblings, pathIndices };
}

/** Leaves must come from canonical, ordered Deposit events for this exact pool. */
export function withdrawalWitness(note: PrivacyNote, leaves: readonly bigint[], recipient: Address, relayer: Address, fee: bigint) {
  const n = validateNote(note);
  const path = merklePath(leaves, leaves.indexOf(noteCommitment(n)));
  const contextHash = withdrawalContext(n, recipient, relayer, fee);
  return {
    secret: n.secret, nullifier: n.nullifier, domain: poolDomain(n).toString(),
    nullifierHash: noteNullifierHash(n).toString(), root: path.root,
    siblings: path.siblings, pathIndices: path.pathIndices,
    recipient: BigInt(recipient).toString(), relayer: BigInt(relayer).toString(), fee: fee.toString(),
    contextHash: contextHash.toString(),
  };
}
