import { concat, encodeFunctionData, type Address, type Hex, type PublicClient } from "viem";
import { entryPoint07Abi, getUserOperationHash, type UserOperation } from "viem/account-abstraction";

import {
  ENTRYPOINT_V07,
  RECOVERY_STUB_SIGNATURE,
  STUB_SIGNATURE,
  encodeCalls,
  encodeFactoryData,
  encodeRecoverySignature,
  encodeUserOpSignature,
  recoveryDigest,
  predictAccountAddress,
  quantumSafeAccountAbi,
  quantumSafeAccountFactoryAbi,
  signatureDigest,
  type Call,
} from "./account.ts";
import {
  MemoryJournal,
  deserializeUserOperation,
  serializeUserOperation,
  type JournalEntry,
  type KeyJournal,
} from "./journal.ts";
import { estimateL1Gas } from "./l1-fee.ts";
import type { Submitter, UserOperationResult } from "./submitters.ts";
import { previewTransfer, type TransferPreviewRequest } from "./transfer-preview.ts";
import { assertDeploymentReady, parseDeploymentManifest, type DeploymentPolicy } from "./readiness.ts";
import { RECOVERY_KEY_OFFSET, publicKeyHash, recoveryKeyHash, sign } from "./wots.ts";

/** Verification gas floors, measured in contracts/test (worst case is ~all-zero digits). */
export const VERIFICATION_GAS = { deployed: 400_000n, withDeployment: 650_000n };

export class KeyReuseError extends Error {
  readonly keyIndex: number;
  constructor(keyIndex: number) {
    super(
      `Key #${keyIndex} already signed a different operation. Signing again would expose the key. ` +
        `Re-send the pending operation instead.`,
    );
    this.name = "KeyReuseError";
    this.keyIndex = keyIndex;
  }
}

export class KeyMismatchError extends Error {
  constructor(keyIndex: number, onchain: Hex, local: Hex) {
    super(
      `On-chain key #${keyIndex} is ${onchain} but this seed derives ${local}. ` +
        `Wrong seed, or the account was rotated elsewhere. Refusing to sign.`,
    );
    this.name = "KeyMismatchError";
  }
}

export class RecoveryKeyExposedError extends Error {
  constructor(recoveryIndex: number) {
    super(
      `Recovery key #${recoveryIndex} signed an operation that was superseded, so it must not sign again. ` +
        `Rotate the recovery key first (a normal operation).`,
    );
    this.name = "RecoveryKeyExposedError";
  }
}

export class PendingOperationError extends Error {
  readonly entry: JournalEntry;
  constructor(entry: JournalEntry) {
    super(
      `Key #${entry.keyIndex} has a signed operation that is not on-chain yet (${entry.userOpHash}). ` +
        `Re-send it or wait for it before sending something new.`,
    );
    this.name = "PendingOperationError";
    this.entry = entry;
  }
}

export type WalletOptions = {
  seed: Hex;
  /** Imported signing state has not been reconciled; reads are allowed, signatures/submission are not. */
  restoreBlocked?: boolean;
  factory: Address;
  publicClient: PublicClient;
  /** If given, the address is computed locally, so the factory need not be deployed yet. */
  accountImplementation?: Address;
  entryPoint?: Address;
  salt?: bigint;
  journal?: KeyJournal;
  /** Required on supported mainnets; validated again before signing/submission. */
  deploymentPolicy?: DeploymentPolicy;
};

export class FeeBudgetExceededError extends Error {
  constructor() {
    super("The maximum network fee increased beyond your reviewed budget. Review a new fee estimate before signing.");
    this.name = "FeeBudgetExceededError";
  }
}

export class RestoreSigningBlockedError extends Error {
  constructor() {
    super("This restored wallet is read-only. Signing and submission are blocked because a recovery phrase does not restore complete, rollback-safe signing history. Keep the original signing device and journal.");
    this.name = "RestoreSigningBlockedError";
  }
}

export type SendLimits = { maxFee: bigint };

