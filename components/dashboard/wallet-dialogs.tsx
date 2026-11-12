'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { formatEther, type Address } from 'viem';
import { faArrowDown, faArrowRight, faCheck, faCopy, faKey, faLock, faPlus, faWallet } from '@fortawesome/free-solid-svg-icons';
import { createVault, deriveWalletAddress, generateRecoveryPhrase, normalizeMnemonic, parseVaultBackup, storeVault, unlockVault, validateRecoveryPhrase, getWalletAccount, type VaultRecord, type VaultSecret } from '@/lib/wallet/vault';
import { broadcastNativeTransfer, prepareNativeTransfer, TransferBroadcastError, type PreparedNativeTransfer } from '@/lib/wallet/chain-client';
import { networkExplorerAddress, networkExplorerTx, type WalletNetwork } from '@/lib/wallet/networks';
import type { WalletActivity } from '@/lib/wallet/activity';
import { TransferImpact } from './transfer-impact';
import { RecoveryWordCheck } from './recovery-word-check';
import { createRecoveryChallenge, recoveryAnswersMatch, type RecoveryWordPositions } from '@/lib/wallet/recovery-challenge';
import { DIcon, Message, Modal, errorText, formatToken, shortAddress } from './ui';

async function persistNewVault(vault: VaultRecord) {
  if (!navigator.locks) throw new Error('Wallet setup requires a browser with secure storage coordination. Open Qozmo over HTTPS in an updated browser.');
  await navigator.locks.request('qozmo-vault-write', () => storeVault(vault));
}

type SetupMode = 'choose' | 'create' | 'import';
type SetupProps = { initialMode?: SetupMode; onClose: () => void; onReady: (vault: VaultRecord, secret: VaultSecret) => void; accountScope?: 'evm' | 'multichain' };

