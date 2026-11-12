'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { createPublicClient, getAddress, http, isAddress, zeroAddress, type Address, type Hex } from 'viem';
import { getWalletNetwork, networkExplorerAddress } from '@/lib/wallet/networks';
import { DIcon, Message } from './ui';

// Read-only interface published at https://www.winternitz.app/docs/developers.
// Getter output words remain compatible when the contract stores uint32 indices.
const accountStateAbi = [
  { type: 'function', name: 'publicKeyHash', stateMutability: 'view', inputs: [], outputs: [{ type: 'bytes32' }] },
  { type: 'function', name: 'keyIndex', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'recoveryKeyHash', stateMutability: 'view', inputs: [], outputs: [{ type: 'bytes32' }] },
  { type: 'function', name: 'recoveryIndex', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
] as const;

const network = getWalletNetwork(46630);
type PublicKeyState = {
  address: Address;
  publicKeyHash: Hex;
  keyIndex: bigint;
  recoveryKeyHash: Hex;
  recoveryIndex: bigint;
  blockNumber: bigint;
  checkedAt: string;
};

class InspectionError extends Error {}
const shortCommitment = (value: string) => `${value.slice(0, 12)}…${value.slice(-10)}`;

export default function WinternitzInspector() {
  const headingId = useId();
  const inputId = useId();
  const [addressInput, setAddressInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PublicKeyState | null>(null);
  const requestId = useRef(0);

  useEffect(() => () => { requestId.current += 1; }, []);

  async function inspect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentRequest = ++requestId.current;
    setError('');
    setResult(null);
    const value = addressInput.trim();
    if (!isAddress(value, { strict: true }) || value.toLowerCase() === zeroAddress) {
      setBusy(false);
      setError('Enter a valid, non-zero EVM smart-account address.');
      return;
    }
    setBusy(true);
    try {
      const address = getAddress(value);
      const client = createPublicClient({
        chain: network.chain,
        transport: http(network.rpcUrl, { retryCount: 0, timeout: 8_000, batch: false }),
      });
      const chainId = await client.getChainId();
      if (chainId !== network.id) {
        throw new InspectionError('The RPC returned a different network. Inspection was stopped.');
      }
      const blockNumber = await client.getBlockNumber();
      const code = await client.getCode({ address, blockNumber });
      if (!code || code === '0x') {
        throw new InspectionError('No contract was found at this address on Robinhood Testnet. Enter an already deployed smart-account address.');
      }
      let state: readonly [Hex, bigint, Hex, bigint];
      try {
        state = await Promise.all([
          client.readContract({ address, abi: accountStateAbi, functionName: 'publicKeyHash', blockNumber }),
          client.readContract({ address, abi: accountStateAbi, functionName: 'keyIndex', blockNumber }),
          client.readContract({ address, abi: accountStateAbi, functionName: 'recoveryKeyHash', blockNumber }),
          client.readContract({ address, abi: accountStateAbi, functionName: 'recoveryIndex', blockNumber }),
        ]);
      } catch {
        throw new InspectionError('Key state could not be read. This contract may use a different interface, or the public RPC may be unavailable. Check the address and try again.');
      }
      const [publicKeyHash, keyIndex, recoveryKeyHash, recoveryIndex] = state;
      if (!/^0x[0-9a-fA-F]{64}$/.test(publicKeyHash)
        || !/^0x[0-9a-fA-F]{64}$/.test(recoveryKeyHash)
        || typeof keyIndex !== 'bigint' || keyIndex < BigInt(0)
        || typeof recoveryIndex !== 'bigint' || recoveryIndex < BigInt(0)) {
        throw new InspectionError('The contract returned an unsupported key-state format.');
      }
      if (currentRequest === requestId.current) {
        setResult({ address, publicKeyHash, keyIndex, recoveryKeyHash, recoveryIndex, blockNumber, checkedAt: new Date().toISOString() });
      }
    } catch (failure) {
      if (currentRequest === requestId.current) {
        setError(failure instanceof InspectionError
          ? failure.message
          : 'Robinhood Testnet could not complete this read. Please try again in a moment.');
      }
    } finally {
      if (currentRequest === requestId.current) setBusy(false);
    }
  }

  return <section className="qd-panel qd-winternitz-inspector" aria-labelledby={headingId}>
    <div className="qd-panel-heading">
      <div><h2 id={headingId}>Inspect a Winternitz account</h2><p>Check public key state on Robinhood Testnet. No recovery phrase required.</p></div>
      <span className="qd-small-tag">READ ONLY</span>
    </div>
    <form className="qd-form" onSubmit={inspect} aria-busy={busy}>
      <label htmlFor={inputId}>Smart-account address
        <input id={inputId} value={addressInput} onChange={event => {
          requestId.current += 1;
          setAddressInput(event.target.value);
          setResult(null);
          setError('');
          setBusy(false);
        }} placeholder="0x…" autoComplete="off" autoCapitalize="off" spellCheck={false} maxLength={128} required/>
      </label>
      <button className="qd-button qd-primary" disabled={busy} type="submit">{busy ? 'Reading public key state…' : 'Inspect account'}</button>
      {error && <Message tone="error">{error}</Message>}
      {result && <div data-winternitz-state="loaded" aria-live="polite">
        <dl className="qd-review">
          <div><dt>Network</dt><dd>{network.label} · {network.id}</dd></div>
          <div className="qd-review-address"><dt>Account</dt><dd>{result.address}</dd></div>
          <div><dt>Signing key index</dt><dd>#{result.keyIndex.toString()}</dd></div>
          <div><dt>Signing commitment</dt><dd><code title={result.publicKeyHash}>{shortCommitment(result.publicKeyHash)}</code></dd></div>
          <div><dt>Recovery key index</dt><dd>#{result.recoveryIndex.toString()}</dd></div>
          <div><dt>Recovery commitment</dt><dd><code title={result.recoveryKeyHash}>{shortCommitment(result.recoveryKeyHash)}</code></dd></div>
          <div><dt>Read at block</dt><dd>{result.blockNumber.toLocaleString('en-US')}</dd></div>
        </dl>
        <div className="qd-table-note"><span>Checked {result.checkedAt.slice(11, 19)} UTC</span><a href={networkExplorerAddress(network, result.address)} target="_blank" rel="noopener noreferrer">View account <DIcon icon={faArrowUpRightFromSquare} size={11}/></a></div>
      </div>}
      <p className="qd-fine-print">This read reports public key state only. It does not verify contract source or attest to the security of funds. No transaction is signed or submitted.</p>
    </form>
  </section>;
}