export type SendResult = UserOperationResult & { keyIndex: number };

export type KeyState = {
  deployed: boolean;
  keyIndex: number;
  publicKeyHash: Hex;
  recoveryIndex: number;
  recoveryKeyHash: Hex;
};

export type SyncResult = {
  keyIndex: number;
  recoveryIndex: number;
  /** An operation signed with the current key (or a recovery replacing it) that isn't on-chain. */
  pending?: JournalEntry;
  /**
   * The current recovery key signed a replacement that lost the race to the original operation:
   * it has been revealed once and must be rotated (rotateRecoveryKey) before any further recovery.
   */
  recoveryExposed: boolean;
};

const isRecoveryEntry = (e: JournalEntry) => e.kind === "recovery";

/**
 * Network fee for an operation, in wei.
 * `max` is what the EntryPoint takes up front (every gas limit at `maxFeePerGas`); the unused part is
 * refunded. `expected` is a typical charge: measured verification cost at the current base fee.
 */
export type FeeEstimate = {
  expected: bigint;
  max: bigint;
  gas: bigint;
  gasLimit: bigint;
  pricePerGas: bigint;
  maxFeePerGas: bigint;
};

/** Typical `validateUserOp` gas (docs/benchmark.md), used for the expected fee. */
const TYPICAL_VERIFICATION_GAS = { deployed: 115_000n, withDeployment: 290_000n };

/** Progress callback for UIs: preparing → signing → submitting → confirming. */
export type SendStep = "preparing" | "signing" | "submitting" | "confirming";
export type OnStep = (step: SendStep, keyIndex: number) => void;

export class QuantumSafeWallet {
  readonly signingBlocked: boolean;
  readonly address: Address;
  readonly factory: Address;
  readonly entryPoint: Address;
  readonly salt: bigint;
  readonly initialPublicKeyHash: Hex;
  readonly initialRecoveryKeyHash: Hex;
  readonly journal: KeyJournal;
  private readonly deploymentPolicy?: DeploymentPolicy;
  private readonly seed: Hex;
  private readonly client: PublicClient;

  private constructor(
    opts: Required<Omit<WalletOptions, "accountImplementation" | "deploymentPolicy">> & Pick<WalletOptions, "deploymentPolicy"> & {
      address: Address;
      initialPublicKeyHash: Hex;
      initialRecoveryKeyHash: Hex;
    },
  ) {
    this.signingBlocked = opts.restoreBlocked;
    this.deploymentPolicy = opts.deploymentPolicy;
    this.seed = opts.seed;
    this.client = opts.publicClient;
    this.factory = opts.factory;
    this.entryPoint = opts.entryPoint;
    this.salt = opts.salt;
    this.journal = opts.journal;
    this.address = opts.address;
    this.initialPublicKeyHash = opts.initialPublicKeyHash;
    this.initialRecoveryKeyHash = opts.initialRecoveryKeyHash;
  }

  static async load(opts: WalletOptions): Promise<QuantumSafeWallet> {
    const salt = opts.salt ?? 0n;
    const initialPublicKeyHash = publicKeyHash(opts.seed, 0);
    const initialRecoveryKeyHash = recoveryKeyHash(opts.seed, 0);
    const address = opts.accountImplementation
      ? predictAccountAddress({
          factory: opts.factory,
          accountImplementation: opts.accountImplementation,
          initialPublicKeyHash,
          initialRecoveryKeyHash,
          salt,
        })
      : await opts.publicClient.readContract({
          address: opts.factory,
          abi: quantumSafeAccountFactoryAbi,
          functionName: "getAddress",
          args: [initialPublicKeyHash, initialRecoveryKeyHash, salt],
        });
    return new QuantumSafeWallet({
      ...opts,
      restoreBlocked: opts.restoreBlocked ?? false,
      salt,
      entryPoint: opts.entryPoint ?? ENTRYPOINT_V07,
      journal: opts.journal ?? new MemoryJournal(),
      address,
      initialPublicKeyHash,
      initialRecoveryKeyHash,
    });
  }

