'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { faArrowLeft, faArrowRight, faCheck, faEye, faEyeSlash, faLock, faShieldHalved, faSpinner, faWallet } from '@fortawesome/free-solid-svg-icons';
import { newQuantumDraft, sealQuantumDraft, installQuantumRecord, restoreQuantumPhrase, restoreQuantumBackup, type QuantumDraft, type QuantumRecord } from '@/lib/wallet/quantum/storage';
import { restoreAccountBackup, MAX_ACCOUNT_BACKUP_BYTES } from '@/lib/wallet/account-backup';
import { decryptQuantumRecord, readQuantumRecord } from '@/lib/wallet/quantum/storage';
import { deriveAccountNotesKey, importAccountNotes } from '@/lib/wallet/privacy/account-notes';
import { unlockQuantumSession, type QuantumSession } from '@/lib/wallet/quantum/client';
import { DIcon, Message, Modal } from './ui';
import { RecoveryWordCheck } from './recovery-word-check';
import { createRecoveryChallenge, recoveryAnswersMatch, type RecoveryWordPositions } from '@/lib/wallet/recovery-challenge';

type SetupStep = 'details' | 'recovery' | 'verify';
const setupSteps: { id: SetupStep; label: string }[] = [{id:'details',label:'Your account'},{id:'recovery',label:'Save phrase'},{id:'verify',label:'Confirm words'}];

