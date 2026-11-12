import { validateMnemonic } from "@scure/bip39";
import { getAddress, type Address } from "viem";
import { english, generateMnemonic, mnemonicToAccount } from "viem/accounts";

/** Only encrypted material and public account metadata are persisted. */
export const STORAGE_KEY = "qozmo.wallet.vault.v1";

const PBKDF2_ITERATIONS = 600_000;
const MAX_BACKUP_LENGTH = 16_384;
const MAX_MNEMONIC_LENGTH = 1_024;
const ACCOUNT_PATH = "m/44'/60'/0'/0/0" as const;
const BACKUP_ERROR = "Invalid Qozmo backup. Select an unmodified encrypted wallet backup.";
const UNLOCK_ERROR = "Unable to unlock this wallet. Check the password and backup file.";
const encoder = new TextEncoder();

export type VaultRecord = {
  version: 1;
  id: string;
  name: string;
  address: Address;
  createdAt: string;
  ciphertext: string;
  salt: string;
  iv: string;
  kdf: { name: "PBKDF2"; hash: "SHA-256"; iterations: 600000 };
  cipher: "AES-256-GCM";
  backupConfirmed: boolean;
};

export type VaultSecret = { mnemonic: string };

export type CreateVaultInput = {
  name: string;
  password: string;
  mnemonic: string;
  backupConfirmed: boolean;
};

type VaultMetadata = Omit<VaultRecord, "ciphertext">;

function secureCrypto(): Crypto {
  if (typeof crypto === "undefined" || !crypto.subtle || !crypto.getRandomValues) {
    throw new Error("Wallet encryption needs a secure connection. Open Qozmo over HTTPS or localhost.");
  }
  return crypto;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  if (!value || value.length % 4 !== 0 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    throw new Error(BACKUP_ERROR);
  }
  const decoded = atob(value);
  const bytes = new Uint8Array(decoded.length);
  for (let index = 0; index < decoded.length; index++) bytes[index] = decoded.charCodeAt(index);
  if (bytesToBase64(bytes) !== value) throw new Error(BACKUP_ERROR);
  return bytes;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(object: Record<string, unknown>, keys: string[]): boolean {
  const actual = Object.keys(object);
  return actual.length === keys.length && actual.every((key) => keys.includes(key));
}

/** Validate before running the KDF so an imported file cannot request unbounded work. */
function validateRecord(value: unknown): VaultRecord {
  if (!isObject(value) || !exactKeys(value, ["version", "id", "name", "address", "createdAt", "ciphertext", "salt", "iv", "kdf", "cipher", "backupConfirmed"])) {
    throw new Error(BACKUP_ERROR);
  }
  if (
    value.version !== 1 ||
    value.cipher !== "AES-256-GCM" ||
    typeof value.id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value.id) ||
    typeof value.name !== "string" || !value.name.trim() || value.name !== value.name.trim() || Array.from(value.name).length > 48 || /[\u0000-\u001f\u007f]/.test(value.name) ||
    typeof value.address !== "string" || !/^0x[\da-fA-F]{40}$/.test(value.address) ||
    typeof value.createdAt !== "string" || !Number.isFinite(Date.parse(value.createdAt)) || new Date(value.createdAt).toISOString() !== value.createdAt ||
    typeof value.backupConfirmed !== "boolean" ||
    typeof value.ciphertext !== "string" || value.ciphertext.length > 5_464 ||
    typeof value.salt !== "string" || value.salt.length !== 24 ||
    typeof value.iv !== "string" || value.iv.length !== 16 ||
    !isObject(value.kdf) || !exactKeys(value.kdf, ["name", "hash", "iterations"]) ||
    value.kdf.name !== "PBKDF2" || value.kdf.hash !== "SHA-256" || value.kdf.iterations !== PBKDF2_ITERATIONS
  ) {
    throw new Error(BACKUP_ERROR);
  }
  const address = getAddress(value.address);
  if (address !== value.address) throw new Error(BACKUP_ERROR);
  const ciphertext = base64ToBytes(value.ciphertext);
  if (ciphertext.length < 32 || ciphertext.length > 4_096 || base64ToBytes(value.salt).length !== 16 || base64ToBytes(value.iv).length !== 12) {
    throw new Error(BACKUP_ERROR);
  }
  return {
    version: 1,
    id: value.id,
    name: value.name,
    address,
    createdAt: value.createdAt,
    ciphertext: value.ciphertext,
    salt: value.salt,
    iv: value.iv,
    kdf: { name: "PBKDF2", hash: "SHA-256", iterations: PBKDF2_ITERATIONS },
    cipher: "AES-256-GCM",
    backupConfirmed: value.backupConfirmed,
  };
}