  /** Whether the factory exists on this chain. Without it the wallet can receive but not send. */
  async isFactoryDeployed(): Promise<boolean> {
    const code = await this.client.getCode({ address: this.factory });
    return code !== undefined && code !== "0x";
  }

  async isDeployed(): Promise<boolean> {
    const code = await this.client.getCode({ address: this.address });
    return code !== undefined && code !== "0x";
  }

  /** The key that must sign next, read from chain (never from local state). */
  async getKeyState(): Promise<KeyState> {
    if (!(await this.isDeployed())) {
      return {
        deployed: false,
        keyIndex: 0,
        publicKeyHash: this.initialPublicKeyHash,
        recoveryIndex: 0,
        recoveryKeyHash: this.initialRecoveryKeyHash,
      };
    }
    const read = <F extends "keyIndex" | "publicKeyHash" | "recoveryIndex" | "recoveryKeyHash">(functionName: F) =>
      this.client.readContract({ address: this.address, abi: quantumSafeAccountAbi, functionName });
    const [keyIndex, pkh, recoveryIndex, recoveryPkh] = await Promise.all([
      read("keyIndex"),
      read("publicKeyHash"),
      read("recoveryIndex"),
      read("recoveryKeyHash"),
    ]);
    return {
      deployed: true,
      keyIndex: Number(keyIndex),
      publicKeyHash: pkh as Hex,
      recoveryIndex: Number(recoveryIndex),
      recoveryKeyHash: recoveryPkh as Hex,
    };
  }

  async getBalance(): Promise<bigint> {
    return this.client.getBalance({ address: this.address });
  }

  /** Builds an unsigned operation (carrying the stub signature) for the given calls. */
  async prepare(calls: Call[], submitter?: Submitter): Promise<UserOperation<"0.7">> {
    return this.prepareCallData(encodeCalls(calls), calls.length, submitter, false);
  }

  /** Prepares the calls and prices them. Nothing is signed. */
  async estimateFee(calls: Call[], submitter?: Submitter): Promise<FeeEstimate> {
    return this.quote(await this.prepare(calls, submitter));
  }

  /** Checks transfer execution without signing, sending, or changing the key journal. */
  async previewTransfer(request: TransferPreviewRequest) {
    const chainId = this.client.chain?.id ?? await this.client.getChainId();
    return previewTransfer(this.client, this.address, this.entryPoint, chainId, request);
  }

  /** Prices an already prepared operation. */
  async quote(op: UserOperation<"0.7">): Promise<FeeEstimate> {
    const block = await this.client.getBlock({ blockTag: "latest" });
    const base = block.baseFeePerGas ?? 0n;
    const pricePerGas = minBig(op.maxFeePerGas, base + op.maxPriorityFeePerGas);
    const deploying = !!op.factory;
    const paymasterGas = op.paymaster ? (op.paymasterVerificationGasLimit ?? 0n) + (op.paymasterPostOpGasLimit ?? 0n) : 0n;
    const gasLimit = op.preVerificationGas + op.verificationGasLimit + op.callGasLimit + paymasterGas;
    const verification = minBig(
      op.verificationGasLimit,
      deploying ? TYPICAL_VERIFICATION_GAS.withDeployment : TYPICAL_VERIFICATION_GAS.deployed,
    );
    // callGasLimit carries a 20% margin over the estimate.
    const gas = op.preVerificationGas + verification + (op.callGasLimit * 10n) / 12n + paymasterGas;
    return { expected: gas * pricePerGas, max: gasLimit * op.maxFeePerGas, gas, gasLimit, pricePerGas, maxFeePerGas: op.maxFeePerGas };
  }

