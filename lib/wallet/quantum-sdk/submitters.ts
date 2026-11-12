import {
  http,
  parseEventLogs,
  type Account,
  type Address,
  type Chain,
  type Hex,
  type PublicClient,
  type Transport,
  type WalletClient,
} from "viem";
import {
  createBundlerClient,
  entryPoint07Abi,
  formatUserOperationRequest,
  getUserOperationHash,
  toPackedUserOperation,
  type UserOperation,
} from "viem/account-abstraction";

export type UserOperationResult = {
  userOpHash: Hex;
  success: boolean;
  transactionHash: Hex;
  actualGasUsed: bigint;
  actualGasCost: bigint;
};

export type GasEstimate = {
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
};

/** Gets a signed UserOperation on-chain. */
export interface Submitter {
  readonly kind: string;
  /** Optional: fee suggestion from the submitter (bundlers often require their own). */
  fees?(): Promise<{ maxFeePerGas: bigint; maxPriorityFeePerGas: bigint } | undefined>;
  /** Optional: gas estimate for an op carrying the stub signature. */
  estimate?(op: UserOperation<"0.7">): Promise<GasEstimate>;
  submit(op: UserOperation<"0.7">): Promise<{ userOpHash: Hex; wait(): Promise<UserOperationResult> }>;
}

/** Sends through an ERC-4337 bundler RPC (Alto, Pimlico, …). */
export function bundlerSubmitter(params: { url: string; entryPoint: Address; client: PublicClient }): Submitter {
  const bundler = createBundlerClient({ client: params.client, transport: http(params.url, { timeout: 10_000, retryCount: 0 }) });
  const entryPoint = params.entryPoint;

  async function compatibility() {
    try {
      const [actualChain, remoteChain, points] = await Promise.all([
        params.client.getChainId(),
        bundler.request({ method: "eth_chainId" as never, params: [] as never }) as Promise<unknown>,
        bundler.request({ method: "eth_supportedEntryPoints" as never, params: [] as never }) as Promise<unknown>,
      ]);
      if ((params.client.chain && actualChain !== params.client.chain.id) ||
          typeof remoteChain !== "string" || !/^0x[0-9a-fA-F]+$/.test(remoteChain) || BigInt(remoteChain) !== BigInt(actualChain) ||
          !Array.isArray(points) || !points.some(point => typeof point === "string" && point.toLowerCase() === entryPoint.toLowerCase())) {
        throw Error();
      }
      return actualChain;
    } catch {
      throw new Error("Bundler compatibility check failed. Check its network and supported EntryPoint before signing or submitting.");
    }
  }

  return {
    kind: "bundler",
    async fees() {
      await compatibility();
      // Bundlers enforce their own minimum prices. Pimlico/Alto expose a full oracle; Alchemy's
      // Rundler (the bundler on Robinhood Chain) exposes the minimum priority fee.
      try {
        const res = (await bundler.request({
          method: "pimlico_getUserOperationGasPrice" as never,
          params: [] as never,
        })) as { fast: { maxFeePerGas: Hex; maxPriorityFeePerGas: Hex } };
        return {
          maxFeePerGas: BigInt(res.fast.maxFeePerGas),
          maxPriorityFeePerGas: BigInt(res.fast.maxPriorityFeePerGas),
        };
      } catch {
        // not Pimlico/Alto
      }
      try {
        const priority = BigInt(
          (await bundler.request({ method: "rundler_maxPriorityFeePerGas" as never, params: [] as never })) as Hex,
        );
        const block = await params.client.getBlock();
        const maxPriorityFeePerGas = (priority * 125n) / 100n;
        return { maxFeePerGas: (block.baseFeePerGas ?? 0n) * 2n + maxPriorityFeePerGas, maxPriorityFeePerGas };
      } catch {
        return undefined;
      }
    },
    async estimate(op) {
      await compatibility();
      const res = (await bundler.request({
        method: "eth_estimateUserOperationGas",
        params: [formatUserOperationRequest(op), entryPoint],
      })) as { callGasLimit: Hex; verificationGasLimit: Hex; preVerificationGas: Hex };
      return {
        callGasLimit: BigInt(res.callGasLimit),
        verificationGasLimit: BigInt(res.verificationGasLimit),
        preVerificationGas: BigInt(res.preVerificationGas),
      };
    },
    async submit(op) {
      const chainId = await compatibility();
      const expectedHash = getUserOperationHash({ userOperation: op, entryPointAddress: entryPoint, entryPointVersion: "0.7", chainId });
      const userOpHash = (await bundler.request({
        method: "eth_sendUserOperation",
        params: [formatUserOperationRequest(op), entryPoint],
      })) as Hex;
      if (typeof userOpHash !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(userOpHash) || userOpHash.toLowerCase() !== expectedHash.toLowerCase()) throw new Error("Bundler returned an unexpected UserOperation hash. Preserve the pending operation and check its status before retrying.");
      return {
        userOpHash,
        async wait() {
          const r = await bundler.waitForUserOperationReceipt({ hash: userOpHash, timeout: 180_000 });
          const receipt = await params.client.waitForTransactionReceipt({ hash: r.receipt.transactionHash, confirmations: 2, timeout: 90_000 });
          const event = parseEventLogs({ abi: entryPoint07Abi, eventName: "UserOperationEvent", logs: receipt.logs.filter(log => log.address.toLowerCase() === entryPoint.toLowerCase()) })
            .find(log => log.args.userOpHash.toLowerCase() === expectedHash.toLowerCase() && log.args.sender.toLowerCase() === op.sender.toLowerCase());
          if (receipt.status !== "success" || !event) throw new Error("Bundler receipt could not be verified against the EntryPoint logs. Keep the pending operation and check its onchain status.");
          return {
            userOpHash,
            success: event.args.success,
            transactionHash: receipt.transactionHash,
            actualGasUsed: event.args.actualGasUsed,
            actualGasCost: event.args.actualGasCost,
          };
        },
      };
    },
  };
}

