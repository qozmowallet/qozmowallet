import { getAddress, isAddress, slice, type Address, type Hex } from "viem";
import { getUserOperationHash } from "viem/account-abstraction";
import { predictAccountAddress, signatureDigest, recoveryDigest, USEROP_SIGNATURE_BYTES, RECOVERY_SIGNATURE_BYTES } from "./account.ts";
import { assertNoConflictingExposure, deserializeUserOperation, parseJournal, type JournalEntry } from "./journal.ts";
import { publicKeyHash, recoveryKeyHash, verify, RECOVERY_KEY_OFFSET } from "./wots.ts";

/** This format preserves known exposure; it never grants permission to sign. */
export const MAX_RECOVERY_BACKUP_BYTES = 4 * 1024 * 1024;
export const MAX_RECOVERY_ENTRIES = 256;
const ITERATIONS = 600_000;
const AAD = new TextEncoder().encode("winternitz-wots-recovery-backup:1");
const INVALID = "Invalid or unsupported recovery backup. Keep the original wallet and signing journals.";

export type RecoveryAccount = {
  chainId: number;
  factory: Address;
  accountImplementation: Address;
  entryPoint: Address;
  salt: string;
  address: Address;
};
export type RecoveryJournal = { chainId: number; entryPoint: Address; entries: JournalEntry[] };
export type RecoveryPayload = {
  version: 1;
  derivation: "wots-keccak256-v1";
  signingPolicy: "read-only";
  historyScope: "this-storage-only";
  seed: Hex;
  initialPublicKeyHash: Hex;
  initialRecoveryKeyHash: Hex;
  account: RecoveryAccount;
  walletCreatedAt: string;
  exportedAt: string;
  journals: RecoveryJournal[];
};
export type EncryptedRecoveryBackup = {
  format: "winternitz-wots-recovery";
  version: 1;
  kdf: "pbkdf2-sha256";
  iterations: 600000;
  salt: string;
  iv: string;
  data: string;
};

const fail = (): never => { throw new Error(INVALID); };
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const hex = (v: unknown, bytes?: number): v is Hex => typeof v === "string" && /^0x(?:[0-9a-fA-F]{2})*$/.test(v) && (bytes === undefined || v.length === 2 + bytes * 2);
const uint = (v: unknown) => typeof v === "string" && /^(0|[1-9]\d{0,77})n$/.test(v) && BigInt(v.slice(0, -1)) < 2n ** 256n;
const chain = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) > 0;
const time = (v: unknown): v is string => typeof v === "string" && v.length <= 32 && Number.isFinite(Date.parse(v));
const address = (v: unknown): Address => {
  if (typeof v !== "string" || !isAddress(v, { strict: false }) || /^0x0{40}$/i.test(v)) return fail();
  return getAddress(v);
};

/** Validate metadata without RPC or changing the configured network. */
export function parseRecoveryAccount(value: unknown): RecoveryAccount {
  if (!object(value) || !chain(value.chainId) || typeof value.salt !== "string" ||
      !/^(0|[1-9]\d{0,77})$/.test(value.salt) || BigInt(value.salt) >= 2n ** 256n) return fail();
  return { chainId: value.chainId, salt: value.salt, address: address(value.address),
    factory: address(value.factory), accountImplementation: address(value.accountImplementation), entryPoint: address(value.entryPoint) };
}

/** Strict shape and hash checks; imported signed bytes must not silently change. */
function operation(entry: JournalEntry, group: {chainId: number; entryPoint: Address}) {
  const op = entry.userOperation;
  const numbers = ["nonce", "callGasLimit", "verificationGasLimit", "preVerificationGas", "maxFeePerGas", "maxPriorityFeePerGas"];
  const optionalNumbers = ["paymasterVerificationGasLimit", "paymasterPostOpGasLimit"];
  const allowed = new Set(["sender", "signature", "callData", "factory", "factoryData", "paymaster", "paymasterData", ...numbers, ...optionalNumbers]);
  if (Object.keys(op).some(k => !allowed.has(k)) || numbers.some(k => !uint(op[k])) ||
      optionalNumbers.some(k => op[k] !== undefined && !uint(op[k])) || !hex(op.callData) || op.callData.length > 131074 ||
      !hex(op.signature) || ![2 + 2 * USEROP_SIGNATURE_BYTES, 2 + 2 * RECOVERY_SIGNATURE_BYTES].includes(op.signature.length)) return fail();
  address(op.sender);
  for (const key of ["factory", "paymaster"]) if (op[key] !== undefined) address(op[key]);
  for (const key of ["factoryData", "paymasterData"]) if (op[key] !== undefined && (!hex(op[key]) || op[key]!.length > 131074)) return fail();
  if ((op.factory === undefined) !== (op.factoryData === undefined) ||
      (op.paymaster === undefined && [op.paymasterData, ...optionalNumbers.map(k => op[k])].some(v => v !== undefined)) ||
      (op.paymaster !== undefined && optionalNumbers.some(k => op[k] === undefined))) return fail();
  // All strings entering deserializeUserOperation have been validated above.
  const hash = getUserOperationHash({ userOperation: deserializeUserOperation(op), chainId: group.chainId,
    entryPointAddress: group.entryPoint, entryPointVersion: "0.7" });
  if (hash.toLowerCase() !== entry.userOpHash.toLowerCase()) return fail();
}