export function QuantumSetup({ mode, onClose, onReady, unified = false }: { unified?: boolean; mode: 'create' | 'import'; onClose: () => void; onReady: (record: QuantumRecord, session: QuantumSession) => void }) {
  const [name, setName] = useState(unified ? 'My Qozmo wallet' : 'Qozmo Quantum');
  const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [draft, setDraft] = useState<QuantumDraft | null>(null); const [revealed, setRevealed] = useState(false);
  const [step, setStep] = useState<SetupStep>('details');
  const [acknowledged, setAcknowledged] = useState(false); const [answers, setAnswers] = useState(['','','']);
  const [phrase, setPhrase] = useState(''); const [archive, setArchive] = useState(''); const [fileName, setFileName] = useState('');
  const [importType, setImportType] = useState<'phrase' | 'backup'>('phrase');
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const alive = useRef(true); const submitting = useRef(false); const fileRequest = useRef(0);
  const [positions, setPositions] = useState<RecoveryWordPositions | null>(null);
  const currentStep = setupSteps.findIndex(item => item.id === step);
  useEffect(() => { alive.current = true; return () => { alive.current = false; fileRequest.current += 1; }; }, []);
  function moveTo(next: SetupStep) { setError(''); setRevealed(false); setAnswers(['', '', '']); setStep(next); }

  async function submit(event: FormEvent) {
    event.preventDefault(); if (submitting.current) return; setError('');
    if (!name.trim() || name.trim().length > 48) { setError('Enter a wallet name with 1–48 characters.'); return; }
    if (password.length < 12 || password !== confirm) { setError('Use at least 12 characters and matching passwords.'); return; }
    if (mode === 'create' && step === 'details') { try { if (!draft) { const next = newQuantumDraft(); const challenge = createRecoveryChallenge(next.mnemonic.split(' ').length); setDraft(next); setPositions(challenge); } setShowPassword(false); moveTo('recovery'); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Secure quantum setup is unavailable.'); } return; }
    if (mode === 'create' && step === 'recovery') { if (acknowledged) moveTo('verify'); return; }
    if (mode === 'create' && (!draft || !recoveryAnswersMatch(draft.mnemonic, positions, answers))) { setError('Those words do not match yet. Check your offline copy and try again.'); return; }
    submitting.current = true; setBusy(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 20));
      if (!alive.current) return;
      let record: QuantumRecord;
      if (mode === 'create') { record = await sealQuantumDraft(draft!, password, name); await installQuantumRecord(record); }
      else if (importType === 'backup') {
        if (!archive) throw new Error('Choose an encrypted quantum backup first.');
        if (readQuantumRecord()) throw new Error('An account already exists. Its storage was preserved.');
        let complete = false;
        try { complete = JSON.parse(archive)?.format === 'qozmo-wallet-backup'; } catch { throw new Error('Choose a valid encrypted Qozmo backup file.'); }
        if (complete) {
          const imported = await restoreAccountBackup(archive, password, name); record = imported.record;
          if (!alive.current) return;
          const seed = await decryptQuantumRecord(record, password), key = await deriveAccountNotesKey(seed, record.address);
          await importAccountNotes(record.address, key, JSON.stringify(imported.privacyNotes));
          if (!alive.current) return;
          await installQuantumRecord(record, imported.history);
        } else {
          const imported = await restoreQuantumBackup(archive, password, name); record = imported.record;
          if (!alive.current) return;
          await installQuantumRecord(record, imported.history);
        }
      } else { record = await restoreQuantumPhrase(phrase, password, name); await installQuantumRecord(record); }
      const session = await unlockQuantumSession(record, password);
      if (alive.current) { setPassword(''); setConfirm(''); setDraft(null); setPhrase(''); setArchive(''); setAnswers(['','','']); onReady(record, session); }
    } catch (reason) { if (alive.current) setError(reason instanceof Error ? reason.message : 'Quantum setup could not be completed. Preserve your recovery phrase.'); }
    finally { submitting.current = false; if (alive.current) setBusy(false); }
  }

  const title = mode === 'import' ? 'Bring your account to Qozmo.' : step === 'details' ? 'A fresh start. Your own keys.' : step === 'recovery' ? 'Keep your recovery phrase safe.' : 'A quick check, then you’re ready.';
  return <Modal title={title} eyebrow={unified ? "ONE QOZMO WALLET · ROBINHOOD TESTNET" : "QOZMO QUANTUM · ROBINHOOD TESTNET"} className={`qd-quantum-setup${step === 'verify' ? ' qwc-modal' : ''}`} focusKey={step} onClose={onClose} busy={busy}>
    {mode === 'create' && <ol className="qd-setup-progress" aria-label="Wallet setup progress">{setupSteps.map((item,index) => <li key={item.id} className={index === currentStep ? 'is-current' : index < currentStep ? 'is-complete' : ''} aria-current={index === currentStep ? 'step' : undefined}><span>{index < currentStep ? <DIcon icon={faCheck} size={10}/> : `0${index+1}`}</span><strong>{item.label}</strong></li>)}</ol>}
    <form className={`qd-form qd-quantum-setup-form${step === 'verify' ? ' qwc-form' : ''}`} onSubmit={submit}>
      <fieldset disabled={busy} className="qd-setup-fields">
      {mode === 'import' && <Message>Imported quantum accounts stay read-only. A phrase or archive restores the address and known history, but cannot prove that a key was never exposed on another device.</Message>}
      {step === 'details' && <div className="qd-setup-stage">
        {mode === 'create' && <div className="qd-setup-intro"><span><DIcon icon={faShieldHalved} size={23}/></span><p>{unified ? 'One smart account for your wallet, Quantum and Privacy Ring.' : 'A separate smart account, encrypted on this device.'}<small>{unified ? 'Create once. Use it throughout Qozmo.' : 'Let’s give your quantum wallet a home.'}</small></p></div>}
        <label>Account name<input value={name} maxLength={48} onChange={event => setName(event.target.value)} required autoComplete="off" placeholder="My quantum wallet"/></label>
        {mode === 'import' && <><div className="qd-segment" role="group" aria-label="Quantum import type"><button type="button" aria-pressed={importType === 'phrase'} className={importType === 'phrase' ? 'is-active' : ''} onClick={() => {fileRequest.current += 1; setImportType('phrase'); setError('');}}>Recovery phrase</button><button type="button" aria-pressed={importType === 'backup'} className={importType === 'backup' ? 'is-active' : ''} onClick={() => {fileRequest.current += 1; setImportType('backup'); setError('');}}>Encrypted archive</button></div>
          {importType === 'phrase' ? <label>24-word quantum recovery phrase<textarea rows={4} value={phrase} onChange={event => setPhrase(event.target.value)} autoComplete="off" autoCorrect="off" spellCheck={false} required/></label>
            : <label>Quantum backup file<input type="file" accept="application/json,.json" onChange={async event => { const request = ++fileRequest.current; const file = event.target.files?.[0]; setArchive(''); setFileName(''); setError(''); if (!file) return; try { if (file.size > MAX_ACCOUNT_BACKUP_BYTES) throw new Error('The backup file is too large.'); const text = await file.text(); if (alive.current && request === fileRequest.current) { setArchive(text); setFileName(file.name); } } catch (reason) { if(alive.current && request === fileRequest.current) setError(reason instanceof Error ? reason.message : 'The encrypted backup could not be read.'); } }}/><small>{fileName || 'Complete Qozmo backups, account-only archives and compatible WOTS archives.'}</small></label>}</>}
        <div className="qd-setup-passwords"><label>{mode === 'import' && importType === 'backup' ? 'Backup password' : unified ? 'Wallet password' : 'Quantum password'}<span className="qd-password-field"><input type={showPassword ? 'text' : 'password'} minLength={12} maxLength={1024} value={password} onChange={event => setPassword(event.target.value)} autoComplete={mode === 'create' ? 'new-password' : 'off'} required placeholder="At least 12 characters"/><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}><DIcon icon={showPassword ? faEyeSlash : faEye} size={14}/></button></span></label>
        <label>Confirm password<input type="password" value={confirm} maxLength={1024} onChange={event => setConfirm(event.target.value)} autoComplete="off" required placeholder="Enter it once more"/></label></div>
        {mode === 'create' && <p className="qd-setup-security-note"><DIcon icon={faLock} size={11}/>{unified ? 'One account, one recovery phrase and one wallet password. Privacy notes also need their encrypted backup.' : 'Your everyday EVM wallet and its recovery phrase stay separate.'}</p>}
      </div>}
      {step === 'recovery' && draft && <div className="qd-setup-stage">
        <p className="qd-setup-description">Write down all 24 words in order and keep them offline. This phrase belongs to your quantum account.</p>
        <div className="qd-phrase-heading"><span><DIcon icon={faLock} size={11}/> ONLY FOR YOU</span><button className="qd-text-button" type="button" onClick={() => setRevealed(value => !value)} aria-pressed={revealed} aria-controls="qd-quantum-phrase"><DIcon icon={revealed ? faEyeSlash : faEye} size={13}/>{revealed ? 'Hide words' : 'Reveal words'}</button></div>
        <div className={`qd-recovery qd-quantum-recovery${revealed ? '' : ' is-concealed'}`} id="qd-quantum-phrase"><ol aria-hidden={!revealed} aria-label={revealed ? '24 recovery words in order' : 'Recovery phrase hidden'}>{Array.from({length:24},(_,index) => <li key={index}><small>{String(index+1).padStart(2,'0')}</small><span>{revealed ? draft.mnemonic.split(' ')[index] : '••••••'}</span></li>)}</ol>{!revealed && <div className="qd-phrase-curtain"><span><DIcon icon={faShieldHalved} size={24}/></span><strong>A little privacy for your keys.</strong><p>Make sure no one is looking at your screen.</p><button type="button" className="qd-button qd-primary" onClick={() => setRevealed(true)}><DIcon icon={faEye} size={13}/>Reveal recovery phrase</button></div>}</div>
        <label className="qd-checkbox qd-setup-ack"><input type="checkbox" checked={acknowledged} disabled={!revealed && !acknowledged} onChange={event => setAcknowledged(event.target.checked)}/><span>I saved all 24 words offline.<small>I’ll preserve this device’s signing history. Restored accounts are read-only.</small></span></label>
      </div>}
      {step === 'verify' && <div className="qd-setup-stage">
        <p className="qd-modal-intro">Enter the three requested words from your saved Quantum phrase.</p>
        <RecoveryWordCheck positions={positions} answers={answers} disabled={busy} onChange={(index, value) => { setError(''); setAnswers(current => current.map((answer, i) => i === index ? value : answer)); }}/>
      </div>}
      </fieldset>
      {error && <Message tone="error">{error}</Message>}
      {step === 'verify' ? <div className="qwc-actions">
        <button className="qd-button qd-full qwc-confirm" disabled={busy || !positions}>{busy ? <><DIcon icon={faSpinner} size={14} className="qd-is-spinning"/>Encrypting your account…</> : <>Confirm and create Quantum wallet<DIcon icon={faShieldHalved} size={13}/></>}</button>
        <button type="button" className="qwc-secondary" disabled={busy} onClick={() => moveTo('recovery')}>View my phrase again</button>
      </div> : <div className="qd-setup-footer">{mode === 'create' && step !== 'details' && <button type="button" className="qd-button qd-secondary" disabled={busy} onClick={() => moveTo('details')}><DIcon icon={faArrowLeft} size={12}/>Back</button>}<button className="qd-button qd-primary" disabled={busy || (step === 'recovery' && !acknowledged)}>{busy ? <><DIcon icon={faSpinner} size={14} className="qd-is-spinning"/>Encrypting your account…</> : <>{mode === 'import' ? 'Import read-only account' : step === 'details' ? 'Continue to recovery phrase' : 'I saved my phrase'}<DIcon icon={faArrowRight} size={13}/></>}</button></div>}
      <p className="qd-setup-footnote"><DIcon icon={faLock} size={9}/>Encrypted locally. Yours to control.</p>
    </form>
  </Modal>;
}

