'use client';
import { appHref } from '@/lib/app-runtime';
import { useEffect, useRef, useState } from 'react';
import { readQuantumRecord, inspectQuantumBackup, type QuantumRecord } from '@/lib/wallet/quantum/storage';
import { QUANTUM_STORAGE_KEY } from '@/lib/wallet/quantum/storage';
import { RECOVERY_RELEASE_GATES } from '@/lib/wallet/quantum/recovery';
import { Message, downloadJSON, errorText } from './ui';
import { useOptionalQozmoAccount } from '@/components/wallet/account-context';

export function RecoveryCenter() {
  const account = useOptionalQozmoAccount();
  const [record,setRecord] = useState<QuantumRecord | null>(null); const [error,setError] = useState('');
  const epoch = useRef(0);
  const [archive,setArchive] = useState(''); const [password,setPassword] = useState(''); const [busy,setBusy] = useState(false); const [inspection,setInspection] = useState<Awaited<ReturnType<typeof inspectQuantumBackup>> | null>(null);
  useEffect(() => {
    if (!account) return;
    epoch.current++; setArchive(''); setPassword(''); setInspection(null); setBusy(false); setRecord(account.record);
  }, [account?.record, account?.session]);
  useEffect(() => {
    const clear = () => { epoch.current++; setArchive('');setPassword('');setInspection(null);setBusy(false); };
    const refresh = () => { clear();try { setRecord(readQuantumRecord()); } catch(e) { setError(errorText(e)); } };
    const sync = (e:StorageEvent) => { if(!e.key || e.key===QUANTUM_STORAGE_KEY)refresh(); };
    const hidden = () => { if(document.hidden)clear(); };
    refresh();window.addEventListener('storage',sync);window.addEventListener('qozmo:lock-all',clear);document.addEventListener('visibilitychange',hidden);
    return () => { epoch.current++;window.removeEventListener('storage',sync);window.removeEventListener('qozmo:lock-all',clear);document.removeEventListener('visibilitychange',hidden); };
  },[]);

  return <section className="qd-panel qd-tools-panel"><div className="qd-panel-heading"><div><h2>Quantum recovery</h2><p>Understand what your current account can recover.</p></div><span className="qd-small-tag">RESEARCH TOOLS</span></div>
    {error && <Message tone="error">{error}</Message>}
    <dl className="qd-review"><div><dt>Account</dt><dd>{record?.address || 'No Quantum account in this browser'}</dd></div><div><dt>Recovery network</dt><dd>Robinhood Testnet · 46630</dd></div><div><dt>Contract version</dt><dd>Legacy WOTS v1 · immutable deployment</dd></div><div><dt>Imported account</dt><dd>{record?.restored ? 'Read-only' : 'Imports remain read-only'}</dd></div><div><dt>Lost-device spending recovery</dt><dd>Not supported by this contract</dd></div></dl>
    <p className="qd-fine-print">An old backup cannot establish complete one-time-key history. Opening an archive, generating a kit or verifying a research approval never re-enables signing. Keep the original signing device and journals.</p>
    <div className="qd-form"><h3>Inspect a backup without importing</h3><label>Encrypted Quantum archive<input type="file" accept="application/json,.json" disabled={busy} onChange={async e=>{const file=e.target.files?.[0];e.target.value='';setInspection(null);setArchive('');setError('');if(!file)return;if(file.size>4*1024*1024){setError('Backup is too large.');return;}const generation=epoch.current;try{const text=await file.text();if(generation===epoch.current)setArchive(text);}catch(e){if(generation===epoch.current)setError(errorText(e));}}}/></label><label>Archive password<input type="password" autoComplete="off" value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}/></label><button className="qd-button qd-secondary" disabled={busy||!archive||!password} onClick={async()=>{const generation=epoch.current;setBusy(true);setError('');setInspection(null);try{const report=await inspectQuantumBackup(archive,password,record);if(generation===epoch.current)setInspection(report);}catch(e){if(generation===epoch.current)setError(errorText(e));}finally{if(generation===epoch.current){setPassword('');setArchive('');setBusy(false);}}}}>{busy?'Authenticating archive…':'Inspect without installing'}</button>{inspection&&<><Message>Archive authenticated: {inspection.comparison.replaceAll('-',' ')}. This does not prove complete cross-device history or allow signing.</Message><button className="qd-text-button" onClick={()=>downloadJSON(inspection,'qozmo-backup-inspection.json')}>Export public inspection</button></>}</div>
    <div className="qd-tools-toolbar"><a className="qd-button qd-primary" href={appHref('/recovery/')}>Open recovery workbench</a><button className="qd-button qd-secondary" onClick={() => downloadJSON({ format:'qozmo-recovery-readiness',version:1,observedAt:new Date().toISOString(),account:record?.address || null,chainId:46630,contractVersion:'legacy-wots-v1',importPolicy:'read-only',gates:RECOVERY_RELEASE_GATES },'qozmo-recovery-readiness.json')}>Export readiness report</button></div>
    <p className="qd-fine-print">The workbench generates an independent encrypted offline key, fresh replacement candidates, and SLH-DSA draft approvals. These artifacts are not enrolled onchain. A new reviewed account version and deployment are required for activation.</p>
  </section>;
}