  private async prepareCallData(
    callData: Hex,
    callCount: number,
    submitter: Submitter | undefined,
    recovery: boolean,
  ): Promise<UserOperation<"0.7">> {
    await this.checkDeployment();
    const deployed = await this.isDeployed();
    const [nonce, fees] = await Promise.all([
      this.client.readContract({
        address: this.entryPoint,
        abi: entryPoint07Abi,
        functionName: "getNonce",
        args: [this.address, 0n],
      }),
      this.fees(submitter),
    ]);

    const op: UserOperation<"0.7"> = {
      sender: this.address,
      nonce,
      callData,
      callGasLimit: 0n,
      // A nonzero input can become the provider's minimum returned estimate.
      // Self-relay floors fail hosted bundlers' gas-efficiency admission checks.
      verificationGasLimit: submitter?.estimate ? 0n : deployed ? VERIFICATION_GAS.deployed : VERIFICATION_GAS.withDeployment,
      preVerificationGas: 0n,
      ...fees,
      signature: recovery ? RECOVERY_STUB_SIGNATURE : STUB_SIGNATURE,
      ...(deployed
        ? {}
        : {
            factory: this.factory,
            factoryData: encodeFactoryData(this.initialPublicKeyHash, this.initialRecoveryKeyHash, this.salt),
          }),
    };

    if (submitter?.estimate) {
      const est = await submitter.estimate(op);
      op.callGasLimit = (est.callGasLimit * 12n) / 10n;
      op.preVerificationGas = (est.preVerificationGas * 11n) / 10n;
      if (est.verificationGasLimit <= 0n || est.callGasLimit < 0n || est.preVerificationGas <= 0n)
        throw new Error("Bundler returned an invalid gas estimate. Nothing was signed.");
      // WOTS chain lengths vary with the digest; successful validation also
      // rotates storage, unlike the invalid stub. Buffer both without forcing
      // the much larger self-relay limit back into a provider's estimate.
      op.verificationGasLimit = (est.verificationGasLimit * 12n) / 10n + 30_000n;
    } else {
      op.callGasLimit = await this.estimateCallGas(callData, callCount, deployed);
      // Bundle overhead plus, on rollups, the L1 data fee (0 elsewhere). +25% for L1 price drift.
      const l1 = await estimateL1Gas(this.client, this.entryPoint, op);
      op.preVerificationGas = 60_000n + (l1 * 125n) / 100n;
    }
    return op;
  }

  /**
   * Signs an operation with the current on-chain key and commits to the next key.
   * Refuses if the key has already signed a different operation.
   */
  async sign(op: UserOperation<"0.7">): Promise<UserOperation<"0.7">> {
    this.assertSigningAllowed();
    await this.checkDeployment();
    return this.journal.transaction(async journal => {
      const state = await this.getKeyState();
      const keyIndex = state.keyIndex;
      if (keyIndex + 1 >= RECOVERY_KEY_OFFSET) throw new Error("Main key space exhausted");
      const localPkh = publicKeyHash(this.seed, keyIndex);
      if (localPkh.toLowerCase() !== state.publicKeyHash.toLowerCase()) {
        throw new KeyMismatchError(keyIndex, state.publicKeyHash, localPkh);
      }

      const userOpHash = await this.hash(op);
      const existing = await journal.get(keyIndex);
      if (existing && existing.userOpHash !== userOpHash) throw new KeyReuseError(keyIndex);

      const nextPublicKeyHash = publicKeyHash(this.seed, keyIndex + 1);
      const wotsSig = sign(this.seed, keyIndex, signatureDigest(userOpHash, nextPublicKeyHash));
      const signed = { ...op, signature: encodeUserOpSignature(nextPublicKeyHash, wotsSig) };

      // Write-ahead: record the exposure before the signature can leave this process.
      await journal.put({
        keyIndex,
        userOpHash,
        nextPublicKeyHash,
        userOperation: serializeUserOperation(signed),
        status: "signed",
        createdAt: Date.now(),
        kind: "main",
      });
      return signed;
    });
  }

