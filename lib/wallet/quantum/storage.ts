import { bytesToHex, getAddress, isAddress, type Address, type Hex } from 'viem';
import { mnemonicToEntropy, entropyToMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import {
  SerializedJournal, assertNoConflictingExposure, browserJournalLock, parseJournal,
  predictAccountAddress, parseVault, encryptRecoveryBackup, decryptRecoveryBackup, parseRecoveryPayload,
  type JournalEntry, type RecoveryPayload, type Vault,
} from '../quantum-sdk/index';
import { publicKeyHash, recoveryKeyHash } from '../quantum-sdk/wots';
import manifest from '../quantum-deployment.json';

export const QUANTUM_CHAIN_ID = 46630;
export const QUANTUM_STORAGE_KEY = 'qozmo.quantum.account.v1';
export type QuantumRecord = {
  format: 'qozmo-quantum-wallet'; version: 1; id: string; chainId: 46630;
  name: string; address: Address; initialPublicKeyHash: Hex; initialRecoveryKeyHash: Hex;
  salt: string; createdAt: string; restored: boolean; vault: Vault;
};
export type QuantumDraft = Readonly<{ seed: Hex; mnemonic: string }>;
const drafts = new WeakSet<QuantumDraft>();
const encoder = new TextEncoder();
const journalName = (identity: Hex) => `qozmo.quantum.journal:${QUANTUM_CHAIN_ID}:${identity.toLowerCase()}`;
const fail = (): never => { throw new Error('The Qozmo Quantum account could not be read safely. Preserve its backup and browser data.'); };
const b64 = (bytes: Uint8Array) => btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''));
const unb64 = (value: string) => Uint8Array.from(atob(value), char => char.charCodeAt(0));

function metadata(record: QuantumRecord) {
  return { format: record.format, version: record.version, id: record.id, chainId: record.chainId,
    name: record.name, address: record.address, initialPublicKeyHash: record.initialPublicKeyHash,
    initialRecoveryKeyHash: record.initialRecoveryKeyHash, salt: record.salt,
    createdAt: record.createdAt, restored: record.restored };
}

export function parseQuantumRecord(value: unknown): QuantumRecord {
  const r = value as QuantumRecord;
  if (!r || Object.keys(r).sort().join(',') !== 'address,chainId,createdAt,format,id,initialPublicKeyHash,initialRecoveryKeyHash,name,restored,salt,vault,version' ||
    r.format !== 'qozmo-quantum-wallet' || r.version !== 1 || r.chainId !== QUANTUM_CHAIN_ID ||
    typeof r.id !== 'string' || !/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/.test(r.id) ||
    typeof r.name !== 'string' || !r.name.trim() || r.name.length > 48 || /[\u0000-\u001f\u007f]/.test(r.name) ||
    typeof r.restored !== 'boolean' || !isAddress(r.address, { strict: true }) || getAddress(r.address) !== r.address ||
    ![r.initialPublicKeyHash, r.initialRecoveryKeyHash].every(hash => typeof hash === 'string' && /^0x[\da-f]{64}$/i.test(hash)) ||
    typeof r.salt !== 'string' || !/^(0|[1-9]\d{0,77})$/.test(r.salt) || BigInt(r.salt) >= 2n ** 256n ||
    typeof r.createdAt !== 'string' || !Number.isFinite(Date.parse(r.createdAt)) || new Date(r.createdAt).toISOString() !== r.createdAt) return fail();
  return { ...metadata(r), vault: parseVault(r.vault) };
}

async function key(password: string, salt: Uint8Array) {
  if (!globalThis.crypto?.subtle) throw new Error('Open Qozmo over HTTPS or localhost to use Quantum Wallet.');
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations: 600_000 }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export function newQuantumDraft(): QuantumDraft {
  if (!globalThis.crypto?.subtle || !globalThis.crypto.getRandomValues) throw new Error('Open Qozmo over HTTPS or localhost before generating a quantum recovery phrase.');
  if (!globalThis.navigator?.locks) throw new Error('This browser needs Web Locks support to protect quantum signing history.');
  const entropy = crypto.getRandomValues(new Uint8Array(32));
  const draft = Object.freeze({ seed: bytesToHex(entropy), mnemonic: entropyToMnemonic(entropy, wordlist) });
  entropy.fill(0); drafts.add(draft); return draft;
}

