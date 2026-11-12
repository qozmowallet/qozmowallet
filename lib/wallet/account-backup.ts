import { getAddress, type Address } from 'viem';
import { decryptRecoveryBackup } from './quantum-sdk/recovery-backup';
import { assertCurrentQuantumRecord, decryptQuantumRecord, exportQuantumBackup, inspectQuantumBackup, QuantumJournal, restoreQuantumBackup, type QuantumRecord } from './quantum/storage';
import { deriveAccountNotesKey, exportAccountNotes, inspectAccountNotes, type AccountNotesArchive } from './privacy/account-notes';
import type { JournalEntry } from './quantum-sdk/journal';

export const MAX_ACCOUNT_BACKUP_BYTES = 12 * 1024 * 1024;
export type BackupStamp = { exportedAt: string; fingerprint: string; operationCount: number; noteCount: number };
export type AccountBackupFile = { format: 'qozmo-wallet-backup'; version: 1; chainId: 46630; owner: Address; createdAt: string; kdf: 'pbkdf2-sha256'; iterations: 600000; salt: string; iv: string; data: string };
type AccountArchive = Awaited<ReturnType<typeof exportQuantumBackup>>;
type BackupPayload = { format: 'qozmo-wallet-backup-payload'; version: 1; accountArchive: AccountArchive; privacyNotes: AccountNotesArchive; snapshot: BackupStamp };
const encoder = new TextEncoder();
const invalid = () => new Error('Invalid or unsupported complete wallet backup. Preserve the original file.');
const stampKey = (owner: Address) => `qozmo.account.backup:46630:${getAddress(owner).toLowerCase()}`;
const canonical = (v: unknown): string => Array.isArray(v) ? `[${v.map(canonical).join(',')}]` : v && typeof v === 'object' ? `{${Object.entries(v).filter(([,value]) => value !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${JSON.stringify(key)}:${canonical(value)}`).join(',')}}` : JSON.stringify(typeof v === 'string' && v.startsWith('0x') ? v.toLowerCase() : v);
const b64 = (v: Uint8Array) => { let text = ''; for (let i = 0; i < v.length; i += 8192) text += String.fromCharCode(...v.subarray(i, i + 8192)); return btoa(text); };
function bytes(v: string) { return Uint8Array.from(atob(v), c => c.charCodeAt(0)); }
const exact = (v: unknown, keys: string[]): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).sort().join(',') === keys.sort().join(',');
const iso = (v: unknown): v is string => typeof v === 'string' && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v;
const metadata = ({ data: _data, ...meta }: AccountBackupFile) => meta;
async function encryptionKey(password: string, salt: Uint8Array) {
  if (password.length < 12 || password.length > 1024) throw new Error('Use your wallet password (12–1024 characters).');
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations: 600000 }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function fingerprint(identity: { address: Address; initialPublicKeyHash: string; initialRecoveryKeyHash: string; salt: string }, entries: JournalEntry[], notes: AccountNotesArchive) {
  const history = entries.slice().sort((a,b) => a.keyIndex - b.keyIndex).map(entry => ({ keyIndex: entry.keyIndex, userOpHash: entry.userOpHash, nextPublicKeyHash: entry.nextPublicKeyHash, userOperation: entry.userOperation, status: entry.status, createdAt: entry.createdAt, kind: entry.kind ?? 'main', ...(entry.transactionHash ? { transactionHash: entry.transactionHash } : {}), ...(entry.kind === 'recovery' ? { replacesKeyIndex: entry.replacesKeyIndex } : {}) }));
  const data = encoder.encode(canonical({ identity: { address: identity.address, initialPublicKeyHash: identity.initialPublicKeyHash, initialRecoveryKeyHash: identity.initialRecoveryKeyHash, salt: identity.salt }, chainId: 46630, entries: history, notes: { ...notes, notes: notes.notes.slice().sort((a,b) => a.commitment.localeCompare(b.commitment)) } }));
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', data)), v => v.toString(16).padStart(2, '0')).join('');
}
export async function currentBackupSnapshot(record: QuantumRecord) {
  assertCurrentQuantumRecord(record);
  const entries = await new QuantumJournal(record).list(), notes = exportAccountNotes(record.address);
  return { fingerprint: await fingerprint(record, entries, notes), operationCount: entries.length, noteCount: notes.notes.length };
}
export function readBackupStamp(owner: Address): BackupStamp | null {
  const raw = localStorage.getItem(stampKey(owner));
  if (raw === null) return null;
  if (raw.length > 2048) throw invalid();
  const v = JSON.parse(raw) as BackupStamp;
  if (!exact(v, ['exportedAt', 'fingerprint', 'operationCount', 'noteCount']) || !iso(v.exportedAt) || typeof v.fingerprint !== 'string' || !/^[a-f0-9]{64}$/.test(v.fingerprint) || !Number.isSafeInteger(v.operationCount) || v.operationCount < 0 || !Number.isSafeInteger(v.noteCount) || v.noteCount < 0 || v.noteCount > 256) throw invalid();
  return v;
}
/** A local download observation, not evidence that a file was retained off-device. */
export function rememberBackupDownload(record: QuantumRecord, stamp: BackupStamp) {
  assertCurrentQuantumRecord(record);
  localStorage.setItem(stampKey(record.address), JSON.stringify(stamp));
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('qozmo:backup-changed'));
}

export async function createAccountBackup(record: QuantumRecord, password: string, signal?: AbortSignal) {
  signal?.throwIfAborted(); assertCurrentQuantumRecord(record);
  const seed = await decryptQuantumRecord(record, password), notesKey = await deriveAccountNotesKey(seed, record.address);
  if (!navigator.locks) throw new Error('Complete backups require Web Locks over HTTPS or localhost.');
  const captured = await navigator.locks.request(`qozmo.quantum.operation:${record.initialPublicKeyHash}`, () => navigator.locks.request(`qozmo.privacy.notes:46630:${record.address.toLowerCase()}`, async () => {
    signal?.throwIfAborted();
    const before = await currentBackupSnapshot(record);
    const privacyNotes = await inspectAccountNotes(JSON.stringify(exportAccountNotes(record.address)), record.address, notesKey);
    const accountArchive = await exportQuantumBackup(record, password);
    const after = await currentBackupSnapshot(record);
    if (before.fingerprint !== after.fingerprint) throw new Error('Wallet history changed while creating the backup. Export again.');
    return { accountArchive, privacyNotes, snapshot: { ...after, exportedAt: new Date().toISOString() } };
  }));
  signal?.throwIfAborted(); assertCurrentQuantumRecord(record);
  const file: AccountBackupFile = { format: 'qozmo-wallet-backup', version: 1, chainId: 46630, owner: record.address, createdAt: captured.snapshot.exportedAt, kdf: 'pbkdf2-sha256', iterations: 600000, salt: b64(crypto.getRandomValues(new Uint8Array(16))), iv: b64(crypto.getRandomValues(new Uint8Array(12))), data: '' };
  const key = await encryptionKey(password, bytes(file.salt));
  const plain = encoder.encode(JSON.stringify({ format: 'qozmo-wallet-backup-payload', version: 1, ...captured } satisfies BackupPayload));
  try { file.data = b64(new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: bytes(file.iv), additionalData: encoder.encode(JSON.stringify(metadata(file))) }, key, plain))); }
  finally { plain.fill(0); }
  signal?.throwIfAborted(); assertCurrentQuantumRecord(record);
  if (JSON.stringify(file).length > MAX_ACCOUNT_BACKUP_BYTES) throw new Error('The complete backup exceeds the supported size. Preserve individual archives.');
  return { file, stamp: captured.snapshot };
}

export async function openAccountBackup(text: string, password: string, signal?: AbortSignal) {
  signal?.throwIfAborted();
  if (text.length > MAX_ACCOUNT_BACKUP_BYTES) throw invalid();
  let file: AccountBackupFile;
  try { file = JSON.parse(text); } catch { throw invalid(); }
  if (!exact(file, ['format','version','chainId','owner','createdAt','kdf','iterations','salt','iv','data']) || file.format !== 'qozmo-wallet-backup' || file.version !== 1 || file.chainId !== 46630 || typeof file.owner !== 'string' || getAddress(file.owner) !== file.owner || !iso(file.createdAt) || file.kdf !== 'pbkdf2-sha256' || file.iterations !== 600000 || typeof file.salt !== 'string' || !/^[A-Za-z0-9+/]{22}==$/.test(file.salt) || typeof file.iv !== 'string' || !/^[A-Za-z0-9+/]{16}$/.test(file.iv) || typeof file.data !== 'string' || file.data.length < 24 || !/^[A-Za-z0-9+/]+={0,2}$/.test(file.data) || file.data.length % 4) throw invalid();
  let payload: BackupPayload;
  try {
    const key = await encryptionKey(password, bytes(file.salt));
    const plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(file.iv), additionalData: encoder.encode(JSON.stringify(metadata(file))) }, key, bytes(file.data)));
    try { payload = JSON.parse(new TextDecoder().decode(plain)); } finally { plain.fill(0); }
  } catch { throw new Error('Unable to authenticate the complete backup. Check its password and preserve the original file.'); }
  signal?.throwIfAborted();
  if (!exact(payload, ['format','version','accountArchive','privacyNotes','snapshot']) || payload.format !== 'qozmo-wallet-backup-payload' || payload.version !== 1 || !exact(payload.accountArchive, ['format','version','archive']) || payload.accountArchive.format !== 'qozmo-quantum-backup' || payload.accountArchive.version !== 1) throw invalid();
  const original = await decryptRecoveryBackup(payload.accountArchive.archive, password);
  if (original.account.chainId !== 46630 || original.account.address !== file.owner) throw invalid();
  const key = await deriveAccountNotesKey(original.seed, file.owner);
  const privacyNotes = await inspectAccountNotes(JSON.stringify(payload.privacyNotes), file.owner, key);
  const entries = original.journals.filter(group => group.chainId === 46630).flatMap(group => group.entries);
  const expected = await fingerprint({ address: original.account.address, initialPublicKeyHash: original.initialPublicKeyHash, initialRecoveryKeyHash: original.initialRecoveryKeyHash, salt: original.account.salt }, entries, privacyNotes);
  const stamp = payload.snapshot;
  if (!exact(stamp, ['exportedAt','fingerprint','operationCount','noteCount']) || stamp.exportedAt !== file.createdAt || stamp.fingerprint !== expected || stamp.operationCount !== entries.length || stamp.noteCount !== privacyNotes.notes.length) throw invalid();
  signal?.throwIfAborted();
  return { accountArchive: payload.accountArchive, privacyNotes, summary: { owner: file.owner, chainId: 46630, exportedAt: file.createdAt, operationCount: entries.length, noteCount: privacyNotes.notes.length, signingPolicy: 'read-only' as const, canActivate: false as const }, stamp };
}
export async function inspectAccountBackup(text: string, password: string, current?: QuantumRecord | null, signal?: AbortSignal) {
  const opened = await openAccountBackup(text, password, signal);
  const history = await inspectQuantumBackup(JSON.stringify(opened.accountArchive), password, current);
  signal?.throwIfAborted();
  return { ...opened.summary, comparison: history.comparison, matchingDeployment: history.matchingDeployment };
}
export async function restoreAccountBackup(text: string, password: string, name: string, signal?: AbortSignal) {
  const opened = await openAccountBackup(text, password, signal);
  const restored = await restoreQuantumBackup(JSON.stringify(opened.accountArchive), password, name);
  signal?.throwIfAborted();
  return { ...restored, privacyNotes: opened.privacyNotes };
}