  /**
   * Signs `op` with the current recovery key instead of main key `skipKeyIndex`, which is stuck
   * behind an operation that never landed. Commits to main key #skip+1 and recovery key #r+1.
   */
  private async signRecovery(op: UserOperation<"0.7">, skipKeyIndex: number): Promise<UserOperation<"0.7">> {
    this.assertSigningAllowed();
    await this.checkDeployment();
    return this.journal.transaction(async journal => {
      const state = await this.getKeyState();
      if (state.keyIndex !== skipKeyIndex) throw new Error(`Key #${skipKeyIndex} is no longer the current key`);
      const r = state.recoveryIndex;
      const localRecovery = recoveryKeyHash(this.seed, r);
      if (localRecovery.toLowerCase() !== state.recoveryKeyHash.toLowerCase()) {
        throw new KeyMismatchError(RECOVERY_KEY_OFFSET + r, state.recoveryKeyHash, localRecovery);
      }

      const userOpHash = await this.hash(op);
      const journalKey = RECOVERY_KEY_OFFSET + r;
      const existing = await journal.get(journalKey);
      if (existing && existing.userOpHash !== userOpHash) throw new RecoveryKeyExposedError(r);

      const nextPublicKeyHash = publicKeyHash(this.seed, skipKeyIndex + 1);
      const nextRecoveryKeyHash = recoveryKeyHash(this.seed, r + 1);
      const wotsSig = sign(this.seed, journalKey, recoveryDigest(userOpHash, nextPublicKeyHash, nextRecoveryKeyHash));
      const signed = { ...op, signature: encodeRecoverySignature(nextPublicKeyHash, nextRecoveryKeyHash, wotsSig) };

      // Write-ahead, as for main keys; the stuck operation is marked as superseded.
      await journal.put({
        keyIndex: journalKey,
        userOpHash,
        nextPublicKeyHash,
        userOperation: serializeUserOperation(signed),
        status: "signed",
        createdAt: Date.now(),
        kind: "recovery",
        replacesKeyIndex: skipKeyIndex,
      });
      const stuck = await journal.get(skipKeyIndex);
      if (stuck && stuck.status === "signed") await journal.put({ ...stuck, status: "replaced" });
      return signed;
    });
  }

  /** Reconciles the journal with the chain. */
  async sync(): Promise<SyncResult> {
    return this.journal.transaction(async journal => {
      const { keyIndex, recoveryIndex } = await this.getKeyState();
      let pendingMain: JournalEntry | undefined;
      let pendingRecovery: JournalEntry | undefined;
      let recoveryExposed = false;

      for (const e of await journal.list()) {
        if (e.status !== "signed") continue;
        if (!isRecoveryEntry(e)) {
          if (e.keyIndex < keyIndex) await journal.put({ ...e, status: "confirmed" });
          else if (e.keyIndex === keyIndex) pendingMain = e;
          continue;
        }
        const r = e.keyIndex - RECOVERY_KEY_OFFSET;
        if (r < recoveryIndex) {
          await journal.put({ ...e, status: "confirmed" });
        } else if (r === recoveryIndex) {
          if (keyIndex > (e.replacesKeyIndex ?? -1)) {
            // The original operation landed first: the recovery signature was revealed but unused.
            recoveryExposed = true;
            const original = await journal.get(e.replacesKeyIndex!);
            if (original?.status === "replaced") await journal.put({ ...original, status: "confirmed" });
          } else {
            pendingRecovery = e;
          }
        }
      }
      return { keyIndex, recoveryIndex, pending: pendingRecovery ?? pendingMain, recoveryExposed };
    });
  }

  async send(calls: Call[], submitter: Submitter, onStep?: OnStep, limits?: SendLimits): Promise<SendResult> {
    this.assertSigningAllowed();
    const { keyIndex, pending } = await this.sync();
    if (pending) throw new PendingOperationError(pending);

    onStep?.("preparing", keyIndex);
    const op = await this.prepare(calls, submitter);
    const maximumFee = (op.preVerificationGas + op.verificationGasLimit + op.callGasLimit) * op.maxFeePerGas;
    if (limits && maximumFee > limits.maxFee) throw new FeeBudgetExceededError();
    onStep?.("signing", keyIndex);
    const signed = await this.sign(op);
    return this.submitAndConfirm(signed, keyIndex, submitter, onStep);
  }

