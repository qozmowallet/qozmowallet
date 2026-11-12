import { parseEventLogs, TransactionReceiptNotFoundError, type Address, type Hex, type PublicClient } from "viem";
import { entryPoint07Abi } from "viem/account-abstraction";

export type OperationReceiptTarget = { transactionHash: Hex; userOpHash?: Hex };
export type OperationReceiptInspection = OperationReceiptTarget & {
  chainId: number;
  account: Address;
  entryPoint: Address;
  checkedAt: string;
  status: "succeeded" | "execution-reverted" | "not-found" | "unverified";
  reason?: "outer-reverted" | "missing-event" | "ambiguous-event" | "noncanonical-block" | "invalid-receipt";
  blockNumber?: string;
  blockHash?: Hex;
  nonce?: string;
  actualGasUsed?: string;
  actualGasCost?: string;
};

const hash = (value: unknown): value is Hex => typeof value === "string" && /^0x[0-9a-f]{64}$/i.test(value);
const address = (value: unknown): value is Address => typeof value === "string" && /^0x[0-9a-f]{40}$/i.test(value) && !/^0x0{40}$/i.test(value);

/** Read-only, uncached observation. A rotated key or outer receipt alone is not execution success. */
export async function inspectOperationReceipt(client: PublicClient, request: OperationReceiptTarget & {
  chainId: number; account: Address; entryPoint: Address;
}, signal?: AbortSignal): Promise<OperationReceiptInspection> {
  if (!Number.isSafeInteger(request.chainId) || request.chainId <= 0 || !address(request.account) || !address(request.entryPoint) ||
    !hash(request.transactionHash) || (request.userOpHash !== undefined && !hash(request.userOpHash)))
    throw new Error("Invalid operation receipt request.");
  const base = { chainId: request.chainId, account: request.account, entryPoint: request.entryPoint,
    transactionHash: request.transactionHash, ...(request.userOpHash ? { userOpHash: request.userOpHash } : {}) };
  const result = (status: OperationReceiptInspection["status"], details: Partial<OperationReceiptInspection> = {}): OperationReceiptInspection =>
    ({ ...base, checkedAt: new Date().toISOString(), status, ...details });
  try {
    signal?.throwIfAborted();
    if (await client.getChainId() !== request.chainId || (client.chain && client.chain.id !== request.chainId))
      throw new Error("chain mismatch");
    signal?.throwIfAborted();
    let receipt;
    try { receipt = await client.getTransactionReceipt({ hash: request.transactionHash }); }
    catch (error) {
      signal?.throwIfAborted();
      if (error instanceof TransactionReceiptNotFoundError) return result("not-found");
      throw error;
    }
    signal?.throwIfAborted();
    if (!hash(receipt.transactionHash) || receipt.transactionHash.toLowerCase() !== request.transactionHash.toLowerCase() ||
      typeof receipt.blockNumber !== "bigint" || receipt.blockNumber < 0n || !hash(receipt.blockHash) || !Array.isArray(receipt.logs))
      return result("unverified", { reason: "invalid-receipt" });
    const block = await client.getBlock({ blockNumber: receipt.blockNumber });
    signal?.throwIfAborted();
    if (block.number !== receipt.blockNumber || block.hash?.toLowerCase() !== receipt.blockHash.toLowerCase())
      return result("unverified", { reason: "noncanonical-block" });
    const included = { blockNumber: String(receipt.blockNumber), blockHash: receipt.blockHash };
    if (receipt.status === "reverted") return result("unverified", { ...included, reason: "outer-reverted" });
    if (receipt.status !== "success") return result("unverified", { reason: "invalid-receipt" });
    const events = parseEventLogs({ abi: entryPoint07Abi, eventName: "UserOperationEvent", strict: true,
      logs: receipt.logs.filter(log => log.address.toLowerCase() === request.entryPoint.toLowerCase() && !log.removed &&
        log.transactionHash?.toLowerCase() === receipt.transactionHash.toLowerCase() && log.blockHash?.toLowerCase() === receipt.blockHash.toLowerCase() &&
        log.blockNumber === receipt.blockNumber) })
      .filter(log => log.args.sender.toLowerCase() === request.account.toLowerCase() &&
        (!request.userOpHash || log.args.userOpHash.toLowerCase() === request.userOpHash.toLowerCase()));
    if (events.length !== 1) return result("unverified", { ...included, reason: events.length ? "ambiguous-event" : "missing-event" });
    const event = events[0].args;
    return result(event.success ? "succeeded" : "execution-reverted", {
      ...included, userOpHash: event.userOpHash, nonce: String(event.nonce),
      actualGasUsed: String(event.actualGasUsed), actualGasCost: String(event.actualGasCost),
    });
  } catch {
    signal?.throwIfAborted();
    // RPC errors can contain provider credentials, signed data or response bodies.
    throw new Error("Receipt check unavailable. Verify the selected network and retry. No operation was signed or submitted.");
  }
}
