'use client';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { faCheck, faDownload, faLock, faRotate, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import { useQozmoAccount } from './account-context';
import { createAccountBackup, currentBackupSnapshot, inspectAccountBackup, MAX_ACCOUNT_BACKUP_BYTES, readBackupStamp, rememberBackupDownload, type BackupStamp } from '@/lib/wallet/account-backup';
import { DIcon, Message, downloadJSON, errorText } from '@/components/dashboard/ui';

export default function BackupCenter() {
  const account = useQozmoAccount();
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof currentBackupSnapshot>> | null>(null);
  const [stamp, setStamp] = useState<BackupStamp | null>(null);
  const [password, setPassword] = useState(''), [inspectPassword, setInspectPassword] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [inspection, setInspection] = useState<Awaited<ReturnType<typeof inspectAccountBackup>> | null>(null);
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [snapshotError, setSnapshotError] = useState('');
  const [busy, setBusy] = useState(false);
  const epoch = useRef(0), refreshEpoch = useRef(0), abort = useRef(new AbortController()), input = useRef<HTMLInputElement>(null);
  const refresh = useCallback(async () => {
    const request = ++refreshEpoch.current;
    if (!account.record) { setSnapshot(null); setStamp(null); return; }
    try {
      const nextStamp = readBackupStamp(account.record.address), next = await currentBackupSnapshot(account.record);
      if (request === refreshEpoch.current) { setStamp(nextStamp); setSnapshot(next); setSnapshotError(''); }
    } catch { if (request === refreshEpoch.current) { setSnapshot(null); setStamp(null); setSnapshotError('Backup status could not be read. Existing browser data has been preserved.'); } }
  }, [account.record]);
  useEffect(() => {
    const sync = () => { void refresh(); };
    sync(); window.addEventListener('storage', sync); window.addEventListener('qozmo:privacy-notes-changed', sync); window.addEventListener('qozmo:backup-changed', sync);
    return () => { refreshEpoch.current++; window.removeEventListener('storage', sync); window.removeEventListener('qozmo:privacy-notes-changed', sync); window.removeEventListener('qozmo:backup-changed', sync); };
  }, [refresh]);
  useEffect(() => { void refresh(); }, [account.status?.entries, refresh]);
  useEffect(() => {
    epoch.current++; abort.current.abort(); abort.current = new AbortController();
    setPassword(''); setInspectPassword(''); setFile(null); setInspection(null); setBusy(false); setError(''); setNotice(''); if (input.current) input.current.value = '';
    return () => { epoch.current++; abort.current.abort(); };
  }, [account.session, account.workGeneration]);
  async function work(task: (signal: AbortSignal, valid: () => boolean) => Promise<void>) {
    if (busy || account.busy) return;
    const request = epoch.current, signal = AbortSignal.any([abort.current.signal, account.abort.current.signal]);
    const valid = () => request === epoch.current && !signal.aborted;
    setBusy(true); setError(''); setNotice('');
    try { await task(signal, valid); } catch (reason) { if (valid()) setError(errorText(reason)); }
    finally { if (valid()) { setBusy(false); setPassword(''); setInspectPassword(''); } }
  }
  async function download(event: FormEvent) {
    event.preventDefault(); if (!account.session || !account.record) return;
    await work(async (signal, valid) => {
      const backup = await createAccountBackup(account.record!, password, signal);
      if (!valid()) return;
      downloadJSON(backup.file, `qozmo-complete-${account.record!.address.slice(2,8)}-${Date.now()}.json`);
      try { rememberBackupDownload(account.record!, backup.stamp); setNotice('Complete encrypted backup downloaded. Keep the file off-device and its wallet password separately.'); }
      catch { setNotice('Complete backup downloaded, but its local download date could not be saved. Keep the downloaded file safe.'); }
      await refresh();
    });
  }
  async function inspect(event: FormEvent) {
    event.preventDefault(); if (!file) return;
    setInspection(null);
    await work(async (signal, valid) => {
      if (file.size > MAX_ACCOUNT_BACKUP_BYTES) throw new Error('Choose a complete Qozmo backup under 12 MB.');
      const report = await inspectAccountBackup(await file.text(), inspectPassword, account.record, signal);
      if (valid()) { setInspection(report); setFile(null); if (input.current) input.current.value = ''; }
    });
  }
  const current = !!snapshot && !!stamp && snapshot.fingerprint === stamp.fingerprint;
  return <div className="qd-backup-center">
    <section className="qd-panel qd-backup-summary"><span className="qd-backup-symbol"><DIcon icon={faShieldHalved} size={25}/></span><div><span className="qd-eyebrow">ONE ACCOUNT · ONE COMPLETE FILE</span><h2>Keep your wallet together.</h2><p>Account archive, known one-time-key history and encrypted Privacy Ring notes.</p></div><span className={`qd-backup-badge ${current ? 'is-current' : ''}`}>{current ? 'Matches local data' : stamp ? 'New backup needed' : 'No complete backup recorded'}</span></section>
    <div className="qd-backup-metrics"><div><span>Last download</span><strong>{stamp ? new Date(stamp.exportedAt).toLocaleString() : 'Not recorded'}</strong></div><div><span>Known operations</span><strong>{snapshot?.operationCount ?? '—'}</strong></div><div><span>Encrypted notes</span><strong>{snapshot?.noteCount ?? '—'}</strong></div><button className="qd-icon-button" aria-label="Refresh backup status" onClick={() => void refresh()} disabled={busy}><DIcon icon={faRotate} size={14}/></button></div>
    {snapshotError && <Message tone="error">{snapshotError}</Message>}
    <div className="qd-tools-grid"><section className="qd-panel qd-tools-panel"><div className="qd-panel-heading"><div><h2>Download a complete backup</h2><p>Use your existing wallet password.</p></div><DIcon icon={faDownload} size={17}/></div>
      {!account.session ? <><p className="qd-fine-print">Unlock the same Qozmo account to authenticate and package its backup.</p><button className="qd-button qd-primary" disabled={!account.loaded || !!account.storageError} onClick={account.openUnlock}>{account.record ? 'Unlock for backup' : 'Create wallet'}</button></> : <form className="qd-form" onSubmit={download}><label>Confirm wallet password<input type="password" autoComplete="off" minLength={12} maxLength={1024} required value={password} disabled={busy || account.busy} onChange={event => setPassword(event.target.value)}/></label><button className="qd-button qd-primary" disabled={busy || account.busy}><DIcon icon={faLock} size={12}/>{busy ? 'Protecting backup…' : 'Download complete backup'}</button></form>}
      <p className="qd-fine-print">The complete file is authenticated and encrypted. A download date records this browser’s action; it cannot confirm that you retained an offline copy. Export again after signing or creating a note.</p>
    </section><section className="qd-panel qd-tools-panel"><div className="qd-panel-heading"><div><h2>Check a backup file</h2><p>Authenticate both archives without importing.</p></div><DIcon icon={faCheck} size={17}/></div><form className="qd-form" onSubmit={inspect}><label>Complete Qozmo backup<input ref={input} type="file" accept="application/json,.json" required disabled={busy} onChange={event => { epoch.current++; setFile(event.target.files?.[0] ?? null); setInspection(null); setError(''); }}/></label><label>Backup password<input type="password" autoComplete="off" minLength={12} maxLength={1024} required disabled={busy} value={inspectPassword} onChange={event => setInspectPassword(event.target.value)}/></label><button className="qd-button qd-secondary" disabled={busy || account.busy || !file}>{busy ? 'Authenticating…' : 'Check completeness'}</button></form>{inspection && <Message><strong>Complete backup authenticated.</strong><br/>{inspection.operationCount} known operations · {inspection.noteCount} authenticated notes<br/>Account: {inspection.owner}<br/>Exported: {new Date(inspection.exportedAt).toLocaleString()}<br/>Local comparison: {inspection.comparison.replaceAll('-', ' ')}<br/>Deployment: {inspection.matchingDeployment ? 'Matches supported deployment' : 'Different deployment'}</Message>}
      <p className="qd-fine-print">On a browser with no Qozmo account, choose Import wallet → Encrypted archive to restore a complete file. Imports remain read-only. Inspection never installs an account or enables spending.</p></section></div>
    {error && <Message tone="error">{error}</Message>}{notice && <Message>{notice}</Message>}
    <p className="qd-fine-print">Keep the original signing device and its journal. A backup contains only history known to its exporting browser; completeness does not prove that no key was exposed elsewhere.</p>
  </div>;
}
