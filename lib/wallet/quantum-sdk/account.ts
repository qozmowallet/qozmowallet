import {
  concat,
  encodeAbiParameters,
  encodeFunctionData,
  getContractAddress,
  keccak256,
  parseAbi,
  size,
  slice,
  toHex,
  type Address,
  type Hex,
} from "viem";
import { SIGNATURE_BYTES } from "./wots.ts";

/** Canonical ERC-4337 v0.7 EntryPoint, same address on every chain. */
export const ENTRYPOINT_V07: Address = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

/** userOp.signature = nextPkh (32) ‖ WOTS signature (2144). */
export const USEROP_SIGNATURE_BYTES = 32 + SIGNATURE_BYTES;

/** Recovery: 0x01 ‖ nextPkh (32) ‖ nextRecoveryPkh (32) ‖ WOTS signature (2144). */
export const RECOVERY_MODE: Hex = "0x01";
export const RECOVERY_SIGNATURE_BYTES = 1 + 32 + 32 + SIGNATURE_BYTES;

export const quantumSafeAccountAbi = parseAbi([
  "function publicKeyHash() view returns (bytes32)",
  "function keyIndex() view returns (uint256)",
  "function recoveryKeyHash() view returns (bytes32)",
  "function recoveryIndex() view returns (uint256)",
  "function rotateRecoveryKey(bytes32 nextRecoveryKeyHash)",
  "function getDeposit() view returns (uint256)",
  "function execute(address dest, uint256 value, bytes func)",
  "function executeBatch(address[] dest, uint256[] value, bytes[] func)",
  "event KeyRotated(uint256 indexed keyIndex, bytes32 usedPublicKeyHash, bytes32 nextPublicKeyHash)",
  "event KeyRecovered(uint256 indexed keyIndex, uint256 indexed recoveryIndex, bytes32 nextPublicKeyHash, bytes32 nextRecoveryKeyHash)",
  "event RecoveryKeyRotated(uint256 indexed recoveryIndex, bytes32 nextRecoveryKeyHash)",
  "event AccountInitialized(address indexed entryPoint, bytes32 initialPublicKeyHash, bytes32 initialRecoveryKeyHash)",
]);

export const quantumSafeAccountFactoryAbi = parseAbi([
  "function createAccount(bytes32 initialPublicKeyHash, bytes32 initialRecoveryKeyHash, uint256 salt) returns (address)",
  "function getAddress(bytes32 initialPublicKeyHash, bytes32 initialRecoveryKeyHash, uint256 salt) view returns (address)",
  "function accountImplementation() view returns (address)",
]);

export const erc20Abi = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)",
]);

export type Call = { to: Address; value?: bigint; data?: Hex };

/** The message the WOTS key signs: binds the UserOperation and the key that replaces it. */
export function signatureDigest(userOpHash: Hex, nextPublicKeyHash: Hex): Hex {
  return keccak256(concat([userOpHash, nextPublicKeyHash]));
}

export function encodeUserOpSignature(nextPublicKeyHash: Hex, wotsSignature: Hex): Hex {
  if (size(nextPublicKeyHash) !== 32) throw new Error("nextPublicKeyHash must be 32 bytes");
  if (size(wotsSignature) !== SIGNATURE_BYTES) throw new Error(`WOTS signature must be ${SIGNATURE_BYTES} bytes`);
  return concat([nextPublicKeyHash, wotsSignature]);
}

/** What a recovery key signs: the operation, the next main key and the next recovery key. */
export function recoveryDigest(userOpHash: Hex, nextPublicKeyHash: Hex, nextRecoveryKeyHash: Hex): Hex {
  return keccak256(concat([userOpHash, RECOVERY_MODE, nextPublicKeyHash, nextRecoveryKeyHash]));
}

export function encodeRecoverySignature(nextPublicKeyHash: Hex, nextRecoveryKeyHash: Hex, wotsSignature: Hex): Hex {
  if (size(nextPublicKeyHash) !== 32 || size(nextRecoveryKeyHash) !== 32) throw new Error("key hashes must be 32 bytes");
  if (size(wotsSignature) !== SIGNATURE_BYTES) throw new Error(`WOTS signature must be ${SIGNATURE_BYTES} bytes`);
  return concat([RECOVERY_MODE, nextPublicKeyHash, nextRecoveryKeyHash, wotsSignature]);
}

export function decodeUserOpSignature(signature: Hex): { nextPublicKeyHash: Hex; wotsSignature: Hex } {
  if (size(signature) !== USEROP_SIGNATURE_BYTES) throw new Error("bad signature length");
  return { nextPublicKeyHash: slice(signature, 0, 32), wotsSignature: slice(signature, 32) };
}

/**
 * Signature used only for gas estimation. It fails verification, which the account reports
 * without reverting. The bytes are pseudo-random rather than constant: a real WOTS signature is
 * incompressible, and on Arbitrum chains (Robinhood Chain) the L1 fee is priced on compressed
 * calldata, so a compressible stub would make every estimate too low.
 */
export const STUB_SIGNATURE: Hex = concat(
  Array.from({ length: USEROP_SIGNATURE_BYTES / 32 }, (_, i) => keccak256(toHex(`winternitz-stub-${i}`))),
);

/** Same idea as STUB_SIGNATURE, sized like a recovery signature. */
export const RECOVERY_STUB_SIGNATURE: Hex = concat([RECOVERY_MODE, slice(STUB_SIGNATURE, 0, RECOVERY_SIGNATURE_BYTES - 1 - 32), keccak256(toHex("winternitz-stub-recovery"))]);

export function encodeCalls(calls: Call[]): Hex {
  if (calls.length === 0) throw new Error("no calls");
  if (calls.length === 1) {
    const [c] = calls;
    return encodeFunctionData({
      abi: quantumSafeAccountAbi,
      functionName: "execute",
      args: [c.to, c.value ?? 0n, c.data ?? "0x"],
    });
  }
  return encodeFunctionData({
    abi: quantumSafeAccountAbi,
    functionName: "executeBatch",
    args: [calls.map((c) => c.to), calls.map((c) => c.value ?? 0n), calls.map((c) => c.data ?? "0x")],
  });
}

export function encodeFactoryData(initialPublicKeyHash: Hex, initialRecoveryKeyHash: Hex, salt: bigint): Hex {
  return encodeFunctionData({
    abi: quantumSafeAccountFactoryAbi,
    functionName: "createAccount",
    args: [initialPublicKeyHash, initialRecoveryKeyHash, salt],
  });
}

/**
 * The account address, computed locally exactly as QuantumSafeAccountFactory.getAddress does
 * (OpenZeppelin Clones: CREATE2 of an EIP-1167 minimal proxy). Needs no RPC call and works before
 * the factory itself is deployed, which lets a wallet be created and funded first.
 */
export function predictAccountAddress(params: {
  factory: Address;
  accountImplementation: Address;
  initialPublicKeyHash: Hex;
  initialRecoveryKeyHash: Hex;
  salt: bigint;
}): Address {
  const cloneInitCode = concat([
    "0x3d602d80600a3d3981f3363d3d373d3d3d363d73",
    params.accountImplementation,
    "0x5af43d82803e903d91602b57fd5bf3",
  ]);
  return getContractAddress({
    opcode: "CREATE2",
    from: params.factory,
    salt: keccak256(
      encodeAbiParameters(
        [{ type: "bytes32" }, { type: "bytes32" }, { type: "uint256" }],
        [params.initialPublicKeyHash, params.initialRecoveryKeyHash, params.salt],
      ),
    ),
    bytecodeHash: keccak256(cloneInitCode),
  });
}
