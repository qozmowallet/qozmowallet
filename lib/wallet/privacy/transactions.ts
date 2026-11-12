import { encodeFunctionData, parseAbi, type Address, type Hex } from 'viem';
import { noteCommitment, validateNote, withdrawalWitness, type PrivacyNote } from './note';

export const privacyPoolAbi = parseAbi([
  'function deposit(uint256 commitment) payable',
  'function withdraw(uint256[2] a, uint256[2][2] b, uint256[2] c, uint256 spendRoot, uint256 nullifierHash, address recipient, address relayer, uint256 fee)',
  'function domain() view returns (uint256)',
  'function denomination() view returns (uint256)',
  'function root() view returns (uint256)',
  'function nextIndex() view returns (uint32)',
  'function knownRoots(uint256) view returns (bool)',
  'function spentNullifiers(uint256) view returns (bool)',
  'event Deposit(uint256 indexed commitment, uint32 leafIndex, uint256 root)',
  'event Withdrawal(uint256 indexed nullifierHash, address indexed recipient, address relayer, uint256 fee)',
]);
export type PrivacyTransaction = { chainId: number; to: Address; value: bigint; data: Hex };
export type Groth16Result = {
  a: readonly [bigint, bigint];
  b: readonly [readonly [bigint, bigint], readonly [bigint, bigint]];
  c: readonly [bigint, bigint];
  publicSignals: readonly bigint[];
};
export type PrivacyProver = (witness: ReturnType<typeof withdrawalWitness>) => Promise<Groth16Result>;

/** Offline calldata only. Caller must validate deployed code, chain, root, nullifier and simulate before signing. */
export function preparePrivacyDeposit(note: PrivacyNote): PrivacyTransaction {
  const n = validateNote(note);
  return { chainId: n.chainId, to: n.pool, value: BigInt(n.denomination), data: encodeFunctionData({ abi: privacyPoolAbi, functionName: 'deposit', args: [noteCommitment(n)] }) };
}

/** Proof generation stays behind an adapter so private witnesses need not leave the device. */
export async function preparePrivacyWithdrawal(note: PrivacyNote, leaves: readonly bigint[], recipient: Address, relayer: Address, fee: bigint, prover: PrivacyProver): Promise<PrivacyTransaction> {
  const n = validateNote(note);
  const witness = withdrawalWitness(n, leaves, recipient, relayer, fee);
  const result = await prover(witness);
  const expected = [witness.root, witness.nullifierHash, witness.domain, witness.contextHash].map(BigInt);
  if (result.publicSignals.length !== expected.length || result.publicSignals.some((v, i) => v !== expected[i])) throw new Error('Prover returned a different withdrawal context.');
  // BN254 coordinate field differs from the circuit scalar field.
  const baseField = 21888242871839275222246405745257275088696311157297823662689037894645226208583n;
  const coordinates = [result.a, ...result.b, result.c];
  if (result.b.length !== 2 || coordinates.some(row => row.length !== 2 || row.some(v => typeof v !== 'bigint' || v < 0n || v >= baseField))) throw new Error('Invalid proof coordinates.');
  return {
    chainId: n.chainId, to: n.pool, value: 0n,
    data: encodeFunctionData({ abi: privacyPoolAbi, functionName: 'withdraw', args: [result.a, result.b, result.c, BigInt(witness.root), BigInt(witness.nullifierHash), recipient, relayer, fee] }),
  };
}