/** Canonical field order is part of this backup format's authentication contract. */
function authenticatedMetadata(record: VaultMetadata): Uint8Array<ArrayBuffer> {
  return encoder.encode(JSON.stringify({
    application: "qozmo-wallet",
    version: record.version,
    id: record.id,
    name: record.name,
    address: record.address,
    createdAt: record.createdAt,
    salt: record.salt,
    iv: record.iv,
    kdf: { name: record.kdf.name, hash: record.kdf.hash, iterations: record.kdf.iterations },
    cipher: record.cipher,
    backupConfirmed: record.backupConfirmed,
  }));
}

async function deriveEncryptionKey(password: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const cryptography = secureCrypto();
  const passwordBytes = encoder.encode(password);
  try {
    const material = await cryptography.subtle.importKey("raw", passwordBytes, "PBKDF2", false, ["deriveKey"]);
    return await cryptography.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
      material,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
  } finally {
    passwordBytes.fill(0);
  }
}

export function normalizeMnemonic(mnemonic: string): string {
  if (typeof mnemonic !== "string" || mnemonic.length > MAX_MNEMONIC_LENGTH) {
    throw new Error("Enter a valid recovery phrase.");
  }
  return mnemonic.normalize("NFKD").trim().toLowerCase().replace(/\s+/g, " ");
}

export function validateRecoveryPhrase(mnemonic: string): boolean {
  try {
    return validateMnemonic(normalizeMnemonic(mnemonic), english);
  } catch {
    return false;
  }
}

export function generateRecoveryPhrase(): string {
  secureCrypto();
  return generateMnemonic(english, 256);
}

export function getWalletAccount(secret: VaultSecret): ReturnType<typeof mnemonicToAccount> {
  const mnemonic = normalizeMnemonic(secret.mnemonic);
  if (!validateRecoveryPhrase(mnemonic)) throw new Error("The recovery phrase is invalid. Check its words and order.");
  return mnemonicToAccount(mnemonic, { path: ACCOUNT_PATH });
}

export function deriveWalletAddress(mnemonic: string): Address {
  return getWalletAccount({ mnemonic }).address;
}

export async function createVault(input: CreateVaultInput): Promise<VaultRecord> {
  const cryptography = secureCrypto();
  if (typeof input.password !== "string" || Array.from(input.password).length < 12 || encoder.encode(input.password).length > 1_024) {
    throw new Error("Use a password with at least 12 characters and no more than 1,024 bytes.");
  }
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name || Array.from(name).length > 48 || /[\u0000-\u001f\u007f]/.test(name)) {
    throw new Error("Give your wallet a name between 1 and 48 characters.");
  }
  if (typeof input.backupConfirmed !== "boolean") throw new Error("Confirm the recovery backup status.");
  const mnemonic = normalizeMnemonic(input.mnemonic);
  if (!validateRecoveryPhrase(mnemonic)) throw new Error("The recovery phrase is invalid. Check its words and order.");

  const salt = cryptography.getRandomValues(new Uint8Array(16));
  const iv = cryptography.getRandomValues(new Uint8Array(12));
  const metadata: VaultMetadata = {
    version: 1,
    id: cryptography.randomUUID(),
    name,
    address: deriveWalletAddress(mnemonic),
    createdAt: new Date().toISOString(),
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    kdf: { name: "PBKDF2", hash: "SHA-256", iterations: PBKDF2_ITERATIONS },
    cipher: "AES-256-GCM",
    backupConfirmed: input.backupConfirmed,
  };
  const key = await deriveEncryptionKey(input.password, salt);
  const plaintext = encoder.encode(JSON.stringify({ mnemonic } satisfies VaultSecret));
  try {
    const encrypted = await cryptography.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: authenticatedMetadata(metadata), tagLength: 128 },
      key,
      plaintext,
    );
    return { ...metadata, ciphertext: bytesToBase64(new Uint8Array(encrypted)) };
  } finally {
    // This clears the mutable encoding. JavaScript strings cannot be reliably zeroized.
    plaintext.fill(0);
  }
}

