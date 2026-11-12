/**
 * Recovery rehearsal tooling. No contract enrollment, cutover, signer installation or
 * legacy restore-policy bypass exists here. A signature proves draft-key approval only.
 */
import { slh_dsa_sha2_256f } from '@noble/post-quantum/slh-dsa.js';
import { bytesToHex, getAddress, hexToBytes, isAddress, sha256, type Address, type Hex } from 'viem';
import { publicKeyHash } from '../quantum-sdk/wots';

const DOMAIN = 'qozmo/recovery-rehearsal/slh-dsa-sha2-256f/v1';
const context = new TextEncoder().encode(DOMAIN);
const encoder = new TextEncoder();
const iterations = 600000;
const hex = (value: unknown, bytes: number): value is Hex => typeof value === 'string' && new RegExp(`^0x[0-9a-f]{${bytes * 2}}$`).test(value);
const b64 = (bytes: Uint8Array) => btoa(Array.from(bytes, b => String.fromCharCode(b)).join(''));
const unb64 = (value: string) => Uint8Array.from(atob(value), c => c.charCodeAt(0));
const fail = (): never => { throw new Error('Invalid recovery research artifact. Nothing was installed or activated.'); };
const exact = (value: object, fields: string[]) => Object.keys(value).sort().join(',') === [...fields].sort().join(',');

export type RecoveryIntent = Readonly<{
  version: 1; purpose: 'research-only-no-activation'; chainId: 46630; account: Address;
  authorityPublicKey: Hex; expectedEpoch: '0'; nextEpoch: '1'; namespace: Hex;
  newSigningKeyHash: Hex; nonce: Hex; createdAt: string; expiresAt: string;
}>;
export type RecoveryEnvelope = Readonly<{
  format: 'qozmo-recovery-research'; version: 1; kind: 'offline-authority' | 'replacement-candidate';
  chainId: 46630; account: Address; publicKey: Hex; commitment: Hex;
  kdf: 'PBKDF2-SHA256-600000'; salt: string; iv: string; ciphertext: string;
}>;
export type RecoveryApproval = { version: 1; domain: typeof DOMAIN; request: RecoveryIntent; signature: Hex };
export type RecoveryPublicAuthority = { format: 'qozmo-recovery-public-authority'; version: 1; chainId: 46630; account: Address; publicKey: Hex; fingerprint: Hex };

export function parsePublicAuthority(value: unknown): RecoveryPublicAuthority {
  const p = value as RecoveryPublicAuthority;
  if (!p || typeof p !== 'object' || !exact(p,['format','version','chainId','account','publicKey','fingerprint']) || p.format !== 'qozmo-recovery-public-authority' || p.version !== 1 || p.chainId !== 46630 || !isAddress(p.account,{ strict:true }) || !hex(p.publicKey,64) || p.fingerprint !== sha256(p.publicKey)) return fail();
  return { ...p,account:getAddress(p.account) };
}
export function publicRecoveryAuthority(envelope: RecoveryEnvelope): RecoveryPublicAuthority {
  const k = parseRecoveryEnvelope(envelope); if (k.kind !== 'offline-authority' || k.commitment !== sha256(k.publicKey)) return fail();
  return parsePublicAuthority({ format:'qozmo-recovery-public-authority',version:1,chainId:46630,account:k.account,publicKey:k.publicKey,fingerprint:k.commitment });
}

export function parseRecoveryIntent(value: unknown, now = Date.now()): RecoveryIntent {
  const r = value as RecoveryIntent;
  if (!r || typeof r !== 'object' || Array.isArray(r) || !exact(r, ['version','purpose','chainId','account','authorityPublicKey','expectedEpoch','nextEpoch','namespace','newSigningKeyHash','nonce','createdAt','expiresAt']) || r.version !== 1 || r.purpose !== 'research-only-no-activation' || r.chainId !== 46630 || !isAddress(r.account, { strict: true }) || r.account === '0x0000000000000000000000000000000000000000' || !hex(r.authorityPublicKey,64) || r.expectedEpoch !== '0' || r.nextEpoch !== '1' || !hex(r.namespace,32) || !hex(r.newSigningKeyHash,32) || !hex(r.nonce,32)) return fail();
  const created = Date.parse(r.createdAt); const expires = Date.parse(r.expiresAt);
  if (!Number.isFinite(created) || !Number.isFinite(expires) || new Date(created).toISOString() !== r.createdAt || new Date(expires).toISOString() !== r.expiresAt || created > now + 300000 || expires <= now || expires <= created || expires - created > 86400000) throw new Error('Recovery request is expired or has an invalid validity window. Create a fresh candidate; never reset a used signing key.');
  return Object.freeze({ version: 1, purpose: r.purpose, chainId: 46630, account: getAddress(r.account), authorityPublicKey: r.authorityPublicKey, expectedEpoch: '0', nextEpoch: '1', namespace: r.namespace, newSigningKeyHash: r.newSigningKeyHash, nonce: r.nonce, createdAt: r.createdAt, expiresAt: r.expiresAt });
}