export function WalletSetup({ initialMode = 'choose', onClose, onReady, accountScope = 'evm' }: SetupProps) {
  const alive = useRef(true);
  const backupRequest = useRef(0);
  useEffect(() => { alive.current = true; return () => { alive.current = false; backupRequest.current += 1; }; }, []);
  const [mode, setMode] = useState<SetupMode>(initialMode);
  const [step, setStep] = useState<'details' | 'recovery' | 'verify'>('details');
  const [importType, setImportType] = useState<'phrase' | 'file'>('phrase');
  const [name, setName] = useState('Main wallet');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [backup, setBackup] = useState<VaultRecord | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [answers, setAnswers] = useState(['', '', '']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [positions, setPositions] = useState<RecoveryWordPositions | null>(null);

  async function finish(phrase: string) {
    setBusy(true); setError('');
    try {
      const vault = await createVault({ name, password, mnemonic: phrase, backupConfirmed: true });
      await persistNewVault(vault);
      setPassword(''); setConfirm(''); setMnemonic('');
      if (alive.current) onReady(vault, { mnemonic: normalizeMnemonic(phrase) });
    } catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    if (mode === 'import' && importType === 'file') {
      if (!backup) { setError('Choose an encrypted Qozmo backup first.'); return; }
      setBusy(true);
      try { const secret = await unlockVault(backup, password); await persistNewVault(backup); setPassword(''); if (alive.current) onReady(backup, secret); }
      catch (e) { setError(errorText(e)); } finally { setBusy(false); }
      return;
    }
    if (password.length < 12) { setError('Choose a password with at least 12 characters.'); return; }
    if (password !== confirm) { setError('Your passwords do not match.'); return; }
    if (!name.trim()) { setError('Give your wallet a name.'); return; }
    if (mode === 'import') {
      if (!validateRecoveryPhrase(mnemonic)) { setError('Check the words and their order. Enter a valid English BIP-39 phrase.'); return; }
      if (!saved) { setError('Confirm that you have a safe copy of your recovery phrase.'); return; }
      await finish(mnemonic); return;
    }
    try { const phrase = generateRecoveryPhrase(); const challenge = createRecoveryChallenge(phrase.split(' ').length); setMnemonic(phrase); setPositions(challenge); setAnswers(['', '', '']); setRevealed(false); setSaved(false); setStep('recovery'); }
    catch (e) { setError(errorText(e)); }
  }

  const title = mode === 'choose' ? 'Make room for your future.' : step === 'recovery' ? 'Your recovery phrase.' : step === 'verify' ? 'One last check.' : mode === 'create' ? 'Create your wallet.' : 'Welcome back.';
  return <Modal title={title} eyebrow="YOUR QOZMO WALLET" className={step === 'verify' ? 'qwc-modal' : ''} focusKey={step} onClose={onClose} busy={busy}>
    {mode === 'choose' ? <><p className="qd-modal-intro">One address for your EVM networks. Your keys stay with you.</p><div className="qd-setup-options"><button onClick={() => setMode('create')}><span className="qd-option-icon"><DIcon icon={faPlus} size={21}/></span><span><strong>Create a wallet</strong><small>A fresh start, secured on this device.</small></span><DIcon icon={faArrowRight}/></button><button onClick={() => setMode('import')}><span className="qd-option-icon"><DIcon icon={faKey} size={20}/></span><span><strong>Import a wallet</strong><small>Use a phrase or encrypted Qozmo backup.</small></span><DIcon icon={faArrowRight}/></button></div><p className="qd-fine-print">Early access. Start with test funds. EVM accounts use standard ECDSA signatures; Quantum Lab is a separate local proof tool.</p></>
    : step === 'details' ? <form onSubmit={submit} className="qd-form">
      <p className="qd-modal-intro">{accountScope === 'multichain' ? 'This standard vault derives separate EVM, Solana and Bitcoin addresses. It is separate from Quantum and does not use WOTS. Use a standard wallet phrase or backup, never your Quantum recovery phrase.' : mode === 'create' ? 'Create an encrypted wallet on this device. We never receive your password or recovery phrase.' : 'Restore your EVM account on this device. Importing a Quantum smart-account seed here does not restore its smart account.'}</p>
      {mode === 'import' && <div className="qd-segment" role="group" aria-label="Import method"><button type="button" className={importType === 'phrase' ? 'is-active' : ''} onClick={() => { setImportType('phrase'); setError(''); }}>Recovery phrase</button><button type="button" className={importType === 'file' ? 'is-active' : ''} onClick={() => { setImportType('file'); setError(''); }}>Backup file</button></div>}
      {mode === 'import' && importType === 'file' ? <label>Encrypted backup<input type="file" accept="application/json,.json" onChange={async event => { const file = event.target.files?.[0]; setError(''); setBackup(null); if (!file) return; const request = ++backupRequest.current; try { if (file.size > 16384) throw new Error('This file is too large to be a Qozmo wallet backup.'); const parsed = parseVaultBackup(await file.text()); if (alive.current && request === backupRequest.current) setBackup(parsed); } catch (e) { if (alive.current && request === backupRequest.current) setError(errorText(e)); } }}/>{backup && <small>{backup.name} · {shortAddress(backup.address)}</small>}</label> : <><label>Wallet name<input value={name} onChange={e => setName(e.target.value)} maxLength={48} autoComplete="off" placeholder="Main wallet" required/></label>{mode === 'import' && <label>Recovery phrase<textarea value={mnemonic} onChange={e => setMnemonic(e.target.value)} autoComplete="off" autoCorrect="off" spellCheck={false} rows={3} maxLength={1024} placeholder="Enter your 12 or 24 recovery words, separated by spaces" required/></label>}</>}
      <label>{mode === 'import' && importType === 'file' ? 'Backup password' : 'Create a password'}<input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={12} maxLength={256} autoComplete={importType === 'file' && mode === 'import' ? 'current-password' : 'new-password'} placeholder="At least 12 characters" required/></label>
      {!(mode === 'import' && importType === 'file') && <label>Confirm password<input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} minLength={12} maxLength={256} autoComplete="new-password" placeholder="Enter your password again" required/></label>}
      {mode === 'import' && importType === 'phrase' && <label className="qd-checkbox"><input type="checkbox" checked={saved} onChange={e => setSaved(e.target.checked)}/><span>I have saved my recovery phrase securely.</span></label>}
      {error && <Message tone="error">{error}</Message>}
      <button className="qd-button qd-primary qd-full" disabled={busy}>{busy ? 'Encrypting your wallet…' : mode === 'create' ? 'Continue to recovery phrase' : 'Import wallet'}</button>
      <p className="qd-form-note"><DIcon icon={faLock} size={11}/> Encrypted on your device · No account required</p>
    </form> : step === 'recovery' ? <div className="qd-form"><p className="qd-modal-intro">Write down these 24 words in order and keep them somewhere private. Anyone with this phrase can control your EVM account.</p><div className={`qd-recovery ${revealed ? '' : 'is-hidden'}`}>
      {revealed ? <ol>{mnemonic.split(' ').map((word, index) => <li key={index}><small>{index + 1}</small><span>{word}</span></li>)}</ol> : <button className="qd-reveal-phrase" onClick={() => setRevealed(true)}><DIcon icon={faKey} size={24}/><strong>Reveal recovery phrase</strong><span>Make sure no one is looking at your screen.</span></button>}
      </div><label className="qd-checkbox"><input type="checkbox" checked={saved} onChange={e => setSaved(e.target.checked)} disabled={!revealed}/><span>I wrote down my phrase and stored it somewhere safe.</span></label><button className="qd-button qd-primary qd-full" disabled={!saved || !revealed} onClick={() => { setRevealed(false); setAnswers(['', '', '']); setError(''); setStep('verify'); }}>I saved my recovery phrase</button><p className="qd-fine-print">Your password unlocks this browser. Your recovery phrase restores your account. Qozmo cannot recover either for you.</p></div>
    : <form className="qd-form qwc-form" onSubmit={event => { event.preventDefault(); if (busy) return; if (!recoveryAnswersMatch(mnemonic, positions, answers)) { setError('These words do not match. Check the numbered words in your saved phrase.'); return; } void finish(mnemonic); }}>
      <p className="qd-modal-intro">Enter the three requested words from your saved phrase to finish creating your wallet.</p>
      <RecoveryWordCheck positions={positions} answers={answers} disabled={busy} onChange={(index, value) => { setError(''); setAnswers(current => current.map((answer, i) => i === index ? value : answer)); }}/>
      {error && <Message tone="error">{error}</Message>}
      <button className="qd-button qd-full qwc-confirm" disabled={busy || !positions}>{busy ? 'Creating your wallet…' : 'Confirm and create wallet'}<DIcon icon={faCheck} size={13}/></button>
      <button type="button" className="qwc-secondary" onClick={() => { setStep('recovery'); setAnswers(['', '', '']); setError(''); }} disabled={busy}>View my phrase again</button>
    </form>}
  </Modal>;
}

