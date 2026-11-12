import assert from "node:assert/strict";
import { test } from "node:test";
import { encodeAbiParameters, encodeEventTopics, TransactionReceiptNotFoundError, type Hex, type PublicClient } from "viem";
import { entryPoint07Abi } from "viem/account-abstraction";
import { ENTRYPOINT_V07, inspectOperationReceipt } from "../lib/wallet/quantum-sdk/index.ts";

const account = `0x${"11".repeat(20)}` as const;
const transactionHash = `0x${"22".repeat(32)}` as const;
const userOpHash = `0x${"33".repeat(32)}` as const;
const blockHash = `0x${"44".repeat(32)}` as const;
const otherHash = `0x${"55".repeat(32)}` as const;
const target = { chainId: 46630, account, entryPoint: ENTRYPOINT_V07, transactionHash, userOpHash };
function log(success = true, hash: Hex = userOpHash, sender: Hex = account) {
  return { address: ENTRYPOINT_V07, transactionHash, blockNumber: 12n, blockHash, removed: false,
    topics: encodeEventTopics({ abi: entryPoint07Abi, eventName: "UserOperationEvent", args: { userOpHash: hash, sender, paymaster: `0x${"00".repeat(20)}` } }),
    data: encodeAbiParameters([{ type: "uint256" }, { type: "bool" }, { type: "uint256" }, { type: "uint256" }],
      [7n, success, 123456789n, 456n]) };
}
function fixture() {
  const calls: string[] = [];
  const state = { chainId: 46630, configuredChain: 46630, receiptError: undefined as Error | undefined,
    block: { number: 12n, hash: blockHash as Hex },
    receipt: { transactionHash: transactionHash as Hex, blockNumber: 12n, blockHash: blockHash as Hex, status: "success", logs: [log()] } };
  const client = { get chain() { return { id: state.configuredChain }; },
    getChainId: async () => { calls.push("chain"); return state.chainId; },
    getTransactionReceipt: async () => { calls.push("receipt"); if (state.receiptError) throw state.receiptError; return state.receipt; },
    getBlock: async () => { calls.push("block"); return state.block; },
  } as unknown as PublicClient;
  return { client, calls, state };
}

test("receipt inspection binds sender, operation, EntryPoint and canonical block and returns only public execution data", async () => {
  const f = fixture();
  const result = await inspectOperationReceipt(f.client, target);
  assert.equal(result.status, "succeeded"); assert.equal(result.nonce, "7");
  assert.equal(result.actualGasCost, "123456789"); assert.equal(result.actualGasUsed, "456");
  assert.equal(result.blockNumber, "12"); assert.equal(result.blockHash, blockHash);
  assert.deepEqual(f.calls, ["chain", "receipt", "block"]);
  assert.equal(JSON.stringify(result).includes("topics"), false);
  assert.equal(JSON.stringify(result).includes("data"), false);
});

test("a successful outer transaction with a failed operation is execution-reverted", async () => {
  const f = fixture(); f.state.receipt.logs = [log(false)];
  const result = await inspectOperationReceipt(f.client, target);
  assert.equal(result.status, "execution-reverted"); assert.equal(result.actualGasUsed, "456");
});

test("unrelated, spoofed, removed and inconsistent receipt logs cannot verify an operation", async () => {
  for (const changed of [log(true, otherHash), log(true, userOpHash, ENTRYPOINT_V07),
    { ...log(), address: account }, { ...log(), removed: true }, { ...log(), transactionHash: otherHash },
    { ...log(), blockHash: otherHash }, { ...log(), blockNumber: 13n }, { ...log(), data: "0x" as Hex }]) {
    const f = fixture(); f.state.receipt.logs = [changed];
    const result = await inspectOperationReceipt(f.client, target);
    assert.equal(result.status, "unverified"); assert.equal(result.reason, "missing-event");
    assert.equal(result.actualGasCost, undefined);
  }
});

test("ambiguous operations require the exact operation hash rather than choosing the first event", async () => {
  const f = fixture(); f.state.receipt.logs = [log(), log(false, otherHash)];
  const ambiguous = await inspectOperationReceipt(f.client, { ...target, userOpHash: undefined });
  assert.equal(ambiguous.status, "unverified"); assert.equal(ambiguous.reason, "ambiguous-event");
  assert.equal((await inspectOperationReceipt(f.client, target)).status, "succeeded");
  assert.equal((await inspectOperationReceipt(f.client, { ...target, userOpHash: otherHash })).status, "execution-reverted");
  f.state.receipt.logs = [log(), log()];
  assert.equal((await inspectOperationReceipt(f.client, target)).reason, "ambiguous-event");
});

test("outer transaction failure, absent events, changed block and malformed receipts remain unverified", async () => {
  const f = fixture(); f.state.receipt.status = "reverted";
  assert.equal((await inspectOperationReceipt(f.client, target)).reason, "outer-reverted");
  f.state.receipt.status = "success"; f.state.receipt.logs = [];
  assert.equal((await inspectOperationReceipt(f.client, target)).reason, "missing-event");
  f.state.block.hash = otherHash;
  assert.equal((await inspectOperationReceipt(f.client, target)).reason, "noncanonical-block");
  f.state.block.hash = blockHash; f.state.block.number = 13n;
  assert.equal((await inspectOperationReceipt(f.client, target)).reason, "noncanonical-block");
  f.state.receipt.transactionHash = otherHash;
  assert.equal((await inspectOperationReceipt(f.client, target)).reason, "invalid-receipt");
});

test("wrong chains stop before receipt lookup and raw provider errors are never returned", async () => {
  for (const field of ["chainId", "configuredChain"] as const) {
    const f = fixture(); f.state[field] = 1;
    await assert.rejects(inspectOperationReceipt(f.client, target), /Receipt check unavailable/);
    assert.deepEqual(f.calls, ["chain"]);
  }
  const f = fixture(); f.state.receiptError = new Error("https://private.rpc/secret-api-key signature=0xprivate");
  await assert.rejects(inspectOperationReceipt(f.client, target), error => error instanceof Error &&
    !/private|secret-api-key|signature/.test(error.message) && /unavailable/.test(error.message));
});

test("not-found receipts differ from unavailable RPCs and never change a journal", async () => {
  const f = fixture(); f.state.receiptError = new TransactionReceiptNotFoundError({ hash: transactionHash });
  const result = await inspectOperationReceipt(f.client, target);
  assert.equal(result.status, "not-found"); assert.equal(result.actualGasUsed, undefined);
  assert.deepEqual(f.calls, ["chain", "receipt"]);
});

test("invalid inputs and cancellation stop before further read calls", async () => {
  for (const change of [{ chainId: 0 }, { transactionHash: "0x12" }, { userOpHash: "0x00" }, { account: "0x" }, { entryPoint: "0x" }]) {
    const f = fixture();
    await assert.rejects(inspectOperationReceipt(f.client, { ...target, ...change } as typeof target), /Invalid operation/);
    assert.deepEqual(f.calls, []);
  }
  const f = fixture(), controller = new AbortController(); controller.abort();
  await assert.rejects(inspectOperationReceipt(f.client, target, controller.signal), { name: "AbortError" });
  assert.deepEqual(f.calls, []);
});