export function parseRecoveryEnvelope(value: unknown): RecoveryEnvelope {
  const k = value as RecoveryEnvelope;
  if (!k || typeof k !== 'object' || Array.isArray(k) || !exact(k, ['format','version','kind','chainId','account','publicKey','commitment','kdf','salt','iv','ciphertext']) || k.format !== 'qozmo-recovery-research' || k.version !== 1 || !['offline-authority','replacement-candidate'].includes(k.kind) || k.chainId !== 46630 || !isAddress(k.account, { strict: true }) || !hex(k.publicKey, k.kind === 'offline-authority' ? 64 : 32) || !hex(k.commitment,32) || k.kdf !== 'PBKDF2-SHA256-600000' || typeof k.salt !== 'string' || k.salt.length !== 24 || typeof k.iv !== 'string' || k.iv.length !== 16 || typeof k.ciphertext !== 'string' || k.ciphertext.length > 8192 || !/^[A-Za-z0-9+/]+={0,2}$/.test(k.ciphertext)) return fail();
  try { for (const [value, length] of [[k.salt,16],[k.iv,12]] as const) { const bytes = unb64(value); if (bytes.length !== length || b64(bytes) !== value) return fail(); } if (unb64(k.ciphertext).length < 16) return fail(); } catch { return fail(); }
  return Object.freeze({ ...k });
}

const metadata = (k: RecoveryEnvelope) => ({ format: k.format, version: k.version, kind: k.kind, chainId: k.chainId, account: k.account, publicKey: k.publicKey, commitment: k.commitment, kdf: k.kdf });
async function encryptionKey(password: string, salt: Uint8Array) {
  if (password.length < 12 || password.length > 1024) throw new Error('Use a separate recovery password with 12–1024 characters.');
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt','decrypt']);
}
async function seal(kind: RecoveryEnvelope['kind'], account: Address, publicKey: Hex, commitment: Hex, secret: Hex, password: string): Promise<RecoveryEnvelope> {
  const salt = crypto.getRandomValues(new Uint8Array(16)); const iv = crypto.getRandomValues(new Uint8Array(12));
  const envelope: RecoveryEnvelope = { format: 'qozmo-recovery-research', version: 1, kind, chainId: 46630, account: getAddress(account), publicKey, commitment, kdf: 'PBKDF2-SHA256-600000', salt: b64(salt), iv: b64(iv), ciphertext: '' };
  const key = await encryptionKey(password,salt); const plain = encoder.encode(secret);
  try { const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: encoder.encode(JSON.stringify(metadata(envelope))) },key,plain); return parseRecoveryEnvelope({ ...envelope, ciphertext: b64(new Uint8Array(ciphertext)) }); } finally { plain.fill(0); }
}
async function open(envelope: RecoveryEnvelope, password: string): Promise<Hex> {
  const k = parseRecoveryEnvelope(envelope); const key = await encryptionKey(password,unb64(k.salt));
  try { const plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(k.iv) as BufferSource, additionalData: encoder.encode(JSON.stringify(metadata(k))) },key,unb64(k.ciphertext) as BufferSource)); try { const secret = new TextDecoder().decode(plain); if (!hex(secret,32)) return fail(); return secret; } finally { plain.fill(0); } } catch { throw new Error('Recovery kit authentication failed. Check the password and original file.'); }
}
async function authorityKeys(secret: Hex) {
  const raw = hexToBytes(secret); let expanded: Uint8Array | undefined;
  try { const key = await crypto.subtle.importKey('raw',raw as BufferSource,'HKDF',false,['deriveBits']); expanded = new Uint8Array(await crypto.subtle.deriveBits({ name:'HKDF',hash:'SHA-256',salt:new Uint8Array(32),info:context },key,768)); return slh_dsa_sha2_256f.keygen(expanded); } finally { raw.fill(0); expanded?.fill(0); }
}