  /** Re-submits the exact operation already signed with the current key. */
  async resendPending(submitter: Submitter, onStep?: OnStep): Promise<SendResult> {
    this.assertSigningAllowed();
    const { keyIndex, pending } = await this.sync();
    if (!pending) throw new Error(`No pending operation for key #${keyIndex}`);
    return this.submitAndConfirm(deserializeUserOperation(pending.userOperation), keyIndex, submitter, onStep, pending);
  }

  /**
   * Replaces the pending operation of the current key with the same calls, signed by the recovery
   * key with higher fees. The stuck key is skipped, so it never signs twice, and the stuck
   * operation becomes invalid because the replacement uses its nonce.
   */
  async replacePending(submitter: Submitter, onStep?: OnStep): Promise<SendResult> {
    this.assertSigningAllowed();
    const { keyIndex, pending, recoveryExposed, recoveryIndex } = await this.sync();
    if (!pending) throw new Error(`No pending operation for key #${keyIndex}`);
    if (isRecoveryEntry(pending)) throw new Error("A replacement is already pending: re-send it instead.");
    if (recoveryExposed) throw new RecoveryKeyExposedError(recoveryIndex);

    onStep?.("preparing", keyIndex);
    const stuck = deserializeUserOperation(pending.userOperation);
    const op = await this.prepareCallData(stuck.callData, 1, submitter, true);
    // Replacements must outbid the original, which may still sit in a mempool.
    op.maxFeePerGas = maxBig(op.maxFeePerGas, (stuck.maxFeePerGas * 125n) / 100n);
    op.maxPriorityFeePerGas = maxBig(op.maxPriorityFeePerGas, (stuck.maxPriorityFeePerGas * 125n) / 100n);
    op.callGasLimit = maxBig(op.callGasLimit, stuck.callGasLimit);

    onStep?.("signing", keyIndex);
    const signed = await this.signRecovery(op, keyIndex);
    const entry = await this.journal.get(RECOVERY_KEY_OFFSET + recoveryIndex);
    return this.submitAndConfirm(signed, keyIndex, submitter, onStep, entry);
  }

  /** Retires an exposed recovery key through a normal (main-key) operation. */
  async rotateRecoveryKey(submitter: Submitter, onStep?: OnStep): Promise<SendResult> {
    this.assertSigningAllowed();
    const { recoveryIndex } = await this.sync();
    const exposed = await this.journal.get(RECOVERY_KEY_OFFSET + recoveryIndex);
    if (exposed?.status === "signed") await this.journal.put({ ...exposed, status: "replaced" });
    const call = {
      to: this.address,
      data: encodeFunctionData({
        abi: quantumSafeAccountAbi,
        functionName: "rotateRecoveryKey",
        args: [recoveryKeyHash(this.seed, recoveryIndex + 1)],
      }),
    };
    return this.send([call], submitter, onStep);
  }

  /** Every key change, oldest first: normal rotations and recoveries (which skip a key). */
  async rotationHistory(fromBlock: bigint = 0n) {
    const [rotated, recovered] = await Promise.all([
      this.client.getContractEvents({ address: this.address, abi: quantumSafeAccountAbi, eventName: "KeyRotated", fromBlock }),
      this.client.getContractEvents({ address: this.address, abi: quantumSafeAccountAbi, eventName: "KeyRecovered", fromBlock }),
    ]);
    return [
      ...rotated.map((l) => ({
        keyIndex: Number(l.args.keyIndex),
        recovered: false,
        usedPublicKeyHash: l.args.usedPublicKeyHash as Hex | undefined,
        nextPublicKeyHash: l.args.nextPublicKeyHash!,
        transactionHash: l.transactionHash,
        blockNumber: l.blockNumber,
      })),
      ...recovered.map((l) => ({
        keyIndex: Number(l.args.keyIndex),
        recovered: true,
        usedPublicKeyHash: undefined as Hex | undefined,
        nextPublicKeyHash: l.args.nextPublicKeyHash!,
        transactionHash: l.transactionHash,
        blockNumber: l.blockNumber,
      })),
    ].sort((a, b) => a.keyIndex - b.keyIndex);
  }

