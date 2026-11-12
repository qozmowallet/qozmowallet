import { decodeFunctionData, encodeFunctionData, erc20Abi, getAddress, type Address, type Hex } from 'viem';
import { quantumSafeAccountAbi, ENTRYPOINT_V07 } from './quantum-sdk/account';
import type { JournalEntry } from './quantum-sdk/journal';
import { privacyCallDetails } from './privacy/account-calls';
import { PRIVACY_RESEARCH } from './privacy/research-deployment';
import type { OperationReceiptInspection } from './quantum-sdk/operation-receipt';

export type AccountOperation = { kind: 'transfer' | 'token-transfer' | 'privacy-deposit' | 'privacy-withdrawal' | 'contract-call' | 'batch' | 'recovery'; label: string; recipient?: Address; amount?: bigint; token?: Address; reference?: string };
export type AccountReceipt = OperationReceiptInspection & { confirmations?: number };
/** Classify actual signed calldata, including older entries with no UI metadata. */
export function describeAccountOperation(entry: JournalEntry, owner: Address): AccountOperation {
  if (entry.kind === 'recovery') return { kind: 'recovery', label: 'Recovery operation' };
  const unknown: AccountOperation = { kind: 'contract-call', label: 'Contract operation' };
  try {
    const data = entry.userOperation.callData as Hex;
    const decoded = decodeFunctionData({ abi: quantumSafeAccountAbi, data });
    if (decoded.functionName === 'executeBatch') return { kind: 'batch', label: 'Batch operation' };
    if (decoded.functionName !== 'execute' || encodeFunctionData({ abi: quantumSafeAccountAbi, functionName: 'execute', args: decoded.args }) !== data) return unknown;
    const [to, value, callData] = decoded.args;
    if (getAddress(to) === PRIVACY_RESEARCH.pool) {
      const details = privacyCallDetails({ chainId: 46630, to, value, data: callData }, owner);
      return { kind: details.kind === 'deposit' ? 'privacy-deposit' : 'privacy-withdrawal', label: details.kind === 'deposit' ? 'Privacy deposit' : 'Privacy withdrawal', recipient: details.recipient, amount: BigInt(PRIVACY_RESEARCH.denomination), reference: details.reference };
    }
    if (callData === '0x') return { kind: 'transfer', label: 'ETH transfer', recipient: getAddress(to), amount: value };
    if (value === 0n) {
      const token = decodeFunctionData({ abi: erc20Abi, data: callData });
      if (token.functionName === 'transfer' && encodeFunctionData({ abi: erc20Abi, functionName: 'transfer', args: token.args }) === callData) return { kind: 'token-transfer', label: 'Token transfer', recipient: getAddress(token.args[0]), amount: token.args[1], token: getAddress(to) };
    }
    return { ...unknown, recipient: getAddress(to) };
  } catch { return unknown; }
}
export function accountExecutionState(entry: JournalEntry, receipt: AccountReceipt | undefined, owner: Address): 'confirmed' | 'reverted' | 'pending' | 'replaced' | 'unverified' {
  const matches = receipt && receipt.account.toLowerCase() === owner.toLowerCase() && receipt.chainId === 46630 && receipt.entryPoint.toLowerCase() === ENTRYPOINT_V07.toLowerCase() && receipt.userOpHash?.toLowerCase() === entry.userOpHash.toLowerCase() && receipt.transactionHash.toLowerCase() === entry.transactionHash?.toLowerCase();
  if (matches && receipt.status === 'succeeded') return 'confirmed';
  if (matches && receipt.status === 'execution-reverted') return 'reverted';
  if (entry.status === 'replaced') return 'replaced';
  return entry.status === 'signed' && !entry.transactionHash ? 'pending' : 'unverified';
}