async function seal(seed: Hex, password: string, name: string, restored: boolean, salt = '0'): Promise<QuantumRecord> {
  if (password.length < 12 || password.length > 1024) throw new Error('Use a password with 12 to 1024 characters.');
  if (!name.trim() || name.trim().length > 48 || /[\u0000-\u001f\u007f]/.test(name)) throw new Error('Enter a wallet name with 1–48 characters.');
  const initialPublicKeyHash = publicKeyHash(seed, 0);
  const initialRecoveryKeyHash = recoveryKeyHash(seed, 0);
  const address = predictAccountAddress({ factory: manifest.factory as Address, accountImplementation: manifest.accountImplementation as Address, initialPublicKeyHash, initialRecoveryKeyHash, salt: BigInt(salt) });
  const record: QuantumRecord = { format: 'qozmo-quantum-wallet', version: 1, id: crypto.randomUUID(), chainId: QUANTUM_CHAIN_ID,
    name: name.trim(), address, initialPublicKeyHash, initialRecoveryKeyHash, salt, createdAt: new Date().toISOString(), restored,
    vault: { version: 1, kdf: 'pbkdf2-sha256', iterations: 600_000, salt: '', iv: '', data: '' } };
  const kdfSalt = crypto.getRandomValues(new Uint8Array(16)); const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptionKey = await key(password, kdfSalt);
  const plain = encoder.encode(JSON.stringify({ seed }));
  try {
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: encoder.encode(JSON.stringify(metadata(record))) }, encryptionKey, plain);
    record.vault = { ...record.vault, salt: b64(kdfSalt), iv: b64(iv), data: b64(new Uint8Array(ciphertext)) };
    return parseQuantumRecord(record);
  } finally { plain.fill(0); }
}

export async function sealQuantumDraft(draft: QuantumDraft, password: string, name: string): Promise<QuantumRecord> {
  if (!drafts.has(draft)) throw new Error('Generate a fresh Qozmo Quantum recovery phrase on this device.');
  const record = await seal(draft.seed, password, name, false);
  return record;
}

export async function decryptQuantumRecord(record: QuantumRecord, password: string): Promise<Hex> {
  const checked = parseQuantumRecord(record);
  try {
    const encryptionKey = await key(password, unb64(checked.vault.salt));
    const plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(checked.vault.iv) as BufferSource,
      additionalData: encoder.encode(JSON.stringify(metadata(checked))) }, encryptionKey, unb64(checked.vault.data) as BufferSource));
    let seed: Hex;
    try { seed = JSON.parse(new TextDecoder().decode(plain)).seed; } finally { plain.fill(0); }
    if (typeof seed !== 'string' || !/^0x[\da-f]{64}$/i.test(seed) || publicKeyHash(seed, 0) !== checked.initialPublicKeyHash || recoveryKeyHash(seed, 0) !== checked.initialRecoveryKeyHash) return fail();
    if (predictAccountAddress({ factory: manifest.factory as Address, accountImplementation: manifest.accountImplementation as Address,
      initialPublicKeyHash: checked.initialPublicKeyHash, initialRecoveryKeyHash: checked.initialRecoveryKeyHash, salt: BigInt(checked.salt) }) !== checked.address) return fail();
    return seed;
  } catch { throw new Error('Unable to unlock Qozmo Quantum. Check the password and preserve your backup.'); }
}

export function readQuantumRecord(): QuantumRecord | null {
  const raw = localStorage.getItem(QUANTUM_STORAGE_KEY);
  if (raw === null) return null;
  if (raw.length > 16_384) return fail();
  try { return parseQuantumRecord(JSON.parse(raw)); } catch { return fail(); }
}

export function assertCurrentQuantumRecord(record: QuantumRecord) {
  const current = readQuantumRecord();
  if (!current || JSON.stringify(current) !== JSON.stringify(record)) throw new Error('The Quantum account changed or was removed. Unlock it again.');
}

/** Shared with the original client namespace to detect known exposure of an imported seed. */
function relatedJournals(identity: Hex) {
  const keys = new Set<string>([journalName(identity)]);
  for (let i = 0; i < localStorage.length; i++) {
    const candidate = localStorage.key(i);
    if (candidate && (/^qozmo\.quantum\.journal:\d+:0x[\da-f]{64}$/i.test(candidate) || /^winternitz:\d+:journal:0x[\da-f]{64}$/i.test(candidate)) && candidate.toLowerCase().endsWith(identity.toLowerCase())) keys.add(candidate);
  }
  return [...keys].map(key => {
    const raw = localStorage.getItem(key);
    if (raw === null) return { key, entries: {} as Record<string, JournalEntry> };
    if (raw.length > 4 * 1024 * 1024) return fail();
    return { key, entries: parseJournal(JSON.parse(raw)) };
  });
}

