import { decodeFunctionResult, encodeFunctionData, parseAbi, zeroAddress, type Address, type Hex, type PublicClient } from "viem";
import { entryPoint07Abi, toPackedUserOperation, type UserOperation } from "viem/account-abstraction";

/** Arbitrum's NodeInterface: a virtual contract answering gas questions via eth_call. */
const NODE_INTERFACE: Address = "0x00000000000000000000000000000000000000C8";
/** OP Stack predeploy that prices the L1 data of a transaction. */
const GAS_PRICE_ORACLE: Address = "0x420000000000000000000000000000000000000F";

const nodeInterfaceAbi = parseAbi([
  "function gasEstimateL1Component(address to, bool contractCreation, bytes data) payable returns (uint64 gasEstimateForL1, uint256 baseFee, uint256 l1BaseFeeEstimate)",
]);
const gasPriceOracleAbi = parseAbi(["function getL1Fee(bytes data) view returns (uint256)"]);

/**
 * Rollups charge for posting the bundle's data to Ethereum, and ERC-4337 accounts repay that
 * through preVerificationGas; a relayer left out of it pays it themselves. A WOTS signature is
 * 2 KB of incompressible bytes, which makes this the largest part of the cost on L2s.
 *
 * - Arbitrum (incl. Robinhood Chain): NodeInterface returns the L1 part directly in L2 gas.
 * - OP Stack (Base): GasPriceOracle returns a fee in wei, converted at `maxFeePerGas`; +10% for
 *   the transaction envelope the calldata alone leaves out.
 * - Anywhere else: 0.
 */
export async function estimateL1Gas(client: PublicClient, entryPoint: Address, op: UserOperation<"0.7">): Promise<bigint> {
  const data = encodeFunctionData({ abi: entryPoint07Abi, functionName: "handleOps", args: [[toPackedUserOperation(op)], zeroAddress] });
  const arbitrum = await callOrZero(client, NODE_INTERFACE, encodeFunctionData({
    abi: nodeInterfaceAbi,
    functionName: "gasEstimateL1Component",
    args: [entryPoint, false, data],
  }));
  if (arbitrum) {
    const [gasForL1] = decodeFunctionResult({ abi: nodeInterfaceAbi, functionName: "gasEstimateL1Component", data: arbitrum });
    return gasForL1;
  }
  const op1 = await callOrZero(client, GAS_PRICE_ORACLE, encodeFunctionData({ abi: gasPriceOracleAbi, functionName: "getL1Fee", args: [data] }));
  if (op1 && op.maxFeePerGas > 0n) {
    const fee = decodeFunctionResult({ abi: gasPriceOracleAbi, functionName: "getL1Fee", data: op1 });
    return ((fee * 110n) / 100n + op.maxFeePerGas - 1n) / op.maxFeePerGas;
  }
  return 0n;
}

async function callOrZero(client: PublicClient, to: Address, data: Hex): Promise<Hex | undefined> {
  try {
    const res = await client.call({ to, data });
    return res.data && res.data !== "0x" ? res.data : undefined;
  } catch {
    return undefined;
  }
}