export function UnlockWallet({ vault, onClose, onUnlock }: { vault: VaultRecord; onClose: () => void; onUnlock: (secret: VaultSecret) => void }) {
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  return <Modal title="Welcome back." eyebrow={vault.name} onClose={onClose} busy={busy}><form className="qd-form" onSubmit={async e => { e.preventDefault(); setBusy(true); setError(''); try { const secret = await unlockVault(vault, password); setPassword(''); if (alive.current) onUnlock(secret); } catch (err) { setError(errorText(err)); } finally { setBusy(false); } }}><div className="qd-unlock-emblem"><DIcon icon={faLock} size={24}/></div><p className="qd-modal-intro">Unlock your wallet on this device.</p><p className="qd-address-label">{shortAddress(vault.address)}</p><label>Password<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your wallet password" autoFocus required/></label>{error && <Message tone="error">{error}</Message>}<button className="qd-button qd-primary qd-full" disabled={busy}>{busy ? 'Unlocking…' : 'Unlock wallet'}</button><p className="qd-fine-print">Your recovery phrase remains encrypted until you unlock.</p></form></Modal>;
}

export function ReceiveWallet({ address, network, onClose }: { address: Address; network: WalletNetwork; onClose: () => void }) {
  const [copied, setCopied] = useState(false); const [error, setError] = useState('');
  return <Modal title={`Receive ${network.symbol}.`} eyebrow={network.label} onClose={onClose}><div className="qd-receive"><div className="qd-qr"><QRCodeSVG value={`ethereum:${address}@${network.id}`} size={190} level="M" marginSize={1}/></div><p>Send only assets on <strong>{network.label}</strong> to this address.</p><code>{address}</code><button className="qd-button qd-primary qd-full" onClick={async () => { try { await navigator.clipboard.writeText(address); setCopied(true); } catch { setError('Clipboard is unavailable. Select and copy the address above.'); } }}><DIcon icon={copied ? faCheck : faCopy}/>{copied ? 'Address copied' : 'Copy address'}</button>{error && <Message tone="error">{error}</Message>}<a className="qd-text-button" href={networkExplorerAddress(network, address)} target="_blank" rel="noopener noreferrer">View on explorer</a><p className="qd-fine-print">Standard EVM account · {network.kind === 'testnet' ? 'Test funds only' : 'Mainnet view-only in this release'}</p></div></Modal>;
}