export class QuantumJournal extends SerializedJournal {
  constructor(record: QuantumRecord) {
    const name = journalName(record.initialPublicKeyHash);
    const load = () => {
      assertCurrentQuantumRecord(record);
      const raw = localStorage.getItem(name);
      if (raw === null) throw new Error('Quantum signing history is missing. Signing is blocked; preserve your backup and original device.');
      if (raw.length > 4 * 1024 * 1024) return fail();
      return parseJournal(JSON.parse(raw));
    };
    super({ get: async index => load()[index], list: async () => Object.values(load()).sort((a,b) => a.keyIndex - b.keyIndex),
      put: async entry => {
        const all = load();
        assertNoConflictingExposure(entry, relatedJournals(record.initialPublicKeyHash).flatMap(group => Object.values(group.entries)));
        all[entry.keyIndex] = entry;
        const text = JSON.stringify(all); localStorage.setItem(name, text);
        if (localStorage.getItem(name) !== text) throw new Error('The Quantum key journal could not be saved. No signature was released.');
      },
    }, browserJournalLock(`qozmo.quantum.key:${record.initialPublicKeyHash}`));
  }
}

export async function installQuantumRecord(record: QuantumRecord, history: JournalEntry[] = []) {
  parseQuantumRecord(record);
  return browserJournalLock('qozmo.quantum.install')(async () => {
    if (readQuantumRecord()) throw new Error('A Qozmo Quantum account already exists here. Its vault and signing history were preserved.');
    const name = journalName(record.initialPublicKeyHash);
    const known = relatedJournals(record.initialPublicKeyHash).flatMap(group => Object.values(group.entries));
    const previous = parseJournal(JSON.parse(localStorage.getItem(name) ?? '{}'));
    for (const entry of history) {
      assertNoConflictingExposure(entry, known);
      if (!previous[entry.keyIndex]) previous[entry.keyIndex] = { ...entry, status: 'signed' };
    }
    const journalText = JSON.stringify(previous); localStorage.setItem(name, journalText);
    if (localStorage.getItem(name) !== journalText) throw new Error('Signing history could not be saved. No account was installed.');
    const text = JSON.stringify(record); localStorage.setItem(QUANTUM_STORAGE_KEY, text);
    if (localStorage.getItem(QUANTUM_STORAGE_KEY) !== text) throw new Error('The encrypted account could not be saved. Preserve your recovery phrase.');
  });
}

export async function restoreQuantumPhrase(phrase: string, password: string, name: string) {
  const normalized = phrase.trim().toLowerCase().split(/\s+/).join(' ');
  if (normalized.split(' ').length !== 24) throw new Error('Qozmo Quantum uses a 24-word recovery phrase.');
  const seed = bytesToHex(mnemonicToEntropy(normalized, wordlist));
  return seal(seed, password, name, true);
}

export async function exportQuantumBackup(record: QuantumRecord, password: string) {
  const seed = await decryptQuantumRecord(record, password);
  return browserJournalLock(`qozmo.quantum.key:${record.initialPublicKeyHash}`)(async () => {
    assertCurrentQuantumRecord(record);
    const raw = localStorage.getItem(journalName(record.initialPublicKeyHash));
    if (raw === null) throw new Error('The key journal is missing. Preserve browser data.');
    const groups = relatedJournals(record.initialPublicKeyHash);
    const journals = new Map<number, JournalEntry[]>();
    for (const group of groups) {
      const chain = Number(group.key.match(/(?:journal:|winternitz:)(\d+):/)?.[1]);
      if (!Number.isSafeInteger(chain) || chain <= 0) return fail();
      const entries = journals.get(chain) ?? [];
      for (const entry of Object.values(group.entries)) {
        assertNoConflictingExposure(entry, entries);
        if (!entries.some(existing => existing.keyIndex === entry.keyIndex)) entries.push(entry);
      }
      journals.set(chain, entries);
    }
    const payload: RecoveryPayload = { version: 1, derivation: 'wots-keccak256-v1', signingPolicy: 'read-only', historyScope: 'this-storage-only',
      seed, initialPublicKeyHash: record.initialPublicKeyHash, initialRecoveryKeyHash: record.initialRecoveryKeyHash,
      account: { chainId: QUANTUM_CHAIN_ID, factory: manifest.factory as Address, entryPoint: manifest.entryPoint as Address,
        accountImplementation: manifest.accountImplementation as Address, address: record.address, salt: record.salt },
      walletCreatedAt: record.createdAt, exportedAt: new Date().toISOString(),
      journals: [...journals].map(([chainId, entries]) => ({ chainId, entryPoint: manifest.entryPoint as Address, entries })) };
    const archive = await encryptRecoveryBackup(parseRecoveryPayload(payload), password);
    return { format: 'qozmo-quantum-backup', version: 1, archive };
  });
}

