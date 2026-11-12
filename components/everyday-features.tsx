'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDownLeft, ArrowUpRight, Check, Coffee, Radio, Spotify, TrendingUp, X } from './icons';
import { MiniChart } from './wallet-art';
import { useMotionSettings } from './motion-system';
import '../app/everyday-features.css';

type Network = 'mastercard' | 'visa';
type Finish = 'aurora' | 'glacier' | 'midnight';
const finishes: { id: Finish; label: string }[] = [
  { id: 'aurora', label: 'Aurora' },
  { id: 'glacier', label: 'Glacier' },
  { id: 'midnight', label: 'Midnight' },
];

function NetworkMark({ network }: { network: Network }) {
  return network === 'visa'
    ? <span className="qc-visa" aria-label="Visa">VISA</span>
    : <span className="qc-mastercard" aria-label="Mastercard"><i/><i/></span>;
}

function ConceptCard({ network, finish, back = false }: { network: Network; finish: Finish; back?: boolean }) {
  return <div className={`qc-card qc-finish-${finish}${back ? ' qc-card-back' : ''}`}>
    <div className="qc-card-grain"/>
    {back ? <>
      <div className="qc-magnetic-strip"/>
      <div className="qc-signature"><span>Your next chapter.</span><small>•••</small></div>
      <p className="qc-back-note">A little wallet.<br/>A world of possibility.</p>
      <div className="qc-card-bottom"><span className="qc-concept-label">DESIGN CONCEPT · NOT FOR PAYMENTS</span><NetworkMark network={network}/></div>
    </> : <>
      <div className="qc-card-top"><span className="qc-wordmark">qozmo<span>.</span></span><Radio size={23}/></div>
      <div className="qc-orbits" aria-hidden="true"><i/><i/><i/></div>
      <div className="qc-chip" aria-hidden="true"><i/><i/><i/></div>
      <div className="qc-card-bottom"><div><span className="qc-concept-label">THE EVERYDAY, REIMAGINED</span><span className="qc-card-number">•••• &nbsp; •••• &nbsp; •••• &nbsp; 0000</span></div><NetworkMark network={network}/></div>
    </>}
  </div>;
}

function CardPreview({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);
  const { enabled } = useMotionSettings();
  const [network, setNetwork] = useState<Network>('mastercard');
  const [finish, setFinish] = useState<Finish>('aurora');
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);

  function tilt(event: PointerEvent<HTMLDivElement>) {
    if (!enabled || event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    modelRef.current?.style.setProperty('--qc-tilt-x', `${-(event.clientY - rect.top - rect.height / 2) / rect.height * 22}deg`);
    modelRef.current?.style.setProperty('--qc-tilt-y', `${(event.clientX - rect.left - rect.width / 2) / rect.width * 28}deg`);
  }

  function resetTilt() {
    modelRef.current?.style.setProperty('--qc-tilt-x', '0deg');
    modelRef.current?.style.setProperty('--qc-tilt-y', '0deg');
  }

  useEffect(resetTilt, [enabled]);

  return createPortal(<dialog ref={dialogRef} className="qc-dialog" aria-labelledby="qc-preview-title" aria-describedby="qc-preview-description" data-motion-enabled={enabled} onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="qc-dialog-content">
      <header className="qc-dialog-header"><span className="qc-wordmark">qozmo<span>.</span> <small>/ CARDS</small></span><button type="button" className="qc-close" onClick={onClose} aria-label="Close card preview" autoFocus><X size={18}/></button></header>
      <div className="qc-dialog-intro"><span className="qc-status"><i/>Coming soon</span><h2 id="qc-preview-title">Your next everyday.</h2><p id="qc-preview-description">A first look at Qozmo cards. Choose a network, find your finish, and explore both sides.</p></div>
      <div className="qc-network-picker" role="group" aria-label="Card network">{(['mastercard', 'visa'] as const).map(option => <button type="button" key={option} onClick={() => setNetwork(option)} aria-pressed={network === option}><NetworkMark network={option}/><span>{option === 'mastercard' ? 'Mastercard' : 'Visa'}</span></button>)}</div>
      <div className="qc-model-stage" onPointerMove={tilt} onPointerLeave={resetTilt}>
        <div className="qc-model-shadow"/>
        <div ref={modelRef} className="qc-model-tilt">
          <div className={`qc-model${flipped ? ' is-flipped' : ''}`}>
            <div className="qc-model-face qc-model-front" aria-hidden={flipped}><ConceptCard network={network} finish={finish}/></div>
            <div className="qc-model-face qc-model-back" aria-hidden={!flipped}><ConceptCard network={network} finish={finish} back/></div>
          </div>
        </div>
      </div>
      <div className="qc-model-controls"><div className="qc-finishes" role="group" aria-label="Card finish">{finishes.map(option => <button type="button" key={option.id} className={`qc-swatch qc-swatch-${option.id}`} aria-label={`${option.label} finish`} aria-pressed={finish === option.id} onClick={() => setFinish(option.id)}>{finish === option.id && <Check size={13}/>}</button>)}</div><span className="qc-finish-name" aria-live="polite">{finishes.find(option => option.id === finish)?.label}</span><button type="button" className="qc-flip" aria-pressed={flipped} onClick={() => setFlipped(value => !value)}><span aria-hidden="true">↻</span> Flip card</button></div>
      <p className="qc-interaction-hint">{enabled ? 'Move your cursor to explore the light. ' : ''}Flip to see the other side.</p>
      <footer className="qc-dialog-footer"><span className="qc-status"><i/>Coming soon</span><p>Concept preview only. Cards are not available to order or use for payments. Network availability will be announced.</p></footer>
    </div>
  </dialog>, document.body);
}