export async function unlockVault(record: VaultRecord, password: string): Promise<VaultSecret> {
  const cryptography = secureCrypto();
  let plaintext: Uint8Array<ArrayBuffer> | undefined;
  try {
    const validated = validateRecord(record);
    if (typeof password !== "string" || Array.from(password).length < 12 || encoder.encode(password).length > 1_024) throw new Error(UNLOCK_ERROR);
    const key = await deriveEncryptionKey(password, base64ToBytes(validated.salt));
    const decrypted = await cryptography.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToBytes(validated.iv), additionalData: authenticatedMetadata(validated), tagLength: 128 },
      key,
      base64ToBytes(validated.ciphertext),
    );
    plaintext = new Uint8Array(decrypted);
    const payload: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(plaintext));
    if (!isObject(payload) || !exactKeys(payload, ["mnemonic"]) || typeof payload.mnemonic !== "string") throw new Error(UNLOCK_ERROR);
    const mnemonic = normalizeMnemonic(payload.mnemonic);
    if (!validateRecoveryPhrase(mnemonic) || deriveWalletAddress(mnemonic) !== validated.address) throw new Error(UNLOCK_ERROR);
    return { mnemonic };
  } catch {
    // Deliberately do not reveal whether a password, tag, payload, or metadata failed.
    throw new Error(UNLOCK_ERROR);
  } finally {
    plaintext?.fill(0);
  }
}

export function parseVaultBackup(text: string): VaultRecord {
  if (typeof text !== "string" || text.length === 0 || text.length > MAX_BACKUP_LENGTH) throw new Error(BACKUP_ERROR);
  try {
    return validateRecord(JSON.parse(text));
  } catch {
    throw new Error(BACKUP_ERROR);
  }
}

export function serializeVault(record: VaultRecord): string {
  return JSON.stringify(validateRecord(record), null, 2);
}

function browserStorage(): Storage {
  try {
    if (typeof window === "undefined") throw new Error("Browser storage unavailable.");
    return window.localStorage;
  } catch {
    throw new Error("Local wallet storage is unavailable. Check this browser’s storage and privacy settings.");
  }
}

export function readStoredVault(): VaultRecord | null {
  if (typeof window === "undefined") return null;
  let stored: string | null;
  try {
    stored = browserStorage().getItem(STORAGE_KEY);
  } catch {
    throw new Error("The browser could not read the local wallet. Check its storage settings.");
  }
  if (stored === null) return null;
  try {
    return parseVaultBackup(stored);
  } catch {
    throw new Error("The saved wallet is unreadable. Keep its backup and restore it before creating another wallet.");
  }
}

export function storeVault(record: VaultRecord): void {
  const serialized = serializeVault(record);
  const storage = browserStorage();
  const existing = readStoredVault();
  if (existing && serializeVault(existing) !== serialized) {
    throw new Error("A wallet is already saved in this browser. Export its backup and explicitly remove it before replacing it.");
  }
  try {
    storage.setItem(STORAGE_KEY, serialized);
  } catch {
    throw new Error("The browser could not save this encrypted wallet. Check available storage and keep your recovery phrase.");
  }
}

/** Call only from the application's explicit, confirmed remove-wallet flow. */
export function removeStoredVault(): void {
  try {
    browserStorage().removeItem(STORAGE_KEY);
  } catch {
    throw new Error("The browser could not remove the saved wallet. Check its storage settings.");
  }
}