export function SendWallet({ vault, network, onClose, onSent }: { vault: VaultRecord; network: WalletNetwork; onClose: () => void; onSent: (activity: WalletActivity) => void }) {
  const [to, setTo] = useState(''); const [amount, setAmount] = useState(''); const [password, setPassword] = useState('');
  const [prepared, setPrepared] = useState<PreparedNativeTransfer | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [hash, setHash] = useState<`0x${string}` | null>(null);
  async function review(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try { setPrepared(await prepareNativeTransfer({ network, account: vault.address, to, amount })); }
    catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  }
  async function send(event: FormEvent) {
    event.preventDefault(); if (!prepared || busy) return; setBusy(true); setError('');
    try {
      if (network.kind !== 'testnet') throw new Error('Mainnet transfers are not enabled in this release.');
      if (!navigator.locks) throw new Error('This browser cannot safely coordinate transfers. Use an updated browser over HTTPS.');
      const current = prepared;
      await navigator.locks.request(`qozmo-transfer-${vault.address.toLowerCase()}-${network.id}`, { ifAvailable: true }, async lock => {
        if (!lock) throw new Error('A transfer is already being prepared in another tab.');
        const secret = await unlockVault(vault, password);
        const account = getWalletAccount(secret);
        const transactionHash = await broadcastNativeTransfer({ network, account, prepared: current });
        setPassword(''); setHash(transactionHash);
        onSent({ id: transactionHash, hash: transactionHash, address: vault.address, to: current.to, chainId: network.id, amount: formatEther(current.value), symbol: network.symbol, createdAt: new Date().toISOString(), status: 'pending' });
      });
    } catch (e) { if (e instanceof TransferBroadcastError && prepared) { setHash(e.transactionHash); onSent({ id: e.transactionHash, hash: e.transactionHash, address: vault.address, to: prepared.to, chainId: network.id, amount: formatEther(prepared.value), symbol: network.symbol, createdAt: new Date().toISOString(), status: 'pending' }); setError(e.message); } else { setError(errorText(e)); setPrepared(null); } setPassword(''); } finally { setBusy(false); }
  }
  return <Modal title={hash ? 'Transfer submitted.' : prepared ? 'Review your transfer.' : `Send ${network.symbol}.`} eyebrow={`${network.label} · TESTNET`} onClose={onClose} busy={busy}>{hash ? <div className="qd-form"><div className="qd-success-emblem"><DIcon icon={faCheck} size={24}/></div><p className="qd-modal-intro">{error ? "The RPC response was uncertain. Keep this transaction hash and check the explorer before trying again." : "Your transaction has been broadcast. Its status will update in Activity after confirmation."}</p><a className="qd-button qd-primary" href={networkExplorerTx(network, hash)} target="_blank" rel="noopener noreferrer">View transaction</a><button className="qd-button qd-secondary" onClick={onClose}>Back to wallet</button></div> : prepared ? <form className="qd-form" onSubmit={send}><p className="qd-modal-intro">Check the recipient, network, amount, and fee before signing.</p><dl className="qd-review"><div><dt>Network</dt><dd>{network.label}</dd></div><div><dt>From</dt><dd title={vault.address}>{shortAddress(vault.address)}</dd></div><div className="qd-review-address"><dt>Recipient</dt><dd>{prepared.to}</dd></div><div><dt>Amount</dt><dd>{formatEther(prepared.value)} {network.symbol}</dd></div><div><dt>Estimated network fee</dt><dd>{formatEther(prepared.maxFee)} {network.symbol}</dd></div><div><dt>Signing method</dt><dd>ECDSA · standard EVM</dd></div></dl><TransferImpact balance={prepared.balance} amount={prepared.value} maxFee={prepared.maxFee} symbol={network.symbol} self={prepared.to === prepared.from} checkedAt={prepared.preparedAt}/><label>Confirm wallet password<input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required/></label>{error && <Message tone="error">{error}</Message>}<button className="qd-button qd-primary qd-full" disabled={busy}>{busy ? 'Signing and submitting…' : 'Confirm test transfer'}</button><button type="button" className="qd-text-button" disabled={busy} onClick={() => { setPrepared(null); setPassword(''); }}>Edit transfer</button></form> : <form className="qd-form" onSubmit={review}><p className="qd-modal-intro">Send native test {network.symbol} from your EVM account.</p><label>Recipient address<input value={to} onChange={e => setTo(e.target.value)} placeholder="0x…" autoComplete="off" spellCheck={false} required/></label><label>Amount ({network.symbol})<input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" inputMode="decimal" autoComplete="off" required/></label><p className="qd-fine-print">Network fees are fetched before review. Only native test tokens are supported in this release.</p>{error && <Message tone="error">{error}</Message>}<button className="qd-button qd-primary qd-full" disabled={busy}>{busy ? 'Checking balance and fees…' : 'Review transfer'}</button></form>}</Modal>;
}