export function EverydayFeatures() {
  const [previewOpen, setPreviewOpen] = useState(false);
  return <>
    <div className="qe-grid">
      <article className="qe-tile qe-cards">
        <div className="qe-tile-top"><span className="qe-eyebrow">01 / A LITTLE MORE YOU</span><span className="qc-status"><i/>Coming soon</span></div>
        <div className="qe-cards-copy"><h3>Your cards.<br/>Your kind of everyday.</h3><p>A fresh expression of Qozmo.<br/>Made to feel a little more like you.</p></div>
        <button type="button" className="qe-card-scene" onClick={() => setPreviewOpen(true)} aria-label="Explore Qozmo Mastercard and Visa concepts in 3D" aria-haspopup="dialog">
          <span className="qe-scene-orbit" aria-hidden="true"/>
          <span className="qe-stacked-card qe-stacked-back" aria-hidden="true"><ConceptCard network="visa" finish="midnight"/></span>
          <span className="qe-stacked-card qe-stacked-front" aria-hidden="true"><ConceptCard network="mastercard" finish="aurora"/></span>
          <span className="qe-scene-hint">↗ &nbsp; Take a closer look</span>
        </button>
        <div className="qe-card-footer"><button type="button" className="qe-action" onClick={() => setPreviewOpen(true)} aria-haspopup="dialog">Explore cards in 3D <ArrowUpRight size={14}/></button><span>MASTERCARD / VISA</span></div>
      </article>
      <article className="qe-tile qe-overview">
        <div className="qe-support-copy"><span className="qe-eyebrow">02 / SEE THE BIG PICTURE</span><h3>A fresh<br/>perspective.</h3><p>Your everyday patterns,<br/>a little clearer.</p><a className="qe-action" href="/dashboard/#overview">Explore overview <ArrowUpRight size={13}/></a></div>
        <div className="qe-overview-art"><div className="qe-chart-top"><span>This week</span><TrendingUp size={15}/></div><div className="qe-chart-amount">$280<span>.35</span></div><MiniChart/><div className="qe-chart-days"><span>MON</span><span>WED</span><span>FRI</span><span>SUN</span></div><span className="qe-sample-label">Sample spending</span></div>
      </article>
      <article className="qe-tile qe-activity">
        <div className="qe-support-copy"><span className="qe-eyebrow">03 / STAY IN THE KNOW</span><h3>Life, in<br/>the details.</h3><p>Little moments.<br/>One clear view.</p><a className="qe-action" href="/dashboard/#activity">View activity <ArrowUpRight size={13}/></a></div>
        <div className="qe-activity-art">{[
          { name: 'Spotify', detail: 'A daily soundtrack', amount: '−$12.99', tone: 'spotify', Icon: Spotify },
          { name: 'From Alex', detail: 'For the good times', amount: '+$480.00', tone: 'transfer', Icon: ArrowDownLeft },
          { name: 'Coffee & company', detail: 'Your morning ritual', amount: '−$5.50', tone: 'coffee', Icon: Coffee },
        ].map(({ name, detail, amount, tone, Icon }) => <div className="qe-transaction" key={name}><span className={`merchant-icon ${tone}`}><Icon size={18}/></span><div><strong>{name}</strong><span>{detail}</span></div><span className={tone === 'transfer' ? 'qe-positive' : ''}>{amount}</span></div>)}<span className="qe-sample-label">Illustrative activity</span></div>
      </article>
    </div>
    {previewOpen && <CardPreview onClose={() => setPreviewOpen(false)}/>}
  </>;
}