/**
 * Calls EntryPoint.handleOps directly from an EOA, acting as our own bundler. The EOA fronts
 * the transaction gas and is refunded by the EntryPoint (it is the beneficiary). Useful on
 * local chains and as a fallback when no bundler is available.
 */
export function selfSubmitter(params: {
  entryPoint: Address;
  publicClient: PublicClient;
  walletClient: WalletClient<Transport, Chain, Account>;
  beneficiary?: Address;
}): Submitter {
  const { entryPoint, publicClient, walletClient } = params;
  const beneficiary = params.beneficiary ?? walletClient.account.address;

  return {
    kind: "self",
    async submit(op) {
      const chainId = await publicClient.getChainId();
      if (chainId !== walletClient.chain.id || (publicClient.chain && chainId !== publicClient.chain.id) ||
          await walletClient.getChainId() !== chainId)
        throw new Error("Relayer RPC chain mismatch. Preserve the signed operation and check network settings.");
      const expectedHash = getUserOperationHash({ userOperation: op, entryPointAddress: entryPoint, entryPointVersion: "0.7", chainId });
      const packed = toPackedUserOperation(op);
      const hash = await walletClient.writeContract({
        address: entryPoint,
        abi: entryPoint07Abi,
        functionName: "handleOps",
        args: [[packed], beneficiary],
      });
      return {
        userOpHash: expectedHash,
        async wait() {
          const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations: chainId === 31337 ? 1 : 2, timeout: 120_000 });
          const event = parseEventLogs({
            abi: entryPoint07Abi,
            eventName: "UserOperationEvent",
            logs: receipt.logs.filter(log => log.address.toLowerCase() === entryPoint.toLowerCase()),
          }).find(log => log.args.userOpHash.toLowerCase() === expectedHash.toLowerCase() &&
            log.args.sender.toLowerCase() === op.sender.toLowerCase() && log.args.nonce === op.nonce);
          if (receipt.status !== "success" || !event)
            throw new Error("Relayer receipt could not be verified against the EntryPoint logs. Keep the pending operation and check its onchain status.");
          return {
            userOpHash: event.args.userOpHash,
            success: event.args.success,
            transactionHash: hash,
            actualGasUsed: event.args.actualGasUsed,
            actualGasCost: event.args.actualGasCost,
          };
        },
      };
    },
  };
}
