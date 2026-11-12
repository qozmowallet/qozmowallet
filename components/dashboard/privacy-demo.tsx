'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPublicClient, formatEther, http } from 'viem';
import { faArrowDown, faArrowUp, faCheck, faCircleNodes, faArrowUpRightFromSquare, faLock, faArrowRight, faDownload, faRotate, faShieldHalved, faPlus } from '@fortawesome/free-solid-svg-icons';
import rawEvidence from '@/lib/wallet/privacy/demo-evidence.json';
import { parseDemoEvidence, verifyDemoEvidence, type DemoEvidence } from '@/lib/wallet/privacy/demo-evidence';
import { PRIVACY_RESEARCH } from '@/lib/wallet/privacy/research-deployment';
import { getWalletNetwork, networkExplorerAddress, networkExplorerTx } from '@/lib/wallet/networks';
import { DIcon, Message, downloadJSON, errorText, shortAddress } from './ui';

const stages = [
  { title: 'Deposit', caption: 'Create a commitment', icon: faArrowDown },
  { title: 'ZK proof', caption: 'Prove membership', icon: faCircleNodes },
  { title: 'Withdraw', caption: 'Spend the note once', icon: faArrowUp },
] as const;
const testnet = getWalletNetwork(46630);
type Verification = Awaited<ReturnType<typeof verifyDemoEvidence>>;
async function checkRecordedDemo(record: DemoEvidence, signal?: AbortSignal): Promise<Verification> {
  const client = createPublicClient({ chain: testnet.chain, transport: http(testnet.rpcUrl, { timeout: 12_000, retryCount: 0 }) });
  return verifyDemoEvidence(record, client, signal);
}

