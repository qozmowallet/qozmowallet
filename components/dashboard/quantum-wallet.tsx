'use client';

import { appHref, isExtensionRuntime } from '@/lib/app-runtime';
import { lazy, Suspense, useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { QuantumExtensionModel, QuantumExtensionSurface, QuantumExtensionView } from '../quantum-extension';
import { QRCodeSVG } from 'qrcode.react';
import { formatEther, formatUnits } from 'viem';
import { faArrowUpRightFromSquare, faArrowDown, faArrowRight, faCheck, faCircleCheck, faClockRotateLeft, faCopy, faDownload, faLink, faLock, faRotate, faShieldHalved, faWallet, faServer } from '@fortawesome/free-solid-svg-icons';
import { QUANTUM_STORAGE_KEY, readQuantumRecord, exportQuantumBackup, type QuantumRecord } from '@/lib/wallet/quantum/storage';
import {
  QUANTUM_NETWORK, connectQuantumBrowserRelay, connectQuantumBundler, connectQuantumManagedBundler, unlockQuantumSession,
  readQuantumStatus, readQuantumToken, prepareQuantumTransfer, confirmQuantumTransfer,
  retryQuantumPending, inspectQuantumEntry, quantumErrorMessage,
  type QuantumSession, type QuantumRelay, type QuantumReview, type QuantumStatus, type QuantumToken,
} from '@/lib/wallet/quantum/client';
import type { AccountReceipt } from '@/lib/wallet/account-activity';
import { ConnectionCheckError, type ConnectionState } from '@/lib/wallet/connection';
import { AccountConnection } from '@/components/wallet/account-connection';
import { networkExplorerAddress, networkExplorerTx } from '@/lib/wallet/networks';
import { QuantumCreated, QuantumSetup } from './quantum-dialogs';
import { useOptionalQozmoAccount } from '@/components/wallet/account-context';
import { QuantumFirstSteps, QuantumIntro } from './quantum-intro';
import { TransferImpact } from './transfer-impact';
import { DIcon, Message, Modal, downloadJSON, formatToken, shortAddress } from './ui';

const QuantumExtension = lazy(() => import('../quantum-extension'));

export type QozmoWalletOptions = {
  layout?: 'dashboard' | 'extension'; surface?: QuantumExtensionSurface;
  initialSetup?: 'create' | 'import'; initialView?: QuantumExtensionView;
  networkSelect?: (disabled: boolean) => ReactNode;
};

export function useQozmoWalletController({ surface = 'tab', initialSetup, unified = false }: QozmoWalletOptions & { unified?: boolean } = {}) {
  const [record, setRecord] = useState<QuantumRecord | null>(null);
  const [session, setSession] = useState<QuantumSession | null>(null);
  const [loaded, setLoaded] = useState(false); const [storageError, setStorageError] = useState('');
  const [setup, setSetup] = useState<'create' | 'import' | null>(null);
  const [created, setCreated] = useState(false); const [receive, setReceive] = useState(false);
  const [copied, setCopied] = useState(false); const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accountTitle = useRef<HTMLHeadingElement>(null);
  const [connectionMethod, setConnectionMethod] = useState<'browser' | 'bundler' | 'managed'>(isExtensionRuntime() ? 'bundler' : 'managed');
  const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const [status, setStatus] = useState<QuantumStatus | null>(null);
  const [relay, setRelay] = useState<QuantumRelay | null>(null); const [bundlerUrl, setBundlerUrl] = useState('');
  const [recipient, setRecipient] = useState(''); const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState<'eth' | 'token'>('eth'); const [tokenAddress, setTokenAddress] = useState('');
  const [token, setToken] = useState<QuantumToken | null>(null);
  const [review, setReview] = useState<QuantumReview | null>(null);
  const [action, setAction] = useState<'backup' | 'retry' | null>(null); const [actionPassword, setActionPassword] = useState('');
  const [receipts, setReceipts] = useState<Record<string, AccountReceipt>>({});
  const [receiptErrors, setReceiptErrors] = useState<Record<string, string>>({});
  const [connection, setConnection] = useState<ConnectionState>({ status: 'idle', method: 'managed', message: 'Choose how your account connects to Robinhood Testnet.' });
  const [workGeneration, setWorkGeneration] = useState(0);
  const epoch = useRef(0); const abort = useRef(new AbortController());
  const lock = useCallback(() => {
    epoch.current += 1; setWorkGeneration(value => value + 1); abort.current.abort(); abort.current = new AbortController();
    setSession(null); setStatus(null); setReview(null); setAction(null); setActionPassword(''); setPassword('');
    setReceipts({}); setReceiptErrors({}); setConnection({ status: 'idle', method: 'managed', message: 'Unlock your wallet to connect.' });
    setRelay(null); setBundlerUrl(''); setToken(null); setBusy(false); setSetup(null); setCreated(false); setReceive(false); setCopied(false);
    if (copyTimer.current) clearTimeout(copyTimer.current);
  }, []);

  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);
  useEffect(() => {
    abort.current = new AbortController();
    const load = () => { try { const next = readQuantumRecord(); setRecord(next); if (!next && initialSetup && surface !== 'popup') setSetup(initialSetup); setStorageError(''); } catch (reason) { setStorageError(quantumErrorMessage(reason)); setRecord(null); } setLoaded(true); };
    load();
    const sync = (event: StorageEvent) => { if (event.key === QUANTUM_STORAGE_KEY || event.key === null) { lock(); load(); } };
    const hidePanel = () => { if (surface === 'panel' && document.visibilityState === 'hidden') lock(); };
    document.addEventListener('visibilitychange', hidePanel);
    window.addEventListener('storage', sync); window.addEventListener('pagehide', lock); window.addEventListener('qozmo:lock-all', lock);
    return () => { epoch.current += 1; abort.current.abort(); document.removeEventListener('visibilitychange', hidePanel); window.removeEventListener('storage', sync); window.removeEventListener('pagehide', lock); window.removeEventListener('qozmo:lock-all', lock); };
  }, [lock, initialSetup, surface]);

  useEffect(() => {
    if (!session) return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => { clearTimeout(timer); timer = setTimeout(() => { lock(); setNotice(unified ? 'Your Qozmo wallet locked after five minutes of inactivity.' : 'Your quantum wallet locked after five minutes of inactivity.'); }, 300_000); };
    reset(); window.addEventListener('pointerdown', reset); window.addEventListener('keydown', reset);
    return () => { clearTimeout(timer); window.removeEventListener('pointerdown', reset); window.removeEventListener('keydown', reset); };
  }, [session, lock]);

  const refresh = useCallback(async (currentSession: QuantumSession) => {
    const request = epoch.current;
    const next = await readQuantumStatus(currentSession);
    if (request !== epoch.current) return;
    setStatus(next);
    const targets = next.entries.filter(entry => entry.transactionHash).slice(-20);
    const checked = await Promise.allSettled(targets.map(async entry => ({ hash: entry.userOpHash, result: await inspectQuantumEntry(currentSession, entry) })));
    if (request === epoch.current) {
      // Clear old success observations when a fresh check fails or a hash changes.
      const validHashes = new Set<string>(next.entries.map(entry => entry.userOpHash));
      setReceipts(previous => {
        const observations = Object.fromEntries(Object.entries(previous).filter(([hash]) => validHashes.has(hash)));
        for (const entry of targets) delete observations[entry.userOpHash];
        for (const result of checked) if (result.status === 'fulfilled' && result.value.result) observations[result.value.hash] = result.value.result;
        return observations;
      });
      setReceiptErrors(Object.fromEntries(checked.flatMap((result, index) => result.status === 'rejected' ? [[targets[index].userOpHash, 'Receipt check unavailable. Retry to verify execution and fees.']] : [])));
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    let current = true;
    void refresh(session).catch(reason => { if (current) setError(quantumErrorMessage(reason)); });
    return () => { current = false; };
  }, [session, refresh]);

  useEffect(() => {
    if (!session || !status?.pending || busy) return;
    const request = epoch.current;
    const timer = setTimeout(() => { void refresh(session).catch(reason => { if (request === epoch.current) setError(quantumErrorMessage(reason)); }); }, 20_000);
    return () => clearTimeout(timer);
  }, [session, status, busy, refresh]);

  async function copyAddress() {
    if (!record) return;
    try { await navigator.clipboard.writeText(record.address); setCopied(true); if (copyTimer.current) clearTimeout(copyTimer.current); copyTimer.current = setTimeout(() => setCopied(false), 2200); }
    catch { setError('Clipboard unavailable. Select and copy the address.'); }
  }
  function closeCreated() { setCreated(false); requestAnimationFrame(() => accountTitle.current?.focus({ preventScroll: true })); }
  async function run(work: () => Promise<void>) {
    const request = epoch.current; setBusy(true); setError(''); setNotice('');
    try { await work(); } catch (reason) { if (request === epoch.current) setError(quantumErrorMessage(reason)); }
    finally { if (request === epoch.current) setBusy(false); }
  }
  async function checkEntry(entry: import('@/lib/wallet/quantum-sdk/journal').JournalEntry) {
    if (!session || busy) return;
    const request = epoch.current;
    await run(async () => {
      try {
        const result = await inspectQuantumEntry(session, entry);
        if (request !== epoch.current) return;
        setReceipts(previous => { const next = { ...previous }; delete next[entry.userOpHash]; if (result) next[entry.userOpHash] = result; return next; });
        setReceiptErrors(previous => { const next = { ...previous }; delete next[entry.userOpHash]; return next; });
      } catch {
        if (request === epoch.current) {
          setReceipts(previous => { const next = { ...previous }; delete next[entry.userOpHash]; return next; });
          setReceiptErrors(previous => ({ ...previous, [entry.userOpHash]: 'Receipt check unavailable. Retry to verify execution and fees.' }));
        }
      }
    });
  }
  async function unlock(event: FormEvent) {
    event.preventDefault(); if (!record) return;
    const request = epoch.current;
    await run(async () => { const next = await unlockQuantumSession(record, password); if (request === epoch.current) { setPassword(''); setSession(next); } });
  }
  function disconnect() {
    epoch.current++; setWorkGeneration(value => value + 1); abort.current.abort(); abort.current = new AbortController();
    setRelay(null); setReview(null); setAction(null); setActionPassword(''); setBundlerUrl(''); setBusy(false);
    setConnection({ status: 'idle', method: connectionMethod, message: 'Disconnected. Choose a connection to continue.' });
  }
  useEffect(() => {
    const provider = (window as unknown as { ethereum?: { on?: (event: string, listener: () => void) => void; removeListener?: (event: string, listener: () => void) => void } }).ethereum;
    const invalidate = () => { disconnect(); setNotice('The gas payer or browser network changed. Reconnect before reviewing another operation.'); };
    const offline = () => { disconnect(); setNotice('You are offline. Reconnect when your connection returns.'); };
    if (relay?.payer && provider?.on && provider.removeListener) { provider.on('chainChanged', invalidate); provider.on('accountsChanged', invalidate); }
    window.addEventListener('offline', offline);
    return () => { if (relay?.payer && provider?.removeListener) { provider.removeListener('chainChanged', invalidate); provider.removeListener('accountsChanged', invalidate); } window.removeEventListener('offline', offline); };
  }, [relay, connectionMethod]);
  async function connect(type: 'browser' | 'bundler' | 'managed') {
    if (!session || record?.restored || busy) return;
    const request = epoch.current;
    setConnectionMethod(type); setRelay(null); setReview(null);
    setConnection({ status: 'checking', method: type, message: 'Checking Robinhood Testnet, account contracts and transaction connection…' });
    await run(async () => {
      try {
        const next = type === 'browser' ? await connectQuantumBrowserRelay() : type === 'managed' ? await connectQuantumManagedBundler(abort.current.signal) : await connectQuantumBundler(bundlerUrl);
        if (request === epoch.current) {
          setRelay(next); setBundlerUrl('');
          setConnection({ status: 'connected', method: type, message: 'Robinhood Testnet and account contracts verified. Connection ready for transaction review.', checkedAt: new Date().toISOString() });
          setNotice('Your transaction connection is shared by Wallet and Privacy Ring.');
          try { await refresh(session); }
          catch (reason) { if (request === epoch.current) setError(quantumErrorMessage(reason)); }
        }
      } catch (reason) {
        if (request === epoch.current) setConnection(reason instanceof ConnectionCheckError ? reason.state : { status: 'unavailable', method: type, message: quantumErrorMessage(reason), checkedAt: new Date().toISOString() });
        throw reason;
      }
    });
  }
  async function prepare(event: FormEvent) {
    event.preventDefault(); if (!session || !relay) return;
    const request = epoch.current;
    await run(async () => { const next = await prepareQuantumTransfer(session, relay, { recipient, amount, tokenAddress: asset === 'token' ? tokenAddress : undefined }, abort.current.signal); if (request === epoch.current) { setReview(next); setActionPassword(''); } });
  }
  async function confirm(event: FormEvent) {
    event.preventDefault(); if (!session || !review) return;
    const request = epoch.current;
    await run(async () => {
      try {
        const result = await confirmQuantumTransfer(session, review, actionPassword, abort.current.signal, value => { if (request === epoch.current) setNotice(value); });
        if (request === epoch.current) { setReview(null); setAmount(''); setNotice(result.success ? 'Quantum transfer execution verified onchain.' : 'The operation consumed its key, but transfer execution reverted. Check Activity.'); }
      } finally {
        if (request === epoch.current) { setActionPassword(''); setReview(null); await refresh(session); }
      }
    });
  }
  async function protectedAction(event: FormEvent) {
    event.preventDefault(); if (!session || !record) return;
    const request = epoch.current;
    await run(async () => {
      try {
        if (action === 'backup') {
          const backup = await exportQuantumBackup(record, actionPassword);
          if (request === epoch.current) { downloadJSON(backup, `qozmo-quantum-${record.address.slice(2,8)}-${Date.now()}.json`); setNotice('Encrypted quantum archive exported with the signing history known to this browser. Keep its password separately.'); }
        } else if (action === 'retry' && relay) {
          const result = await retryQuantumPending(session, relay, actionPassword, abort.current.signal, value => { if (request === epoch.current) setNotice(value); });
          if (request === epoch.current) setNotice(result.success ? 'The pending operation executed successfully.' : 'Execution reverted; the one-time key was consumed.');
        }
      } finally { if (request === epoch.current) { setAction(null); setActionPassword(''); await refresh(session); } }
    });
  }

  const dialogs = <>
    {setup && <QuantumSetup unified={unified} mode={setup} onClose={() => setSetup(null)} onReady={(next, unlocked) => { setRecord(next); setSession(unlocked); setSetup(null); setCreated(true); setError(''); setNotice(''); }}/>}
    {created && record && <QuantumCreated unified={unified} record={record} onClose={closeCreated} onReceive={() => {setCreated(false);setReceive(true);}}/>}
    {receive && record && <Modal title={unified ? "Receive into your Qozmo wallet." : "Receive into Qozmo Quantum."} eyebrow="ROBINHOOD TESTNET · 46630" className="qd-quantum-receive-modal" onClose={() => setReceive(false)}><div className="qd-qwallet-receive-modal-content"><div className="qd-qwallet-modal-qr"><QRCodeSVG value={record.address} size={184} marginSize={2}/><span><i/>Robinhood Testnet</span></div><p>{unified ? 'This is your Qozmo wallet address across the website.' : 'This is your separate quantum account address.'}<br/>Receive test ETH here to cover deployment and fees.</p><code className="qd-qwallet-address">{record.address}</code><button className="qd-button qd-primary qd-full" onClick={() => void copyAddress()}><DIcon icon={copied ? faCheck : faCopy} size={13}/>{copied ? 'Address copied' : unified ? 'Copy wallet address' : 'Copy quantum address'}</button><span className="qd-copy-feedback" role="status">{copied ? 'Address copied to clipboard' : ''}</span><a className="qd-text-button" href={networkExplorerAddress(QUANTUM_NETWORK,record.address)} target="_blank" rel="noopener noreferrer">View account on explorer<DIcon icon={faArrowUpRightFromSquare} size={10}/></a></div></Modal>}
    {review && <Modal title={unified ? "Review wallet transfer" : "Review quantum transfer"} eyebrow="QOZMO QUANTUM · TESTNET" onClose={() => { setReview(null); setActionPassword(''); }} busy={busy}><form className="qd-form" onSubmit={confirm}>{error && <Message tone="error">{error}</Message>}<dl className="qd-review"><div><dt>From</dt><dd>{review.address}</dd></div><div><dt>Recipient</dt><dd>{review.recipient}</dd></div><div><dt>Amount</dt><dd>{review.amount} {review.token?.symbol ?? 'ETH'}</dd></div>{review.token && <div><dt>Token contract</dt><dd>{review.token.address}</dd></div>}<div><dt>Network</dt><dd>Robinhood Testnet · 46630</dd></div><div><dt>Maximum account fee</dt><dd>{formatEther(review.fees.max)} ETH</dd></div><div><dt>Deployment</dt><dd>{review.operation.factory ? 'Included in this first operation' : 'Already deployed'}</dd></div><div><dt>Relay</dt><dd>{review.relay.label}</dd></div></dl><p className="qd-fine-print">Execution check: {review.impact?.message ?? 'Unavailable'}{review.impact?.blockNumber != null ? ` Block ${review.impact.blockNumber}.` : ''}</p><TransferImpact balance={review.impact?.assetBalance ?? review.token?.balance} amount={review.value} maxFee={review.fees.max} symbol={review.token?.symbol ?? 'ETH'} decimals={review.token?.decimals ?? 18} token={!!review.token} self={review.recipient === review.address} checkedAt={review.createdAt}/><p className="qd-fine-print">This review expires after two minutes. The exact reviewed operation will be signed and recorded before submission. {review.relay.payer && 'Your browser gas payer confirms its outer transaction fee separately.'}</p><label>{unified ? 'Confirm wallet password' : 'Confirm quantum password'}<input type="password" value={actionPassword} onChange={event => setActionPassword(event.target.value)} autoComplete="off" required/></label><button className="qd-button qd-primary" disabled={busy}>{busy ? 'Processing quantum transfer…' : 'Sign and submit testnet transfer'}</button></form></Modal>}
    {action && <Modal title={action === 'backup' ? unified ? 'Export encrypted account archive' : 'Export encrypted quantum archive' : 'Retry the stored operation'} eyebrow="QOZMO QUANTUM" onClose={() => { setAction(null); setActionPassword(''); }} busy={busy}><form className="qd-form" onSubmit={protectedAction}>{error && <Message tone="error">{error}</Message>}<p className="qd-fine-print">{action === 'backup' ? unified ? 'The archive includes the account seed and known signing history, encrypted with your wallet password. Back up privacy notes separately. Importing remains read-only.' : 'The archive includes the recovery seed and known signing history, encrypted with your quantum password. Importing it remains read-only.' : 'Only the exact previously signed operation is submitted again. No new one-time signature is created. Check its current onchain status first.'}</p>{action === 'retry' && status?.pending && <code className="qd-qwallet-address">{status.pending.userOpHash}</code>}<label>{unified ? 'Wallet password' : 'Quantum password'}<input type="password" value={actionPassword} onChange={event => setActionPassword(event.target.value)} autoComplete="off" required/></label><button className="qd-button qd-primary" disabled={busy}>{busy ? 'Working…' : action === 'backup' ? 'Download encrypted archive' : 'Submit exact stored bytes'}</button></form></Modal>}
  </>;

  return { record, setRecord, session, setSession, loaded, storageError, setup, setSetup, created, setCreated, receive, setReceive, copied, accountTitle, connectionMethod, setConnectionMethod, password, setPassword, busy, error, setError, notice, setNotice, status, relay, bundlerUrl, setBundlerUrl, recipient, setRecipient, amount, setAmount, asset, setAsset, tokenAddress, setTokenAddress, token, setToken, review, setReview, action, setAction, actionPassword, setActionPassword, receipts, receiptErrors, connection, disconnect, workGeneration, epoch, abort, lock, refresh, checkEntry, copyAddress, run, unlock, connect, prepare, dialogs, unified };
}

export type QozmoWalletController = ReturnType<typeof useQozmoWalletController>;

export function QuantumWalletView({ controller, layout = 'dashboard', surface = 'tab', initialView, networkSelect, includeDialogs = true }: QozmoWalletOptions & { controller: QozmoWalletController; includeDialogs?: boolean }) {
  const { record, setRecord, session, setSession, loaded, storageError, setup, setSetup, created, setCreated, receive, setReceive, copied, accountTitle, connectionMethod, setConnectionMethod, password, setPassword, busy, error, setError, notice, setNotice, status, relay, bundlerUrl, setBundlerUrl, recipient, setRecipient, amount, setAmount, asset, setAsset, tokenAddress, setTokenAddress, token, setToken, review, setReview, action, setAction, actionPassword, setActionPassword, receipts, receiptErrors, connection, disconnect, workGeneration, epoch, abort, lock, refresh, checkEntry, copyAddress, run, unlock, connect, prepare, unified } = controller;
  const sharedAccount = useOptionalQozmoAccount();
  const dialogs = includeDialogs ? controller.dialogs : null;
  if (layout === 'extension') {
    const model: QuantumExtensionModel = {
      record, session, status, loaded, busy, storageError, error, notice, copied,
      password, setPassword, unlock, lock, copyAddress, setSetup, accountTitle,
      refresh: () => { if (session) void run(() => refresh(session)); },
      asset, setAsset, recipient, setRecipient, amount, setAmount, tokenAddress,
      setTokenAddress: value => { setTokenAddress(value); setToken(null); }, token,
      checkToken: () => { if (!session) return; const request = epoch.current; void run(async () => { const next = await readQuantumToken(session, tokenAddress); if (request === epoch.current) setToken(next); }); },
      relay, bundlerUrl, setBundlerUrl, connectBundler: () => { void connect('bundler'); }, prepare, receipts,
      backup: () => { setAction('backup'); setActionPassword(''); setError(''); },
      retry: () => { setAction('retry'); setActionPassword(''); setError(''); },
    };
    return <Suspense fallback={<p className="qe-fallback">Opening Qozmo Quantum…</p>}><QuantumExtension model={model} surface={surface} initialView={initialView} dialogs={dialogs} networkSelect={networkSelect}/></Suspense>;
  }

  return <div className="qd-qwallet">
    <QuantumIntro unified={unified}/>
    <div className="qd-qwallet-testnet-note"><span><DIcon icon={faShieldHalved} size={17}/></span><p><strong>A space for test assets only.</strong> {unified ? 'Your Qozmo smart account uses WOTS authorization for public and privacy operations on Robinhood Testnet. It has not been audited.' : 'Qozmo Quantum is an unaudited testnet wallet. Your everyday EVM account continues to use ECDSA.'}</p></div>
    {storageError && <Message tone="error">{storageError}</Message>}
    {error && <Message tone="error">{error}</Message>}
    {notice && <Message>{notice}</Message>}
    {!record ? <section className="qd-panel qd-qwallet-onboarding qd-qwallet-welcome">
      <div className="qd-qwallet-welcome-copy"><span className="qd-qwallet-welcome-icon"><DIcon icon={faShieldHalved} size={23}/></span><span className="qd-eyebrow">START SOMETHING NEW</span><h2>{unified ? <>One wallet.<br/>Every feature.</> : <>A quantum wallet<br/>of your own.</>}</h2><p>{unified ? 'Create your Qozmo account once, then use it for public transfers, Quantum security and Privacy Ring. Existing Qozmo smart accounts open here automatically.' : 'Create a fresh account on this device with its own recovery phrase. You can also import an existing quantum account for read-only access.'}</p><div className="qd-qwallet-actions"><button className="qd-button qd-primary" disabled={!loaded || !!storageError} onClick={() => setSetup('create')}>{unified ? 'Create wallet' : 'Create quantum wallet'}<DIcon icon={faArrowRight} size={12}/></button><button className="qd-button qd-secondary" disabled={!loaded || !!storageError} onClick={() => setSetup('import')}>Import account</button></div><span className="qd-qwallet-local-note"><DIcon icon={faLock} size={11}/>{unified ? 'Encrypted on your device. One shared account.' : 'Encrypted on your device. A separate account.'}</span></div>
      <QuantumFirstSteps/>
    </section>
    : <>
      <div className="qd-quantum-grid qd-qwallet-overview"><section className="qd-panel qd-qwallet-account"><div className="qd-panel-heading"><div className="qd-qwallet-identity"><span className="qd-qwallet-avatar"><DIcon icon={faShieldHalved} size={20}/></span><div><h2 ref={accountTitle} tabIndex={-1} title={record.name}>{record.name}</h2><p>{record.restored ? 'Imported · read-only' : 'Original signing device'}</p></div></div><div className="qd-qwallet-lock-state"><span className={`qd-qwallet-state${session ? ' is-unlocked' : ''}`}><i/>{session ? 'Unlocked' : 'Locked'}</span>{session && <button className="qd-icon-button" aria-label="Lock quantum wallet" onClick={lock}><DIcon icon={faLock} size={14}/></button>}</div></div>
        <div className="qd-qwallet-account-body"><div className="qd-qwallet-balance-row"><div><span className="qd-field-caption">{unified ? 'PUBLIC WALLET BALANCE' : 'QUANTUM BALANCE'}</span><strong className="qd-qwallet-balance">{status ? formatToken(status.balance) : '—'} <small>ETH</small></strong></div><span className="qd-qwallet-network-pill"><i/>Robinhood Testnet</span></div>
          <div className="qd-qwallet-address-row"><code className="qd-qwallet-address">{record.address}</code><button className={`qd-icon-button${copied ? ' is-copied' : ''}`} aria-label={copied ? 'Quantum address copied' : 'Copy quantum address'} onClick={() => void copyAddress()}><DIcon icon={copied ? faCheck : faCopy} size={14}/></button></div><span className="qd-copy-feedback" role="status">{copied ? 'Address copied to clipboard' : ''}</span>
          {!session ? <form className="qd-form qd-qwallet-unlock" onSubmit={unlock}><label>{unified ? 'Wallet password' : 'Quantum wallet password'}<input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="off" required placeholder="Unlock your encrypted account"/></label><button className="qd-button qd-primary" disabled={busy}><DIcon icon={faLock} size={12}/>{busy ? 'Unlocking…' : unified ? 'Unlock wallet' : 'Unlock quantum wallet'}</button></form>
            : <><dl className="qd-qwallet-stats"><div><dt>Deployment</dt><dd>{status ? status.state.deployed ? 'Deployed' : 'First transfer' : 'Checking…'}</dd></div><div><dt>Next one-time key</dt><dd>{status ? `#${status.state.keyIndex}` : '—'}</dd></div><div><dt>Recovery key</dt><dd>{status ? `#${status.state.recoveryIndex}` : '—'}</dd></div><div><dt>Known key records</dt><dd>{status?.entries.length ?? '—'}</dd></div></dl></>}
          <div className="qd-qwallet-account-footer"><a className="qd-text-button" href={networkExplorerAddress(QUANTUM_NETWORK, record.address)} target="_blank" rel="noopener noreferrer">Open explorer <DIcon icon={faArrowUpRightFromSquare} size={10}/></a>{session && <div className="qd-qwallet-actions"><button className="qd-icon-button" aria-label="Refresh quantum account" disabled={busy} onClick={() => void run(() => refresh(session))}><DIcon icon={faRotate} size={13}/></button><button className="qd-button qd-secondary qd-small" disabled={busy} onClick={() => { if (unified && sharedAccount) sharedAccount.openBackup(); else { setAction('backup'); setActionPassword(''); setError(''); } }}><DIcon icon={faDownload} size={12}/>{unified ? 'Backup Center' : 'Export archive'}</button></div>}</div>
        </div></section>
        <section className="qd-panel qd-qwallet-receive-card"><div className="qd-panel-heading"><div><span className="qd-qwallet-panel-icon"><DIcon icon={faArrowDown} size={16}/></span><h2>A little ETH. A fresh start.</h2><p>{unified ? 'Receive into the same Qozmo wallet.' : 'Receive into your quantum account.'}</p></div><span className="qd-small-tag">TESTNET</span></div><div className="qd-qwallet-receive-preview"><button className="qd-qwallet-qr-button" onClick={() => setReceive(true)} aria-label="Open quantum receive address and QR code"><QRCodeSVG value={record.address} size={108} marginSize={2}/><span>Show receive QR<DIcon icon={faArrowRight} size={10}/></span></button><div><strong>Ready to receive.</strong><p>Use this address on Robinhood Testnet. Your first transfer also deploys the smart account.</p><button className="qd-text-button" onClick={() => setReceive(true)}>View address<DIcon icon={faArrowRight} size={11}/></button></div></div><a className="qd-qwallet-faucet" href="https://faucet.testnet.chain.robinhood.com" target="_blank" rel="noopener noreferrer"><span><DIcon icon={faWallet} size={15}/><span>Need test ETH?<small>Visit the Robinhood Testnet faucet</small></span></span><DIcon icon={faArrowUpRightFromSquare} size={12}/></a><p className="qd-qwallet-receive-caption"><DIcon icon={faShieldHalved} size={11}/>{unified ? 'The same address for Wallet, Quantum and Privacy Ring.' : 'Separate from your everyday EVM account.'}</p></section></div>
      {record.restored && <Message>This imported account is read-only, including after reload. Keep the original signing device and its journal. Restoring an archive does not activate lost-device spending recovery.</Message>}
      {session && <>
        <AccountConnection controller={controller}/>
        {status?.pending && <section className="qd-panel qd-qwallet-pending"><h2>A signed operation needs attention.</h2><p>Key #{status.pending.keyIndex} already signed an operation. Refresh its state or retry the exact stored bytes. Qozmo will not sign a second message with that key.</p><code>{status.pending.userOpHash}</code><details><summary>View the signed operation</summary><pre>{JSON.stringify(status.pending.userOperation,null,2)}</pre></details><div className="qd-qwallet-actions"><button className="qd-button qd-secondary" disabled={busy} onClick={() => void run(() => refresh(session))}>Refresh status</button><button className="qd-button qd-primary" disabled={busy || !relay || record.restored} onClick={() => { setAction('retry'); setActionPassword(''); setError(''); }}>Review exact retry</button></div></section>}
        <div className="qd-qwallet-transfer-grid"><section className="qd-panel qd-qwallet-send-panel"><div className="qd-panel-heading"><div><h2>{unified ? 'Send from your Qozmo wallet' : 'Send from Qozmo Quantum'}</h2><p>ETH or an ERC-20 token · Review first, then confirm with your password.</p></div></div><form className="qd-form qd-qwallet-send" onSubmit={prepare}><fieldset disabled={busy || record.restored || !!status?.pending || !status || status.recoveryExposed}>
          <div className="qd-segment" role="group" aria-label="Quantum transfer asset"><button type="button" aria-pressed={asset === 'eth'} className={asset === 'eth' ? 'is-active' : ''} onClick={() => setAsset('eth')}>Test ETH</button><button type="button" aria-pressed={asset === 'token'} className={asset === 'token' ? 'is-active' : ''} onClick={() => setAsset('token')}>ERC-20 token</button></div>
          {asset === 'token' && <><label>Testnet token contract<input value={tokenAddress} onChange={event => { setTokenAddress(event.target.value); setToken(null); }} placeholder="0x…" autoComplete="off" required/></label><button className="qd-text-button" type="button" onClick={() => { const request = epoch.current; void run(async () => { const next = await readQuantumToken(session, tokenAddress); if (request === epoch.current) setToken(next); }); }}>Check token and balance</button>{token && <p className="qd-fine-print">Unverified token · {token.symbol} · {token.decimals} decimals · Balance {formatUnits(token.balance,token.decimals)}. Contract: {token.address}</p>}</>}
          <div className="qd-qwallet-send-fields"><label>Recipient<input value={recipient} onChange={event => setRecipient(event.target.value)} placeholder="0x…" autoComplete="off" required/></label><label>Amount<input value={amount} onChange={event => setAmount(event.target.value)} inputMode="decimal" placeholder="0.00" required/></label></div><button className="qd-button qd-primary" disabled={!relay}>{busy ? 'Checking transfer…' : unified ? 'Review wallet transfer' : 'Review quantum transfer'}</button>
        </fieldset>{!relay && <p className="qd-fine-print">Connect a transaction relay above before reviewing a transfer.</p>}</form></section>
        <section className="qd-panel qd-qwallet-activity"><div className="qd-panel-heading"><div><h2>Quantum activity</h2><p>Known local signing history. Execution is verified separately from key rotation.</p></div></div>{!status?.entries.length ? <div className="qd-qwallet-empty-activity"><span><DIcon icon={faClockRotateLeft} size={24}/></span><h3>Your story starts here.</h3><p>Signed operations and their verified execution status will appear here.</p><small>No operations signed by this browser.</small></div> : <div className="qd-table-scroll"><table><thead><tr><th>One-time key</th><th>Signed at</th><th>Execution</th><th>Transaction</th></tr></thead><tbody>{status.entries.slice().reverse().map(entry => <tr key={entry.keyIndex}><td>#{entry.keyIndex}</td><td>{new Date(entry.createdAt).toLocaleString()}</td><td>{receipts[entry.userOpHash]?.status === 'succeeded' ? 'Execution succeeded' : receipts[entry.userOpHash]?.status === 'execution-reverted' ? 'Execution reverted' : entry.status === 'signed' ? 'Pending / check explorer' : 'Key consumed / verify execution'}</td><td>{entry.transactionHash ? <a className="qd-text-button" href={networkExplorerTx(QUANTUM_NETWORK,entry.transactionHash)} target="_blank" rel="noopener noreferrer">{shortAddress(entry.transactionHash)} <DIcon icon={faArrowUpRightFromSquare} size={9}/></a> : 'Awaiting receipt'}</td></tr>)}</tbody></table></div>}</section></div>
      </>}
    </>}
    <section className="qd-panel qd-qwallet-notes"><div className="qd-qwallet-notes-heading"><div><span className="qd-eyebrow">BUILT AROUND YOUR CONTROL</span><h2>A clear view of your protection.</h2></div><a className="qd-text-button" href={appHref('/docs/quantum/overview/')}>Read the guide <DIcon icon={faArrowUpRightFromSquare} size={11}/></a></div><div className="qd-qwallet-protection-grid"><div><DIcon icon={faShieldHalved} size={18}/><h3>One operation. One key.</h3><p>A fresh WOTS key authorizes each operation. Signed bytes are saved before submission, and the key is retired even if execution reverts.</p></div><div><DIcon icon={faDownload} size={18}/><h3>Keep your history safe.</h3><p>Keep your original signing device and browser data. Export a new encrypted archive after signing. Imported accounts remain read-only.</p></div><div><DIcon icon={faLock} size={18}/><h3>Know the boundaries.</h3><p>Quantum authorization does not make the network, relay, browser or device quantum-safe. This testnet wallet has not been independently audited.</p></div></div></section>
    {dialogs}
  </div>;
}

function StandaloneQuantumWallet(props: QozmoWalletOptions) {
  const controller = useQozmoWalletController(props);
  return <QuantumWalletView {...props} controller={controller}/>;
}
export default function QuantumWallet(props: QozmoWalletOptions = {}) {
  const shared = useOptionalQozmoAccount();
  return shared && props.layout !== 'extension'
    ? <QuantumWalletView {...props} controller={shared} includeDialogs={false}/>
    : <StandaloneQuantumWallet {...props}/>;
}