/** Authenticated does not mean fresh. Even a valid payload remains read-only. */
export function parseRecoveryPayload(value: unknown): RecoveryPayload {
  if (!object(value) || value.version !== 1 || value.derivation !== "wots-keccak256-v1" ||
      value.signingPolicy !== "read-only" || value.historyScope !== "this-storage-only" ||
      !hex(value.seed, 32) || !hex(value.initialPublicKeyHash, 32) || !hex(value.initialRecoveryKeyHash, 32) ||
      !time(value.walletCreatedAt) || !time(value.exportedAt) || !Array.isArray(value.journals) || value.journals.length > 32 ||
      JSON.stringify(value).length > 2_900_000) return fail();
  const seed = value.seed.toLowerCase() as Hex;
  const initialPublicKeyHash = publicKeyHash(seed, 0);
  const initialRecoveryKeyHash = recoveryKeyHash(seed, 0);
  if (initialPublicKeyHash !== value.initialPublicKeyHash.toLowerCase() ||
      initialRecoveryKeyHash !== value.initialRecoveryKeyHash.toLowerCase()) return fail();
  const account = parseRecoveryAccount(value.account);
  if (predictAccountAddress({ ...account, initialPublicKeyHash, initialRecoveryKeyHash, salt: BigInt(account.salt) }) !== account.address) return fail();
  const seenChains = new Set<number>();
  const exposures: JournalEntry[] = [];
  const journals = value.journals.map((raw): RecoveryJournal => {
    if (!object(raw) || !chain(raw.chainId) || seenChains.has(raw.chainId) || !Array.isArray(raw.entries) ||
        raw.entries.length + exposures.length > MAX_RECOVERY_ENTRIES) return fail();
    seenChains.add(raw.chainId);
    const group = { chainId: raw.chainId, entryPoint: address(raw.entryPoint) };
    if (group.chainId === account.chainId && group.entryPoint !== account.entryPoint) return fail();
    const indices = new Set<number>();
    const entries = raw.entries.map((rawEntry): JournalEntry => {
      if (!object(rawEntry)) return fail();
      const e = rawEntry as unknown as JournalEntry;
      parseJournal({ [String(e.keyIndex)]: e });
      if (e.keyIndex >= 2 ** 32 || indices.has(e.keyIndex) || !Number.isSafeInteger(e.createdAt) || e.createdAt < 0 ||
          (e.transactionHash !== undefined && !hex(e.transactionHash, 32))) return fail();
      indices.add(e.keyIndex);
      const recovery = e.kind === "recovery";
      if (e.kind !== undefined && e.kind !== "main" && !recovery) return fail();
      if (recovery !== (e.keyIndex >= RECOVERY_KEY_OFFSET) ||
          (recovery && (!Number.isSafeInteger(e.replacesKeyIndex) || e.replacesKeyIndex! < 0 || e.replacesKeyIndex! >= RECOVERY_KEY_OFFSET - 1)) ||
          (!recovery && (e.replacesKeyIndex !== undefined || e.keyIndex >= RECOVERY_KEY_OFFSET - 1))) return fail();
      operation(e, group);
      const sig = e.userOperation.signature!.toLowerCase() as Hex;
      const next = slice(sig, recovery ? 1 : 0, recovery ? 33 : 32);
      const mainIndex = recovery ? e.replacesKeyIndex! : e.keyIndex;
      if (next !== e.nextPublicKeyHash.toLowerCase() || next !== publicKeyHash(seed, mainIndex + 1)) return fail();
      let digest: Hex;
      if (recovery) {
        const nextRecovery = slice(sig, 33, 65);
        if (sig.slice(0, 4) !== "0x01" || sig.length !== 2 + 2 * RECOVERY_SIGNATURE_BYTES ||
            nextRecovery !== recoveryKeyHash(seed, e.keyIndex - RECOVERY_KEY_OFFSET + 1)) return fail();
        digest = recoveryDigest(e.userOpHash, next, nextRecovery);
      } else {
        if (sig.length !== 2 + 2 * USEROP_SIGNATURE_BYTES) return fail();
        digest = signatureDigest(e.userOpHash, next);
      }
      if (!verify(publicKeyHash(seed, e.keyIndex), digest, slice(sig, recovery ? 65 : 32))) return fail();
      const userOperation = Object.fromEntries(Object.entries(e.userOperation).map(([k, v]) =>
        [k, typeof v === "string" && v.startsWith("0x") ? v.toLowerCase() : v]));
      const entry: JournalEntry = { keyIndex: e.keyIndex, userOpHash: e.userOpHash.toLowerCase() as Hex,
        nextPublicKeyHash: next, userOperation, status: e.status, createdAt: e.createdAt, kind: recovery ? "recovery" : "main",
        ...(e.transactionHash ? {transactionHash: e.transactionHash.toLowerCase() as Hex} : {}),
        ...(recovery ? {replacesKeyIndex: e.replacesKeyIndex} : {}) };
      assertNoConflictingExposure(entry, exposures);
      exposures.push(entry);
      return entry;
    });
    return { ...group, entries: entries.sort((a, b) => a.keyIndex - b.keyIndex) };
  });
  return { version: 1, derivation: "wots-keccak256-v1", signingPolicy: "read-only", historyScope: "this-storage-only",
    seed, initialPublicKeyHash, initialRecoveryKeyHash, account, walletCreatedAt: value.walletCreatedAt,
    exportedAt: value.exportedAt, journals };
}

