'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { formatEther, getAddress, parseEther, type Address } from 'viem';
import type { WalletNetwork } from '@/lib/wallet/networks';
import { createPrivacyNote, noteCommitment, type PrivacyNote } from '@/lib/wallet/privacy/note';
import { decryptPrivacyNote, encryptPrivacyNote } from '@/lib/wallet/privacy/backup';
import { DIcon, Message, downloadJSON, errorText } from './ui';
import { faLock, faEye, faCheck, faDownload } from '@fortawesome/free-solid-svg-icons';
import { PrivacyDemo } from './privacy-demo';
import { PRIVACY_RESEARCH } from '@/lib/wallet/privacy/research-deployment';
import { useOptionalQozmoAccount } from '@/components/wallet/account-context';
import { AccountPrivacy } from '@/components/wallet/account-privacy';

type Prepared = { backup: Awaited<ReturnType<typeof encryptPrivacyNote>>; commitment: string; chainId: number; pool: Address; denomination: string };

export default function PrivacyPanel({ network, onTestnet }: { network: WalletNetwork; onTestnet: () => void }) {
  const account = useOptionalQozmoAccount();
  return account ? <AccountPrivacy supported={network.id === 46630} onTestnet={onTestnet}/> : <StandaloneNoteLab network={network} onTestnet={onTestnet}/>;
}

