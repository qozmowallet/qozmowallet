import { Component, lazy, Suspense, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fontsource-variable/manrope';
import '@fortawesome/fontawesome-svg-core/styles.css';
import '../app/icons.css';
import '../app/globals.css';
import '../app/dashboard/dashboard.css';
import '../app/dashboard/quantum.css';
import '../app/dashboard/tools.css';
import './workspace.css';
import ExtensionWallet from '../components/extension-wallet';
import type { QuantumExtensionView } from '../components/quantum-extension';

config.autoAddCss = false;
const RecoveryWorkbench = lazy(() => import('../components/recovery-workbench'));
const Dashboard = lazy(() => import('../components/dashboard/qozmo-dashboard').then(m => ({ default: m.QozmoDashboard })));

const pathname = window.location.pathname;
const quantum = pathname !== '/wallet.html' && pathname !== '/recovery.html';
const surface = pathname === '/sidepanel.html' ? 'panel' : pathname === '/popup.html' ? 'popup' : 'tab';
const parameters = new URLSearchParams(window.location.search);
const requestedSetup = parameters.get('setup');
const initialSetup = requestedSetup === 'create' || requestedSetup === 'import' ? requestedSetup : undefined;
const initialView = (['home', 'receive', 'send', 'activity', 'keys', 'settings', 'manage'] as QuantumExtensionView[]).find(view => view === parameters.get('view'));
if (quantum) {
  document.body.dataset.quantumSurface = surface;
  document.title = 'Qozmo Quantum Wallet';
}

class WalletBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <main className="qe-fallback"><h1>Let’s open your workspace again.</h1><p>Your saved wallet data has been preserved. Close this tab and reopen Qozmo from the extension icon.</p></main>;
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <WalletBoundary>
    {pathname === '/recovery.html'
      ? <Suspense fallback={<p className="qe-fallback">Opening recovery research…</p>}><RecoveryWorkbench/></Suspense>
      : quantum ? <ExtensionWallet surface={surface} initialSetup={initialSetup} initialView={initialView}/>
      : <><div className="qe-notice">CHROME EXTENSION · LOCAL VAULT<span>Keep an encrypted backup before removing or reloading the extension. Website wallet data is separate.</span></div><Suspense fallback={<p className="qe-fallback">Opening your EVM workspace…</p>}><Dashboard/></Suspense></>}
  </WalletBoundary>,
);
