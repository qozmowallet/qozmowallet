import { getAddress, hexToBytes, type Address, type Hex } from 'viem';
import { noteCommitment, validateNote, type PrivacyNote } from './note';
import { PRIVACY_RESEARCH } from './research-deployment';

export type AccountNote = { commitment: string; note: PrivacyNote };
type Envelope = { commitment: string; iv: string; ciphertext: string };
export type AccountNotesArchive = { format: 'qozmo-account-notes'; version: 1; chainId: 46630; owner: Address; notes: Envelope[] };
type Archive = AccountNotesArchive;
const encoder = new TextEncoder();
const namespace = (owner: Address) => `qozmo.privacy.notes:46630:${getAddress(owner).toLowerCase()}`;
const hex = (v: Uint8Array) => Array.from(v, x => x.toString(16).padStart(2, '0')).join('');
const bytes = (v: string) => Uint8Array.from(v.match(/../g) ?? [], x => parseInt(x, 16));
const aad = (owner: Address, commitment: string) => encoder.encode(`${namespace(owner)}:${PRIVACY_RESEARCH.pool}:${commitment}:v1`);

/** A domain-separated, non-extractable note key. Never use a WOTS signing key for encryption. */
export async function deriveAccountNotesKey(seed: Hex, owner: Address): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', hexToBytes(seed) as Uint8Array<ArrayBuffer>, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: encoder.encode(namespace(owner)), info: encoder.encode('qozmo-account-note-encryption-v1') }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export function assertAccountNote(value: unknown): PrivacyNote {
  const note = validateNote(value);
  if (note.chainId !== 46630 || note.pool !== PRIVACY_RESEARCH.pool || note.denomination !== PRIVACY_RESEARCH.denomination) throw new Error('This note does not belong to the supported Robinhood Testnet pool.');
  return note;
}

function parseArchive(text: string, owner: Address): Archive {
  if (text.length > 1_048_576) throw new Error('The account note archive is too large.');
  const v = JSON.parse(text) as Archive;
  if (!v || v.format !== 'qozmo-account-notes' || v.version !== 1 || v.chainId !== 46630 || v.owner !== getAddress(owner) || !Array.isArray(v.notes) || v.notes.length > 256) throw new Error('This encrypted note archive belongs to another wallet or is unsupported.');
  const seen = new Set<string>();
  for (const n of v.notes) {
    if (!n || typeof n.commitment !== 'string' || !/^[1-9][0-9]{0,76}$/.test(n.commitment) || seen.has(n.commitment) || typeof n.iv !== 'string' || !/^[a-f0-9]{24}$/.test(n.iv) || typeof n.ciphertext !== 'string' || !/^[a-f0-9]{32,4096}$/.test(n.ciphertext) || n.ciphertext.length % 2) throw new Error('Invalid encrypted account note.');
    seen.add(n.commitment);
  }
  return v;
}
function readArchive(owner: Address): Archive {
  const stored = localStorage.getItem(namespace(owner));
  return stored ? parseArchive(stored, owner) : { format: 'qozmo-account-notes', version: 1, chainId: 46630, owner: getAddress(owner), notes: [] };
}
async function openNotes(archive: Archive, key: CryptoKey): Promise<AccountNote[]> {
  return Promise.all(archive.notes.map(async entry => {
    let note: PrivacyNote;
    try {
      const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(entry.iv), additionalData: aad(archive.owner, entry.commitment) }, key, bytes(entry.ciphertext));
      note = assertAccountNote(JSON.parse(new TextDecoder().decode(decrypted)));
    } catch { throw new Error('The note archive could not be authenticated with this wallet. Preserve the original backup.'); }
    if (noteCommitment(note).toString() !== entry.commitment) throw new Error('Encrypted note commitment mismatch.');
    return { note, commitment: entry.commitment };
  }));
}
export function readAccountNotes(owner: Address, key: CryptoKey) { return openNotes(readArchive(owner), key); }
/** Validate every encrypted note without modifying browser storage. */
export async function inspectAccountNotes(serialized: string, owner: Address, key: CryptoKey) {
  const archive = parseArchive(serialized, owner);
  await openNotes(archive, key);
  return archive;
}
function changed(owner: Address) {
  if (typeof window !== 'undefined') window.dispatchEvent(new window.CustomEvent('qozmo:privacy-notes-changed', { detail: { owner } }));
}

/** Durable encrypted storage MUST succeed before preparing a deposit for signature. */
export async function saveAccountNote(owner: Address, key: CryptoKey, value: PrivacyNote, signal?: AbortSignal) {
  const note = assertAccountNote(value), commitment = noteCommitment(note).toString();
  if (!navigator.locks) throw new Error('Saving account notes requires Web Locks over HTTPS or localhost.');
  return navigator.locks.request(namespace(owner), async () => {
    signal?.throwIfAborted();
    const archive = readArchive(owner);
    await openNotes(archive, key);
    if (!archive.notes.some(n => n.commitment === commitment)) {
      if (archive.notes.length >= 256) throw new Error('This research note archive is full. Preserve a backup.');
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad(owner, commitment) }, key, encoder.encode(JSON.stringify(note)));
      signal?.throwIfAborted();
      archive.notes.push({ commitment, iv: hex(iv), ciphertext: hex(new Uint8Array(encrypted)) });
      const serialized = JSON.stringify(archive);
      localStorage.setItem(namespace(owner), serialized);
      if (localStorage.getItem(namespace(owner)) !== serialized) throw new Error('The encrypted note could not be saved. No deposit should be signed.');
      changed(owner);
    }
    return { note, commitment };
  });
}
export function exportAccountNotes(owner: Address) { return readArchive(owner); }
export async function importAccountNotes(owner: Address, key: CryptoKey, serialized: string, signal?: AbortSignal) {
  const incoming = await inspectAccountNotes(serialized, owner, key);
  if (!navigator.locks) throw new Error('Restoring notes requires Web Locks over HTTPS or localhost.');
  await navigator.locks.request(namespace(owner), async () => {
    signal?.throwIfAborted();
    const archive = readArchive(owner);
    await openNotes(archive, key);
    const known = new Set(archive.notes.map(n => n.commitment));
    const added = incoming.notes.filter(n => !known.has(n.commitment));
    if (archive.notes.length + added.length > 256) throw new Error('This research note archive is full. Preserve the original files.');
    if (!added.length) return;
    signal?.throwIfAborted();
    const text = JSON.stringify({ ...archive, notes: [...archive.notes, ...added] });
    localStorage.setItem(namespace(owner), text);
    if (localStorage.getItem(namespace(owner)) !== text) throw new Error('The encrypted notes could not be restored. Preserve the original file.');
    changed(owner);
  });
  return readAccountNotes(owner, key);
}
