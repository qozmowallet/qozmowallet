import { decodeEventLog, decodeFunctionData, getAddress, isAddress, isHash, keccak256, parseAbi, zeroAddress, type Address, type Hash, type PublicClient } from 'viem';
import { field, withdrawalContext } from './note';
import { privacyPoolAbi } from './transactions';
import { PRIVACY_RESEARCH, type PrivacyResearchPins } from './research-deployment';

type ReceiptPin = { hash: Hash; blockNumber: string; blockHash: Hash };
export type DemoEvidence = {
  version: 1; status: 'complete'; chainId: 46630; pool: Address; verifier: Address;
  denomination: string; sender: Address; recipient: Address; commitment: string;
  nullifierHash: string; root: string; domain: string; leafIndex: number;
  deposit: ReceiptPin; withdrawal: ReceiptPin; gasFeeWei: string; completedAt: string;
  proof: { a: [string, string]; b: [[string, string], [string, string]]; c: [string, string] };
  publicSignals: [string, string, string, string];
};
const verifierAbi = parseAbi(['function verifyProof(uint256[2] a, uint256[2][2] b, uint256[2] c, uint256[4] signals) view returns (bool)']);
const invalid = () => new Error('Invalid privacy demo evidence.');

export function parseDemoEvidence(value: unknown, pins: PrivacyResearchPins = PRIVACY_RESEARCH): DemoEvidence {
  const r = value as DemoEvidence;
  if (!r || r.version !== 1 || r.status !== 'complete' || r.chainId !== 46630 || r.pool !== pins.pool || r.verifier !== pins.verifier || r.domain !== pins.domain || r.denomination !== pins.denomination || !isAddress(r.sender ?? '') || !isAddress(r.recipient ?? '') || r.recipient === zeroAddress || r.recipient === r.pool || !Number.isInteger(r.leafIndex) || r.leafIndex < 0 || r.leafIndex >= 256 || !r.completedAt || !Number.isFinite(Date.parse(r.completedAt))) throw invalid();
  for (const key of ['commitment', 'nullifierHash', 'root', 'domain', 'gasFeeWei'] as const) field(r[key]);
  for (const receipt of [r.deposit, r.withdrawal]) if (!receipt || !isHash(receipt.hash ?? '') || !isHash(receipt.blockHash ?? '') || !/^[1-9][0-9]{0,15}$/.test(receipt.blockNumber)) throw invalid();
  if (r.deposit.hash === r.withdrawal.hash || BigInt(r.withdrawal.blockNumber) < BigInt(r.deposit.blockNumber)) throw invalid();
  const expected = [r.root, r.nullifierHash, r.domain, withdrawalContext({ chainId: 46630, pool: r.pool, denomination: r.denomination }, r.recipient, zeroAddress, 0n).toString()];
  if (!Array.isArray(r.publicSignals) || r.publicSignals.length !== 4 || r.publicSignals.some((v, i) => v !== expected[i])) throw invalid();
  if (!r.proof || !Array.isArray(r.proof.b) || r.proof.b.length !== 2) throw invalid();
  const baseField = 21888242871839275222246405745257275088696311157297823662689037894645226208583n;
  for (const row of [r.proof.a, ...r.proof.b, r.proof.c]) if (!Array.isArray(row) || row.length !== 2 || row.some(v => typeof v !== 'string' || !/^(0|[1-9][0-9]{0,76})$/.test(v) || BigInt(v) >= baseField)) throw invalid();
  return r;
}

