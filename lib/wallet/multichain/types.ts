import type { NativeNetworkId } from './networks';
export type NativeReview = Readonly<{
  network:NativeNetworkId; from:string; to:string; value:bigint; fee:bigint; balance:bigint;
  preparedAt:number; expiresAt:number; detail:string;
}>;
export type SignedNativeTransfer = Readonly<{
  version:1; network:NativeNetworkId; from:string; to:string; value:string; fee:string;
  id:string; wire:string; createdAt:string; status:'signed'|'submitted'|'confirmed'|'failed';
}>;
export type NativeConfirmation = 'pending'|'confirmed'|'failed';
export class NativeBroadcastUncertain extends Error {
  constructor(readonly transactionId:string) { super('Submission could not be confirmed. The signed transaction was saved. Check its status before making another transfer.'); }
}
export function assertReviewAge(review:NativeReview) {
  if (!Number.isSafeInteger(review.preparedAt) || Date.now()<review.preparedAt || Date.now()>review.expiresAt || review.expiresAt-review.preparedAt!==120_000) throw new Error('This transfer review expired. Prepare a fresh review.');
}
export function signedRecord(review:NativeReview,id:string,wire:string):SignedNativeTransfer {
  return Object.freeze({version:1,network:review.network,from:review.from,to:review.to,value:review.value.toString(),fee:review.fee.toString(),id,wire,createdAt:new Date().toISOString(),status:'signed'});
}
