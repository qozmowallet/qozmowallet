import {
  BaseError, ExecutionRevertedError, decodeFunctionResult, encodeFunctionData,
  isAddress, zeroAddress, type Address, type PublicClient,
} from "viem";
import { encodeCalls, erc20Abi } from "./account.ts";

export type TransferPreviewRequest = {
  recipient: Address;
  amount: bigint;
  /** Omitted for native ETH. */
  token?: Address;
  /** Maximum network fee from the reviewed operation quote. */
  maxFee: bigint;
};
export type TransferExecutionPreview = {
  status: "passed" | "blocked" | "unavailable" | "not-deployed";
  message: string;
  checkedAt: number;
  blockNumber?: bigint;
  recipientHasCode?: boolean;
  selfTransfer?: boolean;
  ethBalance?: bigint;
  assetBalance?: bigint;
};

/**
 * Read-only execution check of a single ETH/ERC-20 transfer, at one pinned block.
 * Calls execute as EntryPoint; it does NOT validate a UserOperation or consume a key.
 */
export async function previewTransfer(
  client: PublicClient,
  account: Address,
  entryPoint: Address,
  chainId: number,
  request: TransferPreviewRequest,
): Promise<TransferExecutionPreview> {
  const result: TransferExecutionPreview = { status: "unavailable", message: "The RPC could not check this transfer. Retry the check.", checkedAt: Date.now() };
  const finish = (status: TransferExecutionPreview["status"], message: string) => ({ ...result, status, message });
  if (!isAddress(request.recipient) || request.recipient.toLowerCase() === zeroAddress ||
      request.amount <= 0n || request.maxFee < 0n || (request.token && (!isAddress(request.token) || request.token.toLowerCase() === zeroAddress))) {
    return finish("blocked", "Enter a valid recipient, positive amount, and nonnegative network fee. The zero address cannot receive a transfer here.");
  }
  try {
    if (await client.getChainId() !== chainId || (client.chain && client.chain.id !== chainId)) {
      return finish("blocked", "The RPC network does not match the selected network.");
    }
    const blockNumber = await client.getBlockNumber({ cacheTime: 0 });
    result.blockNumber = blockNumber;
    result.checkedAt = Date.now();
    const [accountCode, recipientCode, ethBalance] = await Promise.all([
      client.getCode({ address: account, blockNumber }),
      client.getCode({ address: request.recipient, blockNumber }),
      client.getBalance({ address: account, blockNumber }),
    ]);
    result.ethBalance = ethBalance;
    result.recipientHasCode = !!recipientCode && recipientCode !== "0x";
    result.selfTransfer = request.recipient.toLowerCase() === account.toLowerCase();
    if (ethBalance < request.maxFee + (request.token ? 0n : request.amount)) {
      return finish("blocked", "Not enough ETH for the transfer and maximum network fee.");
    }
    const data = request.token ? encodeFunctionData({ abi: erc20Abi, functionName: "transfer", args: [request.recipient, request.amount] }) : undefined;
    if (request.token) {
      const tokenCode = await client.getCode({ address: request.token, blockNumber });
      if (!tokenCode || tokenCode === "0x") return finish("blocked", "The token contract is not deployed on this network.");
      result.assetBalance = await client.readContract({ address: request.token, abi: erc20Abi, functionName: "balanceOf", args: [account], blockNumber });
      if (result.assetBalance < request.amount) return finish("blocked", "The current token balance is lower than the amount being sent.");
    } else result.assetBalance = ethBalance;
    if (!accountCode || accountCode === "0x") {
      return finish("not-deployed", "This first transfer also deploys your vault. Balances were checked, but account execution cannot be checked before deployment.");
    }
    const call = request.token ? { to: request.token, data } : { to: request.recipient, value: request.amount };
    await client.call({ account: entryPoint, to: account, data: encodeCalls([call]), blockNumber });
    if (request.token) {
      // execute() bubbles reverts but does not inspect ERC-20's boolean return value.
      const response = await client.call({ account, to: request.token, data, blockNumber });
      if (response.data && response.data !== "0x") {
        const accepted = decodeFunctionResult({ abi: erc20Abi, functionName: "transfer", data: response.data });
        if (!accepted) return finish("blocked", "The token contract returned false for this transfer. No transfer was sent.");
      }
    }
    return finish("passed", "Execution did not revert at the checked block. No transaction was signed or sent.");
  } catch (error) {
    if (error instanceof BaseError && error.walk(cause => cause instanceof ExecutionRevertedError) instanceof ExecutionRevertedError) {
      return finish("blocked", "Execution reverted. Check the recipient, amount, and token restrictions before trying again.");
    }
    // RPC failures/unsupported calls are not evidence of a reverting transfer.
    return finish("unavailable", result.message);
  }
}