function b64(bytes: Uint8Array) {
  let result = "";
  for (let i = 0; i < bytes.length; i += 32768) result += String.fromCharCode(...bytes.subarray(i, i + 32768));
  return btoa(result);
}
const unb64 = (value: string) => Uint8Array.from(atob(value), c => c.charCodeAt(0));

export function parseEncryptedRecoveryBackup(value: unknown): EncryptedRecoveryBackup {
  if (!object(value) || value.format !== "winternitz-wots-recovery" || value.version !== 1 ||
      value.kdf !== "pbkdf2-sha256" || value.iterations !== ITERATIONS ||
      typeof value.salt !== "string" || value.salt.length !== 24 || typeof value.iv !== "string" || value.iv.length !== 16 ||
      typeof value.data !== "string" || value.data.length > MAX_RECOVERY_BACKUP_BYTES - 512 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(value.data)) return fail();
  try {
    if (unb64(value.salt).length !== 16 || unb64(value.iv).length !== 12 || unb64(value.data).length < 16) return fail();
  } catch { return fail(); }
  return { format: "winternitz-wots-recovery", version: 1, kdf: "pbkdf2-sha256", iterations: ITERATIONS,
    salt: value.salt, iv: value.iv, data: value.data };
}

async function key(password: string, salt: Uint8Array) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: ITERATIONS },
    base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

export async function encryptRecoveryBackup(payload: RecoveryPayload, password: string): Promise<EncryptedRecoveryBackup> {
  if (password.length < 12) throw new Error("Use at least 12 characters for the backup password.");
  const checked = parseRecoveryPayload(payload);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptionKey = await key(password, salt);
  const plaintext = new TextEncoder().encode(JSON.stringify(checked));
  try {
    const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: AAD }, encryptionKey, plaintext));
    return parseEncryptedRecoveryBackup({ format: "winternitz-wots-recovery", version: 1, kdf: "pbkdf2-sha256",
      iterations: ITERATIONS, salt: b64(salt), iv: b64(iv), data: b64(encrypted) });
  } finally { plaintext.fill(0); }
}

export async function decryptRecoveryBackup(value: unknown, password: string): Promise<RecoveryPayload> {
  const envelope = parseEncryptedRecoveryBackup(value);
  const encryptionKey = await key(password, unb64(envelope.salt));
  let plaintext: Uint8Array;
  try {
    plaintext = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(envelope.iv) as BufferSource,
      additionalData: AAD }, encryptionKey, unb64(envelope.data) as BufferSource));
  } catch { throw new Error("Backup password is incorrect or the encrypted file was changed."); }
  try {
    let payload: unknown;
    try { payload = JSON.parse(new TextDecoder().decode(plaintext)); }
    catch { return fail(); } // Never surface a JSON error containing decrypted text.
    return parseRecoveryPayload(payload);
  }
  finally { plaintext.fill(0); }
}