/** New independent entropy, never derived from the everyday/quantum wallet phrase. */
export async function createOfflineAuthority(account: Address, password: string): Promise<RecoveryEnvelope> {
  if (!isAddress(account, { strict:true })) return fail();
  const entropy = crypto.getRandomValues(new Uint8Array(32));
  try { const secret = bytesToHex(entropy); const keys = await authorityKeys(secret); try { const publicKey = bytesToHex(keys.publicKey); return await seal('offline-authority',account,publicKey,sha256(publicKey),secret,password); } finally { keys.secretKey.fill(0); } } finally { entropy.fill(0); }
}

export async function createRecoveryCandidate(authority: RecoveryPublicAuthority, password: string, now = Date.now()): Promise<{ envelope: RecoveryEnvelope; request: RecoveryIntent }> {
  const kit = parsePublicAuthority(authority);
  const entropy = crypto.getRandomValues(new Uint8Array(32));
  try {
    const secret = bytesToHex(entropy); const namespace = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
    // Domain-separated replacement key material, with a pre-address account identity.
    const seed = sha256(encoder.encode(`${DOMAIN}/candidate:${kit.chainId}:${kit.account.toLowerCase()}:${namespace}:${secret}`));
    const root = publicKeyHash(seed,0);
    const request = parseRecoveryIntent({ version:1,purpose:'research-only-no-activation',chainId:46630,account:kit.account,authorityPublicKey:kit.publicKey,expectedEpoch:'0',nextEpoch:'1',namespace,newSigningKeyHash:root,nonce:bytesToHex(crypto.getRandomValues(new Uint8Array(32))),createdAt:new Date(now).toISOString(),expiresAt:new Date(now+86400000).toISOString() },now);
    // Commitment authenticates the complete reviewed intent; the sealed seed is not installable by legacy code.
    const commitment = sha256(encoder.encode(JSON.stringify(request)));
    return { envelope:await seal('replacement-candidate',kit.account,root,commitment,seed,password),request };
  } finally { entropy.fill(0); }
}

export async function approveRecoveryResearch(kit: RecoveryEnvelope, password: string, request: RecoveryIntent, now = Date.now()): Promise<RecoveryApproval> {
  const checked = parseRecoveryIntent(request,now); const k = parseRecoveryEnvelope(kit);
  if (k.kind !== 'offline-authority' || k.account !== checked.account || k.publicKey !== checked.authorityPublicKey || k.commitment !== sha256(k.publicKey)) throw new Error('Offline authority does not match this account and request.');
  const secret = await open(k,password); const keys = await authorityKeys(secret);
  try {
    if (bytesToHex(keys.publicKey) !== k.publicKey) return fail();
    const signature = slh_dsa_sha2_256f.sign(encoder.encode(JSON.stringify(checked)),keys.secretKey,{ context });
    return { version:1,domain:DOMAIN,request:checked,signature:bytesToHex(signature) };
  } finally { keys.secretKey.fill(0); }
}

/** Caller MUST supply the expected original request and independently retained fingerprint. */
export function verifyRecoveryApproval(value: unknown, expected: RecoveryIntent, trustedFingerprint: string, now = Date.now()): boolean {
  try {
    const proof = value as RecoveryApproval;
    if (!proof || !exact(proof,['version','domain','request','signature']) || proof.version !== 1 || proof.domain !== DOMAIN || !hex(proof.signature,49856)) return false;
    const request = parseRecoveryIntent(proof.request,now); const original = parseRecoveryIntent(expected,now);
    if (JSON.stringify(request) !== JSON.stringify(original) || !hex(trustedFingerprint,32) || sha256(request.authorityPublicKey) !== trustedFingerprint) return false;
    return slh_dsa_sha2_256f.verify(hexToBytes(proof.signature),encoder.encode(JSON.stringify(request)),hexToBytes(request.authorityPublicKey),{ context });
  } catch { return false; }
}

export async function inspectRecoveryCandidate(envelope: RecoveryEnvelope, password: string, request: RecoveryIntent, now = Date.now()): Promise<boolean> {
  const k = parseRecoveryEnvelope(envelope); const r = parseRecoveryIntent(request,now);
  if (k.kind !== 'replacement-candidate' || k.account !== r.account || k.publicKey !== r.newSigningKeyHash || k.commitment !== sha256(encoder.encode(JSON.stringify(r)))) return false;
  const seed = await open(k,password);
  return publicKeyHash(seed,0) === r.newSigningKeyHash;
}

export const RECOVERY_RELEASE_GATES = Object.freeze({ onchainAuthorityEnrollment:false, onchainStatelessVerifier:false, atomicAuthorityRetirement:false, executionEpochGuard:false, finalityAndReorgPolicy:false, independentReview:false, activation:false });
