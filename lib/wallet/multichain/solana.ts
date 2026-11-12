import { address, blockhash, pipe, createTransactionMessage, setTransactionMessageFeePayer, setTransactionMessageLifetimeUsingBlockhash, appendTransactionMessageInstruction, createNoopSigner, compileTransaction, getBase64EncodedWireTransaction, createKeyPairFromPrivateKeyBytes, signTransaction, getSignatureFromTransaction, isOffCurveAddress } from '@solana/kit';
import { getTransferSolInstruction } from '@solana-program/system';
import { base64 } from '@scure/base';
import { type VaultSecret } from '../vault';
import { deriveNativeAddresses, solanaPrivateSeed } from './keys';
import { parseNativeAmount } from './networks';
import { assertNativeChain, object, uint, solRpc, type NativeTransport } from './transport';
import { assertReviewAge, NativeBroadcastUncertain, signedRecord, type NativeReview, type SignedNativeTransfer, type NativeConfirmation } from './types';

const SYSTEM='11111111111111111111111111111111';
function recipient(value:string) {
  const parsed=address(value.trim());
  if (parsed===SYSTEM || isOffCurveAddress(parsed)) throw new Error('Use a standard on-curve Solana recipient address. Program/PDA recipients are not supported in this release.');
  return parsed;
}
function responseValue(value:unknown) { const result=object(value); uint(object(result.context).slot); return result.value; }
async function plainAccount(io:NativeTransport, owner:string, required:boolean) {
  const value=responseValue(await solRpc(io,'getAccountInfo',[owner,{encoding:'base64',commitment:'confirmed'}]));
  if (value===null&&!required) return;
  const account=object(value);
  if (account.owner!==SYSTEM || account.executable!==false || !Array.isArray(account.data) || account.data[0]!=='' || account.data[1]!=='base64') throw new Error('Only ordinary System Program SOL accounts are supported.');
}
export async function solanaBalance(io:NativeTransport,from:string):Promise<bigint> {
  recipient(from); await assertNativeChain('solana-devnet',io);
  return BigInt(uint(responseValue(await solRpc(io,'getBalance',[from,{commitment:'confirmed'}]))));
}
function transaction(from:string,to:string,value:bigint,hash:string,lastValidBlockHeight:number) {
  return compileTransaction(pipe(createTransactionMessage({version:0}),
    m=>setTransactionMessageFeePayer(address(from),m),
    m=>setTransactionMessageLifetimeUsingBlockhash({blockhash:blockhash(hash),lastValidBlockHeight:BigInt(lastValidBlockHeight)},m),
    m=>appendTransactionMessageInstruction(getTransferSolInstruction({source:createNoopSigner(address(from)),destination:address(to),amount:value}),m)));
}
type SolState={tx:ReturnType<typeof transaction>;lastValidBlockHeight:number; feeMessage:string; phase:'prepared'|'signing'|'signed'};
const reviews=new WeakMap<NativeReview,SolState>();
async function feeAndSimulation(io:NativeTransport,state:SolState) {
  const fee=BigInt(uint(responseValue(await solRpc(io,'getFeeForMessage',[state.feeMessage,{commitment:'confirmed'}])),100_000));
  if(fee===0n)throw new Error('Invalid Solana fee quote.');
  const simulation=object(responseValue(await solRpc(io,'simulateTransaction',[getBase64EncodedWireTransaction(state.tx),{encoding:'base64',commitment:'confirmed',sigVerify:false,replaceRecentBlockhash:false}])));
  if(simulation.err!==null)throw new Error('Solana simulation failed. Check the balance, recipient account and minimum rent. No transaction was signed.');
  uint(simulation.unitsConsumed,1_400_000);
  return fee;
}
export async function prepareSolana(io:NativeTransport,from:string,to:string,amount:string):Promise<NativeReview> {
  const sender=recipient(from),destination=recipient(to); const value=parseNativeAmount(amount,9);
  const balance=await solanaBalance(io,sender);
  await plainAccount(io,sender,true); await plainAccount(io,destination,false);
  const lifetime=object(responseValue(await solRpc(io,'getLatestBlockhash',[{commitment:'confirmed'}])));
  if(typeof lifetime.blockhash!=='string')throw new Error('Invalid Solana blockhash.');
  const lastValidBlockHeight=uint(lifetime.lastValidBlockHeight);
  const tx=transaction(sender,destination,value,lifetime.blockhash,lastValidBlockHeight);
  const state:SolState={tx,lastValidBlockHeight,feeMessage:base64.encode(Uint8Array.from(tx.messageBytes)),phase:'prepared'};
  const fee=await feeAndSimulation(io,state);
  if(value+fee>balance)throw new Error('Not enough devnet SOL for the amount and network fee.');
  const now=Date.now();
  const review=Object.freeze({network:'solana-devnet' as const,from:sender,to:destination,value,fee,balance,preparedAt:now,expiresAt:now+120_000,detail:'SOL transfer · simulation passed · standard Ed25519 account'});
  reviews.set(review,state); return review;
}
export async function submitSolana(io:NativeTransport,review:NativeReview,secret:VaultSecret,save:(tx:SignedNativeTransfer)=>Promise<void>,signal?:AbortSignal):Promise<SignedNativeTransfer> {
  const state=reviews.get(review);
  if(!state||state.phase!=='prepared'||review.network!=='solana-devnet')throw new Error('Invalid or already used Solana review.');
  assertReviewAge(review); signal?.throwIfAborted(); state.phase='signing';
  try {
    if(deriveNativeAddresses(secret).solana!==review.from)throw new Error('This standard vault does not own the reviewed Solana account.');
    const balance=await solanaBalance(io,review.from); await plainAccount(io,review.from,true); await plainAccount(io,review.to,false);
    if(uint(await solRpc(io,'getBlockHeight',[{commitment:'confirmed'}]))>state.lastValidBlockHeight)throw new Error('Solana blockhash expired. Prepare a new review.');
    if(await feeAndSimulation(io,state)!==review.fee||balance<review.value+review.fee)throw new Error('Solana balance or fee changed. Prepare a new review.');
    assertReviewAge(review); signal?.throwIfAborted();
    const seed=solanaPrivateSeed(secret);
    let keyPair:CryptoKeyPair;
    try{keyPair=await createKeyPairFromPrivateKeyBytes(seed);}finally{seed.fill(0);}
    assertReviewAge(review); signal?.throwIfAborted();
    const signed=await signTransaction([keyPair],state.tx);
    state.phase='signed';
    assertReviewAge(review); signal?.throwIfAborted();
    const id=getSignatureFromTransaction(signed),wire=getBase64EncodedWireTransaction(signed);
    const entry=signedRecord(review,id,wire);
    await save(entry); // Durable outbox must succeed before any broadcast.
    try {
      signal?.throwIfAborted();
      const returned=await solRpc(io,'sendTransaction',[wire,{encoding:'base64',skipPreflight:false,preflightCommitment:'confirmed',maxRetries:0}]);
      if(returned!==id)throw new Error('Signature mismatch.');
      return {...entry,status:'submitted'};
    }catch{throw new NativeBroadcastUncertain(id);}
  } finally { if(state.phase==='signing') state.phase='prepared'; }
}
export async function solanaConfirmation(io:NativeTransport,id:string):Promise<NativeConfirmation> {
  if(!/^[1-9A-HJ-NP-Za-km-z]{64,88}$/.test(id))throw new Error('Invalid Solana signature.');
  await assertNativeChain('solana-devnet',io);
  const value=responseValue(await solRpc(io,'getSignatureStatuses',[[id],{searchTransactionHistory:true}]));
  if(!Array.isArray(value)||value.length!==1)throw new Error('Invalid signature status response.');
  if(value[0]===null)return 'pending';
  const status=object(value[0]);
  if(!Object.hasOwn(status,'err')||!['processed','confirmed','finalized'].includes(status.confirmationStatus as string))throw new Error('Malformed Solana confirmation status.');
  if(status.confirmationStatus!=='confirmed'&&status.confirmationStatus!=='finalized')return 'pending';
  if(status.err!==null)return 'failed';
  return 'confirmed';
}