function StandaloneNoteLab({ network, onTestnet }: { network: WalletNetwork; onTestnet: () => void }) {
  const supported = network.id === 46630 || network.id === 11155111;
  const [pool, setPool] = useState(network.id === 46630 ? PRIVACY_RESEARCH.pool : '');
  const [amount, setAmount] = useState(network.id === 46630 ? '0.001' : '0.01');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'create' | 'restore'>('create');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const epoch = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    function clear() { epoch.current++; setPassword(''); setConfirmation(''); setPrepared(null); setFile(null); setBusy(false); setError(''); if (fileInput.current) fileInput.current.value = ''; }
    window.addEventListener('qozmo:lock-all', clear);
    window.addEventListener('pagehide', clear);
    return () => { epoch.current++; window.removeEventListener('qozmo:lock-all', clear); window.removeEventListener('pagehide', clear); };
  }, []);
  async function prepare(event: FormEvent) {
    event.preventDefault();
    if (busy || !supported) return;
    const generation = epoch.current;
    setError(''); setPrepared(null); setBusy(true);
    try {
      let note: PrivacyNote;
      let backup: Prepared['backup'];
      if (mode === 'restore') {
        if (!file || file.size > 8192) throw new Error('Choose an encrypted Qozmo privacy note file under 8 KB.');
        const serialized = await file.text();
        note = await decryptPrivacyNote(serialized, password);
        if (note.chainId !== network.id) throw new Error('This note belongs to a different network. Select its network first.');
        backup = JSON.parse(serialized);
      } else {
        if (password !== confirmation) throw new Error('Backup passwords do not match.');
        if (!/^(0|[1-9][0-9]*)(\.[0-9]{1,18})?$/.test(amount)) throw new Error('Enter an exact ETH denomination with up to 18 decimals.');
        note = createPrivacyNote({ chainId: network.id, pool: getAddress(pool.trim()), denomination: parseEther(amount).toString() });
        backup = await encryptPrivacyNote(note, password);
      }
      if (generation !== epoch.current) return;
      setPrepared({ backup, commitment: noteCommitment(note).toString(), chainId: note.chainId, pool: note.pool, denomination: note.denomination });
      setPassword(''); setConfirmation('');
    } catch (e) { if (generation === epoch.current) setError(errorText(e)); }
    finally { if (generation === epoch.current) setBusy(false); }
  }
  return <div className="qd-privacy-workspace">
    <PrivacyDemo/>
    <section className="qd-privacy-note-lab" aria-label="Encrypted note lab">
    <header className="qd-privacy-lab-heading"><div><span className="qd-privacy-overline">A SPACE FOR YOUR NOTES</span><h2>Your privacy starts with a note.</h2><p>Create a backup. Keep the secret. A little more control, on your device.</p></div><span className="qd-privacy-lab-tag"><DIcon icon={faLock} size={11}/>Local preparation only</span></header>
    {!supported && <Message>Select Robinhood Testnet or Sepolia to prepare a research note. <button className="qd-text-button" onClick={onTestnet}>Use Robinhood Testnet</button></Message>}
    <div className="qd-tools-grid">
      <section className="qd-panel qd-tools-panel qd-privacy-note-form"><div className="qd-panel-heading"><div><span className="qd-privacy-overline">YOUR NOTE</span><h2>Keep it close.</h2><p>{network.label} · Encrypted note lab</p></div><span className="qd-privacy-form-lock"><DIcon icon={faLock} size={15}/></span></div>
        <div className="qd-tabs" role="group" aria-label="Privacy note action">{(['create', 'restore'] as const).map(action => <button key={action} disabled={busy} className={mode === action ? 'is-active' : ''} aria-pressed={mode === action} onClick={() => { setMode(action); setPrepared(null); setError(''); setPassword(''); setConfirmation(''); }}>{action === 'create' ? 'Create note' : 'Restore backup'}</button>)}</div>
        <form className="qd-form" onSubmit={prepare}>
          {mode === 'create' ? <><label>Research pool address<input required value={pool} onChange={e => setPool(e.target.value)} placeholder="0x…" maxLength={42} spellCheck={false} disabled={busy}/></label><label>Pool denomination (ETH)<input required inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} disabled={busy}/></label><p className="qd-fine-print">Enter the intended research pool address and fixed denomination. This lab does not verify contract code or deployment status.</p></> : <label>Encrypted privacy note<input ref={fileInput} required type="file" accept=".json,application/json" disabled={busy} onChange={e => setFile(e.target.files?.[0] ?? null)}/></label>}
          <label>Note backup password<input required type="password" autoComplete="off" minLength={12} maxLength={1024} value={password} onChange={e => setPassword(e.target.value)} disabled={busy} placeholder="At least 12 characters"/></label>
          {mode === 'create' && <label>Confirm password<input required type="password" autoComplete="off" minLength={12} maxLength={1024} value={confirmation} onChange={e => setConfirmation(e.target.value)} disabled={busy}/></label>}
          <button className="qd-button qd-primary" disabled={!supported || busy}><DIcon icon={faLock} size={11}/>{busy ? 'Protecting note…' : mode === 'create' ? 'Prepare encrypted note' : 'Restore encrypted note'}</button>
        </form>{error && <Message tone="error">{error}</Message>}
      </section>
      <section className="qd-panel qd-tools-panel qd-privacy-note-guide"><div className="qd-panel-heading"><div><span className="qd-privacy-overline">{prepared ? 'READY WHEN YOU ARE' : 'PRIVACY, UNDERSTOOD'}</span><h2>{prepared ? 'Your note is ready.' : 'Know what stays with you.'}</h2><p>{prepared ? 'Encrypted backup ready. No funds have moved.' : 'Clear boundaries. A little peace of mind.'}</p></div>{prepared && <span className="qd-privacy-note-ready"><DIcon icon={faCheck} size={15}/></span>}</div>
        {prepared ? <><dl className="qd-review"><div><dt>Chain ID</dt><dd>{prepared.chainId}</dd></div><div><dt>Denomination</dt><dd>{formatEther(BigInt(prepared.denomination))} ETH</dd></div><div className="qd-review-address"><dt>Pool</dt><dd>{prepared.pool}</dd></div></dl><p className="qd-fine-print">Deposit commitment</p><code className="qd-tools-code qd-privacy-note-commitment">{prepared.commitment}</code><button className="qd-button qd-primary" onClick={() => downloadJSON(prepared.backup, `qozmo-privacy-note-${crypto.randomUUID()}.json`)}><DIcon icon={faDownload} size={12}/>Download encrypted note</button><p className="qd-fine-print">Keep the file and password safe. Losing either can make a future funded note unspendable. The note is not saved to browser storage.</p></> : <><div className="qd-privacy-boundary"><span><DIcon icon={faLock} size={14}/></span><div><strong>On your device</strong><p>Note secrets and backup passwords.<br/>Your encrypted file is yours to keep.</p></div></div><div className="qd-privacy-boundary is-public"><span><DIcon icon={faEye} size={14}/></span><div><strong>Visible onchain</strong><p>Amounts, wallet addresses, commitments,<br/>gas payments, and transaction timing.</p></div></div><p className="qd-privacy-guide-caption">Your wallet recovery phrase does not restore these notes. Keep the encrypted backup and its password together in your recovery plan.</p></>}
        <details className="qd-privacy-protocol-details"><summary>Protocol details</summary><dl className="qd-settings-list"><div><dt>Pool</dt><dd>Native ETH · fixed denomination</dd></div><div><dt>Proof</dt><dd>Circom / Groth16 · BN254</dd></div><div><dt>Commitment tree</dt><dd>Poseidon · 256-deposit limit</dd></div><div><dt>Note backup</dt><dd>AES-256-GCM · PBKDF2-SHA256</dd></div><div><dt>Research deployment</dt><dd>Robinhood Testnet · 46630</dd></div></dl><p className="qd-fine-print">Private-to-private transfers, selective disclosure, extension/mobile integration and quantum wallet authorization are future phases. Groth16 is not quantum-resistant.</p></details>
      </section>
    </div>
    <p className="qd-privacy-lab-footnote"><DIcon icon={faLock} size={10}/>This note lab does not deposit funds or submit withdrawals. Creating a note does not create a private balance.</p>
    </section>
  </div>;
}
