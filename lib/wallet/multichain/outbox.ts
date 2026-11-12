import { nativeNetwork, type NativeNetworkId } from './networks';
import type { SignedNativeTransfer } from './types';
const PREFIX='qozmo.native.outbox.v1';
export function nativeOutboxKey(network:NativeNetworkId,from:string) {
  nativeNetwork(network);
  if(!/^[a-zA-Z0-9]{26,90}$/.test(from))throw new Error('Invalid native account identifier.');
  return `${PREFIX}:${network}:${from}`;
}
function validate(entry:unknown,network:NativeNetworkId,from:string):SignedNativeTransfer {
  if(!entry||typeof entry!=='object'||Array.isArray(entry))throw new Error('Unreadable native transaction history. Preserve the existing data.');
  const row=entry as Record<string,unknown>;
  const keys=['version','network','from','to','value','fee','id','wire','createdAt','status'];
  if(Object.keys(row).length!==keys.length||Object.keys(row).some(key=>!keys.includes(key))||row.version!==1||row.network!==network||row.from!==from||typeof row.to!=='string'||!/^[A-Za-z0-9]{26,90}$/.test(row.to)||typeof row.value!=='string'||!/^\d{1,16}$/.test(row.value)||BigInt(row.value)<=0n||typeof row.fee!=='string'||!/^\d{1,8}$/.test(row.fee)||typeof row.id!=='string'||!(network==='solana-devnet'?/^[1-9A-HJ-NP-Za-km-z]{64,88}$/:/^[0-9a-f]{64}$/).test(row.id)||typeof row.wire!=='string'||row.wire.length>100_000||!(network==='solana-devnet'?/^[A-Za-z0-9+/]+={0,2}$/:/^(?:[0-9a-f]{2})+$/).test(row.wire)||typeof row.createdAt!=='string'||!Number.isFinite(Date.parse(row.createdAt))||new Date(row.createdAt).toISOString()!==row.createdAt||!['signed','submitted','confirmed','failed'].includes(row.status as string))throw new Error('Unreadable native transaction history. Preserve the existing data.');
  return Object.freeze({...row}) as SignedNativeTransfer;
}
export function readNativeOutbox(storage:Storage,network:NativeNetworkId,from:string):SignedNativeTransfer[] {
  const text=storage.getItem(nativeOutboxKey(network,from));if(text===null)return [];
  if(text.length>2_000_000)throw new Error('Native transaction history exceeds the size limit.');
  const raw:unknown=JSON.parse(text);if(!Array.isArray(raw)||raw.length>50)throw new Error('Invalid native transaction history.');
  const rows=raw.map(row=>validate(row,network,from));
  if(new Set(rows.map(row=>row.id)).size!==rows.length)throw new Error('Duplicate native transaction history.');
  return rows;
}
export function nativePending(rows:readonly SignedNativeTransfer[]) {return rows.find(row=>row.status==='signed'||row.status==='submitted');}
/** Caller must hold navigator.locks for this network/account until submission finishes. */
export function appendNativeOutbox(storage:Storage,entry:SignedNativeTransfer) {
  const validated=validate(entry,entry.network,entry.from),rows=readNativeOutbox(storage,entry.network,entry.from);
  if(nativePending(rows))throw new Error('A signed transaction still needs a status check. No additional transfer was submitted.');
  if(rows.length>=50)throw new Error('The local history limit was reached. Export the transaction history before extending this release.');
  if(rows.some(row=>row.id===validated.id))throw new Error('This transaction is already recorded.');
  const key=nativeOutboxKey(entry.network,entry.from),text=JSON.stringify([...rows,validated]);
  storage.setItem(key,text);
  if(storage.getItem(key)!==text)throw new Error('The signed transaction could not be saved. Nothing was broadcast.');
}
/** Compare and update a known immutable transaction; never overwrite its reviewed payload. */
export function updateNativeStatus(storage:Storage,entry:SignedNativeTransfer,status:SignedNativeTransfer['status']) {
  const rows=readNativeOutbox(storage,entry.network,entry.from),index=rows.findIndex(row=>row.id===entry.id);
  if(index<0||rows[index].wire!==entry.wire||rows[index].to!==entry.to||rows[index].value!==entry.value||rows[index].fee!==entry.fee)throw new Error('The native transaction history changed. Preserve the existing data.');
  const previous=rows[index].status;
  if(previous==='confirmed'||previous==='failed'){if(previous!==status)throw new Error('A terminal transaction status cannot be overwritten.');return;}
  if(!['submitted','confirmed','failed'].includes(status))throw new Error('Invalid transaction status change.');
  rows[index]={...rows[index],status};
  storage.setItem(nativeOutboxKey(entry.network,entry.from),JSON.stringify(rows));
}
