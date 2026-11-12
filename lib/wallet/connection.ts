import { gatewayBase } from './gateway';

export type ConnectionMethod = 'managed' | 'browser' | 'bundler';
export type ConnectionState = { status: 'idle' | 'checking' | 'connected' | 'not-configured' | 'wrong-network' | 'unavailable'; method: ConnectionMethod; message: string; checkedAt?: string };
export class ConnectionCheckError extends Error {
  constructor(readonly state: ConnectionState) { super(state.message); }
}
export async function inspectManagedGateway(signal?: AbortSignal): Promise<ConnectionState> {
  const base = { method: 'managed' as const, checkedAt: new Date().toISOString() };
  try {
    const response = await fetch(`${gatewayBase()}/health`, { credentials: 'omit', cache: 'no-store', signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(12000)]) : AbortSignal.timeout(12000) });
    const report = await response.json();
    signal?.throwIfAborted();
    if ((report?.chainId !== undefined && report.chainId !== 46630) || report?.bundler === 'wrong-network-or-entrypoint') return { ...base, status: 'wrong-network', message: 'The gateway must use Robinhood Testnet and EntryPoint v0.7. Choose another connection or ask the operator to correct it.' };
    if (response.ok && report.bundler === 'not-configured') return { ...base, status: 'not-configured', message: 'The Qozmo gateway has no bundler configured yet. Choose Browser gas payer or Your bundler to continue.' };
    if (!response.ok || report.bundler !== 'ready') throw Error();
    return { ...base, status: 'connected', message: 'Gateway provider reports Robinhood Testnet and EntryPoint v0.7. Account infrastructure still needs checking.' };
  } catch {
    signal?.throwIfAborted();
    return { ...base, status: 'unavailable', message: 'The Qozmo gateway could not be reached. Retry the check or choose another connection.' };
  }
}
