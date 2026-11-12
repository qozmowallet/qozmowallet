'use client';

import { useEffect, useRef, useState } from 'react';
import { faCopy } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {QZO_TOKEN} from '@/lib/qzo-token';
import { ArrowUpRight, Check } from './icons';
import '../app/contract-address.css';

const CONTRACT_ADDRESS = QZO_TOKEN.address;
const CONTRACT_EXPLORER = QZO_TOKEN.explorer;

export function ContractAddress() {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const reset = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (reset.current) clearTimeout(reset.current); }, []);

  async function copyAddress() {
    if (reset.current) clearTimeout(reset.current);
    try {
      await navigator.clipboard.writeText(CONTRACT_ADDRESS);
      setStatus('copied');
      reset.current = setTimeout(() => setStatus('idle'), 2500);
    } catch {
      setStatus('error');
    }
  }

  return <section className="qca-contract" aria-labelledby="qca-title">
    <div className="qca-heading">
      <h2 id="qca-title">Contract address</h2>
      <span className="qca-network"><i aria-hidden="true"/>Robinhood Chain</span>
    </div>
    <div className="qca-address-row">
      <code className="qca-address" aria-label={`Contract address ${CONTRACT_ADDRESS}`}>{CONTRACT_ADDRESS}</code>
      <button type="button" className={`qca-copy${status === 'copied' ? ' is-copied' : ''}`} onClick={() => void copyAddress()} aria-label={status === 'copied' ? 'Contract address copied' : 'Copy full contract address'}>
        {status === 'copied' ? <Check size={13}/> : <FontAwesomeIcon icon={faCopy} aria-hidden="true"/>}
        <span>{status === 'copied' ? 'Copied' : 'Copy'}</span>
      </button>
    </div>
    <div className="qca-bottom">
      <span className="qca-feedback" role="status" aria-live="polite">{status === 'error' ? 'Select the address above to copy it manually.' : status === 'copied' ? 'Copied to clipboard.' : 'Chain ID 4663'}</span>
      <a href={CONTRACT_EXPLORER} target="_blank" rel="noopener noreferrer" aria-label="View contract address on Robinhood Chain explorer, opens in a new tab">View on explorer <ArrowUpRight size={11}/></a>
    </div>
  </section>;
}
