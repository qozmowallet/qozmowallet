'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { formatEther, zeroAddress } from 'viem';
import { faDownload, faLock, faRotate, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import { useQozmoAccount } from './account-context';
import { AccountConnection } from './account-connection';
import { currentBackupSnapshot, readBackupStamp } from '@/lib/wallet/account-backup';
import { DIcon, Message, Modal, downloadJSON, errorText, shortAddress } from '@/components/dashboard/ui';
import { PrivacyDemo } from '@/components/dashboard/privacy-demo';
import { PRIVACY_RESEARCH as pins } from '@/lib/wallet/privacy/research-deployment';
import { createPrivacyNote, noteCommitment, noteNullifierHash } from '@/lib/wallet/privacy/note';
import { exportAccountNotes, importAccountNotes, readAccountNotes, saveAccountNote, type AccountNote } from '@/lib/wallet/privacy/account-notes';
import { scanPrivacyDeposits } from '@/lib/wallet/privacy/events';
import { verifyAccountPrivacyPool } from '@/lib/wallet/privacy/account-calls';
import { preparePrivacyDeposit, preparePrivacyWithdrawal, privacyPoolAbi } from '@/lib/wallet/privacy/transactions';
import { browserPrivacyProver, checkBrowserProver } from '@/lib/wallet/privacy/browser-prover';
import { confirmQuantumPrivacy, prepareQuantumPrivacy, type QuantumPrivacyReview } from '@/lib/wallet/quantum/client';
import { networkExplorerTx } from '@/lib/wallet/networks';
import { QUANTUM_NETWORK } from '@/lib/wallet/quantum/client';

type NoteState = 'saved' | 'funded' | 'spent';
export function AccountPrivacy({ supported, onTestnet }: { supported: boolean; onTestnet: () => void }) {
  const account = useQozmoAccount();
  const session = account.session;
  const [notes, setNotes] = useState<AccountNote[]>([]);
  const [selected, setSelected] = useState('');
  const [states, setStates] = useState<Record<string, NoteState>>({});
  const [checked, setChecked] = useState(false);
  const [backedUp, setBackedUp] = useState(false);
  const [coveredByComplete, setCoveredByComplete] = useState(false);
  const hasBackup = backedUp || coveredByComplete;
  const [review, setReview] = useState<QuantumPrivacyReview | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [receipt, setReceipt] = useState<{ hash: `0x${string}`; success: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const generation = useRef(0), abort = useRef(new AbortController());
  const fileInput = useRef<HTMLInputElement>(null);
  const note = notes.find(entry => entry.commitment === selected);

  useEffect(() => {
    const request = ++generation.current;
    abort.current = new AbortController();
    setNotes([]); setSelected(''); setStates({}); setChecked(false); setReview(null); setPassword(''); setError(''); setProgress(''); setReceipt(null); setBusy(false); setBackedUp(false); setCoveredByComplete(false);
    if (fileInput.current) fileInput.current.value = '';
    if (session?.notesKey) void readAccountNotes(session.record.address, session.notesKey).then(entries => {
      if (request === generation.current) { setNotes(entries); setSelected(entries[0]?.commitment ?? ''); }
    }).catch(reason => { if (request === generation.current) setError(errorText(reason)); });
    return () => { generation.current++; abort.current.abort(); };
  }, [session, supported, account.workGeneration]);

  useEffect(() => { setReview(null); setPassword(''); }, [account.relay]);
  useEffect(() => {
    let current = true;
    const check = async () => {
      if (!session) { setCoveredByComplete(false); return; }
      try { const stamp = readBackupStamp(session.record.address); const snapshot = await currentBackupSnapshot(session.record); if (current) setCoveredByComplete(!!stamp && stamp.fingerprint === snapshot.fingerprint); }
      catch { if (current) setCoveredByComplete(false); }
    };
    const sync = () => { void check(); };
    sync(); window.addEventListener('qozmo:backup-changed', sync); window.addEventListener('storage', sync);
    return () => { current = false; window.removeEventListener('qozmo:backup-changed', sync); window.removeEventListener('storage', sync); };
  }, [session, account.status?.entries, account.workGeneration]);

  async function work(task: (signal: AbortSignal, valid: () => boolean) => Promise<void>) {
    if (busy || account.busy || !session?.notesKey || !supported) return;
    const request = generation.current;
    const signal = AbortSignal.any([abort.current.signal, account.abort.current.signal]);
    const valid = () => request === generation.current && !signal.aborted;
    setBusy(true); setError(''); setProgress('');
    try { await task(signal, valid); }
    catch (reason) { if (valid()) setError(errorText(reason)); }
    finally { if (valid()) { setBusy(false); setProgress(''); } }
  }
  async function scan() {
    await work(async (signal, valid) => {
      await verifyAccountPrivacyPool(session!.client);
      const snapshot = await scanPrivacyDeposits(session!.client, pins.pool, 46630, pins.deployBlock, signal);
      const result = await Promise.all(notes.map(async entry => {
        if (!snapshot.leaves.includes(noteCommitment(entry.note))) return [entry.commitment, 'saved'] as const;
        const spent = await session!.client.readContract({ address: pins.pool, abi: privacyPoolAbi, functionName: 'spentNullifiers', args: [noteNullifierHash(entry.note)], blockNumber: snapshot.blockNumber });
        return [entry.commitment, spent ? 'spent' : 'funded'] as const;
      }));
      if (valid()) { setStates(Object.fromEntries(result)); setChecked(true); }
    });
  }
  async function create() {
    await work(async (signal, valid) => {
      await checkBrowserProver(signal); await verifyAccountPrivacyPool(session!.client);
      const entry = await saveAccountNote(session!.record.address, session!.notesKey!, createPrivacyNote({ chainId: 46630, pool: pins.pool, denomination: pins.denomination }), signal);
      const entries = await readAccountNotes(session!.record.address, session!.notesKey!);
      if (valid()) { setNotes(entries); setSelected(entry.commitment); setBackedUp(false); setCoveredByComplete(false); setChecked(false); setStates({}); }
    });
  }
  async function prepare(kind: 'deposit' | 'withdrawal') {
    if (!note || !account.relay) return;
    await work(async (signal, valid) => {
      if (!hasBackup) throw new Error('Download a complete backup or encrypted notes backup before reviewing a transaction.');
      let transaction;
      if (kind === 'deposit') {
        await checkBrowserProver(signal);
        setProgress('Checking the confirmed pool and withdrawal indexer before funding…');
        await verifyAccountPrivacyPool(session!.client);
        const snapshot = await scanPrivacyDeposits(session!.client, pins.pool, 46630, pins.deployBlock, signal);
        if (snapshot.leaves.length >= 256) throw new Error('This research pool is full. No deposit can be prepared.');
        if (snapshot.leaves.includes(noteCommitment(note.note))) throw new Error('This note is already deposited. Verify its status instead of funding it again.');
        await saveAccountNote(session!.record.address, session!.notesKey!, note.note, signal);
        transaction = preparePrivacyDeposit(note.note);
      } else {
        setProgress('Reading confirmed deposits, then generating your proof locally…');
        await verifyAccountPrivacyPool(session!.client);
        const snapshot = await scanPrivacyDeposits(session!.client, pins.pool, 46630, pins.deployBlock, signal);
        transaction = await preparePrivacyWithdrawal(note.note, snapshot.leaves, session!.record.address, zeroAddress, 0n, browserPrivacyProver(signal));
      }
      const next = await prepareQuantumPrivacy(session!, account.relay!, transaction, signal);
      if (valid()) { setReview(next); setPassword(''); }
    });
  }
  async function confirm(event: FormEvent) {
    event.preventDefault(); if (!review) return;
    await work(async (signal, valid) => {
      try {
        const result = await confirmQuantumPrivacy(session!, review, password, signal, message => { if (valid()) setProgress(message); });
        if (valid()) { setReceipt({ hash: result.transactionHash, success: result.success }); setChecked(false); setStates({}); }
      } finally {
        if (valid()) { setPassword(''); setReview(null); await account.refresh(session!); }
      }
    });
  }
  const frozen = busy || account.busy;
  const canSign = !!session && !!account.relay && !!account.status && !account.record?.restored && !account.status.pending && !account.status.recoveryExposed;
  const fundedCount = Object.values(states).filter(value => value === 'funded').length;
  return <div className="qd-privacy-workspace">
    <section className="qd-panel qd-account-privacy-hero">
      <div><span className="qd-privacy-overline">ONE WALLET · QUANTUM + PRIVACY</span><h2>Your wallet.<br/>A little more privacy.</h2><p>The same Qozmo account, with encrypted notes and local zero-knowledge proofs.</p></div>
      <div className="qd-account-identity"><span className="qd-privacy-form-lock"><DIcon icon={faShieldHalved} size={24}/></span><strong>{account.record?.name ?? 'Your Qozmo wallet'}</strong><code>{account.record?.address ?? 'Create once. Use it across Qozmo.'}</code><small>{session ? 'Unlocked across your workspace' : 'One account · One wallet password'}</small></div>
    </section>
    {!supported && <Message>Live Privacy Ring uses Robinhood Testnet. <button className="qd-text-button" onClick={onTestnet}>Use Robinhood Testnet</button></Message>}
    {!session ? <section className="qd-panel qd-tools-panel"><h2>{account.record ? 'Your wallet is locked.' : 'Start with one wallet.'}</h2><p>Use your Qozmo wallet for public transfers, Quantum security and Privacy Ring.</p><button className="qd-button qd-primary" onClick={account.openUnlock} disabled={!account.loaded || !!account.storageError}>{account.record ? 'Unlock wallet' : 'Create wallet'}</button></section> : <>
      <div className="qd-account-balances"><section className="qd-panel"><span className="qd-privacy-overline">PUBLIC WALLET</span><strong>{account.status ? formatEther(account.status.balance) : '—'} <small>test ETH</small></strong><p>Spendable by your Qozmo smart account.</p><button className="qd-text-button" onClick={account.openReceive}>Receive test ETH ↗</button></section><section className="qd-panel"><span className="qd-privacy-overline">POOL NOTES · CONFIRMED SNAPSHOT</span><strong>{checked ? formatEther(BigInt(fundedCount) * BigInt(pins.denomination)) : '—'} <small>test ETH</small></strong><p>{checked ? `${fundedCount} unspent notes at the last verified snapshot.` : 'Verify your notes to read their pool status.'}</p><button className="qd-text-button" disabled={frozen || !supported || !notes.length} onClick={() => void scan()}><DIcon icon={faRotate} size={11}/>Verify notes onchain</button></section></div>
      <AccountConnection disabled={!supported || frozen}/>
      <div className="qd-tools-grid">
        <section className="qd-panel qd-tools-panel"><div className="qd-panel-heading"><div><span className="qd-privacy-overline">01 · PROTECT YOUR NOTES</span><h2>Keep it in your wallet.</h2><p>0.001 test ETH per note · Robinhood Testnet</p></div><DIcon icon={faLock} size={16}/></div>
          <p className="qd-fine-print">Notes are encrypted for this account on this device. Your existing wallet password unlocks them. The recovery phrase alone cannot recreate random note secrets.</p>
          <button className="qd-button qd-primary" disabled={frozen || !supported || !session.notesKey || account.record?.restored} onClick={() => void create()}>{busy ? 'Preparing…' : 'Create protected note'}</button>
          <label className="qd-account-note-select">Your notes<select aria-label="Your account privacy note" value={selected} onChange={event => setSelected(event.target.value)} disabled={frozen || !notes.length}><option value="" disabled>Select a note</option>{notes.map(entry => <option key={entry.commitment} value={entry.commitment}>{entry.commitment.slice(0, 10)}… · {states[entry.commitment] === 'funded' ? 'Funded' : states[entry.commitment] === 'spent' ? 'Withdrawn' : checked ? 'Not confirmed in pool' : 'Saved · verify status'}</option>)}</select></label>
          <button className="qd-button qd-primary" disabled={frozen || !notes.length} onClick={account.openBackup}>Open Backup Center</button>
          <button className="qd-button qd-secondary" disabled={frozen || !notes.length} onClick={() => { downloadJSON(exportAccountNotes(session.record.address), `qozmo-notes-${session.record.address.slice(2, 8)}.json`); setBackedUp(true); }}><DIcon icon={faDownload} size={12}/>Download notes-only backup</button>
          <label className="qd-account-note-import">Restore this wallet’s note backup<input ref={fileInput} type="file" accept="application/json,.json" disabled={frozen || !supported} onChange={event => { const file = event.target.files?.[0]; if (!file) return; void work(async (signal, valid) => { if (file.size > 1_048_576) throw new Error('Choose an account note archive under 1 MB.'); const entries = await importAccountNotes(session.record.address, session.notesKey!, await file.text(), signal); if (valid()) { setNotes(entries); setSelected(entries[0]?.commitment ?? ''); setBackedUp(false); setCoveredByComplete(false); setChecked(false); setStates({}); } }); }}/></label>
          <p className="qd-fine-print">Keep both the encrypted account archive and this note backup. Importing an account remains read-only to protect one-time keys.</p>
        </section>
        <section className="qd-panel qd-tools-panel"><div className="qd-panel-heading"><div><span className="qd-privacy-overline">02 · REVIEW YOUR MOVE</span><h2>One account. Both directions.</h2><p>Deposit from, or withdraw to, your Qozmo account.</p></div></div>
          <dl className="qd-settings-list"><div><dt>Wallet</dt><dd>{shortAddress(session.record.address)}</dd></div><div><dt>Authorization</dt><dd>Quantum · next WOTS key</dd></div><div><dt>Pool</dt><dd>{shortAddress(pins.pool)}</dd></div><div><dt>Connection</dt><dd>{account.relay?.label ?? 'Not connected'}</dd></div></dl>

          <div className="qd-settings-actions"><button className="qd-button qd-primary" disabled={frozen || !supported || !canSign || !note || !hasBackup || states[selected] === 'funded' || states[selected] === 'spent'} onClick={() => void prepare('deposit')}>Review 0.001 ETH deposit</button><button className="qd-button qd-secondary" disabled={frozen || !supported || !canSign || !note || !hasBackup || states[selected] !== 'funded'} onClick={() => void prepare('withdrawal')}>Prove &amp; review withdrawal</button></div>
          {coveredByComplete && <p className="qd-fine-print">Your complete backup matches the current local account and notes.</p>}
          {!hasBackup && notes.length > 0 && <p className="qd-fine-print">Download a complete backup in Backup Center, or a notes-only backup, to enable transaction review.</p>}
          {account.status?.pending && <Message>A signed account operation needs reconciliation in Wallet &amp; security before another signature.</Message>}
          {account.record?.restored && <Message>This imported wallet and its notes are read-only. Use the original signing device.</Message>}
          <p className="qd-fine-print">Withdrawals return the full note to this same address; this links the public endpoints and provides no anonymity claim. Amounts, timing and gas activity remain public. Groth16 privacy proofs are not quantum-resistant.</p>
        </section>
      </div>
    </>}
    {(error || account.error) && <Message tone="error">{error || account.error}</Message>}
    {progress && <Message>{progress}</Message>}
    {receipt && <Message>{receipt.success ? 'Privacy Ring account execution verified.' : 'The account key was consumed, but execution reverted. Preserve the note and inspect activity.'} <a href={networkExplorerTx(QUANTUM_NETWORK, receipt.hash)} target="_blank" rel="noopener noreferrer">View your testnet transaction ↗</a></Message>}
    {review && session && <Modal title={`Review Privacy Ring ${review.details.kind}`} eyebrow="YOUR ONE QOZMO WALLET · TESTNET" busy={busy} onClose={() => { setReview(null); setPassword(''); }}><form className="qd-form" onSubmit={confirm}><dl className="qd-review"><div><dt>Account</dt><dd>{review.address}</dd></div><div><dt>Pool</dt><dd>{review.transaction.to}</dd></div><div><dt>Amount</dt><dd>0.001 test ETH</dd></div><div><dt>Maximum account gas fee</dt><dd>{formatEther(review.fees.max)} ETH</dd></div><div><dt>Authorization</dt><dd>Next one-time key · Same wallet</dd></div></dl><p className="qd-fine-print">Your smart account may deploy with its first operation. The pool call is simulated before signing; the full undeployed account wrapper is not separately simulated. A browser gas payer may also charge an outer transaction fee.</p><label>Confirm with your wallet password<input type="password" autoComplete="off" required value={password} onChange={event => setPassword(event.target.value)} disabled={busy}/></label><button className="qd-button qd-primary" disabled={busy || account.busy}>{busy ? 'Processing…' : 'Sign and submit testnet operation'}</button>{error && <Message tone="error">{error}</Message>}</form></Modal>}
    <details className="qd-panel qd-account-recorded-demo"><summary>Explore the recorded protocol demo</summary><p className="qd-fine-print">Separate public evidence from an earlier research run. These transactions are not your wallet activity.</p><PrivacyDemo/></details>
  </div>;
}
