'use client';

import { useEffect, useRef, useState, type FormEvent, type ReactNode, type RefObject } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { faArrowDown, faArrowLeft, faArrowRight, faArrowUp, faArrowUpRightFromSquare, faCheck, faDroplet, faKey, faClockRotateLeft, faCopy, faDownload, faEye, faEyeSlash, faGear, faLock, faRotate, faShieldHalved, faWallet, faSliders } from '@fortawesome/free-solid-svg-icons';
import { QozmoMark } from './brand';
import { formatUnits, type Address } from 'viem';
import { ExtensionAssetList, ExtensionAssetManager, ExtensionTokenIcon, useExtensionAssets } from './extension-assets';
import { Modal } from './dashboard/ui';
import { DIcon, formatToken, shortAddress } from './dashboard/ui';
import { QUANTUM_NETWORK, type QuantumRelay, type QuantumSession, type QuantumStatus, type QuantumToken } from '@/lib/wallet/quantum/client';
import type { QuantumRecord } from '@/lib/wallet/quantum/storage';
import type { OperationReceiptInspection } from '@/lib/wallet/quantum-sdk/operation-receipt';
import { networkExplorerAddress, networkExplorerTx } from '@/lib/wallet/networks';
import { QOZMO_WEBSITE } from '@/lib/app-runtime';
import '../app/quantum-extension.css';

export type QuantumExtensionSurface = 'popup' | 'panel' | 'tab';
export type QuantumExtensionView = 'home' | 'receive' | 'send' | 'activity' | 'keys' | 'settings' | 'manage';
export type QuantumExtensionModel = {
  record: QuantumRecord | null; session: QuantumSession | null; status: QuantumStatus | null;
  loaded: boolean; busy: boolean; storageError: string; error: string; notice: string; copied: boolean;
  password: string; setPassword(value: string): void; unlock(event: FormEvent): Promise<void>;
  lock(): void; copyAddress(): Promise<void>; refresh(): void;
  setSetup(mode: 'create' | 'import'): void;
  accountTitle: RefObject<HTMLHeadingElement | null>;
  asset: 'eth' | 'token'; setAsset(value: 'eth' | 'token'): void;
  recipient: string; setRecipient(value: string): void; amount: string; setAmount(value: string): void;
  tokenAddress: string; setTokenAddress(value: string): void; token: QuantumToken | null; checkToken(): void;
  relay: QuantumRelay | null; bundlerUrl: string; setBundlerUrl(value: string): void;
  connectBundler(): void; prepare(event: FormEvent): Promise<void>;
  receipts: Record<string, OperationReceiptInspection>; backup(): void; retry(): void;
};

const tabs = [
  { id: 'home', label: 'Assets', icon: faWallet },
  { id: 'activity', label: 'Activity', icon: faClockRotateLeft },
  { id: 'keys', label: 'Keys', icon: faKey },
] as const;
const viewNames: Record<QuantumExtensionView, string> = { home: 'Your Quantum wallet', receive: 'Receive test ETH', send: 'Send test assets', activity: 'Quantum activity', keys: 'Quantum signing keys', settings: 'Your wallet settings', manage: 'Manage wallet assets' };

/** Local artwork only; never load remote imagery alongside account information. */
function AlpineScene() {
  return <div className="qx-alpine-scene" aria-hidden="true"><img src="/assets/qozmo-alpine-stag.webp" alt="" width={1280} height={683} draggable={false}/></div>;
}

