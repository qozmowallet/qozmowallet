import { validateNote, type PrivacyNote } from './note';

const ITERATIONS = 600_000;
const encoder = new TextEncoder();
const AAD = encoder.encode('qozmo-privacy-note-backup-v1');
type EncryptedNote = { format: 'qozmo-privacy-note-backup-v1'; kdf: 'PBKDF2-SHA256'; iterations: 600000; cipher: 'AES-256-GCM'; salt: string; iv: string; ciphertext: string };
const hex = (b: Uint8Array) => Array.from(b, v => v.toString(16).padStart(2, '0')).join('');
function bytes(value: unknown, size?: number): Uint8Array<ArrayBuffer> {
  if (typeof value !== 'string' || !/^(?:[0-9a-f]{2})+$/.test(value) || (size && value.length !== size * 2)) throw new Error('Invalid encrypted note backup.');
  return Uint8Array.from(value.match(/../g)!, v => parseInt(v, 16));
}
async function key(password: string, salt: Uint8Array<ArrayBuffer>) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 1024) throw new Error('Use a backup password of 12–1024 characters.');
  const raw = encoder.encode(password);
  try {
    const material = await crypto.subtle.importKey('raw', raw, 'PBKDF2', false, ['deriveKey']);
    return await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  } finally { raw.fill(0); }
}
export async function encryptPrivacyNote(note: PrivacyNote, password: string): Promise<EncryptedNote> {
  const plaintext = encoder.encode(JSON.stringify(validateNote(note)));
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  try {
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: AAD }, await key(password, salt), plaintext);
    return { format: 'qozmo-privacy-note-backup-v1', kdf: 'PBKDF2-SHA256', iterations: ITERATIONS, cipher: 'AES-256-GCM', salt: hex(salt), iv: hex(iv), ciphertext: hex(new Uint8Array(ciphertext)) };
  } finally { plaintext.fill(0); }
}
export async function decryptPrivacyNote(serialized: string, password: string): Promise<PrivacyNote> {
  if (serialized.length > 8192) throw new Error('Invalid encrypted note backup.');
  const r = JSON.parse(serialized);
  const keys = ['format', 'kdf', 'iterations', 'cipher', 'salt', 'iv', 'ciphertext'];
  if (!r || Array.isArray(r) || Object.keys(r).length !== keys.length || !Object.keys(r).every(k => keys.includes(k)) || r.format !== 'qozmo-privacy-note-backup-v1' || r.kdf !== 'PBKDF2-SHA256' || r.iterations !== ITERATIONS || r.cipher !== 'AES-256-GCM') throw new Error('Invalid encrypted note backup.');
  const salt = bytes(r.salt, 16), iv = bytes(r.iv, 12), ciphertext = bytes(r.ciphertext);
  if (ciphertext.length < 17 || ciphertext.length > 2048) throw new Error('Invalid encrypted note backup.');
  let plaintext: Uint8Array | undefined;
  try {
    plaintext = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: AAD }, await key(password, salt), ciphertext));
    return validateNote(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(plaintext)));
  } catch { throw new Error('Unable to unlock note. Check the password and backup.'); }
  finally { plaintext?.fill(0); }
}