  private async submitAndConfirm(
    signed: UserOperation<"0.7">,
    keyIndex: number,
    submitter: Submitter,
    onStep?: OnStep,
    entry?: JournalEntry,
  ): Promise<SendResult> {
    this.assertSigningAllowed();
    await this.checkDeployment();
    onStep?.("submitting", keyIndex);
    const sent = await submitter.submit(signed);
    onStep?.("confirming", keyIndex);
    const result = await sent.wait();
    const after = await this.getKeyState();
    const record = entry ?? (await this.journal.get(keyIndex));
    if (record && after.keyIndex > keyIndex) {
      await this.journal.put({ ...record, status: "confirmed", transactionHash: result.transactionHash });
    }
    return { ...result, keyIndex };
  }

  private async checkDeployment(): Promise<void> {
    const actualChain = await this.client.getChainId();
    if (this.client.chain && actualChain !== this.client.chain.id) throw new Error("RPC chain ID does not match the selected network");
    // All supported mainnets require reviewed deployments and durable key state.
    if (![1, 4663, 8453, 42161].includes(actualChain) && !this.deploymentPolicy) return;
    if (!this.deploymentPolicy) throw new Error("Mainnet requires a reviewed deployment manifest and bundler. Run npm run check:mainnet first.");
    if (this.journal instanceof MemoryJournal) throw new Error("Mainnet signing requires a persistent key journal");
    const m = parseDeploymentManifest(this.deploymentPolicy.manifest);
    if (m.chainId !== actualChain || m.factory.toLowerCase() !== this.factory.toLowerCase() ||
        m.entryPoint.toLowerCase() !== this.entryPoint.toLowerCase()) throw new Error("Deployment policy does not match this wallet");
    await assertDeploymentReady(this.client, this.deploymentPolicy);
  }

  private assertSigningAllowed(): void {
    if (this.signingBlocked) throw new RestoreSigningBlockedError();
  }

  private async hash(op: UserOperation<"0.7">): Promise<Hex> {
    const chainId = this.client.chain?.id ?? (await this.client.getChainId());
    return getUserOperationHash({
      userOperation: op,
      entryPointAddress: this.entryPoint,
      entryPointVersion: "0.7",
      chainId,
    });
  }

  private async fees(submitter?: Submitter) {
    const fromSubmitter = await submitter?.fees?.();
    if (fromSubmitter) return fromSubmitter;
    const f = await this.client.estimateFeesPerGas();
    return { maxFeePerGas: f.maxFeePerGas, maxPriorityFeePerGas: f.maxPriorityFeePerGas };
  }

  private async estimateCallGas(callData: Hex, callCount: number, deployed: boolean): Promise<bigint> {
    const fallback = 60_000n + 40_000n * BigInt(callCount);
    try {
      // A first operation may execute a costly proof verifier. Simulate its clone
      // runtime at the counterfactual address instead of assuming transfer gas.
      const implementation = !deployed ? await this.client.readContract({
        address: this.factory, abi: quantumSafeAccountFactoryAbi, functionName: "accountImplementation",
      }) : undefined;
      const stateOverride = implementation ? [{
        address: this.address,
        code: concat(["0x363d3d373d3d3d363d73", implementation, "0x5af43d82803e903d91602b57fd5bf3"]),
      }] : undefined;
      const est = await this.client.estimateGas({ account: this.entryPoint, to: this.address, data: callData, stateOverride });
      return maxBig((est * 13n) / 10n, 50_000n);
    } catch {
      return fallback;
    }
  }
}

function maxBig(a: bigint, b: bigint) {
  return a > b ? a : b;
}

function minBig(a: bigint, b: bigint) {
  return a < b ? a : b;
}
