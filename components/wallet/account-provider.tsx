'use client';

import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { useQozmoWalletController } from '@/components/dashboard/quantum-wallet';
import { Modal, Message } from '@/components/dashboard/ui';
import { AccountContext } from './account-context';

const BackupCenter = lazy(() => import('./backup-center'));

/** One original-device signing session for every website route. No EOA vault is created here. */
export function QozmoAccountProvider({ children }: { children: ReactNode }) {
  const wallet = useQozmoWalletController({ unified: true });
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [backupAfterUnlock, setBackupAfterUnlock] = useState(false);
  useEffect(() => { if (!wallet.session) setBackupOpen(false); else if (backupAfterUnlock) { setBackupOpen(true); setBackupAfterUnlock(false); } }, [wallet.session, backupAfterUnlock]);
  useEffect(() => { if (wallet.session || !wallet.record) setUnlockOpen(false); }, [wallet.session, wallet.record]);
  useEffect(() => {
    const close = () => { setUnlockOpen(false); setBackupOpen(false); setBackupAfterUnlock(false); };
    window.addEventListener('qozmo:lock-all', close);
    window.addEventListener('pagehide', close);
    return () => { window.removeEventListener('qozmo:lock-all', close); window.removeEventListener('pagehide', close); };
  }, []);
  const openUnlock = () => wallet.record ? setUnlockOpen(true) : wallet.setSetup('create');
  const openReceive = () => wallet.record ? wallet.setReceive(true) : wallet.setSetup('create');
  const openBackup = () => { if (!wallet.session) { if (wallet.record) setBackupAfterUnlock(true); openUnlock(); return; } setBackupOpen(true); };
  const lock = () => window.dispatchEvent(new Event('qozmo:lock-all'));
  return <AccountContext.Provider value={{ ...wallet, lock, openUnlock, openReceive, openBackup }}>
    {children}
    {wallet.dialogs}
    {backupOpen && wallet.session && <Modal title="Your Backup Center" eyebrow="ONE QOZMO WALLET" wide onClose={() => setBackupOpen(false)}><Suspense fallback={<p>Opening Backup Center…</p>}><BackupCenter/></Suspense></Modal>}
    {unlockOpen && wallet.record && !wallet.session && <Modal title="Unlock your Qozmo wallet." eyebrow="ONE ACCOUNT · ALL YOUR FEATURES" onClose={() => { setUnlockOpen(false); setBackupAfterUnlock(false); wallet.setPassword(''); }} busy={wallet.busy}><form className="qd-form" onSubmit={wallet.unlock}><p className="qd-modal-intro">Unlock the same account for your wallet, Quantum security and Privacy Ring.</p>{wallet.error && <Message tone="error">{wallet.error}</Message>}<label>Wallet password<input type="password" autoComplete="off" value={wallet.password} onChange={event => wallet.setPassword(event.target.value)} required/></label><button className="qd-button qd-primary" disabled={wallet.busy}>{wallet.busy ? 'Unlocking…' : 'Unlock wallet'}</button></form></Modal>}
  </AccountContext.Provider>;
}
