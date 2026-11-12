'use client';
import type { QozmoWalletController } from '@/components/dashboard/quantum-wallet';
import { useOptionalQozmoAccount } from './account-context';
import { DIcon } from '@/components/dashboard/ui';
import { faCheck, faLink, faRotate, faServer, faWallet } from '@fortawesome/free-solid-svg-icons';
import { isExtensionRuntime } from '@/lib/app-runtime';
import type { ConnectionMethod } from '@/lib/wallet/connection';

export function AccountConnection({ controller, disabled = false }: { controller?: QozmoWalletController; disabled?: boolean }) {
  const shared = useOptionalQozmoAccount();
  const account = controller ?? shared;
  if (!account) return null;
  const { connection, connectionMethod, relay, busy, session, record } = account;
  const frozen = disabled || busy || !session || !!record?.restored;
  const connected = connection.status === 'connected' && !!relay;
  const failed = ['unavailable', 'wrong-network', 'not-configured'].includes(connection.status);
  function select(method: ConnectionMethod) {
    if (account!.connectionMethod === method) return;
    if (account!.relay) account!.disconnect();
    account!.setConnectionMethod(method);
  }
  return <section className="qd-panel qd-account-connection" aria-label="Shared transaction connection"><div className="qd-panel-heading"><div><h2>Your transaction connection</h2><p>Shared by your wallet and Privacy Ring · Robinhood Testnet</p></div><span className={`qd-qwallet-state${connected ? ' is-unlocked' : ''}`}><i/>{connection.status === 'checking' ? 'Checking…' : connected ? 'Connected' : 'Not connected'}</span></div>
    <div className="qd-account-connection-body"><div className="qd-connection-options" role="group" aria-label="Transaction connection method">{([
      ...(!isExtensionRuntime() ? [{ id: 'managed', title: 'Qozmo bundler', description: 'Use the configured gateway', icon: faServer }, { id: 'browser', title: 'Browser gas payer', description: 'Approve gas in your browser wallet', icon: faWallet }] : []),
      { id: 'bundler', title: 'Your bundler', description: 'Use your HTTPS endpoint', icon: faLink },
    ] as const).map(option => <button type="button" key={option.id} disabled={frozen} aria-pressed={connectionMethod === option.id} className={connectionMethod === option.id ? 'is-selected' : ''} onClick={() => select(option.id as ConnectionMethod)}><DIcon icon={option.icon} size={16}/><span><strong>{option.title}</strong><small>{option.description}</small></span>{connectionMethod === option.id && <DIcon icon={faCheck} size={11}/>}</button>)}</div>
      <div className={`qd-connection-report is-${connection.status}`} role="status"><strong>{connected ? relay.label : connection.status === 'not-configured' ? 'Gateway setup needed' : connection.status === 'wrong-network' ? 'Network check blocked' : connection.status === 'unavailable' ? 'Connection unavailable' : connection.status === 'checking' ? 'Checking connection' : 'Ready to connect'}</strong><p>{connection.message}</p>{connection.checkedAt && <small>Last check {new Date(connection.checkedAt).toLocaleTimeString()}</small>}</div>
      <div className="qd-connection-checks"><span><i className={connected ? 'is-ready' : ''}/>Chain 46630</span><span><i className={connected ? 'is-ready' : ''}/>{connected ? 'Account contracts verified' : 'Account contract check'}</span><span><i className={connected ? 'is-ready' : ''}/>{connected ? 'Transaction relay ready' : 'Relay compatibility check'}</span></div>
      {connected ? <div className="qd-settings-actions"><button className="qd-button qd-secondary" disabled={busy || disabled} onClick={account.disconnect}>Disconnect</button><span className="qd-fine-print">{relay.payer ? 'Browser gas payer connected. Your Qozmo signing account stays the same.' : 'Ready to prepare a transaction for review.'}</span></div> : connectionMethod === 'bundler' ? <form className="qd-form qd-connection-endpoint" onSubmit={event => { event.preventDefault(); void account.connect('bundler'); }}><label>HTTPS bundler endpoint<input type="password" autoComplete="off" required value={account.bundlerUrl} onChange={event => account.setBundlerUrl(event.target.value)} placeholder="Your Robinhood Testnet ERC-4337 endpoint" disabled={frozen}/></label><button className="qd-button qd-primary" disabled={frozen}>{busy ? 'Checking…' : failed ? 'Retry connection check' : 'Check & connect'}</button></form> : <button className="qd-button qd-primary" disabled={frozen} onClick={() => void account.connect(connectionMethod)}><DIcon icon={failed ? faRotate : faLink} size={12}/>{busy ? 'Checking…' : failed ? 'Retry connection check' : connectionMethod === 'browser' ? 'Connect browser gas payer' : 'Check & connect Qozmo'}</button>}
      <p className="qd-fine-print qd-connection-caption">{!session ? 'Unlock your Qozmo wallet to connect.' : record?.restored ? 'Imported accounts remain read-only.' : 'Connections clear on lock. Account gas fees apply. A successful check does not submit a transaction.'}</p>
    </div>
  </section>;
}