/** Fresh read-only verification; recorded evidence is never treated as a live RPC result. */
export async function verifyDemoEvidence(value: unknown, client: PublicClient, signal?: AbortSignal, pins: PrivacyResearchPins = PRIVACY_RESEARCH) {
  const r = parseDemoEvidence(value, pins);
  signal?.throwIfAborted();
  if (await client.getChainId() !== 46630) throw new Error('Wrong chain: demo evidence belongs to Robinhood Testnet 46630.');
  const [poolCode, verifierCode, head] = await Promise.all([client.getCode({ address: r.pool }), client.getCode({ address: r.verifier }), client.getBlockNumber({ cacheTime: 0 })]);
  if (!poolCode || !verifierCode || keccak256(poolCode) !== pins.poolCodeHash || keccak256(verifierCode) !== pins.verifierCodeHash) throw new Error('Privacy demo contract code does not match the research deployment.');
  const transactions = [];
  for (const [kind, pin] of [['deposit', r.deposit], ['withdrawal', r.withdrawal]] as const) {
    signal?.throwIfAborted();
    const [receipt, tx, block] = await Promise.all([client.getTransactionReceipt({ hash: pin.hash }), client.getTransaction({ hash: pin.hash }), client.getBlock({ blockNumber: BigInt(pin.blockNumber) })]);
    if (receipt.status !== 'success' || receipt.transactionHash !== pin.hash || receipt.blockHash !== pin.blockHash || block.hash !== pin.blockHash || receipt.blockNumber !== BigInt(pin.blockNumber) || head < receipt.blockNumber + 2n || tx.blockHash !== pin.blockHash || tx.to?.toLowerCase() !== r.pool.toLowerCase() || tx.from.toLowerCase() !== r.sender.toLowerCase()) throw new Error(`The ${kind} receipt is not a confirmed canonical pool transaction.`);
    const decoded = decodeFunctionData({ abi: privacyPoolAbi, data: tx.input });
    if (kind === 'deposit') {
      if (tx.value !== BigInt(r.denomination) || decoded.functionName !== 'deposit' || decoded.args[0] !== BigInt(r.commitment)) throw new Error('Deposit calldata or amount differs from the recorded demo.');
    } else {
      const expectedArgs = [r.proof.a, r.proof.b, r.proof.c, r.root, r.nullifierHash, getAddress(r.recipient), zeroAddress, '0'];
      const normalized = JSON.stringify(decoded.args, (_, v) => typeof v === 'bigint' ? v.toString() : typeof v === 'string' && isAddress(v) ? getAddress(v) : v);
      if (tx.value !== 0n || decoded.functionName !== 'withdraw' || normalized !== JSON.stringify(expectedArgs)) throw new Error('Withdrawal calldata differs from the proof or recipient.');
    }
    const matches = receipt.logs.filter(log => log.address.toLowerCase() === r.pool.toLowerCase()).flatMap(log => { try { return [decodeEventLog({ abi: privacyPoolAbi, data: log.data, topics: log.topics })]; } catch { return []; } });
    if (kind === 'deposit' && !matches.some(event => event.eventName === 'Deposit' && event.args.commitment === BigInt(r.commitment) && event.args.leafIndex === r.leafIndex)) throw new Error('Deposit event does not match the demo commitment.');
    if (kind === 'withdrawal' && !matches.some(event => event.eventName === 'Withdrawal' && event.args.nullifierHash === BigInt(r.nullifierHash) && getAddress(event.args.recipient) === getAddress(r.recipient) && event.args.relayer === zeroAddress && event.args.fee === 0n)) throw new Error('Withdrawal event does not match the demo nullifier and payout.');
    transactions.push(receipt);
  }
  signal?.throwIfAborted();
  const poolContract = { address: r.pool, abi: privacyPoolAbi };
  const [known, spent, domain, denomination, proofValid] = await Promise.all([
    client.readContract({ ...poolContract, functionName: 'knownRoots', args: [BigInt(r.root)] }),
    client.readContract({ ...poolContract, functionName: 'spentNullifiers', args: [BigInt(r.nullifierHash)] }),
    client.readContract({ ...poolContract, functionName: 'domain' }),
    client.readContract({ ...poolContract, functionName: 'denomination' }),
    client.readContract({ address: r.verifier, abi: verifierAbi, functionName: 'verifyProof', args: [r.proof.a.map(BigInt) as [bigint, bigint], r.proof.b.map(row => row.map(BigInt)) as [[bigint, bigint], [bigint, bigint]], r.proof.c.map(BigInt) as [bigint, bigint], r.publicSignals.map(BigInt) as [bigint, bigint, bigint, bigint]] }),
  ]);
  signal?.throwIfAborted();
  const actualFees = transactions.reduce((total, receipt) => total + receipt.gasUsed * receipt.effectiveGasPrice, 0n);
  if (!known || !spent || !proofValid || domain !== BigInt(r.domain) || denomination !== BigInt(r.denomination) || actualFees.toString() !== r.gasFeeWei) throw new Error('Demo proof, pool parameters, fee or spent state could not be verified.');
  return { checkedAt: new Date().toISOString(), depositConfirmed: true, withdrawalConfirmed: true, proofValid: true, nullifierSpent: true, gasFeeWei: actualFees.toString(), blockNumber: head.toString() };
}
