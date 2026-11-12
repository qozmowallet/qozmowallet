'use client';

import { useId } from 'react';
import { faLock, faShuffle } from '@fortawesome/free-solid-svg-icons';
import type { RecoveryWordPositions } from '@/lib/wallet/recovery-challenge';
import { DIcon } from './ui';
import '../../app/dashboard/recovery-word-check.css';

export function RecoveryWordCheck({ positions, answers, onChange, disabled }: {
  positions: RecoveryWordPositions | null; answers: readonly string[];
  onChange(index: number, value: string): void; disabled?: boolean;
}) {
  const id = useId();
  if (!positions) return <p className="qd-message qd-message-error" role="alert">The word check is unavailable. Return to your recovery phrase before continuing.</p>;
  return <section className="qwc-check" aria-label="Confirm three recovery words" aria-describedby={`${id}-hint`}>
    <div className="qwc-heading"><span className="qwc-symbol"><DIcon icon={faShuffle} size={14}/></span><div><strong>Three words. One final check.</strong><p>Selected at random from your 24-word phrase.</p></div><span className="qwc-step">3 OF 24</span></div>
    <div className="qwc-grid">{positions.map((position, index) => <label className="qwc-word" htmlFor={`${id}-${position}`} key={position}>
      <span className="qwc-label"><span>Word <strong>{position + 1}</strong></span><small>{String(index + 1).padStart(2, '0')}</small></span>
      <input id={`${id}-${position}`} name={`recovery-word-${position + 1}`} value={answers[index] ?? ''} onChange={event => onChange(index, event.target.value)} placeholder={`Enter word #${position + 1}`} autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} disabled={disabled} required aria-describedby={`${id}-hint`}/>
    </label>)}</div>
    <p className="qwc-hint" id={`${id}-hint`}><DIcon icon={faLock} size={10}/>Check your saved copy. Your words stay on this device.</p>
  </section>;
}