/** Presentation only: signing, backups, journal handling and reviews use the shared Quantum controller. */
export default function QuantumExtension({ model: m, surface, initialView = 'home', dialogs, networkSelect }: {
  model: QuantumExtensionModel; surface: QuantumExtensionSurface; initialView?: QuantumExtensionView; dialogs: ReactNode;
  networkSelect?: (disabled: boolean) => ReactNode;
}) {
  const [view, setView] = useState<QuantumExtensionView>(initialView);
  const [hidden, setHidden] = useState(false);
  const assets = useExtensionAssets(m.record,m.session,m.status);
  const [selectedAsset,setSelectedAsset] = useState<'native'|Address|null>(null);
  useEffect(()=>{setSelectedAsset(null);},[m.session,m.record?.id]);
  const content = useRef<HTMLElement>(null);
  const signingBlocked = m.record?.restored || m.session?.wallet.signingBlocked;
  const canSend = !!m.session && !!m.status && !signingBlocked && !m.status.pending && !m.status.recoveryExposed && !m.busy;
  const fullPage = `quantum.html?view=${view}`;
  const overview = view === 'home' || view === 'activity' || view === 'keys';

  useEffect(() => {
    // Password focus can scroll the content before unlock. Reset after the new view commits.
    content.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [view, !!m.session, m.record?.id]);

  function navigate(next: QuantumExtensionView) {
    setView(next);
    setSelectedAsset(null);
  }

  function setupAction(mode: 'create' | 'import', label: string) {
    const className = `qx-button ${mode === 'create' ? 'qx-primary' : 'qx-secondary'}`;
    if (!m.loaded || m.storageError) return <button className={className} disabled>{label}</button>;
    return surface === 'popup'
      ? <a className={className} href={`quantum.html?setup=${mode}`} target="_blank" rel="noopener">{label}<DIcon icon={faArrowUpRightFromSquare} size={11}/></a>
      : <button className={className} onClick={() => m.setSetup(mode)}>{label}</button>;
  }

  function unlockPanel() {
    return <form className="qx-unlock qx-form" onSubmit={event => void m.unlock(event)}>
      <div className="qx-unlock-heading"><span><DIcon icon={faLock} size={13}/></span><div><h2>Unlock your wallet</h2><p>Access this device’s Quantum session.</p></div></div>
      <label className="qx-sr-only" htmlFor="qx-password">Quantum wallet password</label>
      <input id="qx-password" type="password" value={m.password} onChange={event => m.setPassword(event.target.value)} autoComplete="off" placeholder="Quantum wallet password" required disabled={m.busy}/>
      <button className="qx-button qx-primary" disabled={m.busy}>{m.busy ? 'Unlocking…' : 'Unlock Quantum Wallet'}<DIcon icon={faLock} size={11}/></button>
    </form>;
  }

  function welcome() {
    return <section className="qx-welcome">
      <div className="qx-welcome-art"><AlpineScene/><span>QOZMO QUANTUM</span></div>
      <span className="qx-eyebrow">HASH-BASED ACCOUNT · TESTNET</span>
      <h1>Your assets.<br/><em>Your control.</em></h1>
      <p>Meet Qozmo Quantum. A separate smart account, with one-time signing keys.</p>
      <div className="qx-welcome-actions">{setupAction('create', 'Create a wallet')}{setupAction('import', 'I already have an account')}</div>
      <div className="qx-welcome-note"><DIcon icon={faLock} size={11}/><span>{surface === 'popup' ? 'Setup opens in a full tab so you can save your recovery phrase.' : surface === 'panel' ? 'Setup stays in this panel. Keep your recovery phrase somewhere private.' : 'Encrypted locally. Keep your recovery phrase and signing history safe.'}</span></div>
    </section>;
  }

  function home() {
    if (!m.record) return welcome();
    if (!m.session) return <><section className="qx-locked-hero"><AlpineScene/><span><DIcon icon={faLock} size={18}/></span><h1>Welcome back.</h1><p>Your Quantum wallet is locked.</p></section>{unlockPanel()}{m.record.restored && <p className="qx-fine-print">Imported account · read-only after unlock.</p>}</>;
    return <>
      <section className="qx-balance-card" aria-label="Quantum account balance">
        <AlpineScene/>
        <div className="qx-balance-caption"><span>Available balance</span><div><button className="qx-icon-button" aria-label={hidden ? 'Show balance' : 'Hide balance'} onClick={() => setHidden(value => !value)}><DIcon icon={hidden ? faEyeSlash : faEye} size={12}/></button><button className="qx-icon-button" disabled={m.busy||assets.refreshing} onClick={()=>{m.refresh();assets.refresh();}} aria-label="Refresh balance"><DIcon icon={faRotate} size={12}/></button></div></div>
        <div className="qx-balance" aria-label={hidden ? 'Balance hidden' : undefined}>{hidden ? '••••••' : m.status ? formatToken(m.status.balance) : '—'}<small>ETH</small></div>
        <p className="qx-balance-note">{m.status ? 'Test assets only · No monetary value' : 'Checking account and network…'}</p>
        <div className="qx-balance-footer"><button disabled={m.busy} onClick={() => navigate('keys')}><i/>WOTS · Key {m.status ? `#${m.status.state.keyIndex}` : '—'}</button><span>{m.status ? m.status.state.deployed ? 'Account deployed' : 'Deploys on first send' : 'Reading account…'}</span></div>
      </section>
      <div className="qx-quick-actions" aria-label="Wallet actions"><button className="qx-action-primary" disabled={!!signingBlocked || m.busy} onClick={() => navigate('send')}><span><DIcon icon={faArrowUp} size={16}/></span>Send</button><button disabled={m.busy} onClick={() => navigate('receive')}><span><DIcon icon={faArrowDown} size={16}/></span>Receive</button><button disabled={m.busy} onClick={() => navigate('settings')}><span><DIcon icon={faShieldHalved} size={16}/></span>Security</button><a href="https://faucet.testnet.chain.robinhood.com" target="_blank" rel="noopener noreferrer"><span><DIcon icon={faDroplet} size={15}/></span>Faucet</a></div>

      <>
        {m.status?.pending && <button className="qx-pending" onClick={() => navigate('activity')}><DIcon icon={faClockRotateLeft} size={14}/><span><strong>A signed operation needs attention.</strong><small>Check its status or retry the exact stored bytes.</small></span><DIcon icon={faArrowUpRightFromSquare} size={10}/></button>}
        {m.status?.recoveryExposed && <p className="qx-message qx-error" role="alert">The recovery key was exposed. New signing is blocked; preserve this account and its history.</p>}
        <ExtensionAssetList state={assets} hidden={hidden} nativeBalance={m.status?.balance} onManage={()=>navigate('manage')} onSelect={setSelectedAsset}/>
<div className="qx-connection-status"><span><i className={m.relay ? 'is-connected' : ''}/><span>Transaction service<small>{m.relay ? 'Bundler connected' : 'Not connected'}</small></span></span><button disabled={m.busy} onClick={() => navigate('send')}>{m.relay ? 'View connection' : 'Set up'}<DIcon icon={faArrowRight} size={9}/></button></div>
        <button className="qx-backup-shortcut" disabled={m.busy} onClick={m.backup}><span><DIcon icon={faDownload} size={14}/></span><span>Keep your signing history safe<small>Export an encrypted recovery archive</small></span><DIcon icon={faArrowRight} size={10}/></button>
      </>
      {m.record.restored && <p className="qx-fine-print">Imported account · spending remains disabled. Keep the original signing device.</p>}
    </>;
  }

  function receive() {
    if (!m.record) return welcome();
    return <section className="qx-receive"><span className="qx-eyebrow">YOUR QUANTUM ADDRESS</span><h1>Receive test assets.</h1><div className="qx-qr"><QRCodeSVG value={m.record.address} size={140} marginSize={2}/></div><span className="qx-network-label"><i/>Robinhood Testnet · 46630</span><code className="qx-full-address">{m.record.address}</code><button className="qx-button qx-primary" onClick={() => void m.copyAddress()}><DIcon icon={m.copied ? faCheck : faCopy} size={12}/>{m.copied ? 'Address copied' : 'Copy Quantum address'}</button><p className="qx-fine-print">Robinhood Testnet only. This is a separate address from your everyday EVM wallet.</p><div className="qx-inline-links"><a href="https://faucet.testnet.chain.robinhood.com" target="_blank" rel="noopener noreferrer">Get test ETH ↗</a><a href={networkExplorerAddress(QUANTUM_NETWORK, m.record.address)} target="_blank" rel="noopener noreferrer">Explorer ↗</a></div></section>;
  }

  function send() {
    if (!m.record) return welcome();
    if (m.record.restored) return <div className="qx-empty"><DIcon icon={faLock} size={25}/><h1>This account is read-only.</h1><p>Importing a phrase or archive does not transfer signing authority from the original device.</p></div>;
    if (!m.session) return <><div className="qx-view-heading"><h1>Make your next move.</h1><p>Unlock your account before reviewing a test transfer.</p></div>{unlockPanel()}</>;
    return <>
      <div className="qx-view-heading"><h1>Send test assets</h1><p>Robinhood Testnet. Review every detail before signing.</p></div>
      <details className="qx-relay" open={!m.relay}><summary><span className={m.relay ? 'is-ready' : ''}/>{m.relay ? 'HTTPS bundler connected' : 'Connect a transaction relay'}</summary><form className="qx-form" onSubmit={event => { event.preventDefault(); m.connectBundler(); }}><label>HTTPS bundler endpoint<input type="password" value={m.bundlerUrl} onChange={event => m.setBundlerUrl(event.target.value)} autoComplete="off" placeholder="Robinhood Testnet ERC-4337 endpoint" required disabled={m.busy}/></label><button className="qx-button qx-secondary" disabled={m.busy}>{m.busy ? 'Checking connection…' : 'Connect bundler'}</button><p className="qx-fine-print">The extension asks for access to this server. Connection details stay in this session.</p></form></details>
      {m.status?.pending && <p className="qx-message">Resolve the stored operation in Activity before creating another transfer.</p>}
      <form className="qx-form qx-send-form" onSubmit={event => void m.prepare(event)}><fieldset disabled={!canSend}>
        <div className="qx-segment" role="group" aria-label="Transfer asset"><button type="button" aria-pressed={m.asset === 'eth'} onClick={() => m.setAsset('eth')}>Test ETH</button><button type="button" aria-pressed={m.asset === 'token'} onClick={() => m.setAsset('token')}>ERC-20 token</button></div>
        {m.asset === 'token' && <>{!!assets.preferences?.tokens.length&&<label>Choose a tracked token<select value={assets.preferences.tokens.some(token=>token.address===m.tokenAddress)?m.tokenAddress:''} onChange={event=>m.setTokenAddress(event.target.value)}><option value="">Enter a contract manually</option>{assets.preferences.tokens.map(token=><option value={token.address} key={token.address}>{token.symbol} · {shortAddress(token.address)}</option>)}</select></label>}<label>Testnet token contract<input value={m.tokenAddress} onChange={event => m.setTokenAddress(event.target.value)} placeholder="0x…" autoComplete="off" required/></label><button className="qx-text-button" type="button" onClick={m.checkToken}>Check token and balance</button>{m.token && <p className="qx-fine-print">Unverified token: {m.token.symbol} · {m.token.decimals} decimals · Balance {hidden?'••••':formatUnits(m.token.balance,m.token.decimals)}. Check the contract independently.</p>}</>}
        <label>Recipient address<input value={m.recipient} onChange={event => m.setRecipient(event.target.value)} placeholder="0x…" autoComplete="off" spellCheck={false} required/></label>
        <label>Amount<input value={m.amount} onChange={event => m.setAmount(event.target.value)} inputMode="decimal" placeholder="0.00" autoComplete="off" required/></label>
        <button className="qx-button qx-primary" disabled={!m.relay}>{m.busy ? 'Checking transfer…' : 'Review test transfer'}<DIcon icon={faArrowUp} size={12}/></button>
      </fieldset></form>
      {!m.status && <button className="qx-text-button" disabled={m.busy} onClick={m.refresh}>Retry account check</button>}
      <p className="qx-fine-print">One operation uses one key. Signed bytes are saved before submission. {surface === 'panel' ? 'Keep this panel open while submitting.' : <><a href="quantum.html?view=send" target="_blank" rel="noopener">Use a full tab ↗</a> for a longer session.</>}</p>
    </>;
  }

  function activity() {
    if (!m.record) return welcome();
    if (!m.session) return <><div className="qx-view-heading"><h1>Every move, in view.</h1><p>Unlock to read and check your signing history.</p></div>{unlockPanel()}</>;
    return <><div className="qx-section-heading"><h1>Quantum activity</h1><button className="qx-icon-button" aria-label="Refresh Quantum activity" disabled={m.busy} onClick={m.refresh}><DIcon icon={faRotate} size={13}/></button></div>
      {!m.status ? <div className="qx-empty"><DIcon icon={faClockRotateLeft} size={24}/><h2>Checking your history.</h2><p>A verified account check is needed to show activity.</p><button className="qx-text-button" disabled={m.busy} onClick={m.refresh}>Retry account check</button></div> : !m.status.entries.length ? <div className="qx-empty"><DIcon icon={faClockRotateLeft} size={27}/><h2>Your story starts here.</h2><p>No operations are recorded in this device’s known signing history.</p></div> : <div className="qx-activity-list">{m.status.entries.slice().reverse().map(entry => {
        const receipt = m.receipts[entry.userOpHash];
        const result = receipt?.status === 'succeeded' ? 'Execution succeeded' : receipt?.status === 'execution-reverted' ? 'Execution reverted' : entry.status === 'signed' ? 'Pending / check explorer' : 'Key consumed / verify execution';
        return <article key={entry.keyIndex}><span className="qx-activity-icon"><DIcon icon={faArrowUp} size={13}/></span><div><strong>One-time key #{entry.keyIndex}</strong><small>{new Date(entry.createdAt).toLocaleString()}</small><span className={receipt?.status === 'succeeded' ? 'is-success' : ''}>{result}</span></div>{entry.transactionHash && <a aria-label={`View transaction for key ${entry.keyIndex}`} href={networkExplorerTx(QUANTUM_NETWORK, entry.transactionHash)} target="_blank" rel="noopener noreferrer"><DIcon icon={faArrowUpRightFromSquare} size={11}/></a>}</article>;
      })}</div>}
      {m.status?.pending && <div className="qx-retry"><h2>A stored operation needs attention.</h2><code>{shortAddress(m.status.pending.userOpHash)}</code><p>Retry submits the exact saved bytes. It never creates another signature.</p><button className="qx-button qx-secondary" disabled={m.busy || !m.relay || m.record.restored} onClick={m.retry}>Review exact retry</button>{!m.relay && <button className="qx-text-button" onClick={() => navigate('send')}>Connect your bundler first</button>}</div>}
      <p className="qx-fine-print">Known local history. Key rotation and successful transfer execution are checked separately.</p>
    </>;
  }

  function keys() {
    if (!m.record) return welcome();
    if (!m.session) return <><div className="qx-view-heading"><h1>Signing keys</h1><p>Unlock to read your account’s key state and local signing history.</p></div>{unlockPanel()}</>;
    if (!m.status) return <div className="qx-empty"><DIcon icon={faKey} size={27}/><h1>Key state unavailable</h1><p>A verified account check is needed before showing signing key data.</p><button className="qx-text-button" disabled={m.busy} onClick={m.refresh}>Retry account check</button></div>;
    const status = m.status;
    const known = status.entries.filter(entry => entry.kind !== 'recovery').slice().sort((a, b) => b.keyIndex - a.keyIndex).slice(0, 3);
    return <>
      <div className="qx-section-heading"><h1>Signing keys</h1><button className="qx-icon-button" disabled={m.busy} onClick={m.refresh} aria-label="Refresh signing key state"><DIcon icon={faRotate} size={13}/></button></div>
      <section className="qx-keys-card"><span className="qx-eyebrow">ACCOUNT AUTHORIZATION</span><h2>A fresh key.<br/><em>The same address.</em></h2><div className="qx-current-key"><span><DIcon icon={faKey} size={21}/></span><div><small>{status.state.deployed ? 'Onchain signing key' : 'Initial signing key · not deployed'}</small><strong>Key #{status.state.keyIndex}</strong></div><span className="qx-key-state">{status.recoveryExposed ? 'Blocked' : status.pending ? 'Pending' : signingBlocked ? 'Read-only' : 'Current'}</span></div><dl><div><dt>Recovery key</dt><dd>#{status.state.recoveryIndex}</dd></div><div><dt>Known local records</dt><dd>{status.entries.length}</dd></div></dl></section>
      {(status.pending || status.recoveryExposed || signingBlocked) && <p className="qx-message">{status.recoveryExposed ? 'The recovery key was exposed. New signing is blocked.' : signingBlocked ? 'This account cannot create new signatures on this device.' : 'A signed operation is stored. Resolve it before signing another operation.'}</p>}
      <section className="qx-key-hash"><h2>Current public key hash</h2><code>{status.state.publicKeyHash}</code><p>Public account data · {status.state.deployed ? 'Read from the verified account check' : 'Derived initial key; not yet stored onchain'}</p></section>
      {known.length > 0 && <section className="qx-known-keys"><h2>Known signing history</h2>{known.map(entry => <div key={entry.keyIndex}><DIcon icon={entry.status === 'signed' ? faClockRotateLeft : faCheck} size={11}/><span>Key #{entry.keyIndex}</span><small>{entry.status === 'signed' ? 'Signed · pending' : entry.status === 'replaced' ? 'Replaced' : 'Key consumed'}</small></div>)}</section>}
      <p className="qx-fine-print">A WOTS key signs once. A local signature reserves its key before submission. Key consumption and successful transfer execution are checked separately.</p>
      <a className="qx-key-explorer" href={networkExplorerAddress(QUANTUM_NETWORK, m.record.address)} target="_blank" rel="noopener noreferrer">View account on explorer<DIcon icon={faArrowUpRightFromSquare} size={10}/></a>
    </>;
  }

  function settings() {
    return <><div className="qx-view-heading"><h1>Security & settings</h1><p>Your account, backup, and session controls.</p></div><div className="qx-settings-list">
      <div><span>Network</span><strong>Robinhood Testnet · 46630</strong></div><div><span>Authorization</span><strong>WOTS · one-time keys</strong></div><div><span>Account access</span><strong>{m.record ? m.record.restored ? 'Imported · read-only' : 'Original signing device' : 'No account yet'}</strong></div><div><span>Local vault</span><strong>AES-256-GCM</strong></div><div><span>Session auto-lock</span><strong>5 minutes of inactivity</strong></div>
    </div>{m.record && <><button className="qx-settings-action" disabled={!m.session || m.busy} onClick={m.backup}><DIcon icon={faDownload} size={14}/><span>Export encrypted archive<small>Includes known one-time-key history</small></span><DIcon icon={faArrowUpRightFromSquare} size={10}/></button>{!m.session && <p className="qx-fine-print">Unlock from Assets before exporting an archive.</p>}{m.session && <button className="qx-settings-action" onClick={m.lock}><DIcon icon={faLock} size={14}/><span>Lock this session</span></button>}</>}
      {m.record&&<button className="qx-settings-action" disabled={!m.session||m.busy} onClick={()=>navigate('manage')}><DIcon icon={faSliders} size={14}/><span>Manage assets<small>Import tokens, show or hide balances</small></span><DIcon icon={faArrowRight} size={11}/></button>}
      <a className="qx-settings-action" href="recovery.html" target="_blank" rel="noopener"><DIcon icon={faShieldHalved} size={14}/><span>Recovery research<small>Lost-device spending is not activated</small></span><DIcon icon={faArrowUpRightFromSquare} size={10}/></a>
      <div className="qx-inline-links"><a href={`${QOZMO_WEBSITE}/docs/quantum/overview/`} target="_blank" rel="noopener noreferrer">Quantum guide ↗</a><a href="wallet.html" target="_blank" rel="noopener">EVM workspace ↗</a><a href="https://x.com/qozmowallet" target="_blank" rel="noopener noreferrer">Qozmo on X ↗</a></div>
      <p className="qx-fine-print">Your website wallet is separate. Imported Quantum accounts stay read-only. Keep fresh encrypted archives before updating or removing the extension.</p>
    </>;
  }

  const selectedToken=selectedAsset&&selectedAsset!=='native'?assets.preferences?.tokens.find(token=>token.address===selectedAsset):undefined;
  const selectedBalance=selectedToken?assets.balances.find(row=>row.address===selectedToken.address):undefined;
  const assetSymbol=selectedToken?.symbol??'ETH';
  const detailBalance=selectedToken?(selectedBalance?.status==='ready'?selectedBalance.balance:undefined):m.status?.balance;
  function sendSelected(){if(!selectedAsset||(selectedAsset!=='native'&&!selectedToken))return;m.setAsset(selectedAsset==='native'?'eth':'token');m.setTokenAddress(selectedAsset==='native'?'':selectedAsset);navigate('send');}

  return <div className={`qx-wallet qx-${surface}`}>
    <header className={`qx-header${m.record && overview ? ' qx-account-header' : ''}`}>
      {m.record && overview ? <div className="qx-header-identity"><span className="qx-account-avatar"><QozmoMark/></span><div><h1 ref={m.accountTitle} tabIndex={-1} title={m.record.name}>{m.record.name}</h1><button className="qx-address-button" onClick={() => void m.copyAddress()} aria-label={m.copied ? 'Quantum address copied' : 'Copy Quantum address'}>{shortAddress(m.record.address)}<DIcon icon={m.copied ? faCheck : faCopy} size={10}/></button></div></div> : <div className="qx-brand"><QozmoMark/><span>qozmo<em>.</em><small>QUANTUM WALLET</small></span></div>}
      <div className="qx-header-actions">{surface !== 'panel' && <a className="qx-icon-button" href={fullPage} target="_blank" rel="noopener" aria-label="Open Quantum wallet in a full tab"><DIcon icon={faArrowUpRightFromSquare} size={12}/></a>}{m.record && <button className="qx-icon-button" disabled={m.busy} aria-label="Wallet security and settings" onClick={() => navigate('settings')}><DIcon icon={faGear} size={13}/></button>}{m.session && <button className="qx-icon-button" aria-label="Lock Quantum session" onClick={m.lock}><DIcon icon={faLock} size={12}/></button>}</div>
    </header>
    <div className="qx-network-bar">{networkSelect ? networkSelect(m.busy) : <span><QozmoMark/><span>Robinhood Testnet</span></span>}<span>WOTS · Testnet</span></div>
    {m.record && overview && <div className="qx-session-status">{m.record.restored ? 'Read-only account' : m.session ? 'Session active' : 'Session locked'}<span>·</span>Auto-lock 5 min idle</div>}
    <main className="qx-content" ref={content} aria-label={viewNames[view]}>
      {!overview && <button className="qx-back" disabled={m.busy} onClick={() => navigate('home')}><DIcon icon={faArrowLeft} size={11}/>Back to wallet</button>}
      {m.storageError && <p className="qx-message qx-error" role="alert">{m.storageError} Your existing data has been preserved.</p>}
      {m.error && <p className="qx-message qx-error" role="alert">{m.error}</p>}
      {m.notice && <p className="qx-message" role="status">{m.notice}</p>}
      {!m.loaded ? <div className="qx-empty"><DIcon icon={faShieldHalved} size={24}/><p>Opening your local Quantum vault…</p></div> : view === 'home' ? home() : view === 'receive' ? receive() : view === 'send' ? send() : view === 'activity' ? activity() : view === 'keys' ? keys() : view === 'manage' ? <ExtensionAssetManager state={assets} session={m.session} onDone={()=>navigate('home')}/> : settings()}
      {m.record && <span className="qx-session-note">{surface === 'popup' ? 'Closing this popup ends its unlocked session.' : surface === 'panel' ? 'Panel sessions lock when hidden or after 5 minutes idle.' : 'Local vault · Robinhood Testnet · Early access'}</span>}
    </main>
    <footer className={`qx-footer${m.record && m.session && overview ? ' qx-footer-with-navigation' : ''}`} aria-label="Qozmo wallet footer">
      {m.record && m.session && overview && <nav className="qx-navigation" aria-label="Quantum wallet navigation">{tabs.map(tab => <button key={tab.id} aria-current={view === tab.id ? 'page' : undefined} disabled={m.busy} onClick={() => navigate(tab.id)}><DIcon icon={tab.icon} size={14}/><span>{tab.label}</span></button>)}</nav>}
      <div className="qx-footer-meta"><span className="qx-footer-brand"><span aria-hidden="true"><QozmoMark/></span>qozmo<span className="qx-footer-period">.</span></span><span className="qx-footer-status"><i aria-hidden="true"/>Testnet · unaudited</span></div>
    </footer>
    <span className="qx-sr-only" role="status" aria-live="polite">{m.copied ? 'Quantum address copied to clipboard.' : ''}</span>
    {selectedAsset&&m.session&&(selectedAsset==='native'||!!selectedToken)&&<Modal title={selectedToken?.name??'Test Ether'} eyebrow="ROBINHOOD TESTNET · ASSET DETAILS" className="qx-token-dialog" onClose={()=>setSelectedAsset(null)}><div className="qx-token-detail"><ExtensionTokenIcon token={selectedToken} size={54}/><strong className="qx-detail-amount">{hidden?'••••':detailBalance!==undefined?formatUnits(detailBalance,selectedToken?.decimals??18):'Unavailable'} <small>{assetSymbol}</small></strong><span className="qx-imported-badge">{selectedToken?'IMPORTED ERC-20':'NATIVE ASSET'}</span>{selectedToken&&<><dl><div><dt>Contract address</dt><dd>{selectedToken.address}</dd></div><div><dt>Decimals</dt><dd>{selectedToken.decimals}</dd></div></dl><a className="qx-text-button" href={`${QUANTUM_NETWORK.explorerUrl}/token/${selectedToken.address}`} target="_blank" rel="noopener noreferrer">View contract on explorer<DIcon icon={faArrowUpRightFromSquare} size={10}/></a><p className="qx-fine-print">Imported token metadata does not verify its issuer.</p></>}{assets.error&&<p className="qx-message qx-error" role="alert">{assets.error}</p>}<div className="qx-token-detail-actions"><button className="qx-button qx-primary" disabled={!!signingBlocked||m.busy||!m.status||!!m.status.pending||!!m.status.recoveryExposed} onClick={sendSelected}><DIcon icon={faArrowUp} size={12}/>Send {assetSymbol}</button><button className="qx-button qx-secondary" onClick={()=>{setSelectedAsset(null);navigate('receive');}}><DIcon icon={faArrowDown} size={12}/>Receive</button></div><button className="qx-text-button qx-hide-token" disabled={!!assets.storageError} onClick={()=>{if(selectedAsset&&assets.visibility(selectedAsset,false))setSelectedAsset(null);}}><DIcon icon={faEyeSlash} size={12}/>Hide from my assets</button></div></Modal>}
    {dialogs}
  </div>;
}
