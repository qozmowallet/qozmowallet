'use client';

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { appHref } from '@/lib/app-runtime';
import { formatEther } from 'viem';
import { faArrowDown, faArrowRight, faArrowUp, faArrowUpRightFromSquare, faBars, faBookOpen, faCircleNodes, faClockRotateLeft, faCopy, faGear, faLock, faMagnifyingGlass, faPlus, faRotate, faShieldHalved, faTableColumns, faWallet, faXmark, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { QozmoMark } from '@/components/brand';
import { faXTwitter } from '@fortawesome/free-brands-svg-icons';
import { AssetLogo } from '@/components/asset-logo';
import { useMarketPrices } from '@/components/use-market-prices';
import { useScrolled } from '@/components/use-scrolled';
import { formatMarketPrice } from '@/lib/market-data';
import { assetLogoIdForSymbol } from '@/lib/asset-logos';
import { WALLET_NETWORKS, getWalletNetwork } from '@/lib/wallet/networks';
import { fetchNativeBalance } from '@/lib/wallet/chain-client';
import { useQozmoAccount } from '@/components/wallet/account-context';
import { AccountActivity } from '@/components/wallet/account-activity';
import { AccountSettings } from '@/components/wallet/account-settings';
import { MarketChart, MarketWatch } from './market-panels';
import { TokenHoldings } from './token-holdings';
import { ChainHistory } from './chain-history';
import { PaymentRequests } from './payment-requests';
import { DefiExplore } from './defi-explore';
import { NetworkPicker } from './network-picker';
import { DIcon, EmptyState, Message, errorText, formatToken, shortAddress } from './ui';

const BackupCenter = lazy(() => import('@/components/wallet/backup-center'));
const QuantumPanel = lazy(() => import('./quantum-panel'));
const PrivacyPanel = lazy(() => import('./privacy-panel'));
const RecoveryCenter = lazy(() => import('./recovery-center').then(m => ({ default: m.RecoveryCenter })));
type View = 'overview' | 'assets' | 'defi' | 'activity' | 'payments' | 'recovery' | 'backup' | 'quantum' | 'privacy' | 'settings';
type Dialog = 'setup' | 'create' | 'import' | 'unlock' | 'receive' | 'send' | null;
type Balance = { status: 'loading' | 'ready' | 'error'; value?: bigint; block?: bigint; error?: string };
const navigation = [
  { id: 'overview', label: 'Overview', icon: faTableColumns },
  { id: 'assets', label: 'My assets', icon: faWallet },
  { id: 'defi', label: 'Explore DeFi', icon: faCircleNodes },
  { id: 'activity', label: 'Activity', icon: faClockRotateLeft },
  { id: 'payments', label: 'Payment requests', icon: faArrowDown },
  { id: 'backup', label: 'Backup Center', icon: faShieldHalved },
  { id: 'recovery', label: 'Recovery', icon: faShieldHalved },
  { id: 'quantum', label: 'Wallet & security', icon: faShieldHalved },
  { id: 'privacy', label: 'Privacy Ring', icon: faLock },
] as const;
const titles: Record<View, { title: string; subtitle: string }> = {
  overview: { title: 'A little more clarity.', subtitle: 'Your wallet, your networks, your next move.' },
  assets: { title: 'Your assets. All together.', subtitle: 'Crypto, stocks, ETFs and gold. Ethereum and Robinhood Chain.' },
  defi: { title: 'A world of possibilities.', subtitle: 'Explore the protocols shaping decentralized finance.' },
  payments: { title:'A clear way to get paid.', subtitle:'Create native payment requests and check their onchain receipts.' },
  backup: { title: 'Keep it all together.', subtitle: 'A complete encrypted backup for your account, signing history and privacy notes.' },
  recovery: { title:'Your recovery, understood.', subtitle:'Inspect your account boundary and prepare independent research artifacts.' },
  activity: { title: 'Every move, in view.', subtitle: 'Local submissions and explorer-indexed activity from other devices.' },
  quantum: { title: 'Qozmo Quantum.', subtitle: 'One wallet for public transfers, Quantum security and Privacy Ring.' },
  privacy: { title: 'Qozmo Privacy Ring.', subtitle: 'Encrypted notes and zero-knowledge withdrawal research.' },
  settings: { title: 'Make yourself at home.', subtitle: 'Your wallet, your preferences, your control.' },
};

export function QozmoDashboard() {
  const scrolled = useScrolled();
  const [view, setView] = useState<View>('overview');
  const account = useQozmoAccount();
  const vault = account.record ? { ...account.record, backupConfirmed: !account.record.restored } : null;
  const secret = account.session;
  const { loaded, storageError } = account;
  const [networkId, setNetworkId] = useState<number>(46630);
  const [menu, setMenu] = useState(false);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');
  const [balances, setBalances] = useState<Record<number, Balance>>({});
  const [balanceRefresh, setBalanceRefresh] = useState(0);
  const [balanceHidden, setBalanceHidden] = useState(false);
  const network = getWalletNetwork(networkId);
  const { quotes, status, reconnect } = useMarketPrices();
  const visibleNetworks = WALLET_NETWORKS.filter(n => n.kind === network.kind);
  const activeBalance = balances[network.id];
  const hasPending = !!account.status?.pending;
  const notify = useCallback((message: string) => setToast(message), []);
  const lockWallet = () => account.lock();
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (['overview','assets','defi','activity','payments','recovery','backup','quantum','privacy','settings'].includes(hash)) setView(hash as View);
    try { const selected = Number(localStorage.getItem('qozmo.wallet.network')); if (WALLET_NETWORKS.some(n => n.id === selected)) setNetworkId(selected); } catch { /* Session preference only. */ }
  }, []);
  useEffect(() => { setBalanceRefresh(value => value + 1); }, [account.receipts]);

  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 5500); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape' && menu) { setMenu(false); menuToggleRef.current?.focus({ preventScroll: true }); } };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [menu]);

  useEffect(() => {
    if (!vault) { setBalances({}); return; }
    let current = true;
    const networks = WALLET_NETWORKS.filter(n => n.kind === network.kind);
    setBalances(previous => ({ ...previous, ...Object.fromEntries(networks.map(n => [n.id, { status: 'loading' }])) }));
    for (const n of networks) {
      fetchNativeBalance(n, vault.address).then(result => { if (current) setBalances(previous => ({ ...previous, [n.id]: { status: 'ready', value: result.balance, block: result.blockNumber } })); })
        .catch(error => { if (current) setBalances(previous => ({ ...previous, [n.id]: { status: 'error', error: errorText(error) } })); });
    }
    return () => { current = false; };
  }, [vault?.address, network.kind, balanceRefresh]);

  function navigate(next: View) { setView(next); setMenu(false); if (menu) menuToggleRef.current?.focus({ preventScroll: true }); window.history.replaceState(null, '', `#${next}`); window.scrollTo({ top: 0, behavior: 'auto' }); }
  function chooseNetwork(id: number) { setNetworkId(id); setDialog(null); try { localStorage.setItem('qozmo.wallet.network', String(id)); } catch { /* Network selection still works for this session. */ } }
  function openWallet() { setDialog(vault ? secret ? 'receive' : 'unlock' : 'setup'); }
  async function copyAddress() { if (!vault) return; try { await navigator.clipboard.writeText(vault.address); notify('Wallet address copied.'); } catch { notify('Clipboard is unavailable. Open Receive to select your address.'); } }
  const usdBalance = activeBalance?.value != null && network.kind === 'mainnet' && network.symbol === 'ETH' && quotes.ethereum ? Number(formatEther(activeBalance.value)) * quotes.ethereum.priceUsd : null;

  function renderBalances() {
    return <section className="qd-panel qd-network-assets"><div className="qd-panel-heading"><div><h2>Your network balances</h2><p>Native tokens · {network.kind === 'testnet' ? 'Test networks' : 'Mainnets, view-only'}</p></div><button className="qd-icon-button" aria-label="Refresh network balances" onClick={() => setBalanceRefresh(r => r + 1)} disabled={!vault}><DIcon icon={faRotate} size={14}/></button></div>{!vault ? <EmptyState title="A home for your assets." description="Create your Qozmo account once to view its balances."><button className="qd-button qd-primary" onClick={() => setDialog('setup')}>Set up wallet</button></EmptyState> : <div className="qd-network-list">{visibleNetworks.map(n => { const b = balances[n.id]; const logoId = assetLogoIdForSymbol(n.symbol); return <button key={n.id} className={`qd-network-row ${n.id === networkId ? 'is-selected' : ''}`} onClick={() => chooseNetwork(n.id)}><span className="qd-native-token-mark">{logoId && <AssetLogo assetId={logoId} size={32}/>}</span><span><strong>{n.label}</strong><small>{n.symbol} · {n.kind === 'testnet' ? 'Testnet' : 'EVM'}</small></span><span className="qd-network-value">{b?.status === 'ready' && b.value != null ? balanceHidden ? '••••' : `${formatToken(b.value)} ${n.symbol}` : b?.status === 'error' ? 'Unavailable' : 'Loading…'}<small>{b?.status === 'ready' ? `Block ${b.block?.toLocaleString()}` : b?.status === 'error' ? 'RPC connection failed' : 'Reading network'}</small></span></button>; })}</div>}</section>;
  }

  function renderActivity(compact = false) { return <AccountActivity compact={compact}/>; }
  function setDialog(next: Dialog) {
    if (!next) return;
    if (next === 'setup' || next === 'create' || next === 'import') {
      if (vault) account.openUnlock(); else account.setSetup(next === 'import' ? 'import' : 'create');
    } else if (next === 'receive') { chooseNetwork(46630); account.openReceive(); }
    else if (next === 'send') { chooseNetwork(46630); navigate('quantum'); if (!secret) account.openUnlock(); }
    else account.openUnlock();
  }

  return <div className="qd-app">
    <a className="skip-link" href="#dashboard-main">Skip to dashboard</a>
    {menu && <button className="qd-nav-backdrop" aria-label="Close navigation" onClick={() => setMenu(false)}/>}
    <aside id="qd-sidebar" className={`qd-sidebar ${menu ? 'is-open' : ''}`}>
      <div className="qd-sidebar-header">
        <div className="qd-sidebar-heading">
          <a className="qd-brand" href={appHref('/')} aria-label="Qozmo home"><QozmoMark/><span>qozmo<span>.</span></span></a>
          <button className="qd-sidebar-close qd-icon-button" aria-label="Close navigation" onClick={() => { setMenu(false); menuToggleRef.current?.focus({ preventScroll:true }); }}><DIcon icon={faXmark} size={17}/></button>
        </div>
        <button className="qd-sidebar-wallet" onClick={openWallet}><span className="qd-wallet-avatar"><DIcon icon={faWallet} size={17}/></span><span><strong>{vault?.name || 'Your workspace'}</strong><small>{vault ? shortAddress(vault.address) : 'Make yourself at home'}</small></span><DIcon icon={vault ? faLock : faPlus} size={11}/></button>
      </div>
      <div className="qd-sidebar-scroll">
        {[
          { label:'Workspace',ids:['overview','assets','defi','activity','payments'] as const },
          { label:'Quantum & privacy',ids:['quantum','privacy','backup','recovery'] as const },
        ].map(group => <section className="qd-sidebar-group" key={group.label}>
          <h2 className="qd-nav-label">{group.label}</h2>
          <nav aria-label={`${group.label} navigation`}>{group.ids.map(id => {
            const item=navigation.find(item=>item.id===id)!;
            return <button className={`qd-nav-item ${view===item.id?'is-active':''}`} aria-current={view===item.id?'page':undefined} onClick={()=>navigate(item.id)} key={item.id}><DIcon icon={item.icon} size={16}/><span>{item.label}</span>{item.id==='quantum'&&<small>BETA</small>}</button>;
          })}</nav>
        </section>)}
      </div>
      <div className="qd-sidebar-bottom">
        <nav aria-label="Resources navigation">
          <button className={`qd-nav-item ${view==='settings'?'is-active':''}`} aria-current={view==='settings'?'page':undefined} onClick={()=>navigate('settings')}><DIcon icon={faGear} size={16}/><span>Settings</span></button>
          <a className="qd-nav-item" href={appHref('/docs/')}><DIcon icon={faBookOpen} size={16}/><span>Documentation</span><DIcon className="qd-resource-arrow" icon={faArrowUpRightFromSquare} size={10}/></a>
          <a className="qd-nav-item" href={appHref('/proof/')}><DIcon icon={faShieldHalved} size={16}/><span>Proof & status</span><DIcon className="qd-resource-arrow" icon={faArrowUpRightFromSquare} size={10}/></a>
          <a className="qd-nav-item qd-sidebar-x" href="https://x.com/qozmowallet" target="_blank" rel="noopener noreferrer" aria-label="Qozmo official X account @qozmowallet, opens in a new tab"><DIcon icon={faXTwitter} size={15}/><span>Qozmo on X</span><DIcon className="qd-resource-arrow" icon={faArrowUpRightFromSquare} size={10}/></a>
        </nav>
        <div className="qd-build-label"><span className="qd-build-status"><i/>Early access</span><span>v0.2</span></div>
      </div>
    </aside>
    <div className="qd-main-shell"><header className={`qd-topbar${scrolled ? ' is-scrolled' : ''}`}><div className="qd-topbar-left"><button ref={menuToggleRef} aria-controls="qd-sidebar" className="qd-mobile-menu qd-icon-button" aria-label={menu ? 'Close navigation' : 'Open navigation'} aria-expanded={menu} onClick={() => setMenu(!menu)}><DIcon icon={menu ? faXmark : faBars} size={18}/></button><span className="qd-breadcrumb">Workspace <span>/</span><strong>{view === 'settings' ? 'Settings' : navigation.find(n => n.id === view)?.label}</strong></span></div><div className="qd-topbar-actions"><label className="qd-search"><DIcon icon={faMagnifyingGlass} size={13}/><input aria-label="Search market assets" placeholder="Search assets…" value={query} onChange={e => { setQuery(e.target.value); if (view !== 'overview' && view !== 'assets') navigate('assets'); }}/></label><NetworkPicker network={network} onChange={chooseNetwork}/><button className={`qd-button ${secret ? 'qd-secondary' : 'qd-primary'} qd-top-wallet`} onClick={() => secret ? (lockWallet(), notify('Your wallet is locked.')) : setDialog(vault ? 'unlock' : 'setup')} disabled={!loaded || !!storageError}><DIcon icon={secret ? faLock : vault ? faLock : faPlus} size={12}/>{secret ? 'Lock wallet' : vault ? 'Unlock wallet' : 'Create wallet'}</button></div></header>
      <main className="qd-main" id="dashboard-main"><div className="qd-page-heading"><div><p className="qd-eyebrow">{view === 'overview' ? 'YOUR DEFI WORKSPACE' : 'QOZMO WALLET'}</p><h1>{titles[view].title}</h1><p>{titles[view].subtitle}</p></div><span className={`qd-environment ${network.kind === 'testnet' ? 'is-testnet' : ''}`}><i/>{network.kind === 'testnet' ? 'Testnet workspace' : 'Mainnet · view only'}</span></div>
      {storageError && <Message tone="error">{storageError} Your existing storage has been preserved.</Message>}
      {(view === 'overview' || view === 'assets') && <>
        <div className="qd-top-grid"><section className={`qd-balance-card ${vault ? 'has-wallet' : ''}`}><div className="qd-balance-card-top"><span>{vault ? 'Your native balance' : 'YOUR NEXT CHAPTER'}</span>{vault ? <button className="qd-icon-button" onClick={() => setBalanceHidden(h => !h)} aria-label={balanceHidden ? 'Show balances' : 'Hide balances'}><DIcon icon={balanceHidden ? faEyeSlash : faEye} size={14}/></button> : <span className="qd-small-tag">SELF-CUSTODY</span>}</div>{vault ? <><div className="qd-balance-number" data-wallet-balance>{balanceHidden ? '••••••' : activeBalance?.status === 'ready' && activeBalance.value != null ? <>{formatToken(activeBalance.value)} <small>{network.symbol}</small></> : activeBalance?.status === 'error' ? <span className="qd-balance-unavailable">Balance unavailable</span> : '—'}</div><p className="qd-balance-subtitle">{network.kind === 'testnet' ? 'Test tokens have no real-world value.' : usdBalance != null ? `Approximately ${formatMarketPrice(usdBalance)} · native tokens only` : 'Native token balance on the selected network.'}</p><div className="qd-wallet-address"><button onClick={() => void copyAddress()}>{shortAddress(vault.address)} <DIcon icon={faCopy} size={11}/></button><span>{secret ? 'Unlocked' : 'Locked'} · Qozmo smart account</span></div><div className="qd-balance-actions"><button className="qd-button qd-primary" onClick={() => setDialog('receive')}><DIcon icon={faArrowDown} size={12}/>Receive</button><button className="qd-button qd-light" onClick={() => setDialog('send')} disabled={network.id !== 46630 || hasPending} title={network.id !== 46630 ? 'This account signs on Robinhood Testnet only' : hasPending ? 'Check your pending transfer before sending another' : undefined}><DIcon icon={faArrowUp} size={12}/>Send</button>{activeBalance?.status === 'error' && <button className="qd-text-button" onClick={() => setBalanceRefresh(r => r + 1)}>Retry balance</button>}</div></> : <><h2>A fresh start.<br/>A world of possibilities.</h2><p className="qd-balance-subtitle">One account for your assets,<br/>Quantum security and Privacy Ring.</p><div className="qd-balance-actions"><button className="qd-button qd-primary" disabled={!loaded || !!storageError} onClick={() => setDialog('create')}>Create a wallet <DIcon icon={faArrowRight} size={12}/></button><button className="qd-button qd-light" disabled={!loaded || !!storageError} onClick={() => setDialog('import')}>Import wallet</button></div></>}<div className="qd-balance-card-foot"><span className="qd-chain-dots" aria-hidden="true">{WALLET_NETWORKS.slice(0,5).map(n => <i key={n.id} style={{ background: n.color }}/>)}</span><span>{vault ? network.label : 'One Qozmo account · Robinhood Testnet'}</span><span className="qd-card-suffix">{vault ? 'LOCAL VAULT' : 'MADE FOR YOU'}</span></div><div className="qd-card-orbits" aria-hidden="true"><i/><i/><i/></div></section>
        <section className="qd-quantum-card"><div className="qd-quantum-card-top"><span>QOZMO QUANTUM</span><span className="qd-lab-label">TESTNET BETA</span></div><div className="qd-quantum-art" aria-hidden="true"><span/><span/><span/><span/><i/></div><div className="qd-quantum-card-copy"><h2>The next layer<br/>of possibility.</h2><p>Your wallet’s Quantum security.<br/>The same Robinhood Testnet account.</p><button onClick={() => navigate('quantum')}>Open wallet & security <DIcon icon={faArrowRight} size={12}/></button></div></section></div>
        {view === 'overview' ? <><div className="qd-middle-grid"><MarketChart quotes={quotes}/><section className="qd-panel qd-wallet-health"><div className="qd-panel-heading"><div><h2>Your wallet, in check</h2><p>A little peace of mind.</p></div></div><div className="qd-health-list"><div><span className={`qd-health-dot ${vault ? 'is-ready' : ''}`}/><span><strong>Encrypted on your device</strong><small>{vault ? 'AES-256-GCM vault' : 'Ready when you create a wallet'}</small></span><span>{vault ? 'Active' : '—'}</span></div><div><span className={`qd-health-dot ${vault?.backupConfirmed ? 'is-ready' : ''}`}/><span><strong>Recovery backup</strong><small>{vault?.backupConfirmed ? 'Phrase confirmed at setup' : 'Your recovery phrase comes first'}</small></span><span>{vault?.backupConfirmed ? 'Saved' : '—'}</span></div><div><span className="qd-health-dot is-lab"/><span><strong>Qozmo Quantum wallet</strong><small>WOTS authorization · Your Qozmo account</small></span><span>Beta</span></div></div><button className="qd-health-link" onClick={() => navigate('settings')}>Manage wallet security <DIcon icon={faArrowRight} size={11}/></button><p className="qd-security-caption">Wallet, Quantum and Privacy Ring use the same smart account. Public balances and pool notes are displayed separately.</p></section></div><TokenHoldings network={network} address={vault?.address} hidden={balanceHidden} query={query} onSetup={() => setDialog('setup')}/><MarketWatch quotes={quotes} status={status} query={query}/><div className="qd-bottom-grid">{renderActivity(true)}<DefiExplore compact/></div></> : <>{renderBalances()}<TokenHoldings network={network} address={vault?.address} hidden={balanceHidden} query={query} onSetup={() => setDialog('setup')}/><MarketWatch quotes={quotes} status={status} query={query}/></>}
      </>}
      {view === 'defi' && <><div className="qd-defi-intro"><div><span className="qd-eyebrow">OPEN FINANCE, YOUR WAY</span><h2>Discover what your<br/>assets could do.</h2><p>Explore lending, liquid staking, and exchanges.<br/>Review each protocol before connecting a wallet.</p></div><div className="qd-defi-orbit" aria-hidden="true"><i className="qd-orbit-protocol"><AssetLogo assetId="aave" size={35}/></i><i className="qd-orbit-protocol"><AssetLogo assetId="uniswap" size={35}/></i><i>L</i><span><QozmoMark/></span></div></div><DefiExplore/><div className="qd-info-footer">Protocol links open external applications. Qozmo does not deposit, swap, bridge, or approve your tokens.</div></>}
      {view === 'activity' && <>{renderActivity()}<ChainHistory key={`${network.id}:${vault?.address}`} address={vault?.address} network={network}/></>}
      {view === 'payments' && (network.id === 46630 ? <PaymentRequests key={vault?.address} address={vault?.address} network={network}/> : <Message>Your Qozmo account receives payments on Robinhood Testnet. <button className="qd-text-button" onClick={() => chooseNetwork(46630)}>Use Robinhood Testnet</button></Message>)}
      {view === 'recovery' && <Suspense fallback={<div className="qd-panel qd-loading-panel">Opening recovery…</div>}><RecoveryCenter/></Suspense>}
      {view === 'privacy' && <Suspense fallback={<div className="qd-panel qd-loading-panel">Opening privacy lab…</div>}><PrivacyPanel key={network.id} network={network} onTestnet={() => chooseNetwork(46630)}/></Suspense>}
      {view === 'quantum' && <Suspense fallback={<div className="qd-panel qd-loading-panel">Opening Qozmo Quantum…</div>}><QuantumPanel network={network} onSelectQuantumNetwork={() => chooseNetwork(46630)}/></Suspense>}
      {view === 'backup' && <Suspense fallback={<div className="qd-panel qd-loading-panel">Opening Backup Center…</div>}><BackupCenter/></Suspense>}
      {view === 'settings' && <AccountSettings/>}
      <footer className="qd-footer"><span>qozmo. <span>A little clarity. A world of possibility.</span></span><span><i className={status === 'live' ? 'is-live' : ''}/>{status === 'live' ? 'Market feed connected' : status === 'connecting' ? 'Connecting to markets' : <button onClick={reconnect}>Reconnect market feed</button>}<span className="qd-footer-separator">·</span>Early access</span></footer></main>
    </div>
    {toast && <div className="qd-toast" role="status">{toast}<button aria-label="Dismiss notification" onClick={() => setToast('')}><DIcon icon={faXmark} size={12}/></button></div>}
  </div>;
}
