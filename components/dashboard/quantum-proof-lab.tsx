'use client';

import { useEffect, useRef, useState } from 'react';
import { faArrowRight, faCheck, faDownload, faFingerprint, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import type { VaultRecord, VaultSecret } from '@/lib/wallet/vault';
import type { WalletNetwork } from '@/lib/wallet/networks';
import { MAX_QUANTUM_PROOF_JSON_BYTES, createQuantumProof, deriveQuantumIdentity, parseQuantumProofJSON, verifyQuantumProof, type QuantumIdentity, type QuantumProof } from '@/lib/wallet/quantum';
import { DIcon, Message, downloadJSON, errorText } from './ui';

export default function QuantumProofLab({ vault, secret, network, onUnlock }: { vault: VaultRecord | null; secret: VaultSecret | null; network: WalletNetwork; onUnlock: () => void }) {
  const [identity, setIdentity] = useState<QuantumIdentity | null>(null);
  const [proof, setProof] = useState<QuantumProof | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [verified, setVerified] = useState<'idle' | 'valid' | 'invalid' | 'checking'>('idle');
  const [importName, setImportName] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const generation = useRef(0);
  const verificationRequest = useRef(0);
  useEffect(() => () => { verificationRequest.current += 1; }, []);
  useEffect(() => { generation.current += 1; setIdentity(null); setProof(null); setError(''); setBusy(false); return () => { generation.current += 1; }; }, [secret, vault?.id, network.id]);

  async function generate(sign = false) {
    if (!secret || !vault) { onUnlock(); return; }
    const version = generation.current; setBusy(true); setError('');
    try {
      // Let the status paint before the CPU-bound hash-based operation begins.
      await new Promise<void>(resolve => setTimeout(resolve, 30));
      if (version !== generation.current) return;
      if (sign) {
        const next = await createQuantumProof(secret.mnemonic, { address: vault.address, chainId: network.id });
        const valid = await verifyQuantumProof(next);
        if (!valid) throw new Error('The local proof did not verify. No result was saved.');
        if (version === generation.current) { setIdentity(next); setProof(next); }
      } else {
        const next = await deriveQuantumIdentity(secret.mnemonic);
        if (version === generation.current) setIdentity(next);
      }
    } catch (e) { if (version === generation.current) setError(errorText(e)); }
    finally { if (version === generation.current) setBusy(false); }
  }
  return <div className="qd-quantum-workspace"><section className="qd-quantum-intro"><div><span className="qd-eyebrow">HASH-BASED. FORWARD-LOOKING.</span><h2>A new kind<br/>of signature.</h2><p>Create and verify a local post-quantum key proof.<br/>Explore the technology behind a different kind of wallet.</p><span className="qd-proof-tag">SLH-DSA-SHA2-256f · LOCAL LAB</span></div><div className="qd-quantum-art qd-quantum-art-large" aria-hidden="true"><span/><span/><span/><span/><i/></div></section>
    <div className="qd-quantum-grid"><section className="qd-panel qd-identity-panel"><div className="qd-panel-heading"><div><h2>Your quantum identity</h2><p>Derived locally from your recovery phrase.</p></div><span className="qd-small-tag">EXPERIMENTAL</span></div><div className="qd-identity-body"><div className="qd-identity-emblem"><DIcon icon={faFingerprint} size={36}/></div>{identity ? <><h3>One identity. Verifiable proof.</h3><span className="qd-field-caption">PUBLIC KEY FINGERPRINT</span><code className="qd-fingerprint">{identity.fingerprint}</code><p>Only your public fingerprint and proof are shown. Your signing key stays on this device.</p></> : <><h3>{vault ? 'Ready when you are.' : 'Your wallet comes first.'}</h3><p>{vault ? 'Unlock your wallet to derive a separate, hash-based signing identity.' : 'Create or import an EVM wallet, then explore a local quantum identity.'}</p></>}
      {error && <Message tone="error">{error}</Message>}
      {!identity ? <button className="qd-button qd-primary" disabled={busy} onClick={() => void generate(false)}>{busy ? 'Deriving identity…' : secret ? 'Generate quantum identity' : vault ? 'Unlock wallet' : 'Create a wallet'}<DIcon icon={faArrowRight} size={12}/></button> : <button className="qd-button qd-primary" disabled={busy} onClick={() => void generate(true)}>{busy ? 'Creating and verifying proof…' : 'Create & verify local proof'}</button>}
      {proof && <div className="qd-proof-result"><span><DIcon icon={faCheck} size={13}/>Local proof verified</span><p>{proof.algorithm}<br/>49,856-byte signature · {new Date(proof.createdAt).toLocaleTimeString()}</p><button className="qd-button qd-secondary qd-small" onClick={() => downloadJSON(proof, `qozmo-public-quantum-proof-${Date.now()}.json`)}><DIcon icon={faDownload} size={12}/>Export public proof</button></div>}
    </div></section><section className="qd-panel qd-quantum-status"><div className="qd-panel-heading"><div><h2>Know what is protected.</h2><p>Three separate layers, clearly defined.</p></div></div><ol className="qd-protection-layers"><li><span>01</span><div><h3>Your saved vault</h3><p>Password-encrypted on this browser using AES-256-GCM.</p><small>{vault ? 'ACTIVE ON THIS DEVICE' : 'AVAILABLE WITH WALLET SETUP'}</small></div></li><li><span>02</span><div><h3>Your local quantum proof</h3><p>Stateless, hash-based SLH-DSA signatures, built with hash chains. Proves possession of a separate signing key.</p><small>LOCAL VERIFICATION</small></div></li><li><span>03</span><div><h3>Your onchain account</h3><p>Currently a standard ECDSA account. Qozmo Quantum uses a separate WOTS smart account on Robinhood Testnet.</p><small className="qd-pending-label">SEPARATE QUANTUM ACCOUNT</small></div></li></ol><div className="qd-quantum-scope">A verified local proof does not secure your EVM funds, authorize a transaction, or independently prove EVM account ownership.</div></section></div>
    <section className="qd-panel qd-proof-verifier"><div className="qd-panel-heading"><div><h2>Verify a public proof</h2><p>Import an exported Qozmo proof. No wallet unlock required.</p></div></div><div className="qd-verifier-content"><label className="qd-file-input">Choose a proof file<input type="file" accept="application/json,.json" onChange={async event => { const file = event.target.files?.[0]; if (!file) return; const request = ++verificationRequest.current; setVerificationError(''); setImportName(file.name); if (!globalThis.crypto?.subtle) { setVerified('idle'); setVerificationError('Proof verification requires HTTPS or localhost. Open the secure Qozmo website to continue.'); return; } setVerified('checking'); try { if (file.size > MAX_QUANTUM_PROOF_JSON_BYTES) throw new Error('Proof is too large'); const value = parseQuantumProofJSON(await file.text()); const valid = await verifyQuantumProof(value); if (request === verificationRequest.current) setVerified(valid ? 'valid' : 'invalid'); } catch { if (request === verificationRequest.current) setVerified('invalid'); } }}/></label><div aria-live="polite">{verificationError && <Message tone="error">{verificationError}</Message>}{verified === 'checking' ? <span>Verifying signature…</span> : verified === 'valid' ? <Message tone="success">Local proof verified. {importName}</Message> : verified === 'invalid' ? <Message tone="error">This proof is invalid, altered, or uses an unsupported format.</Message> : <span className="qd-muted">Public key + signature + original message</span>}</div></div></section>
    <div className="qd-info-footer">This optional proof lab uses a separate SLH-DSA identity derived from your everyday EVM phrase. It is independent from your Qozmo Quantum smart account and cannot authorize its transfers.</div>
  </div>;
}