export async function restoreQuantumBackup(text: string, password: string, name: string) {
  if (text.length > 4 * 1024 * 1024) throw new Error('Quantum backup is too large.');
  const wrapper = JSON.parse(text);
  const payload = await decryptRecoveryBackup(wrapper.format === 'qozmo-quantum-backup' && wrapper.version === 1 ? wrapper.archive : wrapper, password);
  const account = payload.account;
  if (account.chainId !== QUANTUM_CHAIN_ID || account.factory.toLowerCase() !== manifest.factory.toLowerCase() || account.accountImplementation.toLowerCase() !== manifest.accountImplementation.toLowerCase() || account.entryPoint.toLowerCase() !== manifest.entryPoint.toLowerCase()) throw new Error('This backup belongs to another network or account version. No account was installed.');
  if (payload.journals.some(group => group.chainId !== QUANTUM_CHAIN_ID && group.entries.length)) throw new Error('This backup contains cross-network key history. Preserve the original devices and journals; do not import it into the testnet signer.');
  const record = await seal(payload.seed, password, name, true, account.salt);
  return { record, history: payload.journals.flatMap(group => group.entries) };
}

/** Authenticated inspection only. Never installs a seed, changes a journal or grants signing. */
export async function inspectQuantumBackup(text: string, password: string, current?: QuantumRecord | null) {
  if (text.length > 4 * 1024 * 1024) throw new Error('Quantum backup is too large.');
  const wrapper = JSON.parse(text);
  const payload = await decryptRecoveryBackup(wrapper.format === 'qozmo-quantum-backup' && wrapper.version === 1 ? wrapper.archive : wrapper, password);
  const account = payload.account;
  const matchingDeployment = account.chainId === QUANTUM_CHAIN_ID && account.factory.toLowerCase() === manifest.factory.toLowerCase() && account.accountImplementation.toLowerCase() === manifest.accountImplementation.toLowerCase() && account.entryPoint.toLowerCase() === manifest.entryPoint.toLowerCase();
  const summary = { account: account.address, chainId: account.chainId, exportedAt: payload.exportedAt, knownExposureCount: payload.journals.reduce((count,group)=>count+group.entries.length,0), matchingDeployment, signingPolicy:'read-only' as const, canActivate:false as const };
  if (!matchingDeployment) return { ...summary, comparison:'different-deployment' as const };
  if (!current) return { ...summary, comparison:'no-local-account-to-compare' as const };
  if (current.address.toLowerCase() !== account.address.toLowerCase() || current.initialPublicKeyHash !== payload.initialPublicKeyHash) return { ...summary, comparison:'different-account' as const };
  return browserJournalLock(`qozmo.quantum.key:${current.initialPublicKeyHash}`)(async()=>{
    assertCurrentQuantumRecord(current);
    let local: JournalEntry[];
    try { const raw = localStorage.getItem(journalName(current.initialPublicKeyHash)); if(raw === null) throw new Error('Missing journal'); local = Object.values(parseJournal(JSON.parse(raw))); } catch { return { ...summary, comparison:'local-history-unavailable' as const }; }
    const archived = payload.journals.filter(group=>group.chainId===QUANTUM_CHAIN_ID).flatMap(group=>group.entries);
    try { for (const entry of archived) assertNoConflictingExposure(entry,local); for (const entry of local) assertNoConflictingExposure(entry,archived); }
    catch { return { ...summary, comparison:'conflicting-exposure' as const }; }
    const canonical = (value: unknown): string => {
      if(typeof value === 'string') return JSON.stringify(value.startsWith('0x') ? value.toLowerCase() : value);
      if(Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
      if(value && typeof value === 'object') return `{${Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>`${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`;
      return JSON.stringify(value);
    };
    for(const entry of local) {
      const saved = archived.find(item=>item.keyIndex===entry.keyIndex);
      if(saved && canonical(saved.userOperation)!==canonical(entry.userOperation)) return { ...summary, comparison:'conflicting-exposure' as const };
    }
    const missing = local.filter(entry=>!archived.some(saved=>saved.keyIndex===entry.keyIndex&&saved.userOpHash.toLowerCase()===entry.userOpHash.toLowerCase())).length;
    return { ...summary, comparison:missing?'missing-known-local-exposures' as const:'matches-known-local-history-only' as const, missingKnownExposures:missing };
  });
}
