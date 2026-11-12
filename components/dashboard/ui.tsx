'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

export function DIcon({ icon, size = 16, className = '' }: { icon: IconDefinition; size?: number; className?: string }) {
  return <FontAwesomeIcon icon={icon} className={`qd-icon ${className}`} style={{ width: size, height: size }} aria-hidden="true" />;
}

export function Modal({ title, eyebrow, children, onClose, wide = false, busy = false, className = '', focusKey }: { title: string; eyebrow?: string; children: ReactNode; onClose: () => void; wide?: boolean; busy?: boolean; className?: string; focusKey?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const backdrop = useRef(false);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.showModal();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => {
    if (focusKey === undefined) return;
    ref.current?.scrollTo({ top: 0, behavior: 'instant' });
    ref.current?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
  }, [focusKey]);
  return <dialog ref={ref} className={`qd-modal ${wide ? 'qd-modal-wide' : ''} ${className}`} aria-labelledby={headingId} aria-busy={busy}
    onCancel={event => { event.preventDefault(); if (!busy) close.current(); }}
    onPointerDown={event => { backdrop.current = event.target === event.currentTarget; }}
    onClick={event => { if (event.target === event.currentTarget && backdrop.current && !busy) close.current(); backdrop.current = false; }}>
    <div className="qd-modal-body"><header className="qd-modal-header"><div>{eyebrow && <p className="qd-eyebrow">{eyebrow}</p>}<h2 id={headingId} tabIndex={-1}>{title}</h2></div><button type="button" className="qd-icon-button" aria-label="Close dialog" onClick={onClose} disabled={busy}><DIcon icon={faXmark} size={19}/></button></header>{children}</div>
  </dialog>;
}

export function EmptyState({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <div className="qd-empty"><div className="qd-empty-orbit" aria-hidden="true"><span/></div><h3>{title}</h3><p>{description}</p>{children}</div>;
}

export function Message({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'error' | 'success' }) {
  return <p className={`qd-message qd-message-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>{children}</p>;
}

export function downloadJSON(value: unknown, filename: string) {
  const url = URL.createObjectURL(new Blob([typeof value === 'string' ? value : JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const shortAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`;
export const errorText = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong. Please try again.';

export function formatToken(value: bigint, decimals = 18) {
  const base = BigInt(10) ** BigInt(decimals);
  const whole = value / base;
  const fraction = (value % base).toString().padStart(decimals, '0').slice(0, 6).replace(/0+$/, '');
  if (value > BigInt(0) && whole === BigInt(0) && !fraction) return '<0.000001';
  return `${whole.toLocaleString('en-US')}${fraction ? `.${fraction}` : ''}`;
}
