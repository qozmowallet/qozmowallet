import type { Hex } from "viem";

/**
 * Password-encrypted secrets: PBKDF2-SHA256 (600k iterations) → AES-256-GCM, via WebCrypto
 * (available in browsers, extensions and Node). Shared by the web wallet and the extension;
 * each keeps the decrypted copy in memory only while unlocked.
 */
export type Secrets = { seed: Hex; relayerKey?: Hex; restoreBlocked?: true };

export type Vault = { version: 1; kdf: "pbkdf2-sha256"; iterations: number; salt: string; iv: string; data: string };

const ITERATIONS = 600_000;

const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

/** Bound attacker-controlled storage before doing expensive cryptographic work. */
export function parseVault(value: unknown): Vault {
  const v = value as Vault | null;
  if (!v || v.version !== 1 || v.kdf !== "pbkdf2-sha256" || v.iterations !== ITERATIONS ||
      typeof v.salt !== "string" || v.salt.length !== 24 || typeof v.iv !== "string" || v.iv.length !== 16 ||
      typeof v.data !== "string" || v.data.length > 8192 || !/^[A-Za-z0-9+/]+={0,2}$/.test(v.data))
    throw new Error("Invalid or unsupported encrypted vault. Keep your backup and do not overwrite browser data.");
  try {
    if (unb64(v.salt).length !== 16 || unb64(v.iv).length !== 12 || unb64(v.data).length < 16) throw Error();
  } catch { throw new Error("Invalid encrypted vault encoding. Keep your backup."); }
  return { version: 1, kdf: "pbkdf2-sha256", iterations: ITERATIONS, salt: v.salt, iv: v.iv, data: v.data };
}

function parseSecrets(value: unknown): Secrets {
  const s = value as Secrets | null;
  const valid = (v: unknown): v is Hex => typeof v === "string" && /^0x[0-9a-fA-F]{64}$/.test(v);
  if (!s || !valid(s.seed) || (s.relayerKey !== undefined && !valid(s.relayerKey)) ||
      (s.restoreBlocked !== undefined && s.restoreBlocked !== true)) throw new Error("Invalid vault secrets.");
  return { seed: s.seed, ...(s.relayerKey === undefined ? {} : {relayerKey: s.relayerKey}),
    ...(s.restoreBlocked === true ? {restoreBlocked: true as const} : {}) };
}

async function deriveKey(password: string, salt: Uint8Array, iterations: number) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptVault(secrets: Secrets, password: string): Promise<Vault> {
  const checked = parseSecrets(secrets);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, ITERATIONS);
  const plain = new TextEncoder().encode(JSON.stringify(checked));
  try {
    const data = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain));
    return { version: 1, kdf: "pbkdf2-sha256", iterations: ITERATIONS, salt: b64(salt), iv: b64(iv), data: b64(data) };
  } finally { plain.fill(0); }
}

/** Throws "Wrong password" if authentication fails. */
export async function decryptVault(vault: Vault, password: string): Promise<Secrets> {
  const checked = parseVault(vault);
  const key = await deriveKey(password, unb64(checked.salt), checked.iterations);
  try {
    const plain = new Uint8Array(await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: unb64(checked.iv) as BufferSource },
      key,
      unb64(checked.data) as BufferSource,
    ));
    try { return parseSecrets(JSON.parse(new TextDecoder().decode(plain))); }
    finally { plain.fill(0); }
  } catch {
    throw new Error("Wrong password");
  }
}