export function QuantumCreated({ record, onClose, onReceive, unified = false }: { unified?: boolean;record: QuantumRecord; onClose: () => void; onReceive: () => void}) {
  return <Modal title={record.restored ? 'Your account is here.' : unified ? 'Your Qozmo wallet is ready.' : 'Your quantum wallet is ready.'} eyebrow="A LITTLE MOMENT. A FRESH START." className="qd-quantum-success" onClose={onClose}>
    <div className="qd-created-content">
      <div className="qd-created-art" aria-hidden="true"><span className="qd-created-orbit"/><span className="qd-created-orbit"/><span className="qd-created-confetti"/><span className="qd-created-confetti"/><span className="qd-created-confetti"/><span className="qd-created-confetti"/><span className="qd-created-confetti"/><span className="qd-created-confetti"/><div className="qd-created-check"><svg viewBox="0 0 52 52" fill="none"><path d="m14 26 8 8 16-17" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div></div>
      <p className="qd-created-description">{record.restored ? 'Your quantum account was imported with read-only access.' : 'Created, encrypted, and saved on this device. Your next chapter starts here.'}</p>
      <div className="qd-created-account"><span><DIcon icon={faWallet} size={19}/></span><div><strong>{record.name}</strong><small><i/>Robinhood Testnet · {record.restored ? 'Read-only' : 'Original device'}</small></div><DIcon icon={faCheck} size={14}/><code>{record.address}</code></div>
      <div className="qd-created-milestones"><span><DIcon icon={faCheck} size={11}/>Account saved</span><span><DIcon icon={faCheck} size={11}/>Vault encrypted</span><span><DIcon icon={faCheck} size={11}/>{record.restored ? 'Read-only access' : 'Phrase confirmed'}</span></div>
      <p className="qd-created-next">{record.restored ? 'Keep the original signing device and its complete history. This import does not reactivate spending.' : 'Receive test ETH to get started. Your smart account deploys with its first transfer.'}</p>
      <button className="qd-button qd-primary qd-full" onClick={onClose}>{unified ? 'Explore my wallet' : 'Explore my quantum wallet'}<DIcon icon={faArrowRight} size={13}/></button><button className="qd-text-button" onClick={onReceive}>View receive address</button>
    </div>
  </Modal>;
}
