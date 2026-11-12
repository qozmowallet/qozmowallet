import { nativeNetwork, type NativeNetworkId } from './networks';
export type NativeTransport = { json(url: string, init?: RequestInit): Promise<unknown>; text(url: string, init?: RequestInit): Promise<string> };
export function nativeTransport(signal?: AbortSignal): NativeTransport {
  async function text(url: string, init?: RequestInit) {
    const response = await fetch(url, { ...init, cache:'no-store', credentials:'omit', referrerPolicy:'no-referrer', redirect:'error', signal:AbortSignal.any([AbortSignal.timeout(15_000), ...(signal ? [signal] : [])]) });
    if (!response.ok || !response.body) throw new Error(`Network service unavailable (${response.status}). No automatic retry was made.`);
    const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
    try { while (true) { const part = await reader.read(); if (part.done) break; size += part.value.length; if (size > 1_000_000) { await reader.cancel(); throw new Error('Network response exceeded the size limit.'); } chunks.push(part.value); } }
    finally { reader.releaseLock(); }
    const bytes = new Uint8Array(size); let offset=0; for (const part of chunks) { bytes.set(part,offset); offset+=part.length; }
    return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  }
  return { text, json:async(url,init)=>JSON.parse(await text(url,init)) as unknown };
}
export function object(value: unknown): Record<string,unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Malformed network response.');
  return value as Record<string,unknown>;
}
export function uint(value: unknown, limit=Number.MAX_SAFE_INTEGER): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > limit) throw new Error('Invalid network amount or index.');
  return value;
}
export async function solRpc(io: NativeTransport, method: string, params: unknown[] = []): Promise<unknown> {
  const result=object(await io.json(nativeNetwork('solana-devnet').rpc,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})}));
  if (result.id!==1 || result.jsonrpc!=='2.0' || result.error || !Object.hasOwn(result,'result')) throw new Error('Solana RPC rejected the request.');
  return result.result;
}
export async function assertNativeChain(network: NativeNetworkId, io: NativeTransport) {
  const selected=nativeNetwork(network);
  const genesis=network==='solana-devnet' ? await solRpc(io,'getGenesisHash') : (await io.text(selected.rpc+'/block-height/0')).trim();
  if (genesis!==selected.genesis) throw new Error('The service returned a different network. Signing is blocked.');
}