export function PrivacyDemo({ evidence = rawEvidence, verifyRecord = checkRecordedDemo }: { evidence?: unknown; verifyRecord?: typeof checkRecordedDemo }) {
  const parsed = useMemo(() => {
    if ((evidence as { status?: string })?.status === 'not-run') return { record: null, error: '' };
    try { return { record: parseDemoEvidence(evidence), error: '' }; }
    catch { return { record: null, error: 'Recorded demo evidence is invalid. Do not treat it as a confirmed run.' }; }
  }, [evidence]);
  const record = parsed.record;
  const [stage, setStage] = useState(0);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    setVerification(null); setError(''); setBusy(false);
    return () => controller.current?.abort();
  }, [evidence]);
  async function check() {
    if (!record || busy) return;
    const current = new AbortController(); controller.current?.abort(); controller.current = current;
    setBusy(true); setVerification(null); setError('');
    try {
      const result = await verifyRecord(record, current.signal);
      if (!current.signal.aborted) setVerification(result);
    } catch (e) { if (!current.signal.aborted) setError(errorText(e)); }
    finally { if (!current.signal.aborted) setBusy(false); }
  }
  const detail = stage === 0 ? { title: 'A note enters the pool.', description: 'The wallet deposits exactly 0.001 test ETH. Only its commitment is published; the note secrets stay on the device.', value: record?.commitment, label: 'Public commitment', transaction: record?.deposit } : stage === 1 ? { title: 'Membership, without the secret.', description: 'A Groth16 proof shows knowledge of a note in a known Merkle root. It binds the recipient and a nullifier so the note can only be spent once.', value: record?.root, label: 'Public Merkle root', transaction: undefined } : { title: 'One note. One withdrawal.', description: 'The pool verifies the proof, marks the nullifier as spent, and pays the full 0.001 test ETH back to the same demo wallet.', value: record?.nullifierHash, label: 'Public spent nullifier hash', transaction: record?.withdrawal };

  return <section className="qd-privacy-demo" aria-label="Privacy Ring testnet demo">
    <header className="qd-privacy-hero">
      <div className="qd-privacy-hero-copy">
        <span className="qd-privacy-kicker"><i/>QOZMO PRIVACY RING <span>RESEARCH PREVIEW</span></span>
        <h2>One note.<br/><em>Every step, in view.</em></h2>
        <p>A journey through zero-knowledge privacy.<br/>Explore a real testnet deposit, proof, and withdrawal.</p>
        <span className={`qd-privacy-demo-badge ${verification ? 'is-verified' : ''}`}><DIcon icon={verification ? faCheck : faCircleNodes} size={12}/>{verification ? 'RPC verified' : record ? 'Recorded testnet run' : 'Run not recorded yet'}<span>Robinhood Testnet</span></span>
      </div>
      <div className={`qd-privacy-orbit-art qd-privacy-orbit-step-${stage}`} aria-hidden="true">
        <div className="qd-privacy-orbit-glow"/><div className="qd-privacy-orbit-grid"/>
        <div className="qd-privacy-orbit qd-privacy-orbit-outer"/><div className="qd-privacy-orbit qd-privacy-orbit-middle"/><div className="qd-privacy-orbit qd-privacy-orbit-inner"/>
        <span className="qd-privacy-orbit-point qd-privacy-orbit-point-a"/><span className="qd-privacy-orbit-point qd-privacy-orbit-point-b"/>
        <div className="qd-privacy-art-note"><span className="qd-privacy-art-note-top"><DIcon icon={faLock} size={12}/><span>QOZMO NOTE</span><i/></span><strong>0.001 <small>ETH</small></strong><span className="qd-privacy-art-note-rule"/><span className="qd-privacy-art-note-bottom"><span><i/><i/><i/><i/><i/><i/></span>TESTNET · 46630</span></div>
        <span className="qd-privacy-orbit-tag"><span>0{stage + 1}</span>{stages[stage].title}<DIcon icon={stages[stage].icon} size={11}/></span>
      </div>
    </header>

    <div className="qd-privacy-metrics">
      <div><span className="qd-privacy-metric-icon"><DIcon icon={faCircleNodes} size={16}/></span><span><small>Demo amount</small><strong>0.001 <em>test ETH</em></strong></span></div>
      <div><span className="qd-privacy-metric-icon is-sage"><DIcon icon={faCheck} size={15}/></span><span><small>Recorded journey</small><strong>{record ? '3 / 3' : '0 / 3'} <em>steps complete</em></strong></span></div>
      <div><span className="qd-privacy-metric-icon is-sand"><DIcon icon={faArrowUpRightFromSquare} size={15}/></span><span><small>Total gas paid</small><strong>{record ? formatEther(BigInt(record.gasFeeWei)) : '—'} <em>test ETH</em></strong></span></div>
    </div>

    <div className="qd-privacy-journey-grid">
      <div className="qd-privacy-journey-card">
        <div className="qd-privacy-section-heading"><div><span className="qd-privacy-overline">THE JOURNEY</span><h3>From deposit to done.</h3></div><span className="qd-privacy-step-count">0{stage + 1}<span> / 03</span></span></div>
        <div className="qd-privacy-demo-stages" role="group" aria-label="Explore demo stages">{stages.map((item, index) => <button type="button" key={item.title} aria-pressed={stage === index} className={stage === index ? 'is-active' : ''} onClick={() => setStage(index)}><span className="qd-privacy-stage-icon"><DIcon icon={item.icon} size={15}/></span><strong>{item.title}</strong><small>{item.caption}</small><span className="qd-privacy-stage-marker"/></button>)}</div>
        <div className="qd-privacy-demo-detail" aria-live="polite"><div><span className="qd-privacy-detail-caption">0{stage + 1} <span>— {stages[stage].title.toUpperCase()}</span></span><h3>{detail.title}</h3><p>{detail.description}</p>{detail.transaction && <a className="qd-privacy-receipt-link" href={networkExplorerTx(testnet, detail.transaction.hash)} target="_blank" rel="noopener noreferrer">View {stage === 0 ? 'deposit' : 'withdrawal'} receipt <DIcon icon={faArrowUpRightFromSquare} size={11}/></a>}{detail.value && <details className="qd-privacy-technical" key={stage}><summary>{detail.label}<span>View details <DIcon icon={faArrowDown} size={9}/></span></summary><code className="qd-tools-code">{detail.value}</code></details>}{stage === 1 && record && <p className="qd-privacy-detail-footnote">Public proof available in the evidence report. The note secrets and private witness stay on the device.</p>}</div></div>
      </div>

      <aside className="qd-privacy-evidence-card">
        <div className="qd-privacy-evidence-heading"><span className="qd-privacy-evidence-symbol"><DIcon icon={faShieldHalved} size={18}/></span><span><small>ONCHAIN EVIDENCE</small><h3>A trace you can check.</h3></span></div>
        <p>Two transactions.<br/>One complete round-trip.</p>
        <div className="qd-privacy-evidence-transactions">{(['deposit', 'withdrawal'] as const).map((kind, index) => record ? <a href={networkExplorerTx(testnet, record[kind].hash)} target="_blank" rel="noopener noreferrer" key={kind}><span className="qd-privacy-evidence-tx-icon"><DIcon icon={index === 0 ? faArrowDown : faArrowUp} size={12}/></span><span><strong>{index === 0 ? 'Deposit' : 'Withdrawal'}</strong><small>{shortAddress(record[kind].hash)}</small></span><DIcon icon={faArrowUpRightFromSquare} size={11}/></a> : <div className="qd-privacy-evidence-pending" key={kind}>{index === 0 ? 'Deposit' : 'Withdrawal'}<span>Awaiting a run</span></div>)}</div>
        <dl><div><dt>Network</dt><dd>Robinhood Testnet <i/></dd></div><div><dt>Pool</dt><dd><a href={networkExplorerAddress(testnet, PRIVACY_RESEARCH.pool)} target="_blank" rel="noopener noreferrer">{shortAddress(PRIVACY_RESEARCH.pool)} ↗</a></dd></div><div><dt>Recipient</dt><dd>{record ? <a href={networkExplorerAddress(testnet, record.recipient)} target="_blank" rel="noopener noreferrer">{shortAddress(record.recipient)} ↗</a> : 'Same demo wallet'}</dd></div></dl>
        {record && <button className="qd-privacy-evidence-download" onClick={() => downloadJSON(record, 'qozmo-privacy-demo-evidence.json')}><DIcon icon={faDownload} size={11}/>Download public evidence<DIcon icon={faArrowRight} size={11}/></button>}
      </aside>
    </div>

    {record ? <div className="qd-privacy-verification"><span className={`qd-privacy-verification-icon ${verification ? 'is-verified' : ''}`}><DIcon icon={verification ? faCheck : faRotate} size={17} className={busy ? 'qd-privacy-spinning' : ''}/></span><div><strong>{verification ? 'Checked. Confirmed. In view.' : 'A little peace of mind.'}</strong><p>{verification ? `Proof valid, root known, nullifier spent. Checked at block ${verification.blockNumber}.` : 'Check the receipts and proof directly against Robinhood Testnet.'}<span>Read-only checks. No wallet connection or signing.</span></p></div><button className="qd-button qd-primary" onClick={() => void check()} disabled={busy}>{busy ? 'Checking testnet…' : 'Check testnet receipts'}<DIcon icon={faArrowRight} size={11}/></button></div> : <Message>The walkthrough is available. To record real transactions, run <code>npm run privacy:demo -- --broadcast</code> locally, then reload this dashboard.</Message>}
    {verification && <p className="qd-privacy-confirmation" role="status"><DIcon icon={faCheck} size={10}/>Deposit and withdrawal confirmed with at least three blocks.</p>}
    {(error || parsed.error) && <Message tone="error">{error || parsed.error} Verification is unavailable; saved evidence is not a fresh chain check.</Message>}
    <details className="qd-privacy-demo-limits"><summary><DIcon icon={faCircleNodes} size={11}/>What this demo shows<span>Research scope <DIcon icon={faPlus} size={10}/></span></summary><p>This is a recorded round-trip paid for and received by the same wallet. Both transaction links are published for inspection, so this demo makes no anonymity claim. A small pool, timing and gas funding can identify users. Amounts and addresses remain public; encrypted balances and private-to-private transfers are future work.</p><p>The dashboard explores and verifies recorded evidence. New demo transactions are signed by the local CLI, where the testnet key stays. Clicking a stage does not send a transaction.</p></details>
  </section>;
}
